const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const { authenticate, authorize, companyOnly } = require('../middleware/auth');

router.use(authenticate, companyOnly);

// GET company details
router.get('/profile', async (req, res) => {
  try {
    const company = await Company.findById(req.companyId).select('-apiKey');
    
    if (!company) {
      return res.status(404).json({ message: 'الشركة غير موجودة | Company not found' });
    }

    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE company profile
router.put('/profile', authorize('admin'), async (req, res) => {
  try {
    const { name, phone, website, industry, country, city, address, logo, settings } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (website) updates.website = website;
    if (industry) updates.industry = industry;
    if (country) updates.country = country;
    if (city) updates.city = city;
    if (address) updates.address = address;
    if (logo) updates.logo = logo;
    if (settings) updates.settings = { ...req.user.company.settings, ...settings };

    updates.updatedAt = new Date();

    const company = await Company.findByIdAndUpdate(req.companyId, updates, { new: true }).select('-apiKey');

    res.json({
      message: 'تم تحديث الملف الشخصي بنجاح | Profile updated',
      company
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET company statistics
router.get('/stats', async (req, res) => {
  try {
    const Applicant = require('../models/Applicant');
    const totalUsers = await User.countDocuments({ company: req.companyId, active: true });
    const totalJobs = await require('../models/Job').countDocuments({ company: req.companyId, active: true });
    const totalApplicants = await Applicant.countDocuments({ company: req.companyId });
    const hired = await Applicant.countDocuments({ company: req.companyId, status: 'Hired' });
    const avgScore = (await Applicant.aggregate([
      { $match: { company: req.companyId } },
      { $group: { _id: null, avg: { $avg: '$evaluation.total_score' } } }
    ]))[0] || { avg: 0 };

    res.json({
      totalUsers,
      totalJobs,
      totalApplicants,
      hired,
      hireRate: totalApplicants > 0 ? (hired / totalApplicants * 100).toFixed(2) : 0,
      averageScore: avgScore.avg.toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET subscription info
router.get('/subscription', async (req, res) => {
  try {
    const company = await Company.findById(req.companyId);

    const subscriptionPlans = {
      free: { name: 'Free', maxApplicants: 10, maxJobs: 1, maxUsers: 1, price: 0 },
      starter: { name: 'Starter', maxApplicants: 100, maxJobs: 5, maxUsers: 3, price: 99 },
      pro: { name: 'Pro', maxApplicants: 1000, maxJobs: 20, maxUsers: 10, price: 299 },
      enterprise: { name: 'Enterprise', maxApplicants: 'Unlimited', maxJobs: 'Unlimited', maxUsers: 'Unlimited', price: 'Custom' }
    };

    const currentPlan = subscriptionPlans[company.subscription];
    const Applicant = require('../models/Applicant');
    const currentUsage = {
      applicants: await Applicant.countDocuments({ company: req.companyId }),
      jobs: await require('../models/Job').countDocuments({ company: req.companyId }),
      users: await User.countDocuments({ company: req.companyId, active: true })
    };

    res.json({
      plan: company.subscription,
      planDetails: currentPlan,
      currentUsage,
      limits: {
        applicants: company.maxApplicants,
        jobs: company.maxJobs,
        users: company.maxUsers
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE subscription plan (admin only - simulate with email)
router.post('/upgrade', authorize('admin'), async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['free', 'starter', 'pro', 'enterprise'];

    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: 'خطة غير صحيحة | Invalid plan' });
    }

    const planLimits = {
      free: { maxApplicants: 10, maxJobs: 1, maxUsers: 1 },
      starter: { maxApplicants: 100, maxJobs: 5, maxUsers: 3 },
      pro: { maxApplicants: 1000, maxJobs: 20, maxUsers: 10 },
      enterprise: { maxApplicants: 999999, maxJobs: 999999, maxUsers: 999999 }
    };

    const limits = planLimits[plan];
    const company = await Company.findByIdAndUpdate(
      req.companyId,
      {
        subscription: plan,
        maxApplicants: limits.maxApplicants,
        maxJobs: limits.maxJobs,
        maxUsers: limits.maxUsers,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      message: 'تم ترقية الخطة بنجاح | Plan upgraded',
      plan: company.subscription,
      limits: {
        applicants: company.maxApplicants,
        jobs: company.maxJobs,
        users: company.maxUsers
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
