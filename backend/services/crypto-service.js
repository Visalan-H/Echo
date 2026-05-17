const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT;
const ALGORITHM = 'aes-256-cbc';

if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY must be set in environment variables.');
}

if (!ENCRYPTION_SALT) {
    throw new Error('ENCRYPTION_SALT must be set in environment variables.');
}

// Derive the key once at module load and cache it.
// scryptSync is intentionally slow (it's a KDF) — calling it per-request was wasteful.
const DERIVED_KEY = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_SALT, 32);

const generateRandomString = (length = 16) => {
    return crypto.randomBytes(length).toString('hex');
};

const encrypt = (text) => {
    if (!text) return text;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, DERIVED_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (encryptedText) => {
    if (!encryptedText) return encryptedText;

    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 2) return encryptedText;

        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv(ALGORITHM, DERIVED_KEY, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error.message);
        throw new Error('Failed to decrypt token');
    }
};

module.exports = {
    generateRandomString,
    encrypt,
    decrypt,
};
