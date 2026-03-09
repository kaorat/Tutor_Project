// F3.3: Circuit breaker rate limiting per IP (5 req/10s)
const ipRequests = new Map();

export function circuitBreaker(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 10000; // 10 seconds
  const maxRequests = 5;

  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, []);
  }

  const timestamps = ipRequests.get(ip).filter(t => now - t < windowMs);
  
  if (timestamps.length >= maxRequests) {
    return res.status(429).json({
      message: 'Too many requests. Circuit breaker activated.',
      retryAfter: Math.ceil((timestamps[0] + windowMs - now) / 1000) + 's',
    });
  }

  timestamps.push(now);
  ipRequests.set(ip, timestamps);

  // Auto-reset: clean old entries every 30s
  if (Math.random() < 0.01) {
    for (const [key, val] of ipRequests.entries()) {
      const filtered = val.filter(t => now - t < windowMs);
      if (filtered.length === 0) ipRequests.delete(key);
      else ipRequests.set(key, filtered);
    }
  }

  next();
}
