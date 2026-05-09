const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true,
    required: false
  },
  title_en: { type: String, required: true },
  title_ar: { type: String, required: true },
  department: { type: String },
  // ✅ Unified job description (used by AI for question generation)
  description: { type: String, default: '' },
  description_en: { type: String }, // legacy
  description_ar: { type: String }, // legacy
  active: { type: Boolean, default: true },
  questionCount: { type: Number, default: 10 },
  customQuestions: [{
    text: String,
    category: { type: String, enum: ['Technical', 'Behavioral', 'Attitude', 'Hybrid', 'General'], default: 'Technical' },
    weight: { type: Number, default: 1, min: 0.1, max: 3 },
    // ✅ NEW — question type support
    type: { type: String, enum: ['essay', 'mcq', 'truefalse'], default: 'essay' },
    choices: [String],       // for MCQ: ['A', 'B', 'C', 'D']
    correctAnswer: { type: String } // for MCQ/T-F stored server-side
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);

