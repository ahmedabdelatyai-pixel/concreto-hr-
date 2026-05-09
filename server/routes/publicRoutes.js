const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { checkCvLimit, getCompanyPlanStatus } = require('../middleware/checkLimits');

// Public job listing for candidate applications
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({ active: true })
      .select('title_en title_ar description description_en description_ar department customQuestions questionCount createdAt')
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
      .select('title_en title_ar description description_en description_ar department customQuestions company questionCount');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
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
    const { candidate, jobId, source, utm_source, utm_medium, utm_campaign } = req.body;
    const Applicant = require('../models/Applicant');

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // ─── DYNAMIC CV LIMIT CHECK (reads from Plans DB) ───────────────────────
    const limitError = await checkCvLimit(job.company);
    if (limitError) {
      return res.status(403).json(limitError);
    }
    // ────────────────────────────────────────────────────────────────────────

    const applicant = new Applicant({
      candidate,
      jobId,
      source: utm_source || source || 'Website',
      utm_source: utm_source || source || '',
      utm_medium: utm_medium || '',
      utm_campaign: utm_campaign || '',
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


// PATCH submit applicant results (Public) + Integrately Webhook
router.patch('/applicants/:id/submit', async (req, res) => {
  try {
    const { answers, evaluation, cvData, cvFile, accessSecret, cheatAttempts, integrityScore } = req.body;
    const Applicant = require('../models/Applicant');

    // Enrich answers with isCorrect flag (preserve what client calculated)
    const enrichedAnswers = (answers || []).map(a => ({
      ...a,
      isCorrect: a.isCorrect !== undefined ? a.isCorrect : null
    }));

    // Build evaluation object with new fields
    const enrichedEvaluation = {
      ...evaluation,
      gap_analysis: evaluation?.gap_analysis || '',
      mcq_score: evaluation?.mcq_score,
      essay_score: evaluation?.essay_score,
    };

    // SECURITY: Must match both ID and secret to update
    const applicant = await Applicant.findOneAndUpdate(
      { _id: req.params.id, accessSecret: accessSecret },
      {
        answers: enrichedAnswers,
        evaluation: enrichedEvaluation,
        cvData,
        cvFile,
        appliedAt: new Date(),
        // ✅ Integrity data
        cheatAttempts: cheatAttempts || 0,
        integrityScore: integrityScore !== undefined ? integrityScore : 100,
      },
      { new: true }
    );

    if (!applicant) {
      return res.status(403).json({ message: 'Unauthorized or invalid secret' });
    }


    // ─── INTEGRATELY WEBHOOK ─────────────────────────────────────────────────
    // يتم إرسال الـ Webhook بعد نجاح الـ submit لإعلام Integrately
    const WEBHOOK_URL = process.env.INTEGRATELY_WEBHOOK_URL;
    if (WEBHOOK_URL) {
      try {
        const planStatus = await getCompanyPlanStatus(applicant.company);

        const webhookPayload = {
          event: 'applicant_submitted',
          timestamp: new Date().toISOString(),
          applicant_id: applicant._id,
          candidate_name: applicant.candidate?.name || '',
          candidate_email: applicant.candidate?.email || '',
          job_id: applicant.jobId,
          overall_score: evaluation?.overallScore || 0,
          recommendation: evaluation?.recommendation || '',
          // ✅ Plan Status Variables (for Integrately conditions)
          ...planStatus
        };

        // Fire-and-forget (don't block the response)
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        }).catch(err => console.warn('[Webhook] Failed:', err.message));

      } catch (webhookErr) {
        console.warn('[Webhook] Error building payload:', webhookErr.message);
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    res.json({ message: 'Application submitted successfully', applicant });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

