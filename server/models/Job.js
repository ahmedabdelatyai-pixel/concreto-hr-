const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title_en: { type: String, required: true },
  title_ar: { type: String, required: true },
  department: { type: String },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
