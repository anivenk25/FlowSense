const mongoose = require('mongoose');

const codeAnalysisSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  language: {
    type: String,
    required: true
  },
  problem: {
    type: {
      type: String,
      enum: ['Algorithm', 'UI', 'DataProcessing', 'Utility', 'Network', 'Security', 'Unknown'],
      default: 'Unknown'
    },
    domain: {
      type: String,
      enum: ['Frontend', 'Backend', 'Database', 'System', 'Network', 'Security', 'Unknown'],
      default: 'Unknown'
    },
    functionality: {
      type: String,
      required: true
    },
    complexity: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Unknown'],
      default: 'Unknown'
    }
  },
  complexity: {
    time: {
      type: String,
      required: true
    },
    space: {
      type: String,
      required: true
    }
  },
  quality: {
    readability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    maintainability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    modularity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    documentation: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    errorHandling: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    duplication: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
codeAnalysisSchema.index({ userId: 1, createdAt: -1 });

const CodeAnalysis = mongoose.model('CodeAnalysis', codeAnalysisSchema);

module.exports = CodeAnalysis;