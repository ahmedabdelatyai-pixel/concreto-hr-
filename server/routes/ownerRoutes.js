const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Applicant = require('../models/Applicant');

// Middleware to check for Owner Secret
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
    res.json({ totalCompanies: totalCompaniesCount.length, totalApplicants, activeJobs });
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
      return res.json({ systemPrompt: DEFAULT_SYSTEM_PROMPT, model: 'gemini-2.0-flash', updatedAt: null, isDefault: true });
    }
    res.json({ systemPrompt: setting.value.systemPrompt || DEFAULT_SYSTEM_PROMPT, model: setting.value.model || 'gemini-2.0-flash', updatedAt: setting.updatedAt, isDefault: false });
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
      { key: 'ai_system_prompt', value: { systemPrompt: systemPrompt.trim(), model: model || 'gemini-2.0-flash' }, updatedAt: new Date() },
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
    res.json({ systemPrompt: setting?.value?.systemPrompt || DEFAULT_SYSTEM_PROMPT, model: setting?.value?.model || 'gemini-2.0-flash' });
  } catch (err) {
    res.status(200).json({ systemPrompt: DEFAULT_SYSTEM_PROMPT, model: 'gemini-2.0-flash' });
  }
});

module.exports = router;
