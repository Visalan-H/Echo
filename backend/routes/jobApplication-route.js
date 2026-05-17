const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/jobApplication-validate-middleware');
const { jobApplicationSchema, jobApplicationUpdateSchema } = require('../utils/jobApplication-utils');
const {
    createJobApplication,
    getJobApplications,
    updateJobApplication,
    deleteJobApplication,
} = require('../controllers/jobApplication-controller');

router.post('/job-applications', authMiddleware, validate(jobApplicationSchema), createJobApplication);
router.get('/job-applications', authMiddleware, getJobApplications);
router.put('/job-applications/:id', authMiddleware, validate(jobApplicationUpdateSchema), updateJobApplication);
router.delete('/job-applications/:id', authMiddleware, deleteJobApplication);

module.exports = router;
