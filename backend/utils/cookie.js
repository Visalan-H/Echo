const isProd = process.env.NODE_ENV === 'production';

const cookieConfig = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
};

function setStateCookie(res, state) {
    res.cookie('oauth_state', state, {
        ...cookieConfig,
        maxAge: 600000, // 10 minutes
    });
}

function clearStateCookie(res) {
    res.clearCookie('oauth_state', cookieConfig);
}

function setJwtCookie(res, token) {
    res.cookie('jwt', token, {
        ...cookieConfig,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}

function clearJwtCookie(res) {
    res.clearCookie('jwt', cookieConfig);
}

module.exports = { setStateCookie, clearStateCookie, setJwtCookie, clearJwtCookie };