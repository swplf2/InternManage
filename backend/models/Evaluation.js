const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Evaluation must be linked to a task']
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Evaluation must have an evaluator']
  },
  intern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Evaluation must be for an intern']
  },
  criteria: {
    accuracy: {
      score: {
        type: Number,
        min: 0,
        max: 10,
        required: true
      },
      comments: String
    },
    grammar: {
      score: {
        type: Number,
        min: 0,
        max: 10,
        required: true
      },
      comments: String
    },
    style: {
      score: {
        type: Number,
        min: 0,
        max: 10,
        required: true
      },
      comments: String
    },
    terminology: {
      score: {
        type: Number,
        min: 0,
        max: 10,
        required: true
      },
      comments: String
    },
    formatting: {
      score: {
        type: Number,
        min: 0,
        max: 10,
        required: true
      },
      comments: String
    },
    adherence: {
      score: {
        type: Number,
        min: 0,
        max: 10,
        required: true
      },
      comments: String
    }
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 10
  },
  feedback: {
    strengths: String,
    improvements: String,
    generalComments: String
  },
  corrections: [{
    originalText: String,
    correctedText: String,
    explanation: String,
    position: {
      start: Number,
      end: Number
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'completed', 'sent'],
    default: 'draft'
  },
  isRevisionRequired: {
    type: Boolean,
    default: false
  },
  revisionInstructions: String,
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
evaluationSchema.index({ task: 1 });
evaluationSchema.index({ intern: 1 });
evaluationSchema.index({ evaluatedBy: 1 });
evaluationSchema.index({ overallScore: 1 });

// Pre-save middleware to calculate overall score
evaluationSchema.pre('save', function(next) {
  if (this.criteria) {
    const scores = [];
    
    if (this.criteria.accuracy?.score !== undefined) scores.push(this.criteria.accuracy.score);
    if (this.criteria.grammar?.score !== undefined) scores.push(this.criteria.grammar.score);
    if (this.criteria.style?.score !== undefined) scores.push(this.criteria.style.score);
    if (this.criteria.terminology?.score !== undefined) scores.push(this.criteria.terminology.score);
    if (this.criteria.formatting?.score !== undefined) scores.push(this.criteria.formatting.score);
    if (this.criteria.adherence?.score !== undefined) scores.push(this.criteria.adherence.score);
    
    if (scores.length > 0) {
      this.overallScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
    }
  }
  
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Virtual for grade letter
evaluationSchema.virtual('gradeLetter').get(function() {
  if (this.overallScore >= 9) return 'A+';
  if (this.overallScore >= 8.5) return 'A';
  if (this.overallScore >= 8) return 'A-';
  if (this.overallScore >= 7.5) return 'B+';
  if (this.overallScore >= 7) return 'B';
  if (this.overallScore >= 6.5) return 'B-';
  if (this.overallScore >= 6) return 'C+';
  if (this.overallScore >= 5.5) return 'C';
  if (this.overallScore >= 5) return 'C-';
  if (this.overallScore >= 4) return 'D';
  return 'F';
});

// Method to get detailed breakdown
evaluationSchema.methods.getScoreBreakdown = function() {
  return {
    accuracy: this.criteria.accuracy?.score || 0,
    grammar: this.criteria.grammar?.score || 0,
    style: this.criteria.style?.score || 0,
    terminology: this.criteria.terminology?.score || 0,
    formatting: this.criteria.formatting?.score || 0,
    adherence: this.criteria.adherence?.score || 0,
    overall: this.overallScore || 0,
    grade: this.gradeLetter
  };
};

// Transform output
evaluationSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
