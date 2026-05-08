const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// Public job listing for candidate applications
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({ active: true })
      .select('title_en title_ar description_en description_ar department customQuestions questionCount createdAt')
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public job detail by ID
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, active: true })
      .select('title_en title_ar description_en description_ar department customQuestions company questionCount');

    if (!job) {
      return res.status(404).json({ message: 'الوظيفة غير موجودة | Job not found' });
    }

    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST log integrity incident (Public access for candidates)
router.post('/integrity', async (req, res) => {
  try {
    const { applicantId, incidentType, description, severity, sessionData } = req.body;
    
    if (!applicantId) {
      return res.status(400).json({ message: 'Applicant ID is required' });
    }

    const Applicant = require('../models/Applicant');
    const IntegrityLog = require('../models/IntegrityLog');

    // Find applicant to get their associated company
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    const log = new IntegrityLog({
      applicant: applicantId,
      company: applicant.company,
      incidentType,
      severity: severity || 'medium',
      description,
      sessionData,
      userAgent: req.headers['user-agent'],
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    // Auto-flag critical incidents
    if (severity === 'critical' || incidentType === 'dev_tools') {
      log.flagged = true;
    }

    await log.save();
    res.status(201).json({ message: 'Incident logged' });
  } catch (err) {
    console.error('Integrity log error:', err);
    res.status(400).json({ message: err.message });
  }
});

// POST init applicant (Public)
router.post('/applicants/init', async (req, res) => {
  try {
    const { candidate, jobId, source } = req.body;
    const Job = require('../models/Job');
    const Applicant = require('../models/Applicant');
    const User = require('../models/User');

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // --- CHECK SUBSCRIPTION LIMIT ---
    const companyAdmin = await User.findById(job.company);
    if (companyAdmin) {
      const plan = (companyAdmin.subscription || 'starter').toLowerCase();
      const limits = { starter: 50, professional: 200, enterprise: 5000 };
      const limit = limits[plan] || 50;

      // Count applicants in the current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthCount = await Applicant.countDocuments({
        company: job.company,
        createdAt: { $gte: startOfMonth }
      });

      if (monthCount >= limit) {
        return res.status(403).json({ 
          message: 'نعتذر، لقد تم استهلاك الحد الأقصى للمتقدمين لهذا الشهر لهذه الشركة. | Sorry, the monthly applicant limit for this company has been reached.',
          limitReached: true
        });
      }
    }
    // --------------------------------

    const applicant = new Applicant({
      candidate,
      jobId,
      source: source || 'Website',
      company: job.company,
      status: 'Pending'
    });

    const saved = await applicant.save();
    res.status(201).json({ 
      applicantId: saved._id,
      accessSecret: saved.accessSecret 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH submit applicant results (Public)
router.patch('/applicants/:id/submit', async (req, res) => {
  try {
    const { answers, evaluation, cvData, cvFile, accessSecret } = req.body;
    const Applicant = require('../models/Applicant');

    // SECURITY: Must match both ID and secret to update
    const applicant = await Applicant.findOneAndUpdate(
      { _id: req.params.id, accessSecret: accessSecret },
      { 
        answers, 
        evaluation, 
        cvData, 
        cvFile,
        appliedAt: new Date()
      },
      { new: true }
    );

    if (!applicant) {
      return res.status(403).json({ message: 'وصول غير مصرح به أو رمز غير صالح | Unauthorized or invalid secret' });
    }

    res.json({ message: 'Application submitted successfully', applicant });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
