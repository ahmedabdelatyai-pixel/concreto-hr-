const express = require('express');
const router = express.Router();
const Applicant = require('../models/Applicant');
const { authenticate, companyOnly } = require('../middleware/auth');

// GET all applicants (For current company)
router.get('/', authenticate, companyOnly, async (req, res) => {
  try {
    const { status, jobId, search } = req.query;
    let query = { company: req.companyId }; 

    if (status && status !== 'all') query.status = status;
    if (jobId && jobId !== 'all') query.jobId = jobId;
    if (search) {
      query.$or = [
        { 'candidate.name': { $regex: search, $options: 'i' } },
        { 'candidate.email': { $regex: search, $options: 'i' } }
      ];
    }

    const applicants = await Applicant.find(query).sort({ appliedAt: -1 });
    res.json(applicants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET stats
router.get('/stats', authenticate, companyOnly, async (req, res) => {
  try {
    const stats = await Applicant.aggregate([
      { $match: { company: req.user.company._id } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single applicant
router.get('/:id', authenticate, companyOnly, async (req, res) => {
  try {
    const applicant = await Applicant.findOne({ _id: req.params.id, company: req.companyId });
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
    res.json(applicant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update
router.put('/:id', authenticate, companyOnly, async (req, res) => {
  try {
    const applicant = await Applicant.findOneAndUpdate(
      { _id: req.params.id, company: req.companyId },
      req.body,
      { new: true }
    );
    if (!applicant) return res.status(404).json({ message: 'Applicant not found or unauthorized' });
    res.json(applicant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const applicant = new Applicant(req.body);
    const saved = await applicant.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH status
router.patch('/:id/status', authenticate, companyOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const applicant = await Applicant.findOneAndUpdate(
      { _id: req.params.id, company: req.companyId },
      { status },
      { new: true }
    );
    if (!applicant) return res.status(404).json({ message: 'Applicant not found or unauthorized' });
    res.json(applicant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', authenticate, companyOnly, async (req, res) => {
  try {
    const applicant = await Applicant.findOneAndDelete({ _id: req.params.id, company: req.companyId });
    if (!applicant) return res.status(404).json({ message: 'Applicant not found or unauthorized' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CLEAR ALL (For a company)
router.delete('/clear/all', authenticate, companyOnly, async (req, res) => {
  try {
    await Applicant.deleteMany({ company: req.companyId });
    res.json({ message: 'All applicants cleared for this company' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
