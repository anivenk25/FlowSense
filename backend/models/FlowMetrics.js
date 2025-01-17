const mongoose = require('mongoose');

const flowMetricsSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, required: true },
  focusScore: { type: Number, required: true },
  currentStreak: { type: Number, required: true },
  longestStreak: { type: Number, required: true },
  sessionDuration: { type: Number, required: true },
  activeFileDuration: { type: Number, required: true },
  idleTime: { type: Number, required: true },
  typingRhythm: { type: Number, required: true },
  tabMetrics: {
    total: { type: Number, required: true },
    rapid: { type: Number, required: true },
    patterns: {
      backAndForth: { type: Number, required: true },
      sequential: { type: Number, required: true }
    }
  },
  copyPasteMetrics: {
    total: { type: Number, required: true },
    copy: { type: Number, required: true },
    cut: { type: Number, required: true },
    paste: { type: Number, required: true }
  },
  errorMetrics: {
    syntaxErrors: { type: Number, required: true },
    warningCount: { type: Number, required: true },
    problemCount: { type: Number, required: true }
  },
  codeMetrics: {
    linesAdded: { type: Number, required: true },
    linesDeleted: { type: Number, required: true },
    fileEdits: { type: Number, required: true },
    codeComplexity: { type: Number, required: true },
    testCoverage: { type: Number, required: true }
  },
  productivityStatus: { type: String, required: true },
  achievements: [{
    type: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('FlowMetrics', flowMetricsSchema);