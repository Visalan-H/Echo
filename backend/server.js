const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const jobApplicationsRoutes = require('./routes/jobApplication-route');
const cronRoutes = require('./routes/emailSync-route');

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
// for testing - log all incoming requests
// remove it after testing 
app.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.url);
    next();
});


app.use('/api/auth', authRoutes);
app.use('/api', jobApplicationsRoutes);
app.use('/api/cron', cronRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    console.log("THIS IS MY BACKEND SERVER");

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

module.exports = app;