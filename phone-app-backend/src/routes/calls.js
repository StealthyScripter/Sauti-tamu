import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import callService from '../services/callService.js';
import callingService from '../services/callingService.js';
import productionPhoneService from '../services/productionPhoneService.js';

const router = express.Router();

// Rate limiting for call endpoints
const callLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 calls per minute per IP
  message: 'Too many call attempts, please try again later.',
});

// All call routes require authentication
router.use(authenticateToken);

// ==========================================
// CALL INITIATION & MANAGEMENT (from calling.js)
// ==========================================

// POST /api/calls/initiate - Initiate a new call
router.post('/initiate',
  callLimiter,
  [
    body('toPhoneNumber')
      .custom((value) => {
        const cleaned = value.replace(/[^\d+]/g, '');
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
          toUserId: null,
          toPhoneNumber: result.toPhoneNumber,
          callType: result.callType,
          status: result.status,
          startTime: new Date().toISOString(),
          connectionType: metadata.connectionType || 'unknown'
        });
      } catch (logError) {
        console.error('Failed to log call initiation:', logError);
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

// POST /api/calls/:callId/accept - Accept an incoming call
router.post('/:callId/accept',
  [
    param('callId').isUUID().withMessage('Valid call ID required'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
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

// POST /api/calls/:callId/reject - Reject an incoming call
router.post('/:callId/reject',
  [
    param('callId').isUUID().withMessage('Valid call ID required'),
    body('reason').optional().isIn(['busy', 'declined', 'unavailable', 'blocked']),
    body('metadata').optional().isObject()
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

      try {
        await callService.updateCallStatus(callId, 'rejected');
      } catch (logError) {
        console.error('Failed to update call log:', logError);
      }
      console.log('Metadata: calls.js line 210',metadata);

      res.json({
        success: true,
        message: 'Call rejected successfully',
        data: { ...result, reason }
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

// POST /api/calls/:callId/end - End an active call
router.post('/:callId/end',
  [
    param('callId').isUUID().withMessage('Valid call ID required'),
    body('qualityScore').optional().isInt({ min: 1, max: 5 }),
    body('metadata').optional().isObject()
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

      try {
        await callService.updateCallStatus(
          callId, 
          'ended', 
          new Date().toISOString(), 
          result.duration
        );
      } catch (logError) {
        console.error('Failed to update call log:', logError);
      }
      console.log('Metadata: calls.js line 268',metadata);

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

// GET /api/calls/:callId - Get call details
router.get('/:callId',
  [param('callId').isUUID().withMessage('Valid call ID required')],
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

// ==========================================
// CALL HISTORY & ANALYTICS (from callsManagement.js)
// ==========================================

// GET /api/calls/history - Get call history
router.get('/history',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('callType').optional().isIn(['voice', 'video']),
    query('status').optional().isIn(['initiated', 'ringing', 'active', 'ended', 'failed', 'missed'])
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
      const { page = 1, limit = 50, callType, status, dateFrom, dateTo } = req.query;

      const filters = {};
      if (callType) filters.callType = callType;
      if (status) filters.status = status;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const callHistory = await callService.getCallHistory(
        userId,
        parseInt(page),
        parseInt(limit),
        filters
      );

      res.json({
        success: true,
        data: callHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching call history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch call history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// GET /api/calls/analytics - Get call analytics
router.get('/analytics',
  [query('period').optional().isIn(['1d', '7d', '30d', '90d'])],
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { period = '7d' } = req.query;

      const analytics = await callService.getCallAnalytics(userId, period);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch call analytics',
        error: error.message
      });
    }
  }
);

// ==========================================
// AGORA TOKEN GENERATION
// ==========================================

// POST /api/calls/token - Get call tokens
router.post('/token',
  [
    body('callId').isUUID().withMessage('Valid call ID required'),
    body('role').optional().isIn(['publisher', 'audience']).withMessage('Role must be publisher or audience')
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

      const { callId, role = 'publisher' } = req.body;
      const userId = req.user.userId;

      // Verify user is part of this call
      const call = await callingService.getCall(callId);
      if (!call || (call.fromUserId !== userId && call.toUserId !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to access this call'
        });
      }

      // Generate Agora token
      const channelName = `call_${callId}`;
      const tokenData = productionPhoneService.generateAgoraToken(channelName, userId, role);

      res.json({
        success: true,
        message: 'Call token generated successfully',
        data: tokenData
      });

    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate call token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

export default router;