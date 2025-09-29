const express = require('express');
const { generateToken, verifyAdminPassword, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Verify admin password
    if (!verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken({
      isAdmin: true,
      loginTime: new Date().toISOString()
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        isAdmin: true,
        loginTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateToken, (req, res) => {
  // In a more complex setup, you might want to blacklist the token
  res.json({ message: 'Logout successful' });
});

module.exports = router;
