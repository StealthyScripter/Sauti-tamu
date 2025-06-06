import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import callRecordingService from '../services/callRecordingService.js';
import callingService from '../services/callingService.js';

const router = express.Router();

// All recording routes require authentication
router.use(authenticateToken);

// Start recording for active call
router.post('/start',
  [
    body('callId')
      .isUUID()
      .withMessage('Valid call ID required'),
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object')
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

      const { callId, options = {} } = req.body;
      const userId = req.user.userId;

      // Verify user is part of the call
      const call = await callingService.getCall(callId);
      if (!call || (call.fromUserId !== userId && call.toUserId !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to record this call'
        });
      }

      if (call.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Can only record active calls'
        });
      }

      const channelName = `call_${callId}`;
      const result = await callRecordingService.startRecording(
        callId,
        channelName,
        userId,
        {
          videoEnabled: call.callType === 'video',
          subscribedUsers: [call.fromUserId, call.toUserId].filter(Boolean),
          ...options
        }
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Recording started successfully',
          data: {
            recordingId: result.recordingId,
            callId,
            status: 'recording'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to start recording',
          error: result.error || result.reason
        });
      }

    } catch (error) {
      console.error('Start recording error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start recording',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Stop recording
router.post('/stop',
  [
    body('recordingId')
      .isUUID()
      .withMessage('Valid recording ID required')
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

      const { recordingId } = req.body;
      const userId = req.user.userId;

      const result = await callRecordingService.stopRecording(recordingId, userId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Recording stopped successfully',
          data: {
            recordingId,
            duration: result.duration,
            fileList: result.fileList
          }
        });
      } else {
        const statusCode = result.reason === 'recording_not_found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          message: 'Failed to stop recording',
          error: result.error || result.reason
        });
      }

    } catch (error) {
      console.error('Stop recording error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop recording',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Toggle recording during call (convenience endpoint)
router.post('/toggle/:callId',
  [
    param('callId')
      .isUUID()
      .withMessage('Valid call ID required'),
    body('enable')
      .isBoolean()
      .withMessage('Enable flag must be boolean')
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
      const { enable } = req.body;
      const userId = req.user.userId;

      const result = await callingService.toggleRecording(callId, userId, enable);

      if (result.success) {
        res.json({
          success: true,
          message: `Recording ${enable ? 'started' : 'stopped'} successfully`,
          data: result
        });
      } else {
        const statusCode = result.reason === 'recording_not_found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          message: `Failed to ${enable ? 'start' : 'stop'} recording`,
          error: result.error || result.reason
        });
      }

    } catch (error) {
      console.error('Toggle recording error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle recording',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Get recording status
router.get('/status/:recordingId',
  [
    param('recordingId')
      .isUUID()
      .withMessage('Valid recording ID required')
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

      const { recordingId } = req.params;

      const result = await callRecordingService.getRecordingStatus(recordingId);

      if (result.success) {
        res.json({
          success: true,
          data: result.recordingInfo,
          isActive: result.isActive
        });
      } else {
        const statusCode = result.reason === 'recording_not_found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          message: 'Failed to get recording status',
          error: result.error || result.reason
        });
      }

    } catch (error) {
      console.error('Get recording status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recording status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Get user's recordings
router.get('/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
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

      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await callRecordingService.getUserRecordings(userId, page, limit);

      if (result.success) {
        res.json({
          success: true,
          data: result.recordings,
          pagination: result.pagination
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get recordings',
          error: result.error
        });
      }

    } catch (error) {
      console.error('Get recordings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recordings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Delete recording
router.delete('/:recordingId',
  [
    param('recordingId')
      .isUUID()
      .withMessage('Valid recording ID required')
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

      const { recordingId } = req.params;
      const userId = req.user.userId;

      const result = await callRecordingService.deleteRecording(recordingId, userId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Recording deleted successfully'
        });
      } else {
        const statusCode = result.reason === 'recording_not_found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          message: 'Failed to delete recording',
          error: result.error || result.reason
        });
      }

    } catch (error) {
      console.error('Delete recording error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete recording',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Get recording statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get stats from database
    const pool = (await import('../config/database.js')).default;
    const result = await pool.query(`
      SELECT * FROM get_recording_stats($1)
    `, [userId]);

    const stats = result.rows[0] || {
      total_recordings: 0,
      total_duration_seconds: 0,
      total_file_size_bytes: 0,
      avg_duration_seconds: 0,
      recordings_this_month: 0
    };

    // Convert to more readable format
    const formattedStats = {
      totalRecordings: parseInt(stats.total_recordings),
      totalDurationSeconds: parseInt(stats.total_duration_seconds),
      totalFileSizeBytes: parseInt(stats.total_file_size_bytes),
      averageDurationSeconds: parseFloat(stats.avg_duration_seconds),
      recordingsThisMonth: parseInt(stats.recordings_this_month),
      // Formatted versions for display
      totalDurationFormatted: formatDuration(parseInt(stats.total_duration_seconds)),
      totalFileSizeFormatted: formatFileSize(parseInt(stats.total_file_size_bytes)),
      averageDurationFormatted: formatDuration(parseFloat(stats.avg_duration_seconds))
    };

    res.json({
      success: true,
      data: formattedStats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get recording stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recording statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

function formatFileSize(bytes) {
  if (!bytes || bytes < 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export default router;