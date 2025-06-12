import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import redis from '../config/redis.js';
import authService from '../services/authService.js';
import phoneVerificationService from '../services/productionPhoneService.js';

const router = express.Router();

// Fixed rate limiting - more reasonable limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window (increased from too restrictive)
  message: 'Too many authentication attempts, please try again in 15 minutes'
});

// Fixed verification rate limiting
const verificationLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes (reduced from 20 minutes)
  max: 2, // 2 codes per 2 minutes (increased from 1 per 20 minutes)
  message: 'Please wait 2 minutes before requesting another verification code'
});

// Enhanced Redis connection check
async function ensureRedisConnection() {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed in auth routes:', error);
    throw new Error('Authentication service temporarily unavailable');
  }
}

// Send verification code with proper error handling
router.post('/verify-phone',
  verificationLimiter,
  [
    body('phoneNumber')
      .custom((value) => {
        const cleaned = value.replace(/[^\d+]/g, '');
        if (!/^\+?[1-9]\d{6,14}$/.test(cleaned)) {
          throw new Error('Valid phone number required (6-15 digits, optionally starting with +)');
        }
        return true;
      })
      .withMessage('Valid phone number required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      // Check Redis connection before proceeding
      await ensureRedisConnection();

      const { phoneNumber } = req.body;
      const normalizedPhone = authService.normalizePhoneNumber(phoneNumber);
      
      const result = await phoneVerificationService.sendVerificationCode(normalizedPhone);
      
      res.json({
        success: true,
        message: result.message,
        data: {
          phoneNumber: normalizedPhone,
          expiresIn: 600,
          ...(process.env.NODE_ENV === 'development' && result.data?._testCode && { 
            _testCode: result.data._testCode 
          })
        }
      });
    } catch (error) {
      console.error('Phone verification error:', error);
      
      // Enhanced error responses
      if (error.message.includes('Authentication service')) {
        return res.status(503).json({
          success: false,
          message: 'Authentication service temporarily unavailable',
          error: 'SERVICE_UNAVAILABLE'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Login with enhanced error handling
router.post('/login', 
  authLimiter,
  [
    body('phoneNumber')
      .custom((value) => {
        const cleaned = value.replace(/[^\d+]/g, '');
        if (!/^\+?[1-9]\d{6,14}$/.test(cleaned)) {
          throw new Error('Valid phone number required (6-15 digits, optionally starting with +)');
        }
        return true;
      })
      .withMessage('Valid phone number required'),
    body('verificationCode')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('6-digit verification code required'),
    body('displayName').optional().isLength({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      // Check Redis connection
      await ensureRedisConnection();

      const { phoneNumber, verificationCode, displayName } = req.body;
      const normalizedPhone = authService.normalizePhoneNumber(phoneNumber);
      
      // Verify the code first
      const verificationResult = await phoneVerificationService.verifyCode(normalizedPhone, verificationCode);
      
      if (!verificationResult.success) {
        return res.status(400).json({
          success: false,
          message: verificationResult.message,
          error: 'VERIFICATION_FAILED'
        });
      }
      
      // Code is valid, proceed with login/registration
      let user = await authService.getUserByPhone(normalizedPhone);
      
      if (!user) {
        user = await authService.createUser(normalizedPhone, displayName);
      }
      
      const token = await authService.generateToken(user.id);
      
      // Store token in Redis with proper error handling
      try {
        await redis.setEx(`token:${user.id}`, 86400, token); // 24 hours
      } catch (redisError) {
        console.error('❌ Failed to store token in Redis:', redisError);
        // Continue without storing in Redis - not critical for immediate auth
      }
      
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
      
      // Enhanced error handling
      if (error.message.includes('Database error')) {
        return res.status(503).json({
          success: false,
          message: 'Database temporarily unavailable',
          error: 'DATABASE_ERROR'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Enhanced logout with error handling
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = await authService.validateToken(token);
        await redis.del(`token:${decoded.userId}`);
      } catch (error) {
        console.error('❌ Error during logout cleanup:', error);
        // Continue with logout even if cleanup fails
      }
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed',
      error: 'LOGOUT_ERROR'
    });
  }
});

// Test endpoint remains the same
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes working!', 
    timestamp: new Date().toISOString() 
  });
});

export default router;