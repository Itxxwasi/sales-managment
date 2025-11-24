import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';

const JWT_SECRET = env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  console.error('Please set JWT_SECRET in your .env file');
  process.exit(1);
}

export const authenticate = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).populate('groupId');
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid token.' });
    if (!user.groupId || !Array.isArray(user.groupId.permissions)) {
      return res.status(401).json({ error: 'Group has no permissions defined.' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const isAdmin = (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    if (!req.user || !req.user.groupId || !Array.isArray(req.user.groupId.permissions)) {
      return res.status(403).json({ error: 'Access denied - insufficient privileges.' });
    }
    if (!req.user.groupId.permissions.includes('admin')) {
      return res.status(403).json({ error: 'Access denied - admin required.' });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(403).json({ error: 'Access denied.' });
  }
};

export const hasPermission = (permission) => {
  return (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      if (!req.user || !req.user.groupId || !Array.isArray(req.user.groupId.permissions)) {
        return res.status(403).json({ error: 'Access denied - insufficient privileges.' });
      }
      if (!req.user.groupId.permissions.includes(permission) && !req.user.groupId.permissions.includes('admin')) {
        return res.status(403).json({ error: 'Access denied - missing permission.' });
      }
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(403).json({ error: 'Access denied.' });
    }
  };
};