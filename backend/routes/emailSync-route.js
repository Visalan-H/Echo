const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { syncEmails } = require('../controllers/emailSync-controller');

// Route for syncing emails and extracting job application info
router.post('/sync',authMiddleware, syncEmails);

module.exports = router;
