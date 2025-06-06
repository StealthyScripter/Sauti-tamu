import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import pushNotificationService from '../services/pushNotificationService.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

// Register FCM token
router.post('/register-token',
  [
    body('fcmToken')
      .isLength({ min: 100, max: 200 })
      .withMessage('Valid FCM token required'),
    body('deviceInfo')
      .optional()
      .isObject()
      .withMessage('Device info must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { fcmToken, deviceInfo = {} } = req.body;
      const userId = req.user.userId;

      const result = await pushNotificationService.registerFCMToken(userId, fcmToken, {
        ...deviceInfo,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        registeredAt: new Date().toISOString()
      });

      if (result.success) {
        res.json({
          success: true,
          message: 'FCM token registered successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to register FCM token',
          error: result.error
        });
      }

    } catch (error) {
      console.error('FCM token registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register FCM token',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Send test notification
router.post('/test',
  [
    body('message')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('Message must be 1-200 characters')
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

      const { message = 'Test notification from Phone App!' } = req.body;
      const userId = req.user.userId;

      const result = await pushNotificationService.sendTestNotification(userId, message);

      res.json({
        success: result.success,
        message: result.success ? 'Test notification sent' : 'Failed to send test notification',
        data: result
      });

    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Get notification settings
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's notification preferences from database
    const pool = (await import('../config/database.js')).default;
    const result = await pool.query(`
      SELECT setting_value 
      FROM user_settings 
      WHERE user_id = $1 AND setting_key = 'notification_preferences'
    `, [userId]);

    const preferences = result.rows.length > 0 
      ? result.rows[0].setting_value 
      : {
        callNotifications: true,
        missedCallNotifications: true,
        recordingNotifications: true,
        sound: true,
        vibration: true
      };

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification settings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update notification settings
router.put('/settings',
  [
    body('callNotifications').optional().isBoolean(),
    body('missedCallNotifications').optional().isBoolean(),
    body('recordingNotifications').optional().isBoolean(),
    body('sound').optional().isBoolean(),
    body('vibration').optional().isBoolean()
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

      const userId = req.user.userId;
      const preferences = req.body;

      const pool = (await import('../config/database.js')).default;
      await pool.query(`
        INSERT INTO user_settings (user_id, setting_key, setting_value, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (user_id, setting_key)
        DO UPDATE SET setting_value = $3, updated_at = NOW()
      `, [userId, 'notification_preferences', JSON.stringify(preferences)]);

      res.json({
        success: true,
        message: 'Notification settings updated successfully',
        data: preferences
      });

    } catch (error) {
      console.error('Update notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification settings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get FCM tokens count
    const tokens = await pushNotificationService.getUserFCMTokens(userId);
    const serviceStats = pushNotificationService.getStats();

    res.json({
      success: true,
      data: {
        registeredDevices: tokens.length,
        serviceStatus: serviceStats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;