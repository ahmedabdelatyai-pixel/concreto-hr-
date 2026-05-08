const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true,
    required: false // Optional
  },
  title_en: { type: String, required: true },
  title_ar: { type: String, required: true },
  department: { type: String },
  description_en: { type: String },
  description_ar: { type: String },
  active: { type: Boolean, default: true },
  questionCount: { type: Number, default: 10 }, // Total questions (Custom + AI)
  customQuestions: [{
    text: String,
    category: { type: String, enum: ['Technical', 'Behavioral', 'Attitude', 'Hybrid'], default: 'Technical' },
    weight: { type: Number, default: 1, min: 0.1, max: 3 }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
