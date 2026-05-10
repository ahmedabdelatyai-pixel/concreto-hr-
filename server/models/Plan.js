const mongoose = require('mongoose');

/**
 * Plan Schema — Dynamic Subscription Plans
 * كل باقة لها Job_Limit و CV_Limit يمكن تعديلهم من لوحة المالك
 */
const planSchema = new mongoose.Schema({
  // اسم الباقة (primary key)
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    enum: ['free', 'starter', 'professional', 'enterprise']
  },

  // الاسم للعرض
  displayName: {
    type: String,
    required: true
  },

  // حد الوظائف النشطة في نفس الوقت
  jobLimit: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },

  // حد السير الذاتية (Applicants) شهرياً
  cvLimit: {
    type: Number,
    required: true,
    default: 50,
    min: 0
  },

  // السعر الشهري (بالدولار) — للعرض فقط
  price: {
    type: Number,
    default: 0,
    min: 0
  },

  // وصف الباقة
  description: {
    type: String,
    default: ''
  },

  // هل الباقة نشطة (يمكن الاشتراك بها)
  active: {
    type: Boolean,
    default: true
  },

  // ترتيب العرض
  order: {
    type: Number,
    default: 0
  },

  // مميزات الباقة الديناميكية
  features: {
    type: [String],
    default: []
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

planSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static: seed default plans if not exist
planSchema.statics.seedDefaults = async function() {
  const count = await this.countDocuments();
  if (count > 0) return; // Already seeded

  const defaults = [
    { name: 'free',         displayName: 'Free',         jobLimit: 1,    cvLimit: 10,   price: 0,   order: 1, description: 'For trying out the platform' },
    { name: 'starter',      displayName: 'Starter',      jobLimit: 5,    cvLimit: 50,   price: 29,  order: 2, description: 'Perfect for small businesses' },
    { name: 'professional', displayName: 'Professional', jobLimit: 20,   cvLimit: 200,  price: 99,  order: 3, description: 'For growing HR teams' },
    { name: 'enterprise',   displayName: 'Enterprise',   jobLimit: 9999, cvLimit: 9999, price: 299, order: 4, description: 'Unlimited — for large organizations' },
  ];

  await this.insertMany(defaults);
  console.log('[Plans] Default plans seeded successfully.');
};

module.exports = mongoose.model('Plan', planSchema);
