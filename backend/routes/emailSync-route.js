const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { syncEmails } = require('../controllers/emailSync-controller');

// cron routes for syncing emails and getting sync status
router.post('/sync',authMiddleware, syncEmails);
// router.get('/sync-status', authMiddleware, getSyncStatus);

module.exports = router;
