import express from 'express';
import { query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import callService from '../services/callService.js';

const router = express.Router();

// All call routes require authentication
router.use(authenticateToken);

// Get call history
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
        return res.status(400).json({ errors: errors.array() });
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch call history',
        error: error.message
      });
    }
  }
);

// Get call analytics
router.get('/analytics',
  [
    query('period').optional().isIn(['1d', '7d', '30d', '90d'])
  ],
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

export default router;