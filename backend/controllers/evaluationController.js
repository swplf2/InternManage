const Evaluation = require('../models/Evaluation');
const Task = require('../models/Task');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all evaluations
// @route   GET /api/evaluations
// @access  Private
const getEvaluations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const intern = req.query.intern;
    const taskId = req.query.taskId;

    let query = {};

    // If user is intern, only show their evaluations
    if (req.user.role === 'intern') {
      query.intern = req.user.id;
    }

    if (intern && req.user.role === 'admin') {
      query.intern = intern;
    }

    if (taskId) {
      query.task = taskId;
    }

    const evaluations = await Evaluation.find(query)
      .populate('task', 'title type sourceLanguage targetLanguage')
      .populate('evaluatedBy', 'firstName lastName email')
      .populate('intern', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Evaluation.countDocuments(query);

    res.json({
      evaluations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get evaluation by ID
// @route   GET /api/evaluations/:id
// @access  Private
const getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('task')
      .populate('evaluatedBy', 'firstName lastName email')
      .populate('intern', 'firstName lastName email');

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check if user has permission to view this evaluation
    if (req.user.role === 'intern' && evaluation.intern._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Get evaluation by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new evaluation
// @route   POST /api/evaluations
// @access  Private (Admin)
const createEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId, internId, criteria, overallComments, recommendations } = req.body;

    // Check if task exists and is completed
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'submitted') {
      return res.status(400).json({ message: 'Task must be submitted before evaluation' });
    }

    // Check if evaluation already exists for this task
    const existingEvaluation = await Evaluation.findOne({ task: taskId });
    if (existingEvaluation) {
      return res.status(400).json({ message: 'Evaluation already exists for this task' });
    }

    // Calculate total score
    const totalScore = Object.values(criteria).reduce((sum, criterion) => sum + criterion.score, 0);
    const maxScore = Object.keys(criteria).length * 10;
    const percentage = (totalScore / maxScore) * 100;

    const evaluation = new Evaluation({
      task: taskId,
      evaluatedBy: req.user.id,
      intern: internId,
      criteria,
      totalScore,
      maxScore,
      percentage,
      overallComments,
      recommendations
    });

    await evaluation.save();

    // Update task status to completed
    await Task.findByIdAndUpdate(taskId, { 
      status: 'completed',
      completedAt: new Date()
    });

    // Update user statistics
    await updateUserStatistics(internId, totalScore, maxScore);

    const populatedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('task', 'title type sourceLanguage targetLanguage')
      .populate('evaluatedBy', 'firstName lastName email')
      .populate('intern', 'firstName lastName email');

    res.status(201).json(populatedEvaluation);
  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update evaluation
// @route   PUT /api/evaluations/:id
// @access  Private (Admin)
const updateEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    const { criteria, overallComments, recommendations } = req.body;

    // Recalculate total score if criteria changed
    if (criteria) {
      const totalScore = Object.values(criteria).reduce((sum, criterion) => sum + criterion.score, 0);
      const maxScore = Object.keys(criteria).length * 10;
      const percentage = (totalScore / maxScore) * 100;

      evaluation.criteria = criteria;
      evaluation.totalScore = totalScore;
      evaluation.percentage = percentage;
    }

    if (overallComments !== undefined) {
      evaluation.overallComments = overallComments;
    }

    if (recommendations !== undefined) {
      evaluation.recommendations = recommendations;
    }

    await evaluation.save();

    // Update user statistics
    if (criteria) {
      await updateUserStatistics(evaluation.intern, evaluation.totalScore, evaluation.maxScore);
    }

    const populatedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('task', 'title type sourceLanguage targetLanguage')
      .populate('evaluatedBy', 'firstName lastName email')
      .populate('intern', 'firstName lastName email');

    res.json(populatedEvaluation);
  } catch (error) {
    console.error('Update evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete evaluation
// @route   DELETE /api/evaluations/:id
// @access  Private (Admin)
const deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Update task status back to submitted
    await Task.findByIdAndUpdate(evaluation.task, { 
      status: 'submitted',
      completedAt: null
    });

    await Evaluation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Delete evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get evaluation statistics
// @route   GET /api/evaluations/statistics
// @access  Private
const getEvaluationStatistics = async (req, res) => {
  try {
    const { intern, period } = req.query;

    let matchQuery = {};
    
    // If intern user, only their evaluations
    if (req.user.role === 'intern') {
      matchQuery.intern = req.user.id;
    } else if (intern) {
      matchQuery.intern = intern;
    }

    // Add date filter if period specified
    if (period) {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        matchQuery.createdAt = { $gte: startDate };
      }
    }

    const stats = await Evaluation.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalEvaluations: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' },
          averageAccuracy: { $avg: '$criteria.accuracy.score' },
          averageGrammar: { $avg: '$criteria.grammar.score' },
          averageStyle: { $avg: '$criteria.style.score' },
          averageTerminology: { $avg: '$criteria.terminology.score' },
          averageFormatting: { $avg: '$criteria.formatting.score' },
          averageAdherence: { $avg: '$criteria.adherence.score' }
        }
      }
    ]);

    const scoreDistribution = await Evaluation.aggregate([
      { $match: matchQuery },
      {
        $bucket: {
          groupBy: '$percentage',
          boundaries: [0, 60, 70, 80, 90, 100],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const criteriaAnalysis = await Evaluation.aggregate([
      { $match: matchQuery },
      {
        $project: {
          accuracy: '$criteria.accuracy.score',
          grammar: '$criteria.grammar.score',
          style: '$criteria.style.score',
          terminology: '$criteria.terminology.score',
          formatting: '$criteria.formatting.score',
          adherence: '$criteria.adherence.score'
        }
      },
      {
        $group: {
          _id: null,
          criteriaScores: {
            $push: {
              accuracy: '$accuracy',
              grammar: '$grammar',
              style: '$style',
              terminology: '$terminology',
              formatting: '$formatting',
              adherence: '$adherence'
            }
          }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        totalEvaluations: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        averageAccuracy: 0,
        averageGrammar: 0,
        averageStyle: 0,
        averageTerminology: 0,
        averageFormatting: 0,
        averageAdherence: 0
      },
      scoreDistribution,
      criteriaAnalysis: criteriaAnalysis[0]?.criteriaScores || []
    });
  } catch (error) {
    console.error('Get evaluation statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to update user statistics
const updateUserStatistics = async (userId, score, maxScore) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const newTotalScore = user.statistics.totalScore + score;
    const newTotalEvaluations = user.statistics.totalEvaluations + 1;
    const newAverageScore = newTotalScore / newTotalEvaluations;

    await User.findByIdAndUpdate(userId, {
      $set: {
        'statistics.totalScore': newTotalScore,
        'statistics.totalEvaluations': newTotalEvaluations,
        'statistics.averageScore': newAverageScore
      }
    });
  } catch (error) {
    console.error('Update user statistics error:', error);
  }
};

module.exports = {
  getEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getEvaluationStatistics
};
