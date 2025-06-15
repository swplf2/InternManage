const express = require('express');
const { body } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  getUserStatistics
} = require('../controllers/userController');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', auth, adminAuth, getUsers);

// @route   GET /api/users/interns
// @desc    Get all interns (admin only)
// @access  Private (Admin)
router.get('/interns', auth, adminAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const interns = await User.find({ role: 'intern' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ interns });
  } catch (error) {
    console.error('Get interns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update own profile
// @access  Private
router.put('/profile', [
  auth,
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty()
], updateProfile);

// @route   PUT /api/users/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', [
  auth,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], changePassword);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, getUserById);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', [
  auth,
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail()
], updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete/deactivate user (admin only)
// @access  Private (Admin)
router.delete('/:id', auth, adminAuth, deleteUser);

// @route   GET /api/users/:id/statistics
// @desc    Get user statistics
// @access  Private
router.get('/:id/statistics', auth, getUserStatistics);

module.exports = router;
