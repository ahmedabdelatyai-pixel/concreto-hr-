const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    unique: true
  },
  tier: {
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    default: 'starter'
  },
  seats: {
    type: Number,
    default: 3,
    min: 1
  },
  maxApplicants: {
    type: Number,
    default: 100
  },
  maxJobs: {
    type: Number,
    default: 5
  },
  features: {
    aiEvaluation: { type: Boolean, default: true },
    cvAnalysis: { type: Boolean, default: true },
    customQuestions: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    multiLanguage: { type: Boolean, default: true },
    prioritySupport: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    whiteLabel: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer'],
    required: false
  },
  lastPayment: Date,
  nextBilling: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate remaining days
subscriptionSchema.methods.getRemainingDays = function() {
  return Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24));
};

// Check if subscription is expired
subscriptionSchema.methods.isExpired = function() {
  return new Date() > this.endDate;
};

// Check if subscription allows more applicants
subscriptionSchema.methods.canAddApplicant = function(currentCount) {
  return currentCount < this.maxApplicants;
};

// Check if subscription allows more jobs
subscriptionSchema.methods.canAddJob = function(currentCount) {
  return currentCount < this.maxJobs;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);