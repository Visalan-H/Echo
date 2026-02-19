const User = require('../models/User');
const { generateToken } = require('../services/jwt');
const { generateRandomString, encrypt } = require('../services/crypto');
const { generateAuthUrl, exchangeCodeForTokens, getUserProfile } = require('../services/gmail');
const { setStateCookie, clearStateCookie, setJwtCookie, clearJwtCookie } = require('../utils/cookie');

function googleAuthUrl(req, res) {
    const state = generateRandomString(16);
    setStateCookie(res, state);
    res.redirect(generateAuthUrl(state));
}

async function googleAuthCallback(req, res) {
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}/?error=Error while signing in with Google`);
    }

    const storedState = req.cookies['oauth_state'];
    clearStateCookie(res);

    if (!state || state !== storedState || !code) {
        return res.redirect(`${process.env.FRONTEND_URL}/?error=Invalid state parameter`);
    }

    try {
        const tokens = await exchangeCodeForTokens(code);

        if (!tokens.access_token || !tokens.refresh_token) {
            return res.redirect(`${process.env.FRONTEND_URL}/?error=Failed to obtain tokens from Google`);
        }

        const googleUser = await getUserProfile(tokens.access_token);

        let user = await User.findOne({ googleId: googleUser.id });

        if (!user) {
            user = await User.create({
                googleId: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                avatarUrl: googleUser.picture,
                accessToken: encrypt(tokens.access_token),
                refreshToken: encrypt(tokens.refresh_token),
            });
        } else {
            user.accessToken = encrypt(tokens.access_token);
            if (tokens.refresh_token) {
                user.refreshToken = encrypt(tokens.refresh_token);
            }
            user.name = googleUser.name;
            user.avatarUrl = googleUser.picture;
            await user.save();
        }

        const token = generateToken(user._id);
        setJwtCookie(res, token);

        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/?error=Internal server error during sign-in`);
    }
}

async function getCurrentUser(req, res) {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'User not found' });

        res.json({
            id: user._id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
        });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

function logoutUser(req, res) {
    clearJwtCookie(res);
    res.json({ message: 'Logged out successfully' });
}

module.exports = { googleAuthUrl, googleAuthCallback, getCurrentUser, logoutUser };