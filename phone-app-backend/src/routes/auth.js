import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import redis from '../config/redis.js';
import authService from '../services/authService.js';
import productionPhoneService from '../services/productionPhoneService.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Fixed rate limiting - more reasonable limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again in 15 minutes'
});

// Fixed verification rate limiting
const verificationLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 2, // 2 codes per 2 minutes
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

// NEW: Health check endpoint (this was missing)
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await productionPhoneService.healthCheck();
    const redisHealthy = await redis.ping().then(() => true).catch(() => false);
    
    res.json({
      success: true,
      services: {
        firebase: healthStatus.services.firebase,
        firebaseSms: healthStatus.services.firebaseSms,
        agora: healthStatus.services.agora,
        redis: redisHealthy
      },
      healthy: healthStatus.healthy && redisHealthy,
      warnings: healthStatus.warnings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Send verification code with Firebase Auth
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
      
      // Send verification code via Firebase (or fallback)
      const result = await productionPhoneService.sendVerificationCode(normalizedPhone);
      
      if (result.success) {
        // Store session info temporarily for verification step (if Firebase)
        if (result.data && result.data.sessionInfo) {
          await redis.setEx(
            `firebase_session:${normalizedPhone}`, 
            600, // 10 minutes
            result.data.sessionInfo
          );
        }

        res.json({
          success: true,
          message: result.message,
          data: {
            phoneNumber: normalizedPhone,
            expiresIn: 600,
            provider: result.provider,
            // Include test code in development
            ...(process.env.NODE_ENV === 'development' && result.data?._testCode && { 
              _testCode: result.data._testCode 
            })
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send verification code',
          error: result.message || 'Unknown error'
        });
      }
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
      
      // Try to get Firebase session info first
      const sessionInfo = await redis.get(`firebase_session:${normalizedPhone}`);
      
      // Verify the code (Firebase or fallback)
      const verificationResult = await productionPhoneService.verifyCode(
        normalizedPhone, 
        verificationCode, 
        sessionInfo
      );
      
      if (!verificationResult.success) {
        return res.status(400).json({
          success: false,
          message: verificationResult.message,
          error: 'VERIFICATION_FAILED'
        });
      }
      
      // Clean up session if it existed
      if (sessionInfo) {
        await redis.del(`firebase_session:${normalizedPhone}`);
      }
      
      // Code is valid, proceed with login/registration
      let user = await authService.getUserByPhone(normalizedPhone);
      
      if (!user) {
        user = await authService.createUser(normalizedPhone, displayName);
        console.log(`👤 New user created: ${user.id} (${normalizedPhone})`);
      } else {
        console.log(`👤 Existing user login: ${user.id} (${normalizedPhone})`);
      }
      
      const token = await authService.generateToken(user.id);
      
      // Store token in Redis with proper error handling
      try {
        await redis.setEx(`token:${user.id}`, 86400, token); // 24 hours
      } catch (redisError) {
        console.error('❌ Failed to store token in Redis:', redisError);
        // Continue without storing in Redis - not critical for immediate auth
      }
      
      const responseData = {
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          displayName: user.display_name
        },
        token
      };

      // Add Firebase data if available
      if (verificationResult.firebaseUid) {
        responseData.firebase = {
          uid: verificationResult.firebaseUid,
          idToken: verificationResult.idToken,
          refreshToken: verificationResult.refreshToken
        };
      }
      
      res.json({
        success: true,
        data: responseData
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

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // User data is already available from authMiddleware
    const user = {
      id: req.user.id,
      phoneNumber: req.user.phone_number,
      displayName: req.user.display_name,
      createdAt: req.user.created_at,
      lastLoginAt: req.user.last_login_at
    };

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user profile - requires authentication  
router.patch('/profile', 
  authMiddleware,
  [
    body('displayName').optional().isLength({ min: 1, max: 100 }).withMessage('Display name must be 1-100 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { displayName } = req.body;
      
      if (displayName) {
        const updatedUser = await authService.updateUser(req.user.id, { display_name: displayName });
        
        res.json({
          success: true,
          data: {
            user: {
              id: updatedUser.id,
              phoneNumber: updatedUser.phone_number,
              displayName: updatedUser.display_name,
              createdAt: updatedUser.created_at,
              lastLoginAt: updatedUser.last_login_at
            }
          },
          message: 'Profile updated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'No valid fields provided for update'
        });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Test endpoint remains the same
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes working!', 
    timestamp: new Date().toISOString(),
    firebaseEnabled: productionPhoneService.smsEnabled
  });
});

export default router;