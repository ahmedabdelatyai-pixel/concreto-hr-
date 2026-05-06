const mongoose = require('mongoose');
const EncryptionService = require('../utils/encryption');

const applicantSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  candidate: {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      set: val => EncryptionService.encrypt(val), // Encrypt email
      get: val => EncryptionService.decrypt(val) // Decrypt when retrieving
    },
    phone: {
      type: String,
      set: val => val ? EncryptionService.encrypt(val) : val, // Encrypt phone if provided
      get: val => val ? EncryptionService.decrypt(val) : val // Decrypt when retrieving
    },
    role: { type: String },
    jobTitle: { type: String },
  },
  cvData: {
    summary: String,
    skills: [String],
    education: String,
    experience_years: Number,
    technical_match: Number,
  },
  cvFile: {
    name: { type: String },
    type: { type: String },
    data: { type: String } // Base64 string
  },
  evaluation: {
    scores: {
      behavior: Number,
      attitude: Number,
      personality: Number
    },
    total_score: Number,
    recommendation: String,
    disc: {
      d: Number,
      i: Number,
      s: Number,
      c: Number
    },
    strengths: [String],
    weaknesses: [String],
    reasoning: String
  },
  answers: [{
    question: String,
    answer: String,
    category: { type: String, enum: ['Technical', 'Behavioral', 'Attitude', 'Hybrid'], default: 'Technical' },
    weight: { type: Number, default: 1, min: 0.1, max: 3 },
    score: Number,
    aiFeedback: String
  }],
  appliedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Pending', 'Shortlisted', 'Hired', 'Rejected'], 
    default: 'Pending' 
  },
  source: { type: String, default: 'Website' },
  jobId: { type: String }
});

applicantSchema.set('toJSON', { getters: true });
applicantSchema.set('toObject', { getters: true });

module.exports = mongoose.model('Applicant', applicantSchema);
