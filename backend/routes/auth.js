const router = require('express').Router();
const { googleAuthUrl, googleAuthCallback, logoutUser, getCurrentUser } = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');

router.get('/google/url', googleAuthUrl);
router.get('/google/callback', googleAuthCallback);
router.post('/logout', authMiddleware, logoutUser);
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;