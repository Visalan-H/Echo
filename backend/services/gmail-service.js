const { google } = require('googleapis');
const { decrypt, encrypt } = require('./crypto-service');

if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REDIRECT_URI) {
    throw new Error('GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REDIRECT_URI must be set in environment variables');
}

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

// Creates a per-user OAuth2 client with a token refresh listener.
// Google auto-refreshes the access token after ~1hr. Without the 'tokens'
// listener, the new token is never saved back to DB and future syncs break.
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

    client.on('tokens', async (tokens) => {
        try {
            if (tokens.access_token) {
                user.accessToken = encrypt(tokens.access_token);
            }
            if (tokens.refresh_token) {
                user.refreshToken = encrypt(tokens.refresh_token);
            }
            await user.save();
            console.log('[Gmail] Refreshed tokens saved for user:', user._id);
        } catch (err) {
            console.error('[Gmail] Failed to save refreshed tokens:', err.message);
        }
    });

    return client;
}

async function getNewEmails(user) {
    const auth = getAuthClientForUser(user);
    const gmail = google.gmail({ version: 'v1', auth });

    const since = user.lastSyncAt || user.createdAt;
    const afterDate = Math.floor(new Date(since).getTime() / 1000);

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

function getEmailHeader(email) {
    try {
        const headers = email.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        let body = '';
        if (email.payload.parts) {
            const textPart = email.payload.parts.find(part => part.mimeType === 'text/plain');
            if (textPart && textPart.body.data) {
                body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
        } else if (email.payload.body && email.payload.body.data) {
            body = Buffer.from(email.payload.body.data, 'base64').toString('utf-8');
        }

        return {
            id: email.id,
            subject,
            from,
            date,
            body: body.substring(0, 800),
        };
    } catch (error) {
        console.error('Error extracting email header:', error.message);
        return { id: email.id, subject: '', from: '', date: '', body: '' };
    }
}

module.exports = { generateAuthUrl, exchangeCodeForTokens, getUserProfile, getNewEmails, getEmailHeader };
