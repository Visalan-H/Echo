const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    applicationDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['Applied', 'Interviewing', 'Offered', 'Rejected'], default: 'Applied' },
    emailId: { type: String },
    notes: { type: String },
    confidenceLevel: { type: Number, min: 1, max: 10 },
}, { timestamps: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);