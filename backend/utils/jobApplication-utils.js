const joi = require('joi');

const jobApplicationSchema = joi.object({
    companyName: joi.string().min(2).max(100).required(),
    jobRole: joi.string().min(2).max(100).required(),
    status: joi.string().valid('Applied', 'Interviewing', 'Offered', 'Rejected').required(),
    notes: joi.string().max(500).optional().allow(''),
    applicationDate: joi.date().iso().optional().max('now'),
});

const jobApplicationUpdateSchema = joi.object({
    companyName: joi.string().min(2).max(100).optional(),
    jobRole: joi.string().min(2).max(100).optional(),
    status: joi.string().valid('Applied', 'Interviewing', 'Offered', 'Rejected').optional(),
    notes: joi.string().max(500).optional().allow(''),
    applicationDate: joi.date().iso().optional().max('now'),
}).min(1);

module.exports = {
    jobApplicationSchema,
    jobApplicationUpdateSchema,
};
