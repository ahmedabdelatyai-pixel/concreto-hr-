const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Company = require('../models/Company');
const { authenticate, authorize } = require('../middleware/auth');

// Apply middleware to all routes
router.use(authenticate);

// GET subscription for current company
router.get('/', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ company: req.companyId });

    if (!subscription) {
      // Create default subscription if none exists
      const company = await Company.findById(req.companyId);
      const defaultSubscription = new Subscription({
        company: req.companyId,
        tier: company.subscription || 'starter',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        seats: company.maxUsers || 3,
        maxApplicants: company.maxApplicants || 100,
        maxJobs: company.maxJobs || 5
      });
      await defaultSubscription.save();
      return res.json(defaultSubscription);
    }

    res.json(subscription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE subscription (admin only)
router.put('/', authorize('admin'), async (req, res) => {
  try {
    const { tier, seats, maxApplicants, maxJobs, endDate, features } = req.body;

    const subscription = await Subscription.findOneAndUpdate(
      { company: req.companyId },
      {
        tier,
        seats,
        maxApplicants,
        maxJobs,
        endDate: new Date(endDate),
        features,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      message: 'تم تحديث الاشتراك بنجاح | Subscription updated',
      subscription
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Check subscription limits
router.get('/limits', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ company: req.companyId });

    if (!subscription) {
      return res.json({
        canAddApplicant: true,
        canAddJob: true,
        canAddUser: true,
        remainingApplicants: 100,
        remainingJobs: 5,
        remainingSeats: 3
      });
    }

    // Count current usage
    const Applicant = require('../models/Applicant');
    const Job = require('../models/Job');
    const User = require('../models/User');

    const currentApplicants = await Applicant.countDocuments({ company: req.companyId });
    const currentJobs = await Job.countDocuments({ company: req.companyId });
    const currentUsers = await User.countDocuments({ company: req.companyId });

    res.json({
      canAddApplicant: subscription.canAddApplicant(currentApplicants),
      canAddJob: subscription.canAddJob(currentJobs),
      canAddUser: currentUsers < subscription.seats,
      remainingApplicants: Math.max(0, subscription.maxApplicants - currentApplicants),
      remainingJobs: Math.max(0, subscription.maxJobs - currentJobs),
      remainingSeats: Math.max(0, subscription.seats - currentUsers),
      isExpired: subscription.isExpired(),
      remainingDays: subscription.getRemainingDays()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;