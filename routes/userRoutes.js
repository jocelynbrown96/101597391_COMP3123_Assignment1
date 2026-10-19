const jwt = require('jsonwebtoken');

const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const User = require('../models/User');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
    '/signup',
    [
        body('username')
            .isString().withMessage('Username must be text.')
            .bail()
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must contain 3 to 30 characters.')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Use only letters, numbers, and underscores.')
            .toLowerCase(),

        body('email')
            .isString().withMessage('Email must be text.')
            .bail()
            .trim()
            .isLength({ max: 254 })
            .withMessage('Email is too long.')
            .isEmail().withMessage('Enter a valid email.')
            .toLowerCase(),

        body('password')
            .isString().withMessage('Password must be text.')
            .bail()
            .isLength({ min: 8 })
            .withMessage('Password must contain at least 8 characters.')
            .custom(value => Buffer.byteLength(value, 'utf8') <= 72)
            .withMessage('Password must not exceed 72 UTF-8 bytes.')
            .matches(/[a-z]/).withMessage('Include a lowercase letter.')
            .matches(/[A-Z]/).withMessage('Include an uppercase letter.')
            .matches(/[0-9]/).withMessage('Include a number.')
    ],
    validate,
    async (req, res) => {
        const { username, email, password } = req.body;

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            username,
            email,
            password: passwordHash
        });

        res.status(201).json({
            message: 'User registered successfully!',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        });
    }
);

router.post(
    '/login',
    [
        body('username')
            .optional()
            .isString().withMessage('Username must be text.')
            .bail()
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must contain 3–30 characters.')
            .toLowerCase(),

        body('email')
            .optional()
            .isString().withMessage('Email must be text.')
            .bail()
            .trim()
            .isLength({ max: 254 }).withMessage('Email is too long.')
            .isEmail().withMessage('Enter a valid email.')
            .toLowerCase(),

        body('password')
            .isString().withMessage('Password must be text.')
            .bail()
            .notEmpty().withMessage('Password is required.')
            .custom(value => Buffer.byteLength(value, 'utf8') <= 72)
            .withMessage('Password must not exceed 72 UTF-8 bytes.')
    ],
    validate,
    async (req, res) => {
        const { username, email, password } = req.body;

        // Require exactly one login identifier.
        if (Boolean(username) === Boolean(email)) {
            return res.status(400).json({
                message: 'Provide either username or email, but not both.'
            });
        }

        const query = username ? { username } : { email };
        const user = await User.findOne(query).select('+password');

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: 'Invalid credentials.'
            });
        }

        const token = jwt.sign(
            {},
            process.env.JWT_SECRET,
            {
                algorithm: 'HS256',
                subject: user._id.toString(),
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        );

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });
    }
);

module.exports = router;