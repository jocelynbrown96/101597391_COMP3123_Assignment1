# COMP3123 Assignment 1 — Employee Management API

**Student:** Jocelyn Brown  
**Student ID:** 101597391

REST API built with Node.js, Express, MongoDB/Mongoose, and JWT authentication.

## Links

- Repository: https://github.com/jocelynbrown96/101597391_COMP3123_Assignment1
- Hosted API: https://101597391-comp-3123-assignment1.vercel.app
- Health check: https://101597391-comp-3123-assignment1.vercel.app/health

## Features

- User signup with hashed passwords.
- Login using either username or email and a password.
- JWT authentication for employee endpoints.
- Create, list, retrieve, update, and delete employees.
- Employee ownership: users can access only their own employees.
- Input validation and JSON error responses.

## Run locally

Install Node.js 24 and run:

```bash
npm ci
```

Copy `.env.example` to `.env` and supply your own values:

```dotenv
PORT=8081
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER_HOST/comp3123_assignment1
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
JWT_EXPIRES_IN=1h
```

Allow your connection's IP address in MongoDB Atlas, then start:

```bash
npm run dev
```

Local API: `http://localhost:8081`

The application uses the database `comp3123_assignment1`.
The `.env` file is excluded from Git.

## Endpoints

| Method | Path | Success | Authentication |
|---|---|---|---|
| POST | `/api/v1/user/signup` | 201 | None |
| POST | `/api/v1/user/login` | 200 | None |
| GET | `/api/v1/emp/employees` | 200 | Bearer token |
| POST | `/api/v1/emp/employees` | 201 | Bearer token |
| GET | `/api/v1/emp/employees/:eid` | 200 | Bearer token |
| PUT | `/api/v1/emp/employees/:eid` | 200 | Bearer token |
| DELETE | `/api/v1/emp/employees?eid=:eid` | 204 | Bearer token |

For protected requests, use:

```text
Authorization: Bearer YOUR_LOGIN_TOKEN
```

### Signup

```json
{
  "username": "example_user",
  "email": "example.user@example.com",
  "password": "ExamplePassword42!"
}
```

A successful response contains a message and a `user` object.
Passwords are not returned. Duplicate usernames or emails return 409.

### Login

```json
{
  "username": "example_user",
  "password": "ExamplePassword42!"
}
```

Alternatively, replace `username` with `email`. Supply only one login
identifier. A successful response contains a message, token, and user.
Incorrect credentials return 401.

### Create or update an employee

Both POST and PUT require the following fields:

```json
{
  "first_name": "Avery",
  "last_name": "Taylor",
  "email": "avery.taylor@example.com",
  "position": "Software Developer",
  "salary": 72000,
  "date_of_joining": "2026-10-19",
  "department": "Engineering"
}
```

Creation and update responses contain a message and an `employee` object.
The server assigns employee ownership from the authenticated user.

Listing returns an array. Retrieving one employee returns an employee object.
Successful deletion returns 204 with no response body.

### Error responses

Invalid input returns 400 with validation details, for example:

```json
{
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Enter a valid email."
    }
  ]
}
```

The validation message above is illustrative; wording depends on the rule.

Other responses include:

- 401: missing, invalid, or expired authentication; incorrect login credentials.
- 404: employee not found or not owned by the authenticated user.
- 409: duplicate username or email.
- 503: database initialization unavailable.

## Postman tests

The `postman/` directory contains the Postman v12 YAML collection,
including its resource folders and executable test scripts. Preserve
the complete directory structure when opening it in Postman.

Set the collection variable `baseUrl` to either:

- Local: `http://localhost:8081`
- Hosted: `https://101597391-comp-3123-assignment1.vercel.app`

The signup script generates fresh test-account details.
Login saves `token`, and employee creation saves `employeeId`.
These two variables are supplied empty in the submitted collection.

Run one iteration in this order:

1. Signup — new user
2. Signup — duplicate account
3. Login — valid credentials
4. Login — wrong password
5. Get all employees
6. Create employee
7. Get employee by ID
8. Update employee
9. Get employee after update
10. Delete employee
11. Get deleted employee
12. Create employee — invalid data
13. Get employees — no token
14. Get employees — invalid token
15. Get employee — invalid ID

Expected result: **30 passing assertions, 0 failures**.

The collection was run successfully against both the local and hosted APIs.
Expected error responses are checked by assertions and count as passing tests.
Each full run creates a test user and deletes the employee it creates.

Tests are run through Postman; the default `npm test` script is not configured.

## Evidence

`comp3123_assignment1_screenshots/` contains API response screenshots,
collection run results, and the hosted database health check.

## Deployment

The API is deployed on Vercel with the Express preset.
Configure `MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`
as Vercel environment variables.

MongoDB Atlas network access must permit connections from the deployment.