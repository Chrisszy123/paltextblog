const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');
const { authenticateToken } = require('../middleware/auth');

// Public route - Add to waitlist
router.post('/join', waitlistController.addToWaitlist);

// Admin routes - Protected
router.get('/stats', authenticateToken, waitlistController.getWaitlistStats);
router.get('/entries', authenticateToken, waitlistController.getAllWaitlistEntries);

module.exports = router;

