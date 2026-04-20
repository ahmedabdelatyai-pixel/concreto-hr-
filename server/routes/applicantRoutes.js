const express = require('express');
const router = express.Router();
const Applicant = require('../models/Applicant');

// GET all applicants
router.get('/', async (req, res) => {
  try {
    const applicants = await Applicant.find().sort({ appliedAt: -1 });
    res.json(applicants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new applicant
router.post('/', async (req, res) => {
  const applicant = new Applicant(req.body);
  try {
    const newApplicant = await applicant.save();
    res.status(201).json(newApplicant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE all applicants (clean up)
router.delete('/clear', async (req, res) => {
  try {
    await Applicant.deleteMany({});
    res.json({ message: 'All applicants cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
