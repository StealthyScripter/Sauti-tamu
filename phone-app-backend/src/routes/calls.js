import express from 'express';
import { body, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import authMiddleware from '../middleware/authMiddleware.js';
import authService from '../services/authService.js';
import Call from '../models/Call.js';
import callingService from '../services/callingService.js';
import productionPhoneService from '../services/productionPhoneService.js';

const router = express.Router();

// Apply auth middleware to all call routes
router.use(authMiddleware);

// Rate limiting for calls
const callLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 calls per minute per user
  message: 'Too many call attempts, please try again in a minute'
});

// Get user's call history
router.get('/', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'connected', 'ended', 'missed', 'rejected'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      
      const query = {
        $or: [
          { caller_id: req.user.id },
          { callee_id: req.user.id }
        ]
      };
      
      if (status) {
        query.status = status;
      }

      const calls = await Call.find(query)
        .sort({ created_at: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('caller_id', 'display_name phone_number')
        .populate('callee_id', 'display_name phone_number');

      const total = await Call.countDocuments(query);

      res.json({
        success: true,
        data: calls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get calls error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch calls',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Generate Agora token for voice/video calls
router.post('/agora-token',
  callLimiter,
  [
    body('channelName')
      .isLength({ min: 1, max: 64 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Channel name must be 1-64 characters, alphanumeric with _ or -'),
    body('role')
      .isIn(['publisher', 'subscriber'])
      .withMessage('Role must be publisher or subscriber'),
    body('uid').optional().isInt({ min: 0 }).withMessage('UID must be a non-negative integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { channelName, role, uid } = req.body;
      
      // Generate token using productionPhoneService
      const tokenResult = productionPhoneService.generateAgoraToken(
        channelName, 
        uid || req.user.id, 
        role
      );

      if (tokenResult.success) {
        console.log(`🎯 Agora token generated for user ${req.user.id}, channel: ${channelName}`);
        res.json({
          success: true,
          data: tokenResult
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to generate Agora token'
        });
      }
    } catch (error) {
      console.error('Agora token generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate Agora token',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// FIXED: Initiate a call - supports both phone numbers and user IDs
router.post('/initiate',
  callLimiter,
  [
    body('calleeId')
      .optional()
      .isUUID()
      .withMessage('Valid callee ID required'),
    body('toPhoneNumber')
      .optional()
      .matches(/^\+?[1-9]\d{6,14}$/)
      .withMessage('Valid phone number required'),
    body('type')
      .isIn(['audio', 'video', 'voice']) // Support both 'audio' and 'voice'
      .withMessage('Call type must be audio, video, or voice')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { calleeId, toPhoneNumber, type } = req.body;
      
      // Must provide either calleeId or toPhoneNumber
      if (!calleeId && !toPhoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Either calleeId or toPhoneNumber is required'
        });
      }

      let targetPhoneNumber = toPhoneNumber;
      
      // If calleeId provided, get phone number from user
      if (calleeId) {
        const targetUser = await authService.getUserById(calleeId);
        if (!targetUser) {
          return res.status(404).json({
            success: false,
            message: 'Callee not found'
          });
        }
        targetPhoneNumber = targetUser.phone_number;
      }
      
      // Check if user is trying to call themselves
      if (calleeId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot call yourself'
        });
      }

      // Use the calling service for proper call initiation
      const callResult = await callingService.initiateCall(
        req.user.id,
        targetPhoneNumber,
        type === 'audio' ? 'voice' : type, // Normalize call type
        {
          fromDisplayName: req.user.display_name,
          connectionType: 'app'
        }
      );

      if (callResult.success) {
        console.log(`📞 Call initiated: ${req.user.display_name} calling ${targetPhoneNumber} (${type})`);
        res.status(201).json(callResult);
      } else {
        res.status(400).json(callResult);
      }

    } catch (error) {
      console.error('Call initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate call',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// FIXED: Accept/reject a call using calling service
router.patch('/:callId/respond',
  [
    body('action')
      .isIn(['accept', 'reject'])
      .withMessage('Action must be accept or reject')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { callId } = req.params;
      const { action } = req.body;

      let result;
      if (action === 'accept') {
        result = await callingService.acceptCall(callId, req.user.id, req.body.metadata || {});
      } else {
        result = await callingService.rejectCall(callId, req.user.id, req.body.reason || 'rejected');
      }

      if (result.success) {
        console.log(`📞 Call ${action}ed: ${callId}`);
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Call response error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to respond to call',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// FIXED: End a call using calling service
router.patch('/:callId/end', async (req, res) => {
  try {
    const { callId } = req.params;
    const { qualityScore } = req.body;

    const result = await callingService.endCall(callId, req.user.id, qualityScore);

    if (result.success) {
      console.log(`📞 Call ended: ${callId}, duration: ${result.duration || 0}s`);
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end call',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get call details
router.get('/:callId', async (req, res) => {
  try {
    const { callId } = req.params;

    const call = await Call.findOne({ callId })
      .populate('caller_id', 'display_name phone_number')
      .populate('callee_id', 'display_name phone_number');

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Only participants can view call details
    if (call.caller_id._id.toString() !== req.user.id && call.callee_id._id.toString() !== req.user.id) {
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
    console.error('Get call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// NEW: Get active calls for user
router.get('/active/list', async (req, res) => {
  try {
    const activeCalls = await callingService.getActiveCalls(req.user.id);
    
    res.json({
      success: true,
      data: activeCalls
    });
  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active calls',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;