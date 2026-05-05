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
    answer: String
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

module.exports = mongoose.model('Applicant', applicantSchema);
