const { RateLimiterMemory } = require('rate-limiter-flexible');

// Configure for login attempts
const loginLimiter = new RateLimiterMemory({
  points: 20, // 5 attempts
  duration: 15 * 60, // 5 minutes
  blockDuration: 60 * 15 // Block for 15 minutes after exceeding
});

const bruteForceProtection = async (req, res, next) => {
  try {
    const ip = req.ip;
    await loginLimiter.consume(ip);
    next();
  } catch (error) {
    res.status(429).json({
      error: {
        message: 'Too many login attempts. Your IP is temporarily blocked.',
        code: 'IP_BLOCKED',
        retryAfter: error.msBeforeNext / 1000 // Seconds
      }
    });
  }
};

module.exports = {bruteForceProtection};