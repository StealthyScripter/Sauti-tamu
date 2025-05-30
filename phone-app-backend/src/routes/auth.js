import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import redis from 'redis';
import authService from '../services/authService.js';

const router = express.Router();

// Redis client setup
const redisClient = redis.createClient({ 
  url: process.env.REDIS_URI || 'redis://localhost:6379'
});

// Initialize Redis connection
async function initRedis() {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected for auth routes');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
  }
}

// Initialize when module loads
initRedis();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts'
});

router.post('/login', 
  authLimiter,
  [
    body('phoneNumber')
      .custom((value) => {
        // Remove all non-digit characters except +
        const cleaned = value.replace(/[^\d+]/g, '');
        // Check if it's a valid phone number format
        if (!/^\+?[1-9]\d{6,14}$/.test(cleaned)) {
          throw new Error('Valid phone number required (6-15 digits, optionally starting with +)');
        }
        return true;
      })
      .withMessage('Valid phone number required'),
    body('displayName').optional().isLength({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phoneNumber, displayName } = req.body;
      
      let user = await authService.getUserByPhone(phoneNumber);
      
      if (!user) {
        user = await authService.createUser(phoneNumber, displayName);
      }
      
      const token = await authService.generateToken(user.id);
      
      // Store token in Redis
      await redisClient.setEx(`token:${user.id}`, 86400, token); // 24 hours
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            phoneNumber: user.phone_number,
            displayName: user.display_name
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        error: error.message
      });
    }
  }
);

router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = await authService.validateToken(token);
      await redisClient.del(`token:${decoded.userId}`);
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// Test endpoint to verify routes work
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes working!', 
    timestamp: new Date().toISOString() 
  });
});

export default router;