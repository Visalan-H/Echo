const joi = require('joi');

// Validation schema for creating a new job application --validates against the expected fields and their types
const jobApplicationSchema = joi.object({
    companyName: joi.string().min(2).max(100).required(),
    jobRole: joi.string().min(2).max(100).required(),
    status: joi.string().valid('Applied', 'Interviewing', 'Offered', 'Rejected').required(),
    notes: joi.string().max(500).optional(),
});

// Validation schema for updating an existing job application --allows partial updates but requires at least one field to be present
const jobApplicationUpdateSchema = joi.object({
    companyName: joi.string().min(2).max(100).optional(),
    jobRole: joi.string().min(2).max(100).optional(),
    status: joi.string().valid('Applied', 'Interviewing', 'Offered', 'Rejected').optional(),
    notes: joi.string().max(500).optional(),
}).min(1);

module.exports = {
    jobApplicationSchema,
    jobApplicationUpdateSchema,
};
