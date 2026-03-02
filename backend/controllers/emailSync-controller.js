const User = require('../models/User');
const JobApplication = require('../models/JobApplication-model');
const { getNewEmails, getEmailHeader } = require('../services/gmail');
const { parseEmailsWithGroq } = require('../services/groq-service');

// Sync emails for that user, extract job application info from groq, and create/update job applications in the database
async function syncEmails(req, res) {
    try {

        const userId = req.user._id;

        const user = await User.findById(userId);

        // Get the new emails and parse it using groq.
        const newEmails = await getNewEmails(user);
        if (newEmails.length === 0) {
            return res.json({ message: 'No new emails to sync' });
        }

        const emails = newEmails.map(getEmailHeader);
        console.log("New emails fetched: ", emails);

        const parsed = await parseEmailsWithGroq(emails);
        console.log("Returned value from the groq service:::: ", parsed);

        const jobEmails = parsed.filter(email => email.isJobRelated); // we can use confidence score here to filter out low confidence ones if we want

        if (jobEmails.length === 0) {
            return res.json({ message: 'No job-related emails found in the new emails' });
        }

        // For each job-related email, upsert a job application in the database
        const jobApplications = await Promise.all(
            jobEmails.map(email =>
                JobApplication.findOneAndUpdate(
                    { userId, emailId: email.id },       
                    {
                        userId,
                        emailId: email.id,
                        companyName: email.companyName || 'Unknown Company',
                        jobRole: email.jobRole || 'Unknown Role',
                        status: email.status || 'Unknown',
                        confidence: email.confidence,
                    },
                    { upsert: true, returnDocument: 'after' }         // upsert - create if doesn't exist
                )
            )
        );

        // update the last sync time for the user
        user.lastSyncAt = new Date();
        await user.save();

        return res.json({
            message: 'Email sync completed',
            jobApplications: jobApplications
        });
    } catch (error) {
        console.error('Sync emails error:', error);
        return res.status(500).json({ error: 'Failed to sync emails' });
    }
}

module.exports = { syncEmails };
