const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    avatarUrl: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    lastSyncAt: { type: Date },
    gmailSyncStatus: { type: String, enum: ['pending', 'syncing', 'completed', 'failed'], default: 'pending' },
    emailSyncErrorMessage: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);