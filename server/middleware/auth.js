import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// F5.5: Token blacklist (in-memory for demo, use Redis in production)
const tokenBlacklist = new Set();

export function blacklistToken(token) {
  tokenBlacklist.add(token);
}

export function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

// F5.3: Protect middleware with ghost check, password change check
const protect = async (req, res, next) => {
  try {
    let token;

    // F5.2: Check HttpOnly cookie first, then Authorization header
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    // F5.5: Check token blacklist
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Token has been revoked. Please log in again.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // F5.3: Ghost user check - does user still exist?
    const user = await User.findById(decoded.userId).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
    }

    // F5.3: Account suspension check
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    // F5.3: Password change check - was password changed after token issued?
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ message: 'Password recently changed. Please log in again.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// F5.4: RBAC restrictTo factory function
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Admin hierarchy bypass
    if (req.user.role === 'admin') return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
    }
    next();
  };
};

// Admin tutor override: sets req.tutorId — admin can view as any tutor via ?tutorId=
export const resolveTutorId = (req) => {
  if (req.user.role === 'admin' && req.query.tutorId) return req.query.tutorId;
  return req.user._id;
};

export default protect;
