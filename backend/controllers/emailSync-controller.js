const User = require('../models/User-model');
const JobApplication = require('../models/JobApplication-model');
const { getNewEmails, getEmailHeader } = require('../services/gmail-service');
const { parseEmailsWithGroq } = require('../services/groq-service');

async function syncEmails(req, res) {
    const userId = req.user._id;

    // Declared outside try so the catch block can access it to save the error message
    let user;

    try {
        user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Enforce minimum sync interval of 60s to prevent quota abuse
        if (user.lastSyncAt) {
            const secondsSinceLastSync = (Date.now() - new Date(user.lastSyncAt).getTime()) / 1000;
            if (secondsSinceLastSync < 60) {
                return res.status(429).json({
                    error: `Please wait ${Math.ceil(60 - secondsSinceLastSync)}s before syncing again.`,
                });
            }
        }

        const newEmails = await getNewEmails(user);

        if (newEmails.length === 0) {
            user.lastSyncAt = new Date();
            user.emailSyncErrorMessage = null;
            await user.save();
            return res.json({ message: 'No new emails to sync' });
        }

        const emails = newEmails.map(getEmailHeader);
        console.log(`[Sync] Fetched ${emails.length} new emails for user ${userId}`);

        const parsed = await parseEmailsWithGroq(emails);
        const jobEmails = parsed.filter(email => email.isJobRelated);

        user.lastSyncAt = new Date();
        user.emailSyncErrorMessage = null;

        if (jobEmails.length === 0) {
            await user.save();
            return res.json({ message: 'No job-related emails found in the new emails' });
        }

        const jobApplications = await Promise.all(
            jobEmails.map(email =>
                JobApplication.findOneAndUpdate(
                    { userId, emailId: email.id },
                    {
                        $set: {
                            companyName: email.companyName || 'Unknown Company',
                            jobRole: email.jobRole || 'Unknown Role',
                            status: email.status || 'Applied',
                            confidence: email.confidence,
                        },
                        $setOnInsert: {
                            userId,
                            emailId: email.id,
                        },
                    },
                    { upsert: true, returnDocument: 'after' }
                )
            )
        );

        await user.save();

        return res.json({
            message: `Sync complete — ${jobApplications.length} application(s) updated`,
            jobApplications,
        });
    } catch (error) {
        console.error('Sync emails error:', error.message);

        try {
            if (user) {
                user.emailSyncErrorMessage = error.message;
                await user.save();
            }
        } catch (saveErr) {
            console.error('Failed to save sync error message:', saveErr.message);
        }

        return res.status(500).json({ error: 'Failed to sync emails. Please try again.' });
    }
}

module.exports = { syncEmails };
