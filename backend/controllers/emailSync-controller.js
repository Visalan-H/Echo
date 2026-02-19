const User = require('../models/User');
const JobApplication = require('../models/JobApplication-model');
const { getNewEmails, getEmailHeader } = require('../services/gmail');
const { parseEmailWithGemini } = require('../services/gemini-service');

// Sync emails for all users, extract job application info, and create/update job applications in the database
async function syncEmails(req, res) {
    try {

        // For debugging - log the incoming request and headers to verify the cron secret is being sent correctly
        console.log("Received email sync request");
        const cronSecret = req.headers.authorization?.replace('Bearer ', '');
        console.log("Header:", req.headers.authorization);
        console.log("Extracted:", cronSecret);
        console.log("ENV:", process.env.CRON_SECRET);
        if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const users = await User.find({ gmailSyncStatus: { $ne: 'syncing' } });
        let usersProcessed = 0;
        let emailsProcessed = 0;
        let applicationsCreated = 0;
        let applicationsUpdated = 0;

        // Process each user sequentially to avoid overwhelming the Gmail API and Gemini API
        for (const user of users) {
            try {
                user.gmailSyncStatus = 'syncing';
                await user.save();

                const emails = await getNewEmails(user);

                for (const email of emails) {
                    try {
                        const emailData = getEmailHeader(email);
                        const emailContent = `
                                                Subject: ${emailData.subject}
                                                From: ${emailData.from}
                                                Date: ${emailData.date}
                                                ${emailData.body}
                                            `;
                        const subject = emailData.subject.toLowerCase();

                        if (!subject.includes("application") &&
                            !subject.includes("interview") &&
                            !subject.includes("offer") &&
                            !subject.includes("job") &&
                            !subject.includes("position") &&
                            !subject.includes("hiring") &&
                            !subject.includes("recruitment") &&
                            !subject.includes("candidate")) {

                            console.log(`Skipping email ${email} for user ${user._id} - subject does not indicate job-related content`);
                            continue;
                        }


                        const parsed = await parseEmailWithGemini(emailContent);
                        await new Promise(resolve => setTimeout(resolve, 12000)); // Add delay to avoid hitting Gemini API rate limits
                        if (parsed.isJobRelated && parsed.companyName && parsed.jobRole) {
                            // Check if job application already exists
                            let jobApplication = await JobApplication.findOne({
                                userId: user._id,
                                emailId: emailData.id,
                            });

                            if (jobApplication) {
                                // Update if new confidence is higher
                                if (parsed.confidence > (jobApplication.confidenceLevel || 0)) {
                                    jobApplication.status = parsed.status;
                                    jobApplication.confidenceLevel = parsed.confidence;
                                    await jobApplication.save();
                                    applicationsUpdated++;
                                }
                            } else {
                                // Create new job application
                                await JobApplication.create({
                                    userId: user._id,
                                    companyName: parsed.companyName,
                                    jobRole: parsed.jobRole,
                                    status: parsed.status,
                                    emailId: emailData.id,
                                    confidenceLevel: parsed.confidence,
                                });
                                applicationsCreated++;
                            }
                            emailsProcessed++;
                        }
                    } catch (emailError) {
                        console.error(`Error processing email ${email.id} for user ${user._id}:`, emailError.message);
                        // Continue to next email if one fails
                    }
                }

                user.lastSyncAt = new Date();
                user.gmailSyncStatus = 'completed';
                user.emailSyncErrorMessage = undefined;
                await user.save();
                usersProcessed++;
            } catch (userError) {
                console.error(`Error syncing emails for user ${user._id}:`, userError.message);
                user.gmailSyncStatus = 'failed';
                user.emailSyncErrorMessage = userError.message;
                await user.save();
            }
        }

        res.json({
            message: 'Email sync completed',
            usersProcessed,
            emailsProcessed,
            applicationsCreated,
            applicationsUpdated,
        });
    } catch (error) {
        console.error('Sync emails error:', error);
        res.status(500).json({ error: 'Failed to sync emails' });
    }
}

// Endpoint to get the sync status for the authenticated user
// This can be used by the frontend to show sync progress and any errors that occurred during the last sync
async function getSyncStatus(req, res) {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            lastSyncAt: user.lastSyncAt,
            gmailSyncStatus: user.gmailSyncStatus,
            emailSyncErrorMessage: user.emailSyncErrorMessage,
        });
    } catch (error) {
        console.error('Get sync status error:', error);
        res.status(500).json({ error: 'Failed to get sync status' });
    }
}

module.exports = { syncEmails, getSyncStatus };
