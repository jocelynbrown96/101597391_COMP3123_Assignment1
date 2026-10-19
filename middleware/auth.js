const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    const authorization = req.get('Authorization');
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        return res.status(401).json({
            message: 'A Bearer token is required.'
        });
    }

    let payload;

    try {
        payload = jwt.verify(match[1], process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });
    } catch {
        return res.status(401).json({
            message: 'Invalid or expired token.'
        });
    }

    if (
        typeof payload !== 'object' ||
        !mongoose.isObjectIdOrHexString(payload.sub)
    ) {
        return res.status(401).json({
            message: 'Invalid token subject.'
        });
    }

    try {
        const user = await User.findById(payload.sub);

        if (!user) {
            return res.status(401).json({
                message: 'User no longer exists.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};