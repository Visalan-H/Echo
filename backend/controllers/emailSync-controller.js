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
        const emails = newEmails.map(getEmailHeader);

        console.log("New emails fetched: ", emails);
        const parsed = await parseEmailsWithGroq(emails);
        console.log("Returned value from the groq service:::: ", parsed);

        // update the last sync time for the user
        user.lastSyncAt = new Date();
        await user.save();

        res.json({
            message: 'Email sync completed',
            parsedEmails: parsed,
        });
    } catch (error) {
        console.error('Sync emails error:', error);
        res.status(500).json({ error: 'Failed to sync emails' });
    }
}

module.exports = { syncEmails };
