const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { syncEmails, getSyncStatus } = require('../controllers/emailSync-controller');

// cron routes for syncing emails and getting sync status
router.post('/sync', syncEmails);
router.get('/sync-status', authMiddleware, getSyncStatus);

module.exports = router;
