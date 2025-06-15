const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },  type: {
    type: String,
    enum: ['translation', 'review'], // Simplified task types
    required: [true, 'Task type is required']
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted', 'under_revision', 'completed'],
    default: 'not_started'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to someone']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must have an assigner']
  },
  sourceLanguage: {
    type: String,
    required: [true, 'Source language is required']
  },
  targetLanguage: {
    type: String,
    required: [true, 'Target language is required']
  },
  specializedField: {
    type: String,
    enum: ['economics', 'engineering', 'medical', 'legal', 'technology', 'education', 'marketing', 'other']
  },  sourceDocument: {
    type: String, // Just store filename
    required: [true, 'Source document is required']
  },
  targetDocument: {
    type: String, // For review tasks - existing translation file
  },
  translatedDocument: {
    type: String, // File uploaded by intern after completing translation
  },
  instructions: {
    type: String,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  submittedAt: Date,
  completedAt: Date,
  workProgress: {
    sentences: [{
      id: String,
      sourceText: String,
      translatedText: String,
      isCompleted: Boolean,
      needsReview: Boolean,
      comments: String
    }],
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    workNotes: String,
    lastSaved: Date
  },
  revisionHistory: [{
    version: Number,
    content: String,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    changes: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ sourceLanguage: 1, targetLanguage: 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.deadline < new Date() && this.status !== 'completed';
});

// Virtual for time remaining
taskSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadline);
  return Math.max(0, deadline - now);
});

// Method to update status
taskSchema.methods.updateStatus = function(newStatus, userId) {
  this.status = newStatus;
  
  if (newStatus === 'submitted') {
    this.submittedAt = new Date();
  } else if (newStatus === 'completed') {
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Transform output
taskSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Task', taskSchema);
