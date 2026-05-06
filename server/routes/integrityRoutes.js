const express = require('express');
const router = express.Router();
const IntegrityLog = require('../models/IntegrityLog');
const { authenticate, companyOnly } = require('../middleware/auth');

// Apply middleware to all routes
router.use(authenticate, companyOnly);

// GET integrity logs for company
router.get('/', async (req, res) => {
  try {
    const { applicantId, incidentType, flagged, reviewed, limit = 100 } = req.query;

    let query = { company: req.companyId };

    if (applicantId) query.applicant = applicantId;
    if (incidentType) query.incidentType = incidentType;
    if (flagged !== undefined) query.flagged = flagged === 'true';
    if (reviewed !== undefined) query.reviewed = reviewed === 'true';

    const logs = await IntegrityLog.find(query)
      .populate('applicant', 'candidate.name candidate.email')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ logs, count: logs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST log integrity incident
router.post('/', async (req, res) => {
  try {
    const { applicantId, incidentType, description, severity, sessionData } = req.body;

    // Verify applicant belongs to company
    const Applicant = require('../models/Applicant');
    const applicant = await Applicant.findOne({
      _id: applicantId,
      company: req.companyId
    });

    if (!applicant) {
      return res.status(404).json({ message: 'الطلب غير موجود | Applicant not found' });
    }

    const log = new IntegrityLog({
      applicant: applicantId,
      company: req.companyId,
      incidentType,
      severity: severity || 'medium',
      description,
      sessionData,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    });

    // Auto-flag critical incidents
    if (severity === 'critical' || incidentType === 'dev_tools') {
      log.flagged = true;
    }

    const savedLog = await log.save();
    res.status(201).json({
      message: 'تم تسجيل الحادثة | Incident logged',
      log: savedLog
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH update log (mark as reviewed)
router.patch('/:id', async (req, res) => {
  try {
    const { reviewed, reviewerNotes, flagged } = req.body;

    const log = await IntegrityLog.findOneAndUpdate(
      { _id: req.params.id, company: req.companyId },
      { reviewed, reviewerNotes, flagged },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ message: 'السجل غير موجود | Log not found' });
    }

    res.json({
      message: 'تم تحديث السجل | Log updated',
      log
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET statistics
router.get('/stats', async (req, res) => {
  try {
    const total = await IntegrityLog.countDocuments({ company: req.companyId });
    const flagged = await IntegrityLog.countDocuments({ company: req.companyId, flagged: true });
    const reviewed = await IntegrityLog.countDocuments({ company: req.companyId, reviewed: true });

    const byType = await IntegrityLog.aggregate([
      { $match: { company: req.companyId } },
      { $group: { _id: '$incidentType', count: { $sum: 1 } } }
    ]);

    const bySeverity = await IntegrityLog.aggregate([
      { $match: { company: req.companyId } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    res.json({
      total,
      flagged,
      reviewed,
      byType,
      bySeverity
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE log
router.delete('/:id', async (req, res) => {
  try {
    const log = await IntegrityLog.findOneAndDelete({
      _id: req.params.id,
      company: req.companyId
    });

    if (!log) {
      return res.status(404).json({ message: 'السجل غير موجود | Log not found' });
    }

    res.json({ message: 'تم حذف السجل | Log deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;