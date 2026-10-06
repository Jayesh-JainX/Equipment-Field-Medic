const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Local in-memory users cache if MongoDB is disconnected
const inMemoryUsers = new Map();

// Helper to sign JWT
const generateToken = (userId, email, name) => {
  return jwt.sign(
    { userId, email, name },
    process.env.JWT_SECRET || 'field_medic_super_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user with email & password
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Try MongoDB first
    try {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const defaultGear = [
        { name: 'Duct Tape (Heavy Duty)', category: 'Repair', available: true },
        { name: 'Paracord (550lb, 20ft)', category: 'Cordage', available: true },
        { name: 'Zip Ties (Assorted)', category: 'Hardware', available: true },
        { name: 'Seam Sealer / Super Glue', category: 'Adhesive', available: true },
        { name: 'Multi-Tool & Pliers', category: 'Tools', available: true },
      ];

      const newUser = new User({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        gearKit: defaultGear
      });

      await newUser.save();

      const token = generateToken(newUser._id, newUser.email, newUser.name);

      return res.status(201).json({
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          gearKit: newUser.gearKit
        }
      });
    } catch (dbErr) {
      // Fallback for standalone/no-DB mode
      console.warn('MongoDB connection unavailable, using memory auth fallback:', dbErr.message);
      
      const lowerEmail = email.toLowerCase();
      if (inMemoryUsers.has(lowerEmail)) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const memUser = {
        id: 'mem_' + Date.now(),
        name,
        email: lowerEmail,
        password: hashedPassword,
        gearKit: [
          { name: 'Duct Tape (Heavy Duty)', category: 'Repair', available: true },
          { name: 'Paracord (550lb, 20ft)', category: 'Cordage', available: true },
          { name: 'Zip Ties (Assorted)', category: 'Hardware', available: true },
          { name: 'Multi-Tool & Pliers', category: 'Tools', available: true }
        ]
      };

      inMemoryUsers.set(lowerEmail, memUser);
      const token = generateToken(memUser.id, memUser.email, memUser.name);

      return res.status(201).json({
        token,
        user: {
          id: memUser.id,
          name: memUser.name,
          email: memUser.email,
          gearKit: memUser.gearKit
        }
      });
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password' });
    }

    const lowerEmail = email.toLowerCase();

    try {
      const user = await User.findOne({ email: lowerEmail });
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id, user.email, user.name);
        return res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            gearKit: user.gearKit
          }
        });
      }
    } catch (dbErr) {
      // DB error check fallback below
    }

    // Check in-memory fallback
    if (inMemoryUsers.has(lowerEmail)) {
      const memUser = inMemoryUsers.get(lowerEmail);
      const isMatch = await bcrypt.compare(password, memUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(memUser.id, memUser.email, memUser.name);
      return res.json({
        token,
        user: {
          id: memUser.id,
          name: memUser.name,
          email: memUser.email,
          gearKit: memUser.gearKit
        }
      });
    }

    return res.status(400).json({ message: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get logged in user details
router.get('/me', authMiddleware, async (req, res) => {
  try {
    try {
      const user = await User.findById(req.user.userId).select('-password');
      if (user) {
        return res.json(user);
      }
    } catch (dbErr) {}

    // Fallback search in memory
    for (const memUser of inMemoryUsers.values()) {
      if (memUser.id === req.user.userId || memUser.email === req.user.email) {
        const { password, ...userData } = memUser;
        return res.json(userData);
      }
    }

    return res.json({
      id: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      gearKit: [
        { name: 'Duct Tape (Heavy Duty)', category: 'Repair', available: true },
        { name: 'Paracord (550lb, 20ft)', category: 'Cordage', available: true },
        { name: 'Zip Ties (Assorted)', category: 'Hardware', available: true }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

module.exports = router;
