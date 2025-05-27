require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Simple in-memory DB (replace with real DB in production)
const users = [];
const phones = {};

// Auth endpoint: register or login
app.post('/api/auth', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  let user = users.find(u => u.email === email);
  if (!user) {
    // Register new user
    user = { id: users.length + 1, email, password };
    users.push(user);
    phones[user.id] = [];
  } else {
    // Login: check password
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '1h'
  });
  res.json({ token });
});

// Middleware to verify JWT token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Get user's phones
app.get('/api/phones', authMiddleware, (req, res) => {
  const userPhones = phones[req.user.id] || [];
  res.json(userPhones);
});

// Add new phone
app.post('/api/phones', authMiddleware, (req, res) => {
  const { name, id } = req.body;
  if (!name || !id) {
    return res.status(400).json({ error: 'Name and ID required' });
  }
  phones[req.user.id].push({ name, id });
  res.status(201).json({ message: 'Phone added' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
