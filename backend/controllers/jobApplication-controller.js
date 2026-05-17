const JobApplication = require('../models/JobApplication-model');

// Escape user input before using it as a MongoDB $regex to prevent ReDoS attacks.
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createJobApplication(req, res) {
    try {
        const { companyName, jobRole, status, notes, applicationDate } = req.validatedBody;

        const jobApplication = await JobApplication.create({
            userId: req.user._id,
            companyName,
            jobRole,
            status,
            notes,
            ...(applicationDate && { applicationDate: new Date(applicationDate) }),
        });

        return res.status(201).json({
            success: true,
            message: 'Job application created successfully',
            data: jobApplication,
        });
    } catch (error) {
        console.error('Create job application error:', error);
        return res.status(500).json({ error: 'Failed to create job application' });
    }
}

async function getJobApplications(req, res) {
    try {
        const { status, company } = req.query;

        const query = { userId: req.user._id };

        if (status) {
            query.status = status;
        }

        if (company) {
            query.companyName = { $regex: escapeRegex(company), $options: 'i' };
        }

        const applications = await JobApplication.find(query).sort({ applicationDate: -1 });

        return res.json({
            success: true,
            message: 'Job applications fetched successfully',
            data: applications,
        });
    } catch (error) {
        console.error('Get job applications error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch job applications',
        });
    }
}

async function updateJobApplication(req, res) {
    try {
        const { id } = req.params;
        const updates = req.validatedBody;

        const jobApplication = await JobApplication.findById(id);

        if (!jobApplication) {
            return res.status(404).json({ error: 'Job application not found' });
        }

        if (jobApplication.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (updates.applicationDate) {
            updates.applicationDate = new Date(updates.applicationDate);
        }

        Object.assign(jobApplication, updates);
        await jobApplication.save();

        return res.json({
            success: true,
            message: 'Job application updated successfully',
            data: jobApplication,
        });
    } catch (error) {
        console.error('Update job application error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update job application',
        });
    }
}

async function deleteJobApplication(req, res) {
    try {
        const { id } = req.params;

        const jobApplication = await JobApplication.findById(id);

        if (!jobApplication) {
            return res.status(404).json({ error: 'Job application not found' });
        }

        if (jobApplication.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await JobApplication.deleteOne({ _id: id });

        return res.json({
            success: true,
            message: 'Job application deleted successfully',
        });
    } catch (error) {
        console.error('Delete job application error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete job application',
        });
    }
}

module.exports = { createJobApplication, getJobApplications, updateJobApplication, deleteJobApplication };
