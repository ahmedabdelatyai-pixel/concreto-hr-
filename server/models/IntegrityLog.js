const mongoose = require('mongoose');

const integrityLogSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Applicant',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  incidentType: {
    type: String,
    enum: ['tab_switch', 'window_blur', 'window_minimize', 'copy_paste', 'right_click', 'dev_tools'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  ipAddress: String,
  sessionData: {
    questionNumber: Number,
    timeRemaining: Number,
    totalIncidents: Number
  },
  flagged: {
    type: Boolean,
    default: false
  },
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewerNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
integrityLogSchema.index({ applicant: 1, timestamp: -1 });
integrityLogSchema.index({ company: 1, incidentType: 1 });
integrityLogSchema.index({ flagged: 1, reviewed: 1 });

module.exports = mongoose.model('IntegrityLog', integrityLogSchema);