import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import protect from '../middleware/auth.js';
import { blacklistToken } from '../middleware/auth.js';
import { circuitBreaker } from '../middleware/circuitBreaker.js';

const router = express.Router();

// F5.2: JWT via HttpOnly cookie, 7-day expiry
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const sendTokenCookie = (res, token) => {
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({ name, email, password, phone });
    await user.save();
    const token = generateToken(user._id);
    sendTokenCookie(res, token);
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login — F3.3: rate limited to 5 attempts per 10s per IP
router.post('/login', circuitBreaker, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    // F5.1: select:false on password, so +password needed; also fetch brute-force fields
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      // F5.5: 2-second delay even for unknown email (prevent user enumeration)
      await new Promise(r => setTimeout(r, 2000));
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // F5.5: Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const waitSec = Math.ceil((user.lockUntil - Date.now()) / 1000);
      return res.status(429).json({ message: `Too many failed attempts. Try again in ${waitSec}s.` });
    }

    const isMatch = await user.correctPassword(password);
    if (!isMatch) {
      // F5.5: 2-second response delay on wrong password
      await new Promise(r => setTimeout(r, 2000));

      // Increment login attempt counter
      const attempts = (user.loginAttempts || 0) + 1;
      const update = { loginAttempts: attempts };
      if (attempts >= 5) {
        // Lock for 15 minutes
        update.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        update.loginAttempts = 0;
      }
      await User.findByIdAndUpdate(user._id, update);

      const remaining = 5 - attempts;
      return res.status(400).json({
        message: remaining > 0
          ? `Invalid email or password. ${remaining} attempt(s) remaining.`
          : 'Too many failed attempts. Account locked for 15 minutes.'
      });
    }

    // F5.5: Reset counter on successful login
    if (user.loginAttempts > 0 || user.lockUntil) {
      await User.findByIdAndUpdate(user._id, { loginAttempts: 0, lockUntil: null });
    }

    const token = generateToken(user._id);
    sendTokenCookie(res, token);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// F5.5: Logout with token blacklist
router.post('/logout', protect, (req, res) => {
  if (req.token) blacklistToken(req.token);
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', protect, [
  body('name').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.correctPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    // Issue new token after password change
    const token = generateToken(user._id);
    sendTokenCookie(res, token);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
