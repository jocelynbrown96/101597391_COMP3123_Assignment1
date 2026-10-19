const { body } = require('express-validator');

const employeeValidation = [
    ...['first_name', 'last_name', 'position', 'department'].map(field =>
        body(field)
            .isString().withMessage(`${field} must be text.`)
            .bail()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage(`${field} must contain 1–100 characters.`)
    ),

    body('email')
        .isString().withMessage('Email must be text.')
        .bail()
        .trim()
        .isLength({ max: 254 }).withMessage('Email is too long.')
        .isEmail().withMessage('Enter a valid email.')
        .toLowerCase(),

    body('salary')
        .custom(value =>
            typeof value === 'number' &&
            Number.isFinite(value) &&
            value > 0
        )
        .withMessage('Salary must be a positive JSON number.'),

    body('date_of_joining')
        .isString().withMessage('Date must be text.')
        .bail()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Use YYYY-MM-DD for the joining date.')
        .bail()
        .isISO8601({ strict: true })
        .withMessage('Enter a valid calendar date.'),

    body('user')
        .not().exists()
        .withMessage('Employee ownership is assigned by the server.')
];

module.exports = employeeValidation;