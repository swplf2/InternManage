const Task = require('../models/Task');
const User = require('../models/User');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const priority = req.query.priority;
    const assignedTo = req.query.assignedTo;

    let query = {};    // If user is intern, only show tasks assigned to them
    if (req.user.role === 'intern') {
      query.assignedTo = new mongoose.Types.ObjectId(req.user.id);
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (assignedTo && req.user.role === 'admin') {
      query.assignedTo = assignedTo;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email profile')
      .populate('assignedBy', 'firstName lastName email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to view this task
    if (req.user.role === 'intern' && task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin)
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }    // Prepare task data
    const taskData = {
      ...req.body,
      assignedBy: req.user.id
    };

    // Handle empty specializedField
    if (!taskData.specializedField || taskData.specializedField.trim() === '') {
      delete taskData.specializedField;
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.sourceDocument && req.files.sourceDocument[0]) {
        taskData.sourceDocument = req.files.sourceDocument[0].filename;
      }
      
      if (req.files.targetDocument && req.files.targetDocument[0]) {
        taskData.targetDocument = req.files.targetDocument[0].filename;
      }
    }

    // Validate required files based on task type
    if (!taskData.sourceDocument) {
      return res.status(400).json({ 
        message: 'Source document is required' 
      });
    }

    if (taskData.type === 'review' && !taskData.targetDocument) {
      return res.status(400).json({ 
        message: 'Target document is required for review tasks' 
      });
    }

    const task = new Task(taskData);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email');

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isAssignedIntern = req.user.role === 'intern' && task.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isAssignedIntern) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Interns can only update specific fields
    let updateData = req.body;
    if (req.user.role === 'intern') {
      updateData = {
        status: req.body.status,
        translatedDocument: req.body.translatedDocument,
        submittedAt: req.body.status === 'submitted' ? new Date() : task.submittedAt
      };
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email');

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Submit task
// @route   POST /api/tasks/:id/submit
// @access  Private (Intern)
const submitTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task
    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if task is in correct status
    if (task.status !== 'in_progress') {
      return res.status(400).json({ message: 'Task must be in progress to submit' });
    }

    task.status = 'submitted';
    task.submittedAt = new Date();
    
    if (req.body.translatedDocument) {
      task.translatedDocument = req.body.translatedDocument;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email');

    res.json(populatedTask);
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/statistics
// @access  Private
const getTaskStatistics = async (req, res) => {
  try {
    let matchQuery = {};    // If intern, only their tasks
    if (req.user.role === 'intern') {
      matchQuery.assignedTo = new mongoose.Types.ObjectId(req.user.id);
    }

    const stats = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          submitted: {
            $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] }
          },
          overdue: {
            $sum: { $cond: ['$isOverdue', 1, 0] }
          }
        }      }
    ]);

    const statusDistribution = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityDistribution = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        total: 0,
        completed: 0,
        inProgress: 0,
        submitted: 0,
        overdue: 0
      },
      statusDistribution,
      priorityDistribution
    });
  } catch (error) {
    console.error('Get task statistics error:', error);
    res.status(500).json({ message: 'Server error' });  }
};

// @desc    Update task progress
// @route   PUT /api/tasks/:id/progress
// @access  Private (Intern)
const updateTaskProgress = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task
    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update progress data
    const { sentences, progress, workNotes } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          workProgress: {
            sentences: sentences || [],
            progressPercentage: progress || 0,
            workNotes: workNotes || '',
            lastSaved: new Date()
          },
          status: progress > 0 ? 'in_progress' : task.status
        }
      },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email');

    res.json({
      message: 'Progress saved successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  submitTask,
  updateTaskProgress,
  getTaskStatistics
};
