const express = require('express');
const { body } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getEvaluationStatistics
} = require('../controllers/evaluationController');

const router = express.Router();

// @route   GET /api/evaluations
// @desc    Get all evaluations
// @access  Private
router.get('/', auth, getEvaluations);

// @route   GET /api/evaluations/statistics
// @desc    Get evaluation statistics
// @access  Private
router.get('/statistics', auth, getEvaluationStatistics);

// @route   GET /api/evaluations/:id
// @desc    Get evaluation by ID
// @access  Private
router.get('/:id', auth, getEvaluationById);

// @route   POST /api/evaluations
// @desc    Create new evaluation (admin only)
// @access  Private (Admin)
router.post('/', [
  auth,
  adminAuth,
  body('taskId').notEmpty().isMongoId(),
  body('internId').notEmpty().isMongoId(),
  body('criteria').notEmpty().isObject()
], createEvaluation);

// @route   PUT /api/evaluations/:id
// @desc    Update evaluation (admin only)
// @access  Private (Admin)
router.put('/:id', [
  auth,
  adminAuth,
  body('criteria').optional().isObject()
], updateEvaluation);

// @route   DELETE /api/evaluations/:id
// @desc    Delete evaluation (admin only)
// @access  Private (Admin)
router.delete('/:id', auth, adminAuth, deleteEvaluation);

module.exports = router;

// @route   GET /api/evaluations
// @desc    Get evaluations (filtered by user role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, intern } = req.query;
    
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'intern') {
      query.intern = req.user._id;
    } else if (req.user.role === 'admin') {
      if (intern) query.intern = intern;
    }
    
    if (status) query.status = status;

    const evaluations = await Evaluation.find(query)
      .populate('task', 'title type sourceLanguage targetLanguage')
      .populate('intern', 'firstName lastName email')
      .populate('evaluatedBy', 'firstName lastName email')
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
});

// @route   POST /api/evaluations
// @desc    Create new evaluation (admin only)
// @access  Private (Admin)
router.post('/', [
  auth,
  adminAuth,
  body('task').isMongoId(),
  body('intern').isMongoId(),
  body('criteria.accuracy.score').isNumeric().isFloat({ min: 0, max: 10 }),
  body('criteria.grammar.score').isNumeric().isFloat({ min: 0, max: 10 }),
  body('criteria.style.score').isNumeric().isFloat({ min: 0, max: 10 }),
  body('criteria.terminology.score').isNumeric().isFloat({ min: 0, max: 10 }),
  body('criteria.formatting.score').isNumeric().isFloat({ min: 0, max: 10 }),
  body('criteria.adherence.score').isNumeric().isFloat({ min: 0, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { task: taskId, intern: internId, criteria, feedback, corrections, isRevisionRequired, revisionInstructions } = req.body;

    // Verify task exists and is submitted
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'submitted' && task.status !== 'under_revision') {
      return res.status(400).json({ message: 'Task must be submitted before evaluation' });
    }

    // Verify intern exists
    const intern = await User.findById(internId);
    if (!intern || intern.role !== 'intern') {
      return res.status(404).json({ message: 'Intern not found' });
    }

    // Check if evaluation already exists for this task
    const existingEvaluation = await Evaluation.findOne({ task: taskId });
    if (existingEvaluation) {
      return res.status(400).json({ message: 'Task already evaluated' });
    }

    // Create evaluation
    const evaluation = new Evaluation({
      task: taskId,
      intern: internId,
      evaluatedBy: req.user._id,
      criteria,
      feedback,
      corrections,
      isRevisionRequired: isRevisionRequired || false,
      revisionInstructions,
      status: 'completed'
    });

    await evaluation.save();

    // Update task status
    if (isRevisionRequired) {
      task.status = 'under_revision';
    } else {
      task.status = 'completed';
      task.completedAt = new Date();
      // Update intern statistics
      await intern.updateStatistics(evaluation.overallScore);
    }
    await task.save();

    // Populate the evaluation for response
    await evaluation.populate('task', 'title type sourceLanguage targetLanguage');
    await evaluation.populate('intern', 'firstName lastName email');
    await evaluation.populate('evaluatedBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Evaluation created successfully',
      evaluation
    });
  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(500).json({ message: 'Server error during evaluation creation' });
  }
});

