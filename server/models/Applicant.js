const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  candidate: {
    name: { type: String, required: true },
    email: { type: String, required: true },
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
    answer: String
  }],
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Applicant', applicantSchema);
