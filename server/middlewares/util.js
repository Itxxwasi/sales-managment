// Input sanitization
export const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const MAX_MAP_SIZE = 10000;
const CLEANUP_INTERVAL = 60 * 60 * 1000;
setInterval(() => {
  if (rateLimitMap.size > 0) {
    console.log(`🧹 Rate limit cleanup: clearing ${rateLimitMap.size} entries`);
    rateLimitMap.clear();
  }
}, CLEANUP_INTERVAL);

export const rateLimit = (maxRequests = 10, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (rateLimitMap.size >= MAX_MAP_SIZE && !rateLimitMap.has(clientId)) {
      console.warn('⚠️ Rate limit map at max size, clearing old entries');
      rateLimitMap.clear();
    }
    if (rateLimitMap.has(clientId)) {
      const requests = rateLimitMap.get(clientId).filter((time) => time > windowStart);
      rateLimitMap.set(clientId, requests);
    } else {
      rateLimitMap.set(clientId, []);
    }
    const requests = rateLimitMap.get(clientId);
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }
    requests.push(now);
    next();
  };
};