const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Applicant = require('../models/Applicant');

// Middleware to check for Owner Secret
const ownerOnly = (req, res, next) => {
  const secret = req.headers['x-owner-secret'];
  if (secret === '01553692600A@n') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Owner access only' });
  }
};

// POST — Create a new company (Owner only, bypasses public rate limits)
router.post('/companies', ownerOnly, async (req, res) => {
  try {
    const { username, email, password, companyName, logo, subscription } = req.body;
    const Company = require('../models/Company');
    const bcrypt = require('bcrypt');

    // Basic Validation
    if (!username || !email || !password || !companyName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Create company
    const company = new Company({
      name: companyName,
      logo: logo || '',
      email: email,
      subscription: subscription || 'starter',
      active: true
    });
    await company.save();

    // Create user
    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: password, // Model handles hashing via pre-save hook
      company: company._id,
      role: 'admin',
      name: companyName,
      active: true
    });
    await newUser.save();

    res.status(201).json({ message: 'Company created successfully', company: company, user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Global Stats
router.get('/stats', ownerOnly, async (req, res) => {
  try {
    const totalCompaniesCount = await User.distinct('companyName', { role: 'admin' });
    const totalApplicants = await Applicant.countDocuments();
    const activeJobs = await Job.countDocuments();
    res.json({ totalCompanies: totalCompaniesCount.length, totalApplicants, activeJobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET All Companies/Admins
router.get('/companies', ownerOnly, async (req, res) => {
  try {
    const companies = await User.find({ role: 'admin' }).select('-password').populate('company');
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE a company/admin
router.patch('/companies/:id', ownerOnly, async (req, res) => {
  try {
    const { companyName, email, username, password, subscription, logo } = req.body;
    const user = await User.findById(req.params.id).populate('company');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update Company details
    if (user.company) {
      const Company = require('../models/Company');
      const company = await Company.findById(user.company._id);
      if (companyName) company.name = companyName;
      if (email) company.email = email;
      if (subscription) company.subscription = subscription;
      if (logo !== undefined) company.logo = logo;
      await company.save();
    }

    // Update User details
    if (email) user.email = email;
    if (username) user.username = username;
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

// ============================================================
// =========== AI SYSTEM PROMPT SETTINGS ROUTES ==============
// ============================================================

const DEFAULT_SYSTEM_PROMPT = `أنت الخبير الرائد (Senior HR Director) في منصة TalentFlow، تمتلك خبرة دولية تزيد عن 50 عاماً في إدارة الموارد البشرية والتوظيف لكبرى المؤسسات العالمية في مختلف القطاعات. أنت لست مجرد نموذج ذكاء اصطناعي، بل استشاري إداري محنك يتميز بالفراسة والموضوعية المطلقة.

مهامك الأساسية:
1. فلترة وتحليل الـ CV: تحليل السير الذاتية بمختلف تخصصاتها ومطابقتها مع متطلبات الوظيفة بدقة جراحية، مع استخلاص المهارات الحقيقية واستبعاد الحشو.
2. توليد الأسئلة الذكية: بناءً على تحليل الـ CV، قم بصياغة أسئلة تقييمية تهدف لكشف الثغرات المهنية وقياس القدرات السلوكية باستخدام منهجية STAR Method.
3. تقييم الإجابات: تحليل ردود المتقدمين بدقة، مع مراعاة قوة المحتوى التقني، وإعطاء تقييم من 100.

قواعد العمل الصارمة:
- الشمولية: خبرتك عامة وتغطي كافة التخصصات والمهن بمرونة عالية.
- عزل البيانات: بيانات كل شركة هي أمانة مستقلة؛ لا يتم خلط البيانات بين الحسابات المختلفة.
- كشف التزييف: إذا كانت الإجابات تبدو منسوخة أو مولدة بواسطة AI، يجب التنويه بذلك في التقرير.
- التنسيق: الرد بلغة احترافية (عربية أو إنجليزية حسب السياق) بتنسيق JSON منظم يشمل الدرجة، نقاط القوة، المخاطر، والتوصية النهائية.
- الموضوعية: التقييم يعتمد فقط على الأدلة المتاحة في النصوص، بعيداً عن أي تحيز.`;

// GET AI Settings (owner-protected)
router.get('/ai-settings', ownerOnly, async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const setting = await SystemSettings.findOne({ key: 'ai_system_prompt' });
    if (!setting) {
      return res.json({ systemPrompt: DEFAULT_SYSTEM_PROMPT, model: 'gemini-1.5-flash', updatedAt: null, isDefault: true });
    }
    res.json({ systemPrompt: setting.value.systemPrompt || DEFAULT_SYSTEM_PROMPT, model: setting.value.model || 'gemini-1.5-flash', updatedAt: setting.updatedAt, isDefault: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — Save / Update AI Settings
router.post('/ai-settings', ownerOnly, async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const { systemPrompt, model } = req.body;
    if (!systemPrompt || systemPrompt.trim().length < 50) {
      return res.status(400).json({ message: 'System prompt is too short (min 50 chars).' });
    }
    await SystemSettings.findOneAndUpdate(
      { key: 'ai_system_prompt' },
      { key: 'ai_system_prompt', value: { systemPrompt: systemPrompt.trim(), model: model || 'gemini-1.5-flash' }, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'AI settings saved successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET AI Settings — Public route (no auth — used by the React frontend to get the active prompt)
router.get('/ai-settings/public', async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const setting = await SystemSettings.findOne({ key: 'ai_system_prompt' });
    res.json({ systemPrompt: setting?.value?.systemPrompt || DEFAULT_SYSTEM_PROMPT, model: setting?.value?.model || 'gemini-1.5-flash' });
  } catch (err) {
    res.status(200).json({ systemPrompt: DEFAULT_SYSTEM_PROMPT, model: 'gemini-1.5-flash' });
  }
});

// GET Branding Settings
router.get('/branding', async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const setting = await SystemSettings.findOne({ key: 'branding' });
    res.json(setting?.value || { siteName: 'TalentFlow', siteTagline: 'AI', primaryColor: '#6366f1' });
  } catch (err) {
    res.json({ siteName: 'TalentFlow', siteTagline: 'AI', primaryColor: '#6366f1' });
  }
});

// POST — Save Branding Settings (owner-protected)
router.post('/branding', ownerOnly, async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const { siteName, siteTagline, primaryColor } = req.body;
    await SystemSettings.findOneAndUpdate(
      { key: 'branding' },
      { key: 'branding', value: { siteName, siteTagline, primaryColor }, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Branding settings saved successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// =========== FOOTER SETTINGS ROUTES (OWNER) ================
// ============================================================

const DEFAULT_FOOTER_LINKS = {
  email: 'support@talentflow.com',
  website: 'https://talentflow.com',
  linkedin: 'https://linkedin.com',
  facebook: 'https://facebook.com',
  x: 'https://x.com'
};

// GET Footer Links (owner-protected)
router.get('/footer-links', ownerOnly, async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const setting = await SystemSettings.findOne({ key: 'footer_links' });
    if (!setting) {
      return res.json(DEFAULT_FOOTER_LINKS);
    }
    res.json(setting.value);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — Save / Update Footer Links
router.post('/footer-links', ownerOnly, async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const links = req.body;
    await SystemSettings.findOneAndUpdate(
      { key: 'footer_links' },
      { key: 'footer_links', value: links, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Footer links saved successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// =========== USER MANUAL ROUTES (OWNER) =====================
// ============================================================

const DEFAULT_MANUAL = "Welcome to the TalentFlow operations manual. You can edit this text from the Owner Panel.";

// GET User Manual (owner-protected)
router.get('/user-manual', ownerOnly, async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const setting = await SystemSettings.findOne({ key: 'user_manual' });
    if (!setting) {
      return res.json({ text: DEFAULT_MANUAL });
    }
    res.json(setting.value);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — Save / Update User Manual
router.post('/user-manual', ownerOnly, async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const manual = req.body; // expected { text: "..." }
    await SystemSettings.findOneAndUpdate(
      { key: 'user_manual' },
      { key: 'user_manual', value: manual, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'User manual saved successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// =========== SUBSCRIPTION REQUESTS (OWNER) ==================
// ============================================================

// GET all subscription requests
router.get('/subscription-requests', ownerOnly, async (req, res) => {
  try {
    const SubscriptionRequest = require('../models/SubscriptionRequest');
    const requests = await SubscriptionRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH status of a request
router.patch('/subscription-requests/:id/status', ownerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'contacted', 'converted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const SubscriptionRequest = require('../models/SubscriptionRequest');
    const reqDoc = await SubscriptionRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Status updated successfully', request: reqDoc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a request
router.delete('/subscription-requests/:id', ownerOnly, async (req, res) => {
  try {
    const SubscriptionRequest = require('../models/SubscriptionRequest');
    const reqDoc = await SubscriptionRequest.findByIdAndDelete(req.params.id);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// =========== OWNER: ALL JOBS MANAGEMENT (No company filter) ==
// ============================================================

// GET all jobs across all companies
router.get('/jobs/all', ownerOnly, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const User = require('../models/User');
    const jobs = await Job.find({}).sort({ createdAt: -1 });

    // Attach company name to each job for display
    const enriched = await Promise.all(jobs.map(async (job) => {
      const owner = job.company ? await User.findById(job.company).select('companyName username') : null;
      return {
        _id: job._id,
        title_en: job.title_en,
        title_ar: job.title_ar,
        department: job.department,
        active: job.active,
        createdAt: job.createdAt,
        customQuestionsCount: job.customQuestions?.length || 0,
        questionCount: job.questionCount || 10,
        companyName: owner?.companyName || 'Unknown',
        companyUsername: owner?.username || '?',
      };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH any job by ID (owner bypass)
router.patch('/jobs/:id', ownerOnly, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const { title_en, title_ar, department, active, questionCount } = req.body;
    const updated = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: { title_en, title_ar, department, active, questionCount, updatedAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job updated successfully!', job: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE any job by ID (owner bypass)
router.delete('/jobs/:id', ownerOnly, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const deleted = await Job.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: `Job "${deleted.title_en || deleted.title_ar}" deleted successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// =========== PLANS (Subscription Tiers) MANAGEMENT =========
// ============================================================

// GET all plans (owner-protected)
router.get('/plans', ownerOnly, async (req, res) => {
  try {
    const Plan = require('../models/Plan');
    const plans = await Plan.find({}).sort({ order: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all plans (public — for frontend display & limit checks)
router.get('/plans/public', async (req, res) => {
  try {
    const Plan = require('../models/Plan');
    const plans = await Plan.find({ active: true }).sort({ order: 1 })
      .select('name displayName jobLimit cvLimit price description order');
    res.json(plans);
  } catch (err) {
    res.status(200).json([]); // Don't break frontend on error
  }
});

// PUT — Update a plan's limits and price
router.put('/plans/:name', ownerOnly, async (req, res) => {
  try {
    const Plan = require('../models/Plan');
    const { jobLimit, cvLimit, price, displayName, description, active, features } = req.body;

    const updates = { updatedAt: new Date() };
    if (jobLimit !== undefined) updates.jobLimit = Number(jobLimit);
    if (cvLimit !== undefined) updates.cvLimit = Number(cvLimit);
    if (price !== undefined) updates.price = Number(price);
    if (displayName) updates.displayName = displayName;
    if (description !== undefined) updates.description = description;
    if (active !== undefined) updates.active = active;
    if (features !== undefined) updates.features = features;

    const plan = await Plan.findOneAndUpdate(
      { name: req.params.name.toLowerCase() },
      updates,
      { new: true, upsert: false }
    );

    if (!plan) return res.status(404).json({ message: `Plan "${req.params.name}" not found.` });

    res.json({ message: `Plan "${plan.displayName}" updated successfully!`, plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — Create a new custom plan
router.post('/plans', ownerOnly, async (req, res) => {
  try {
    const Plan = require('../models/Plan');
    const { name, displayName, jobLimit, cvLimit, price, description } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ message: 'name and displayName are required.' });
    }

    const exists = await Plan.findOne({ name: name.toLowerCase() });
    if (exists) return res.status(400).json({ message: `Plan "${name}" already exists.` });

    const plan = new Plan({
      name: name.toLowerCase(),
      displayName,
      jobLimit: Number(jobLimit) || 5,
      cvLimit: Number(cvLimit) || 50,
      price: Number(price) || 0,
      description: description || '',
      order: 99
    });

    await plan.save();
    res.status(201).json({ message: 'Plan created!', plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


