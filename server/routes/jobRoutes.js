const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { authenticate, companyOnly } = require('../middleware/auth');

// GET all jobs (For current company)
router.get('/', authenticate, companyOnly, async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.companyId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single job
router.get('/:id', authenticate, companyOnly, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, company: req.companyId });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create
router.post('/', authenticate, companyOnly, async (req, res) => {
  try {
    const jobData = { ...req.body, company: req.companyId };
    const job = new Job(jobData);
    const saved = await job.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update
router.put('/:id', authenticate, companyOnly, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company: req.companyId }, 
      req.body, 
      { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found or unauthorized' });
    res.json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH status
router.patch('/:id/status', authenticate, companyOnly, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company: req.companyId }, 
      { active: req.body.active }, 
      { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found or unauthorized' });
    res.json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', authenticate, companyOnly, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, company: req.companyId });
    if (!job) return res.status(404).json({ message: 'Job not found or unauthorized' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
