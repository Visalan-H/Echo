const { verifyToken } = require('../services/jwt');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
    const token = req.cookies['jwt'];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('JWT verification error:', error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

module.exports = authMiddleware;