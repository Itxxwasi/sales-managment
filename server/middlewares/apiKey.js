import bcrypt from 'bcryptjs';
import { ApiKey } from '../models/index.js';

export const authenticateApiKey = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const apiKey = req.header('X-API-Key') || req.query.apiKey;
    const apiSecret = req.header('X-API-Secret') || req.query.apiSecret;
    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        error: 'API authentication required',
        message: 'Please provide both X-API-Key and X-API-Secret headers',
      });
    }
    const keyRecord = await ApiKey.findOne({ apiKey, isActive: true });
    if (!keyRecord) return res.status(401).json({ error: 'Invalid API key' });
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      return res.status(401).json({ error: 'API key has expired' });
    }
    const secretMatch = await bcrypt.compare(apiSecret, keyRecord.apiSecret);
    if (!secretMatch) return res.status(401).json({ error: 'Invalid API secret' });
    keyRecord.lastUsed = new Date();
    keyRecord.usageCount = (keyRecord.usageCount || 0) + 1;
    await keyRecord.save();
    req.apiKey = keyRecord;
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};