// @route   GET /api/evaluations/:id
// @desc    Get evaluation by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('task', 'title type sourceLanguage targetLanguage deadline')
      .populate('intern', 'firstName lastName email profile')
      .populate('evaluatedBy', 'firstName lastName email');

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check access permissions
    if (req.user.role === 'intern' && evaluation.intern._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ evaluation });
  } catch (error) {
    console.error('Get evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/evaluations/:id
// @desc    Update evaluation (admin only)
// @access  Private (Admin)
router.put('/:id', [
  auth,
  adminAuth,
  body('criteria.accuracy.score').optional().isNumeric().isFloat({ min: 0, max: 10 }),
  body('criteria.grammar.score').optional().isNumeric().isFloat({ min: 0, max: 10 }),
  body('criteria.style.score').optional().isNumeric().isFloat({ min: 0, max: 10 }),
  body('criteria.terminology.score').optional().isNumeric().isFloat({ min: 0, max: 10 }),
  body('criteria.formatting.score').optional().isNumeric().isFloat({ min: 0, max: 10 }),
  body('criteria.adherence.score').optional().isNumeric().isFloat({ min: 0, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['criteria', 'feedback', 'corrections', 'isRevisionRequired', 'revisionInstructions', 'status'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'criteria' && typeof req.body[key] === 'object') {
          evaluation.criteria = { ...evaluation.criteria.toObject(), ...req.body[key] };
        } else if (key === 'feedback' && typeof req.body[key] === 'object') {
          evaluation.feedback = { ...evaluation.feedback.toObject(), ...req.body[key] };
        } else {
          evaluation[key] = req.body[key];
        }
      }
    });

    await evaluation.save();

    // Update related task status if needed
    if (req.body.isRevisionRequired !== undefined) {
      const task = await Task.findById(evaluation.task);
      if (task) {
        task.status = req.body.isRevisionRequired ? 'under_revision' : 'completed';
        if (!req.body.isRevisionRequired && !task.completedAt) {
          task.completedAt = new Date();
        }
        await task.save();
      }
    }

    await evaluation.populate('task', 'title type sourceLanguage targetLanguage');
    await evaluation.populate('intern', 'firstName lastName email');
    await evaluation.populate('evaluatedBy', 'firstName lastName email');

    res.json({
      message: 'Evaluation updated successfully',
      evaluation
    });
  } catch (error) {
    console.error('Update evaluation error:', error);
    res.status(500).json({ message: 'Server error during evaluation update' });
  }
});

// @route   GET /api/evaluations/task/:taskId
// @desc    Get evaluation for specific task
// @access  Private
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const evaluation = await Evaluation.findOne({ task: req.params.taskId })
      .populate('task', 'title type sourceLanguage targetLanguage')
      .populate('intern', 'firstName lastName email')
      .populate('evaluatedBy', 'firstName lastName email');

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found for this task' });
    }

    // Check access permissions
    if (req.user.role === 'intern' && evaluation.intern._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ evaluation });
  } catch (error) {
    console.error('Get task evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/evaluations/intern/:internId/statistics
// @desc    Get evaluation statistics for an intern
// @access  Private
router.get('/intern/:internId/statistics', auth, async (req, res) => {
  try {
    // Check access permissions
    if (req.user.role === 'intern' && req.user._id.toString() !== req.params.internId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const evaluations = await Evaluation.find({ 
      intern: req.params.internId,
      status: 'completed'
    });

    if (evaluations.length === 0) {
      return res.json({
        totalEvaluations: 0,
        averageScore: 0,
        scoreBreakdown: {
          accuracy: 0,
          grammar: 0,
          style: 0,
          terminology: 0,
          formatting: 0,
          adherence: 0
        },
        gradeDistribution: {},
        recentTrend: []
      });
    }

    // Calculate statistics
    const totalEvaluations = evaluations.length;
    const totalScore = evaluations.reduce((sum, eval) => sum + eval.overallScore, 0);
    const averageScore = totalScore / totalEvaluations;

    // Score breakdown
    const scoreBreakdown = {
      accuracy: evaluations.reduce((sum, eval) => sum + (eval.criteria.accuracy?.score || 0), 0) / totalEvaluations,
      grammar: evaluations.reduce((sum, eval) => sum + (eval.criteria.grammar?.score || 0), 0) / totalEvaluations,
      style: evaluations.reduce((sum, eval) => sum + (eval.criteria.style?.score || 0), 0) / totalEvaluations,
      terminology: evaluations.reduce((sum, eval) => sum + (eval.criteria.terminology?.score || 0), 0) / totalEvaluations,
      formatting: evaluations.reduce((sum, eval) => sum + (eval.criteria.formatting?.score || 0), 0) / totalEvaluations,
      adherence: evaluations.reduce((sum, eval) => sum + (eval.criteria.adherence?.score || 0), 0) / totalEvaluations
    };

    // Grade distribution
    const gradeDistribution = {};
    evaluations.forEach(eval => {
      const grade = eval.gradeLetter;
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    // Recent trend (last 5 evaluations)
    const recentTrend = evaluations
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .reverse()
      .map(eval => ({
        date: eval.createdAt,
        score: eval.overallScore,
        grade: eval.gradeLetter
      }));

    res.json({
      totalEvaluations,
      averageScore: Math.round(averageScore * 100) / 100,
      scoreBreakdown: Object.keys(scoreBreakdown).reduce((acc, key) => {
        acc[key] = Math.round(scoreBreakdown[key] * 100) / 100;
        return acc;
      }, {}),
      gradeDistribution,
      recentTrend
    });
  } catch (error) {
    console.error('Get evaluation statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
