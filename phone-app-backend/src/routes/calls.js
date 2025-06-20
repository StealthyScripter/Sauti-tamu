import express from 'express';
import { body, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import authMiddleware from '../middleware/authMiddleware.js';
import Call from '../models/Call.js';
import websocketService from '../services/websocketService.js';
import callTimeoutService from '../services/callTimeoutService.js';

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
      
      // Get Agora credentials from environment
      const appId = process.env.AGORA_APP_ID;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;
      
      if (!appId || !appCertificate) {
        return res.status(500).json({
          success: false,
          message: 'Agora credentials not configured'
        });
      }

      // Set role for Agora
      const userRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      
      // Use provided UID or generate from user ID
      const agoraUid = uid || parseInt(req.user.id.replace(/\D/g, '').slice(-9)) || 0;
      
      // Token expires in 24 hours
      const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 86400;
      
      // Generate the token
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        agoraUid,
        userRole,
        expirationTimeInSeconds
      );

      console.log(`🎯 Agora token generated for user ${req.user.id}, channel: ${channelName}`);

      res.json({
        success: true,
        data: {
          token,
          appId,
          channelName,
          uid: agoraUid,
          role,
          expiresAt: new Date(expirationTimeInSeconds * 1000).toISOString()
        }
      });
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

// Initiate a call
router.post('/initiate',
  callLimiter,
  [
    body('calleeId')
      .isUUID()
      .withMessage('Valid callee ID required'),
    body('type')
      .isIn(['audio', 'video'])
      .withMessage('Call type must be audio or video'),
    body('channelName')
      .isLength({ min: 1, max: 64 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Valid channel name required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { calleeId, type, channelName } = req.body;
      
      // Check if user is trying to call themselves
      if (calleeId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot call yourself'
        });
      }

      // Create call record
      const call = new Call({
        caller_id: req.user.id,
        callee_id: calleeId,
        channel_name: channelName,
        call_type: type,
        status: 'pending'
      });

      await call.save();

      // Set call timeout (30 seconds for pickup)
      callTimeoutService.setCallTimeout(call._id.toString(), 30000);

      // Notify callee via WebSocket
      websocketService.emitToUser(calleeId, 'incoming_call', {
        callId: call._id,
        callerId: req.user.id,
        callerName: req.user.display_name,
        callerPhone: req.user.phone_number,
        type,
        channelName
      });

      console.log(`📞 Call initiated: ${req.user.display_name} calling ${calleeId} (${type})`);

      res.json({
        success: true,
        data: {
          callId: call._id,
          channelName,
          type,
          status: 'pending'
        }
      });
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

// Accept/reject a call
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

      const call = await Call.findById(callId);
      if (!call) {
        return res.status(404).json({
          success: false,
          message: 'Call not found'
        });
      }

      // Only callee can respond to calls
      if (call.callee_id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to respond to this call'
        });
      }

      // Update call status
      call.status = action === 'accept' ? 'connected' : 'rejected';
      if (action === 'accept') {
        call.connected_at = new Date();
      } else {
        call.ended_at = new Date();
      }
      
      await call.save();

      // Clear timeout
      callTimeoutService.clearCallTimeout(callId);

      // Notify caller
      websocketService.emitToUser(call.caller_id.toString(), 'call_response', {
        callId,
        action,
        message: action === 'accept' ? 'Call accepted' : 'Call rejected'
      });

      console.log(`📞 Call ${action}ed: ${callId}`);

      res.json({
        success: true,
        data: {
          callId,
          status: call.status,
          action
        }
      });
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

// End a call
router.patch('/:callId/end', async (req, res) => {
  try {
    const { callId } = req.params;

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Only participants can end the call
    if (call.caller_id.toString() !== req.user.id && call.callee_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to end this call'
      });
    }

    // Update call status
    call.status = 'ended';
    call.ended_at = new Date();
    
    // Calculate duration if call was connected
    if (call.connected_at) {
      call.duration = Math.floor((call.ended_at - call.connected_at) / 1000); // seconds
    }
    
    await call.save();

    // Clear any timeouts
    callTimeoutService.clearCallTimeout(callId);

    // Notify other participant
    const otherUserId = call.caller_id.toString() === req.user.id 
      ? call.callee_id.toString() 
      : call.caller_id.toString();
      
    websocketService.emitToUser(otherUserId, 'call_ended', {
      callId,
      endedBy: req.user.id,
      duration: call.duration
    });

    console.log(`📞 Call ended: ${callId}, duration: ${call.duration || 0}s`);

    res.json({
      success: true,
      data: {
        callId,
        status: 'ended',
        duration: call.duration
      }
    });
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

    const call = await Call.findById(callId)
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

export default router;