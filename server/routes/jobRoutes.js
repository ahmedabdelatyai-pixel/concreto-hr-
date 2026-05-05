const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { authenticate, companyOnly, authorize } = require('../middleware/auth');

// Apply middleware to all routes
router.use(authenticate, companyOnly);

// GET all jobs for company
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    let query = { company: req.companyId };

    if (active !== undefined) {
      query.active = active === 'true';
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    const jobsWithApplicantCount = await Promise.all(
      jobs.map(async (job) => {
        const Applicant = require('../models/Applicant');
        const count = await Applicant.countDocuments({ jobId: job._id });
        return { ...job.toObject(), applicantCount: count };
      })
    );

    res.json({
      count: jobsWithApplicantCount.length,
      jobs: jobsWithApplicantCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      company: req.companyId
    });

    if (!job) {
      return res.status(404).json({ message: 'الوظيفة غير موجودة | Job not found' });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new job
router.post('/', authorize('admin', 'hr'), async (req, res) => {
  try {
    const { title_en, title_ar, department, customQuestions } = req.body;

    if (!title_en || !title_ar) {
      return res.status(400).json({ message: 'العناوين مطلوبة | Titles required' });
    }

    const job = new Job({
      ...req.body,
      company: req.companyId,
      active: true
    });

    const newJob = await job.save();

    res.status(201).json({
      message: 'تم إنشاء الوظيفة بنجاح | Job created',
      job: newJob
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE job
router.put('/:id', authorize('admin', 'hr'), async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'الوظيفة غير موجودة | Job not found' });
    }

    res.json({
      message: 'تم تحديث الوظيفة بنجاح | Job updated',
      job
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH job status
router.patch('/:id/status', authorize('admin', 'hr'), async (req, res) => {
  try {
    const { active } = req.body;

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company: req.companyId },
      { active },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'الوظيفة غير موجودة | Job not found' });
    }

    res.json({
      message: 'تم تحديث حالة الوظيفة بنجاح | Job status updated',
      job
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a job
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      company: req.companyId
    });

    if (!job) {
      return res.status(404).json({ message: 'الوظيفة غير موجودة | Job not found' });
    }

    res.json({ message: 'تم حذف الوظيفة | Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
