const express = require('express');
const router = express.Router();
const Applicant = require('../models/Applicant');
const { authenticate, companyOnly, authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateApplicant } = require('../middleware/validation');

// Apply middleware to all routes
router.use(authenticate, companyOnly);

// GET all applicants for company
router.get('/', async (req, res) => {
  try {
    const { status, jobId, search } = req.query;
    let query = { company: req.companyId };

    if (status) query.status = status;
    if (jobId) query.jobId = jobId;
    if (search) {
      query.$or = [
        { 'candidate.name': { $regex: search, $options: 'i' } },
        { 'candidate.email': { $regex: search, $options: 'i' } }
      ];
    }

    const applicants = await Applicant.find(query)
      .sort({ appliedAt: -1 })
      .limit(1000);

    res.json({
      count: applicants.length,
      applicants
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single applicant
router.get('/:id', async (req, res) => {
  try {
    const applicant = await Applicant.findOne({
      _id: req.params.id,
      company: req.companyId
    });

    if (!applicant) {
      return res.status(404).json({ message: 'الطلب غير موجود | Applicant not found' });
    }

    res.json(applicant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new applicant
router.post('/', uploadLimiter, async (req, res) => {
  try {
    const errors = validateApplicant(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'خطأ في البيانات | Validation error', errors });
    }

    const applicant = new Applicant({
      ...req.body,
      company: req.companyId
    });

    const newApplicant = await applicant.save();
    res.status(201).json({
      message: 'تم إنشاء الطلب بنجاح | Applicant created',
      applicant: newApplicant
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE applicant
router.put('/:id', async (req, res) => {
  try {
    const applicant = await Applicant.findOneAndUpdate(
      { _id: req.params.id, company: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!applicant) {
      return res.status(404).json({ message: 'الطلب غير موجود | Applicant not found' });
    }

    res.json({
      message: 'تم تحديث الطلب بنجاح | Applicant updated',
      applicant
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH applicant status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Shortlisted', 'Hired', 'Rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'حالة غير صحيحة | Invalid status' });
    }

    const applicant = await Applicant.findOneAndUpdate(
      { _id: req.params.id, company: req.companyId },
      { status },
      { new: true }
    );

    if (!applicant) {
      return res.status(404).json({ message: 'الطلب غير موجود | Applicant not found' });
    }

    res.json({
      message: 'تم تحديث الحالة بنجاح | Status updated',
      applicant
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE applicant
router.delete('/:id', authorize('admin', 'hr'), async (req, res) => {
  try {
    const applicant = await Applicant.findOneAndDelete({
      _id: req.params.id,
      company: req.companyId
    });

    if (!applicant) {
      return res.status(404).json({ message: 'الطلب غير موجود | Applicant not found' });
    }

    res.json({ message: 'تم حذف الطلب | Applicant deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE all applicants for company
router.delete('/clear/all', authorize('admin'), async (req, res) => {
  try {
    const result = await Applicant.deleteMany({ company: req.companyId });
    res.json({
      message: `تم حذف ${result.deletedCount} طلب | Deleted applicants`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const total = await Applicant.countDocuments({ company: req.companyId });
    const byStatus = await Applicant.aggregate([
      { $match: { company: req.companyId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const avgScore = (await Applicant.aggregate([
      { $match: { company: req.companyId } },
      { $group: { _id: null, avg: { $avg: '$evaluation.total_score' } } }
    ]))[0] || { avg: 0 };

    res.json({
      totalApplicants: total,
      byStatus,
      averageScore: avgScore.avg
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
