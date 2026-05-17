const mongoose = require('mongoose');

if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in environment variables');
}

// Serverless-safe singleton: reuse the connection across warm invocations.
let connectionPromise = null;

async function connectDB() {
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = mongoose
        .connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
        })
        .then(() => {
            console.log('MongoDB connected');
        })
        .catch((err) => {
            console.error('MongoDB connection error:', err.message);
            connectionPromise = null;
            throw err;
        });

    return connectionPromise;
}

module.exports = connectDB;
