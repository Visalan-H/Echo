const { google } = require('googleapis');
const { decrypt } = require('./crypto');

if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REDIRECT_URI) {
    throw new Error('GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REDIRECT_URI must be set in environment variables');
}

// global OAuth2 client instance to be used for generating auth URLs and exchanging codes for tokens
const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
);

function generateAuthUrl(state) {
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        state,
        scope: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
    });
}

async function exchangeCodeForTokens(code) {
    const { tokens } = await oAuth2Client.getToken(code);
    return tokens;
}

async function getUserProfile(accessToken) {
    oAuth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const { data } = await oauth2.userinfo.get();
    return data;
}

// We need to create a new OAuth2 client for each user to set their specific tokens 
function getAuthClientForUser(user) {
    const client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
    );

    client.setCredentials({
        access_token: decrypt(user.accessToken),
        refresh_token: decrypt(user.refreshToken),
    });

    return client;
}

async function getNewEmails(user) {
    const auth = getAuthClientForUser(user);
    const gmail = google.gmail({ version: 'v1', auth });


    const afterDate = Math.floor(new Date(user.createdAt).getTime() / 1000);

    const res = await gmail.users.messages.list({
        userId: 'me',
        q: `after:${afterDate}`,
        maxResults: 25,
    });

    const messages = res.data.messages || [];
    if (messages.length === 0) return [];

    const emails = await Promise.all(
        messages.map(async (msg) => {
            const full = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'full',
            });
            return full.data;
        })
    );

    return emails;
}

module.exports = { generateAuthUrl, exchangeCodeForTokens, getUserProfile, getNewEmails };
