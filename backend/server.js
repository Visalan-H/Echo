const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth-route');
const jobApplicationsRoutes = require('./routes/jobApplication-route');
const gmailRoutes = require('./routes/emailSync-route');

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // needed for avatar images
}));
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

// CSRF guard for state-changing requests.
// sameSite:'none' is required for cross-domain cookies but disables browser-level CSRF
// protection, so we enforce it manually via the Origin header.
app.use((req, res, next) => {
    const modifying = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (!modifying.includes(req.method)) return next();

    const origin = req.headers.origin;
    const allowedOrigin = process.env.FRONTEND_URL;

    // Allow requests with no Origin (e.g. server-to-server, Postman in dev)
    if (!origin) return next();

    if (origin !== allowedOrigin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    next();
});

app.use(express.json());
app.use(cookieParser());

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});

app.use('/api/auth', authRoutes);
app.use('/api', jobApplicationsRoutes);
app.use('/api/gmail', gmailRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
