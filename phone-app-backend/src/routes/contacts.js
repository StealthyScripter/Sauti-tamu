import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import contactService from '../services/contactService.js';

const router = express.Router();

// All contact routes require authentication
router.use(authenticateToken);

// Get user contacts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const userId = req.user.userId;

    let contacts;
    if (search) {
      contacts = await contactService.searchContacts(userId, search);
    } else {
      contacts = await contactService.getUserContacts(userId, parseInt(page), parseInt(limit));
    }

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: error.message
    });
  }
});

// Create new contact
router.post('/',
  [
    body('phoneNumber').isMobilePhone().withMessage('Valid phone number required'),
    body('displayName').isLength({ min: 1, max: 100 }).withMessage('Display name required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.userId;
      const contact = await contactService.createContact(userId, req.body);

      res.status(201).json({
        success: true,
        data: contact
      });
    } catch (error) {
      if (error.message === 'Contact already exists') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create contact',
        error: error.message
      });
    }
  }
);

// Update contact
router.put('/:contactId',
  [
    body('displayName').optional().isLength({ min: 1, max: 100 }),
    body('phoneNumber').optional().isMobilePhone()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { contactId } = req.params;
      const contact = await contactService.updateContact(contactId, req.body);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      res.json({
        success: true,
        data: contact
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update contact',
        error: error.message
      });
    }
  }
);

// Delete contact
router.delete('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const contact = await contactService.deleteContact(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message
    });
  }
});

export default router;