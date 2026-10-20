const express = require('express');
const mongoose = require('mongoose');

const User = require('./models/User');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const PORT = process.env.PORT || 8081;

// Share initialization between requests in this server instance.
let databasePromise;

function connectDatabase() {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required.');
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must contain at least 32 characters.');
    }

    if (!databasePromise) {
        databasePromise = mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'comp3123_assignment1',
            serverSelectionTimeoutMS: 10000
        })
            .then(async () => {
                // Ensure the unique username/email indexes are ready.
                await User.init();
                console.log('Connected to MongoDB: comp3123_assignment1');
            })
            .catch((error) => {
                // Allow a later request to retry failed initialization.
                databasePromise = undefined;
                throw error;
            });
    }

    return databasePromise;
}

app.use(express.json({ limit: '100kb' }));

// Vercel requests must wait until database initialization finishes.
app.use(async (req, res, next) => {
    try {
        await connectDatabase();
        next();
    } catch (error) {
        console.error('Database initialization failed:', error.name);
        res.status(503).json({
            message: 'Service temporarily unavailable.'
        });
    }
});

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

// Start a local server when this file is run directly.
if (require.main === module) {
    connectDatabase()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`API running at http://localhost:${PORT}`);
            });
        })
        .catch((error) => {
            console.error('Startup failed:', error.message);
            process.exit(1);
        });
}

// Vercel imports this Express app.
module.exports = app;