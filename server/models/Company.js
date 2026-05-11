const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  website: String,
  industry: String,
  country: String,
  city: String,
  address: String,
  logo: String,
  subscription: {
    type: String,
    default: 'starter'
  },
  maxApplicants: {
    type: Number,
    default: 100
  },
  maxJobs: {
    type: Number,
    default: 5
  },
  maxUsers: {
    type: Number,
    default: 3
  },
  active: {
    type: Boolean,
    default: true
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  settings: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    darkMode: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Company', companySchema);
