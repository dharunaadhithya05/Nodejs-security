require('dotenv').config();

const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Log errors to the terminal and to a local file.
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Security middleware.
app.use(helmet());
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

// General request limit: 100 requests per IP in 15 minutes.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use(generalLimiter);

// A stricter limit for login attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// Demo-only storage. Data disappears when the server restarts.
// Use a real database for an actual application.
const users = [];
const saltRounds = 12;

const registerSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(72).required()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(72).required()
});

app.get('/', (req, res) => {
  res.json({
    message: 'Node.js Security Demo API is running',
    endpoints: ['/health', '/register', '/login']
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Register: validate input, hash the password, and never return the hash.
app.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.details.map(item => item.message)
      });
    }

    const existingUser = users.find(user => user.email === value.email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(value.password, saltRounds);

    users.push({
      id: users.length + 1,
      email: value.email,
      password: hashedPassword
    });

    logger.info('A user account was created');
    return res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    next(err);
  }
});

// Login: compare the entered password with the stored password hash.
app.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: 'Invalid email or password format.' });
    }

    const user = users.find(item => item.email === value.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(value.password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    logger.info('A user logged in successfully');
    return res.json({ message: 'Login successful.' });
  } catch (err) {
    next(err);
  }
});

// Keep the detailed error in server logs, not in the public response.
app.use((err, req, res, next) => {
  logger.error('Request failed', { message: err.message, stack: err.stack });

  const message = NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
