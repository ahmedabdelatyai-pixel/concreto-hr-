const Plan = require('../models/Plan');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Applicant = require('../models/Applicant');

/**
 * getPlanLimits — جلب حدود الباقة من DB (مع fallback)
 */
const getPlanLimits = async (planName) => {
  const FALLBACK = { jobLimit: 5, cvLimit: 50 };
  try {
    const name = (planName || 'starter').toLowerCase();
    const plan = await Plan.findOne({ name });
    if (!plan) return FALLBACK;
    return { jobLimit: plan.jobLimit, cvLimit: plan.cvLimit };
  } catch (err) {
    console.warn('[checkLimits] DB error, using fallback limits:', err.message);
    return FALLBACK;
  }
};

/**
 * Middleware: checkJobLimit
 * يتحقق قبل إنشاء وظيفة جديدة
 * يُستخدم في: POST /api/jobs
 */
const checkJobLimit = async (req, res, next) => {
  try {
    const company = await Company.findById(req.companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const { jobLimit } = await getPlanLimits(company.subscription);

    // enterprise = unlimited
    if (jobLimit >= 9999) return next();

    const currentJobCount = await Job.countDocuments({ company: req.companyId });

    if (currentJobCount >= jobLimit) {
      return res.status(403).json({
        message: `لقد استنفدت رصيد باقتك. الحد الأقصى للوظائف في باقة "${company.subscription}" هو ${jobLimit} وظائف. | You've reached your plan's job limit (${jobLimit} jobs for "${company.subscription}" plan).`,
        limitReached: true,
        type: 'job_limit',
        current: currentJobCount,
        limit: jobLimit,
        plan: company.subscription
      });
    }

    // Pass limit info downstream if needed
    req.planLimits = { jobLimit, currentJobCount };
    next();
  } catch (err) {
    console.error('[checkJobLimit] Error:', err.message);
    next(); // Don't block on error
  }
};

/**
 * checkCvLimit — دالة (ليست middleware) للاستخدام داخل publicRoutes
 * ترجع null إذا كان مسموح، أو object بالخطأ إذا تجاوز الحد
 * @param {string} companyId
 * @returns {Object|null}
 */
const checkCvLimit = async (companyId) => {
  try {
    const company = await Company.findById(companyId);
    if (!company) return null;

    const { cvLimit } = await getPlanLimits(company.subscription);

    // enterprise = unlimited
    if (cvLimit >= 9999) return null;

    // عد المتقدمين في الشهر الحالي
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthCount = await Applicant.countDocuments({
      company: companyId,
      createdAt: { $gte: startOfMonth }
    });

    if (monthCount >= cvLimit) {
      return {
        message: `نعتذر، لقد تم استهلاك الحد الأقصى للمتقدمين لهذا الشهر. | Sorry, the monthly applicant limit has been reached for this company.`,
        limitReached: true,
        type: 'cv_limit',
        current: monthCount,
        limit: cvLimit,
        plan: company.subscription
      };
    }

    return null; // مسموح
  } catch (err) {
    console.error('[checkCvLimit] Error:', err.message);
    return null; // Don't block on error
  }
};

/**
 * getCompanyPlanStatus — جلب حالة الباقة (للـ Webhook)
 * @param {string} companyId
 */
const getCompanyPlanStatus = async (companyId) => {
  try {
    const company = await Company.findById(companyId);
    if (!company) return { plan_status: 'unknown', plan_name: 'unknown' };

    const planName = (company.subscription || 'starter').toLowerCase();
    const { cvLimit, jobLimit } = await getPlanLimits(planName);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [cvUsed, jobCount] = await Promise.all([
      Applicant.countDocuments({ company: companyId, createdAt: { $gte: startOfMonth } }),
      Job.countDocuments({ company: companyId })
    ]);

    const cvRemaining = cvLimit >= 9999 ? 'unlimited' : Math.max(0, cvLimit - cvUsed);
    const jobRemaining = jobLimit >= 9999 ? 'unlimited' : Math.max(0, jobLimit - jobCount);
    const isActive = company.active !== false;
    const cvExceeded = cvLimit < 9999 && cvUsed >= cvLimit;

    return {
      plan_status: isActive && !cvExceeded ? 'active' : 'limit_reached',
      plan_name: planName,
      cv_used: cvUsed,
      cv_limit: cvLimit >= 9999 ? 'unlimited' : cvLimit,
      cv_remaining: cvRemaining,
      job_count: jobCount,
      job_limit: jobLimit >= 9999 ? 'unlimited' : jobLimit,
      job_remaining: jobRemaining,
      company_active: isActive
    };
  } catch (err) {
    return { plan_status: 'active', plan_name: 'starter', error: err.message };
  }
};

module.exports = { checkJobLimit, checkCvLimit, getCompanyPlanStatus, getPlanLimits };
