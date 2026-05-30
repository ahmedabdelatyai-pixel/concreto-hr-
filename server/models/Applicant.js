const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const applicantSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true,
    required: false
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
      d: Number, i: Number, s: Number, c: Number
    },
    strengths: [String],
    weaknesses: [String],
    reasoning: String,
    mcq_score: Number,      // auto-calculated MCQ/T-F score
    essay_score: Number,    // AI-evaluated essay score
    gap_analysis: String,   // AI-written gap analysis paragraph
    cv_consistency_score: Number,
    detailed_reasoning: String,
    lie_detection_flags: [String]
  },
  // ✅ NEW: Video Emotion Analysis Data
  emotion_data: {
    confidence: { type: Number, default: 0 },
    stress: { type: Number, default: 0 },
    focus: { type: Number, default: 0 }
  },
  // ✅ NEW: HR Analytics (ATS compatibility)
  analytics: {
    retention_probability: { type: Number, default: 0 },
    cultural_fit: { type: Number, default: 0 }
  },
  answers: [{
    question: String,
    answer: String,
    category: {
      type: String,
      enum: ['Technical', 'Behavioral', 'Attitude', 'Hybrid', 'General'],
      default: 'Technical'
    },
    weight: { type: Number, default: 1, min: 0.1, max: 3 },
    type: { type: String, enum: ['essay', 'mcq', 'truefalse'], default: 'essay' },
    score: Number,
    aiFeedback: String,
    isCorrect: Boolean // for MCQ/T-F auto-scoring
  }],
  appliedAt: { type: Date, default: Date.now },
  accessSecret: {
    type: String,
    unique: true,
    default: uuidv4,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Shortlisted', 'Hired', 'Rejected'],
    default: 'Pending'
  },
  source: { type: String, default: 'Website' },
  // UTM source tracking
  utm_source: { type: String, default: '' },
  utm_medium: { type: String, default: '' },
  utm_campaign: { type: String, default: '' },
  jobId: { type: String },
  // Integrity Meter
  cheatAttempts: { type: Number, default: 0 },
  integrityScore: { type: Number, default: 100 }, // 100 = clean, decreases per incident
});

module.exports = mongoose.model('Applicant', applicantSchema);
