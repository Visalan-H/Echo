const User = require('../models/User');
const JobApplication = require('../models/JobApplication-model');
const { getNewEmails, getEmailHeader } = require('../services/gmail');
const { parseEmailsWithGroq } = require('../services/groq-service');

// Sync emails for that user, extract job application info from groq, and create/update job applications in the database
async function syncEmails(req, res) {
    try {

        const userId = req.user ? req.user._id : null;

        const user = await User.findById(userId);

        console.log("❌❌❌",user.lastSyncAt);
        // Get the new emails and parse it using groq.
        const emails = await getNewEmails(user);
        const parsed = await parseEmailsWithGroq(emails);
        console.log("Returned value from the groq service:::: ", parsed);
        
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
