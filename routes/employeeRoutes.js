const { param, query } = require('express-validator');
const express = require('express');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const employeeValidation = require('../middleware/employeeValidation');

const router = express.Router();

// Every route below requires a verified login token.
router.use(auth);

// List only the logged-in user's employees.
router.get('/employees', async (req, res) => {
    const employees = await Employee.find({
        user: req.user._id
    }).sort({ created_at: -1 });

    res.status(200).json(employees);
});

// Create an employee owned by the logged-in user.
router.post(
    '/employees',
    employeeValidation,
    validate,
    async (req, res) => {
        const {
            first_name,
            last_name,
            email,
            position,
            salary,
            date_of_joining,
            department
        } = req.body;

        const employee = await Employee.create({
            first_name,
            last_name,
            email,
            position,
            salary,
            date_of_joining,
            department,
            user: req.user._id
        });

        res.status(201).json({
            message: 'Employee created successfully.',
            employee
        });
    }
);

// Retrieve one employee belonging to the logged-in user.
router.get(
    '/employees/:eid',
    param('eid').isMongoId().withMessage('Invalid employee ID.'),
    validate,
    async (req, res) => {
        const employee = await Employee.findOne({
            _id: req.params.eid,
            user: req.user._id
        });

        if (!employee) {
            return res.status(404).json({
                message: 'Employee not found.'
            });
        }

        res.status(200).json(employee);
    }
);

// Update an employee without changing ownership.
router.put(
    '/employees/:eid',
    param('eid').isMongoId().withMessage('Invalid employee ID.'),
    employeeValidation,
    validate,
    async (req, res) => {
        const {
            first_name,
            last_name,
            email,
            position,
            salary,
            date_of_joining,
            department
        } = req.body;

        const employee = await Employee.findOneAndUpdate(
            {
                _id: req.params.eid,
                user: req.user._id
            },
            {
                $set: {
                    first_name,
                    last_name,
                    email,
                    position,
                    salary,
                    date_of_joining,
                    department
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!employee) {
            return res.status(404).json({
                message: 'Employee not found.'
            });
        }

        res.status(200).json({
            message: 'Employee updated successfully.',
            employee
        });
    }
);

// The assignment requires the ID in the query string for DELETE.
router.delete(
    '/employees',
    query('eid')
        .isString().withMessage('Provide one employee ID.')
        .bail()
        .isMongoId().withMessage('Invalid employee ID.'),
    validate,
    async (req, res) => {
        const employee = await Employee.findOneAndDelete({
            _id: req.query.eid,
            user: req.user._id
        });

        if (!employee) {
            return res.status(404).json({
                message: 'Employee not found.'
            });
        }

        res.status(204).send();
    }
);

module.exports = router;