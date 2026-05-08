const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Applicant = require('../models/Applicant');

// Middleware to check for Owner Secret (Simple security for now)
const ownerOnly = (req, res, next) => {
  const secret = req.headers['x-owner-secret'];
  if (secret === 'owner_concreto_2025') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Owner access only' });
  }
};

// GET Global Stats
router.get('/stats', ownerOnly, async (req, res) => {
  try {
    const totalCompaniesCount = await User.distinct('companyName', { role: 'admin' });
    const totalApplicants = await Applicant.countDocuments();
    const activeJobs = await Job.countDocuments();

    res.json({
      totalCompanies: totalCompaniesCount.length,
      totalApplicants,
      activeJobs
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET All Companies/Admins
router.get('/companies', ownerOnly, async (req, res) => {
  try {
    const companies = await User.find({ role: 'admin' }).select('-password');
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE a company/admin
router.patch('/companies/:id', ownerOnly, async (req, res) => {
  try {
    const { companyName, email, username, password, subscription } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (companyName) user.companyName = companyName;
    if (email) user.email = email;
    if (username) user.username = username;
    if (subscription) user.subscription = subscription;
    
    if (password) {
      const bcrypt = require('bcrypt');
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: 'Company updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a company/admin
router.delete('/companies/:id', ownerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company admin deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
