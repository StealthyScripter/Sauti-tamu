import express from 'express';
import { body, param, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import callService from '../services/callService.js';
import callingService from '../services/callingService.js';

const router = express.Router();

// Rate limiting for call-related endpoints
const callLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 calls per minute per IP
  message: 'Too many call attempts, please try again later.',
});

// All call routes require authentication
router.use(authenticateToken);

// POST /api/calls/initiate - Initiate a new call
router.post('/initiate',
  callLimiter,
  [
    body('toPhoneNumber')
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
    body('callType')
      .optional()
      .isIn(['voice', 'video'])
      .withMessage('Call type must be voice or video'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
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

      const { toPhoneNumber, callType = 'voice', metadata = {} } = req.body;
      const fromUserId = req.user.userId;

      // Add device/request metadata
      const enrichedMetadata = {
        ...metadata,
        deviceInfo: {
          caller: {
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            ...metadata.deviceInfo?.caller
          }
        },
        requestTimestamp: new Date().toISOString()
      };

      const result = await callingService.initiateCall(
        fromUserId,
        toPhoneNumber,
        callType,
        enrichedMetadata
      );

      // Log call initiation to analytics
      try {
        await callService.logCall({
          callId: result.callId,
          fromUserId,
          toUserId: null, // Will be updated when recipient accepts
          toPhoneNumber: result.toPhoneNumber,
          callType: result.callType,
          status: result.status,
          startTime: new Date().toISOString(),
          connectionType: metadata.connectionType || 'unknown'
        });
      } catch (logError) {
        console.error('Failed to log call initiation:', logError);
        // Don't fail the request if logging fails
      }

      res.status(201).json({
        success: true,
        message: 'Call initiated successfully',
        data: result
      });

    } catch (error) {
      console.error('Call initiation error:', error);
      
      const statusCode = error.message.includes('already has an active call') || 
                        error.message.includes('currently on another call') ? 409 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to initiate call',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// POST /api/calls/{callId}/accept - Accept an incoming call
router.post('/:callId/accept',
  [
    param('callId')
      .isUUID()
      .withMessage('Valid call ID required'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
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

      const { callId } = req.params;
      const { metadata = {} } = req.body;
      const userId = req.user.userId;

      // Add device/request metadata
      const enrichedMetadata = {
        ...metadata,
        deviceInfo: {
          callee: {
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            ...metadata.deviceInfo?.callee
          }
        },
        acceptedAt: new Date().toISOString()
      };

      const result = await callingService.acceptCall(callId, userId, enrichedMetadata);

      // Update call log
      try {
        await callService.updateCallStatus(callId, 'active');
      } catch (logError) {
        console.error('Failed to update call log:', logError);
      }

      res.json({
        success: true,
        message: 'Call accepted successfully',
        data: result
      });

    } catch (error) {
      console.error('Call accept error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 :
        error.message.includes('Unauthorized') ? 403 :
          error.message.includes('Cannot accept') ? 409 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to accept call',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// POST /api/calls/{callId}/reject - Reject an incoming call
router.post('/:callId/reject',
  [
    param('callId')
      .isUUID()
      .withMessage('Valid call ID required'),
    body('reason')
      .optional()
      .isIn(['busy', 'declined', 'unavailable', 'blocked'])
      .withMessage('Invalid rejection reason'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
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

      const { callId } = req.params;
      const { reason = 'declined', metadata = {} } = req.body;
      const userId = req.user.userId;

      const result = await callingService.rejectCall(callId, userId, reason);

      // Update call log
      try {
        await callService.updateCallStatus(callId, 'rejected');
      } catch (logError) {
        console.error('Failed to update call log:', logError, metadata);
      }

      res.json({
        success: true,
        message: 'Call rejected successfully',
        data: {
          ...result,
          reason
        }
      });

    } catch (error) {
      console.error('Call reject error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 :
        error.message.includes('Unauthorized') ? 403 :
          error.message.includes('Cannot reject') ? 409 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to reject call',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// POST /api/calls/{callId}/end - End an active call
router.post('/:callId/end',
  [
    param('callId')
      .isUUID()
      .withMessage('Valid call ID required'),
    body('qualityScore')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Quality score must be between 1 and 5'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
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

      const { callId } = req.params;
      const { qualityScore, metadata = {} } = req.body;
      const userId = req.user.userId;

      const result = await callingService.endCall(callId, userId, qualityScore);

      // Update call log with final details
      try {
        await callService.updateCallStatus(
          callId, 
          'ended', 
          new Date().toISOString(), 
          result.duration
        );
      } catch (logError) {
        console.error('Failed to update call log:', logError, metadata);
      }

      res.json({
        success: true,
        message: 'Call ended successfully',
        data: result
      });

    } catch (error) {
      console.error('Call end error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 :
        error.message.includes('Unauthorized') ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to end call',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// GET /api/calls/active - Get user's active calls
router.get('/active', async (req, res) => {
  try {
    const userId = req.user.userId;
    const activeCalls = await callingService.getActiveCalls(userId);

    res.json({
      success: true,
      data: {
        calls: activeCalls,
        count: activeCalls.length
      }
    });

  } catch (error) {
    console.error('Error fetching active calls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active calls',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/calls/{callId} - Get call details
router.get('/:callId',
  [
    param('callId')
      .isUUID()
      .withMessage('Valid call ID required')
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

      const { callId } = req.params;
      const userId = req.user.userId;
      
      const call = await callingService.getCall(callId);
      
      if (!call) {
        return res.status(404).json({
          success: false,
          message: 'Call not found'
        });
      }

      // Check if user is part of the call
      if (call.fromUserId !== userId && call.toUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to view this call'
        });
      }

      res.json({
        success: true,
        data: call
      });

    } catch (error) {
      console.error('Error fetching call details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch call details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

export default router;