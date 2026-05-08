const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const applicantSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true,
    required: false // Made optional for legacy support
  },
  candidate: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
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
  accessSecret: { 
    type: String, 
    unique: true, 
    default: uuidv4,
    required: true 
  }, // For secure link access
  status: { 
    type: String, 
    enum: ['Pending', 'Shortlisted', 'Hired', 'Rejected'], 
    default: 'Pending' 
  },
  source: { type: String, default: 'Website' },
  jobId: { type: String }
});

module.exports = mongoose.model('Applicant', applicantSchema);
