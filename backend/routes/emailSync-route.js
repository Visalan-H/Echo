const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { syncEmails } = require('../controllers/emailSync-controller');

router.post('/sync', authMiddleware, syncEmails);

module.exports = router;
