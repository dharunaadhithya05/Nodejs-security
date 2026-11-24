# Node.js Security Best Practices

A beginner-friendly Express API demonstrating the topics from the CodeLucky Node.js security tutorial.

## Topics covered

1. **Input validation** – Joi checks that email and password have the expected format.
2. **Secure authentication** – bcrypt hashes passwords before storage and compares hashes during login.
3. **Environment configuration** – dotenv loads local configuration from `.env`. The `.env` file is ignored by Git.
4. **SQL injection prevention** – use parameterized queries instead of joining user input into SQL strings (example below).
5. **HTTPS and security headers** – Helmet adds common HTTP security headers. Deploy behind HTTPS in production.
6. **Rate limiting** – limits repeated requests, especially login attempts.
7. **Dependency security** – `npm audit` checks installed packages for known vulnerabilities.
8. **Error handling and logging** – Winston records server-side errors while the API returns a safer message.

## Requirements

- Node.js and npm installed
- VS Code or another code editor

## Run locally

```bash
npm install
```

Copy `.env.example` to `.env`, then start the app:

```bash
npm start
```

Open `http://localhost:3000` in your browser. You should see a JSON message confirming the API is running.

## Test the API

Use Postman, Thunder Client, or another API client.

### Register

- Method: `POST`
- URL: `http://localhost:3000/register`
- Body type: JSON

```json
{
  "email": "student@example.com",
  "password": "StrongPass123"
}
```

### Login

- Method: `POST`
- URL: `http://localhost:3000/login`
- Body type: JSON

```json
{
  "email": "student@example.com",
  "password": "StrongPass123"
}
```

A successful request returns a message. Try an invalid email or a password shorter than 8 characters to see validation working.

> This is a learning demo. It stores users in memory, so accounts disappear when the server restarts. It is not production authentication and does not issue login tokens.

## SQL injection prevention

Do not build SQL by joining untrusted input into the query:

```js
// Unsafe pattern — do not use
const sql = "SELECT * FROM users WHERE id = " + userId;
```

Use a parameterized query with a database driver such as `mysql2`:

```js
const [rows] = await connection.execute(
  'SELECT id, email FROM users WHERE id = ?',
  [userId]
);
```

The SQL statement and the user value are sent separately. This example is a reference snippet; this demo project does not connect to a database.

## HTTPS note

`http://localhost` is only for local testing. In production, deploy behind a correctly configured HTTPS/TLS connection. Helmet sets security headers, but it does not create an HTTPS certificate or encrypt a plain HTTP connection by itself.

## Dependency audit

Run:

```bash
npm audit
```

To apply compatible fixes suggested by npm:

```bash
npm audit fix
```

Read the audit report before applying changes. Do not use `npm audit fix --force` blindly because it may introduce breaking package upgrades.

## Project structure

```text
nodejs-security-best-practices/
├── app.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Learning references

- Video: https://youtu.be/BbbOPxzK5EY
- OWASP Node.js Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html

## Important

This repository is a learning exercise based on the tutorial topics. It demonstrates selected defensive practices; it does not guarantee that an application is completely secure.
