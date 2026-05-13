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
    trim: true
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

  // المنطقة الجغرافية المخصصة للباقة
  region: {
    type: String,
    enum: ['egypt', 'saudi', 'both'],
    default: 'egypt'
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
  if (!this.region) this.region = 'egypt';
  next();
});

// Static: seed default plans if not exist
planSchema.statics.seedDefaults = async function() {
  const defaults = [
    { 
      name: 'free', displayName: 'Free', jobLimit: 1, cvLimit: 10, price: 0, order: 1, 
      description: 'For trying out the platform',
      features: ['basic_dashboard'],
      region: 'both'
    },
    { 
      name: 'starter', displayName: 'Starter (Egypt)', jobLimit: 5, cvLimit: 50, price: 29, order: 2, 
      description: 'Perfect for small businesses in Egypt',
      features: ['basic_dashboard', 'ai_evaluation'],
      region: 'egypt'
    },
    { 
      name: 'professional', displayName: 'Professional (Egypt)', jobLimit: 20, cvLimit: 200, price: 99, order: 3, 
      description: 'For growing HR teams in Egypt',
      features: ['basic_dashboard', 'ai_evaluation', 'disc_profiling', 'pdf_reports'],
      region: 'egypt'
    },
    { 
      name: 'enterprise', displayName: 'Enterprise (Egypt)', jobLimit: 9999, cvLimit: 9999, price: 299, order: 4, 
      description: 'Unlimited — for large organizations',
      features: ['basic_dashboard', 'ai_evaluation', 'disc_profiling', 'pdf_reports', 'priority_support', 'advanced_anti_cheat'],
      region: 'egypt'
    },
    // 🇸🇦 Seeded Saudi Targeted Plans
    { 
      name: 'saudi_starter', displayName: 'باقة الذكاء الأساسي (السعودية)', jobLimit: 5, cvLimit: 50, price: 199, order: 5, 
      description: 'سعة معالجة ذكية للشركات والمؤسسات الناشئة في المملكة.',
      features: ['basic_dashboard', 'ai_evaluation'],
      region: 'saudi'
    },
    { 
      name: 'saudi_professional', displayName: 'باقة الإدراك الاحترافي (السعودية)', jobLimit: 20, cvLimit: 200, price: 499, order: 6, 
      description: 'قوة تحليلية متقدمة لفرق التوظيف الطموحة في المملكة.',
      features: ['basic_dashboard', 'ai_evaluation', 'disc_profiling', 'pdf_reports'],
      region: 'saudi'
    },
    { 
      name: 'saudi_enterprise', displayName: 'باقة العصب المؤسسي (السعودية)', jobLimit: 9999, cvLimit: 9999, price: 999, order: 7, 
      description: 'حلول شاملة وقدرات معالجة غير محدودة للشركات الكبرى.',
      features: ['basic_dashboard', 'ai_evaluation', 'disc_profiling', 'pdf_reports', 'priority_support', 'advanced_anti_cheat'],
      region: 'saudi'
    }
  ];

  for (const d of defaults) {
    const existing = await this.findOne({ name: d.name });
    if (!existing) {
      await this.create(d);
      console.log(`[Plans] Seeded regional plan: ${d.name}`);
    } else {
      let changed = false;
      if (!existing.region) {
        existing.region = d.region;
        changed = true;
      }
      if (!existing.features || existing.features.length === 0) {
        existing.features = d.features;
        changed = true;
      }
      if (changed) {
        await existing.save();
        console.log(`[Plans] Migrated region/features for: ${d.name}`);
      }
    }
  }
};

module.exports = mongoose.model('Plan', planSchema);
