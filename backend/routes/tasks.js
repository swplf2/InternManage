const express = require('express');
const { body } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const { uploadTaskFiles } = require('../middleware/upload');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  submitTask,
  updateTaskProgress,
  getTaskStatistics
} = require('../controllers/taskController');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', auth, getTasks);

// @route   GET /api/tasks/statistics
// @desc    Get task statistics
// @access  Private
router.get('/statistics', auth, getTaskStatistics);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', auth, getTaskById);

// @route   POST /api/tasks
// @desc    Create new task (admin only)
// @access  Private (Admin)
router.post('/', [
  auth,
  adminAuth,
  uploadTaskFiles, // Add multer middleware for file upload
  body('title').notEmpty().trim(),
  body('assignedTo').notEmpty(),
  body('sourceLanguage').notEmpty(),
  body('targetLanguage').notEmpty(),
  body('type').isIn(['translation', 'review']), // Updated to match frontend
  body('deadline').isISO8601()
], createTask);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().notEmpty().trim(),
  body('status').optional().isIn(['not_started', 'in_progress', 'submitted', 'under_revision', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete task (admin only)
// @access  Private (Admin)
router.delete('/:id', auth, adminAuth, deleteTask);

// @route   POST /api/tasks/:id/submit
// @desc    Submit task (intern only)
// @access  Private
router.post('/:id/submit', auth, submitTask);

// @route   PUT /api/tasks/:id/progress
// @desc    Save task progress (intern only)
// @access  Private
router.put('/:id/progress', auth, updateTaskProgress);

module.exports = router;
