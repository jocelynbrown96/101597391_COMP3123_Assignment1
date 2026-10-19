const User = require('./models/User');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8081;

app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => {
    const connected = mongoose.connection.readyState === 1;

    res.status(connected ? 200 : 503).json({
        status: connected ? 'ok' : 'unavailable',
        database: connected ? 'connected' : 'disconnected'
    });
});

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found.' });
});

app.use((err, req, res, next) => {
    if (err.code === 11000) {
        return res.status(409).json({
            message: 'Username or email already exists.'
        });
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: 'Invalid JSON body.'
        });
    }

    if (err.name === 'ValidationError' || err.name === 'CastError') {
        return res.status(400).json({
            message: 'Invalid data supplied.'
        });
    }

    console.error('Request failed:', err.name);
    res.status(500).json({
        message: 'Internal server error.'
    });
});

async function startServer() {
    if (!process.env.MONGODB_URI) {
        console.error('Missing MONGODB_URI in .env');
        process.exit(1);
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        console.error('JWT_SECRET must contain at least 32 characters.');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'comp3123_assignment1',
            serverSelectionTimeoutMS: 10000
        });

        await User.init();

        console.log('Connected to MongoDB: comp3123_assignment1');

        app.listen(PORT, () => {
            console.log(`API running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Database connection failed:', error.name);
        process.exit(1);
    }
}

startServer();