import { RateLimiterMemory } from 'rate-limiter-flexible';

// Configure for login attempts
const loginLimiter = new RateLimiterMemory({
  points: 20, // 20 attempts
  duration: 15 * 60, // 15 minutes
  blockDuration: 60 * 15 // Block for 15 minutes after exceeding
});

export const bruteForceProtection = async (req, res, next) => {
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