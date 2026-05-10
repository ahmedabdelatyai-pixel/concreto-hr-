import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { refreshAiSettings } from '../services/aiApi';

// ── Inline component for editing a plan's limits ──────────────────────────────
function PlanEditForm({ plan, onSave, onCancel, isAr }) {
  const [form, setForm] = useState({
    jobLimit: plan.jobLimit,
    cvLimit: plan.cvLimit,
    price: plan.price,
  });

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            {isAr ? 'حد الوظائف (9999 = غير محدود)' : 'Job Limit (9999 = unlimited)'}
          </label>
          <input
            type="number" min="0" className="form-control"
            value={form.jobLimit}
            onChange={e => setForm({ ...form, jobLimit: Number(e.target.value) })}
            style={{ padding: '0.5rem' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            {isAr ? 'حد السير الذاتية / شهر (9999 = غير محدود)' : 'CV Limit / month (9999 = unlimited)'}
          </label>
          <input
            type="number" min="0" className="form-control"
            value={form.cvLimit}
            onChange={e => setForm({ ...form, cvLimit: Number(e.target.value) })}
            style={{ padding: '0.5rem' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            {isAr ? 'السعر الشهري ($)' : 'Monthly Price ($)'}
          </label>
          <input
            type="number" min="0" className="form-control"
            value={form.price}
            onChange={e => setForm({ ...form, price: Number(e.target.value) })}
            style={{ padding: '0.5rem' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onSave(plan.name, form)}
          className="btn btn-primary"
          style={{ flex: 2, padding: '0.5rem', fontSize: '0.85rem', fontWeight: '700' }}
        >
          💾 {isAr ? 'حفظ' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="btn btn-outline"
          style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
        >
          {isAr ? 'إلغاء' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function OwnerPanel() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [ownerPassword, setOwnerPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('companies');
  
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({ totalCompanies: 0, totalApplicants: 0, activeJobs: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // AI Settings State
  const [aiSettings, setAiSettings] = useState({ systemPrompt: '', model: 'gemini-2.0-flash', updatedAt: null, isDefault: true });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState('');

  // All Jobs State
  const [allJobs, setAllJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState('');

  // Plans State
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planSuccess, setPlanSuccess] = useState('');
  const [planError, setPlanError] = useState('');

  // Footer Settings State
  const [footerLinks, setFooterLinks] = useState({ email: '', website: '', linkedin: '', facebook: '', x: '' });
  const [footerLoading, setFooterLoading] = useState(false);
  const [footerSuccess, setFooterSuccess] = useState('');
  const [footerError, setFooterError] = useState('');

  // User Manual State
  const [userManual, setUserManual] = useState({ text: '' });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState('');
  const [manualError, setManualError] = useState('');

  // Subscription Requests State
  const [subRequests, setSubRequests] = useState([]);
  const [subReqLoading, setSubReqLoading] = useState(false);

  const [newCompany, setNewCompany] = useState({
    companyName: '',
    logo: '',
    email: '',
    username: '',
    password: '',
    subscription: 'starter'
  });

  // Owner password
  const OWNER_PASSWORD = 'owner_concreto_2025';

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanies();
      fetchAiSettings();
      fetchPlans();
      fetchFooterLinks();
      fetchUserManual();
      fetchSubRequests();
    }
  }, [isAuthenticated]);

  const fetchSubRequests = async () => {
    setSubReqLoading(true);
    try {
      const res = await api.get('/owner/subscription-requests', { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setSubRequests(res.data || []);
    } catch (err) {
      console.error('Failed to fetch subscription requests', err);
    } finally {
      setSubReqLoading(false);
    }
  };

  const handleUpdateSubStatus = async (id, newStatus) => {
    try {
      await api.patch(`/owner/subscription-requests/${id}/status`, { status: newStatus }, { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      fetchSubRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteSubRequest = async (id) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this request?')) return;
    try {
      await api.delete(`/owner/subscription-requests/${id}`, { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      fetchSubRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete request');
    }
  };

  const fetchUserManual = async () => {
    setManualLoading(true);
    try {
      const res = await api.get('/owner/user-manual', { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setUserManual(res.data || { text: '' });
    } catch (err) {
      console.error('Failed to fetch user manual', err);
    } finally {
      setManualLoading(false);
    }
  };

  const handleSaveUserManual = async () => {
    setManualLoading(true);
    setManualError('');
    setManualSuccess('');
    try {
      await api.post('/owner/user-manual', userManual, { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setManualSuccess(isAr ? '✅ تم حفظ الدليل الإرشادي بنجاح!' : '✅ User manual saved successfully!');
      setTimeout(() => setManualSuccess(''), 4000);
    } catch (err) {
      setManualError(err.response?.data?.message || err.message);
    } finally {
      setManualLoading(false);
    }
  };

  const fetchFooterLinks = async () => {
    setFooterLoading(true);
    try {
      const res = await api.get('/owner/footer-links', { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setFooterLinks(res.data || { email: '', website: '', linkedin: '', facebook: '', x: '' });
    } catch (err) {
      console.error('Failed to fetch footer links', err);
    } finally {
      setFooterLoading(false);
    }
  };

  const handleSaveFooterLinks = async () => {
    setFooterLoading(true);
    setFooterError('');
    setFooterSuccess('');
    try {
      await api.post('/owner/footer-links', footerLinks, { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setFooterSuccess(isAr ? '✅ تم حفظ روابط الفوتر بنجاح!' : '✅ Footer links saved successfully!');
      setTimeout(() => setFooterSuccess(''), 4000);
    } catch (err) {
      setFooterError(err.response?.data?.message || err.message);
    } finally {
      setFooterLoading(false);
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await api.get('/owner/plans', { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to fetch plans', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleUpdatePlan = async (planName, updates) => {
    setPlanError('');
    setPlanSuccess('');
    try {
      await api.put(`/owner/plans/${planName}`, updates, { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setPlanSuccess(isAr ? `✅ تم تحديث باقة "${planName}" بنجاح!` : `✅ Plan "${planName}" updated!`);
      setEditingPlan(null);
      fetchPlans();
      setTimeout(() => setPlanSuccess(''), 4000);
    } catch (err) {
      setPlanError(err.response?.data?.message || err.message);
    }
  };

  const fetchAllJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await api.get('/owner/jobs/all', { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setAllJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch all jobs', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleDeleteOwnerJob = async (jobId, jobTitle) => {
    if (!window.confirm(isAr ? `هل أنت متأكد من حذف وظيفة "${jobTitle}"؟` : `Delete job "${jobTitle}"?`)) return;
    try {
      await api.delete(`/owner/jobs/${jobId}`, { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setAllJobs(prev => prev.filter(j => j._id !== jobId));
    } catch (err) {
      alert(isAr ? 'فشل الحذف: ' + (err.response?.data?.message || err.message) : 'Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchAiSettings = async () => {
    setAiLoading(true);
    try {
      const res = await api.get('/owner/ai-settings', { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setAiSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch AI settings', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiSettings = async () => {
    setAiLoading(true);
    setAiError('');
    setAiSuccess('');
    try {
      await api.post('/owner/ai-settings', {
        systemPrompt: aiSettings.systemPrompt,
        model: aiSettings.model
      }, { headers: { 'x-owner-secret': OWNER_PASSWORD } });
      setAiSuccess(isAr ? '✅ تم حفظ إعدادات الذكاء الاصطناعي بنجاح! التغييرات ستظهر فوراً.' : '✅ AI settings saved! Changes will take effect immediately.');
      refreshAiSettings(); // Clear the client-side cache so new prompt is used
      setTimeout(() => setAiSuccess(''), 5000);
    } catch (err) {
      setAiError(err.response?.data?.message || err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleOwnerLogin = (e) => {
    e.preventDefault();
    if (ownerPassword === OWNER_PASSWORD) {
      setIsAuthenticated(true);
      setOwnerPassword('');
      setError('');
    } else {
      setError(isAr ? 'كلمة المرور خاطئة' : 'Invalid password');
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      // Fetch Real Stats
      const statsRes = await api.get('/owner/stats', {
        headers: { 'x-owner-secret': OWNER_PASSWORD }
      });
      setStats(statsRes.data);

      // Fetch Real Companies List
      const compRes = await api.get('/owner/companies', {
        headers: { 'x-owner-secret': OWNER_PASSWORD }
      });
      setCompanies(compRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(isAr ? 'فشل جلب البيانات من السيرفر' : 'Failed to fetch real data from server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/register', {
        username: newCompany.username,
        email: newCompany.email,
        password: newCompany.password,
        confirmPassword: newCompany.password,
        companyName: newCompany.companyName,
        logo: newCompany.logo,
        fullName: newCompany.companyName,
        subscription: newCompany.subscription
      });

      if (response.data) {
        setSuccess(isAr 
          ? `✅ تم إنشاء حساب الشركة بنجاح!\nUsername: ${newCompany.username}\nPassword: ${newCompany.password}` 
          : `✅ Company account created successfully!\nUsername: ${newCompany.username}\nPassword: ${newCompany.password}`
        );
        
        setNewCompany({
          companyName: '',
          logo: '',
          email: '',
          username: '',
          password: '',
          subscription: 'starter'
        });
        setShowCreateForm(false);
        fetchCompanies();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(isAr ? `خطأ: ${msg}` : `Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const [editingCompany, setEditingCompany] = useState(null);
  const [editForm, setEditForm] = useState({
    companyName: '',
    logo: '',
    email: '',
    username: '',
    password: '',
    subscription: ''
  });

  const handleEditClick = (company) => {
    setEditingCompany(company);
    setEditForm({
      companyName: company.companyName || '',
      logo: company.company?.logo || '',
      email: company.email || '',
      username: company.username || '',
      password: '', // Leave empty for no change
      subscription: company.subscription || 'starter'
    });
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/owner/companies/${editingCompany._id}`, editForm, {
        headers: { 'x-owner-secret': OWNER_PASSWORD }
      });
      setSuccess(isAr ? '✅ تم تحديث البيانات بنجاح' : '✅ Company updated successfully');
      setEditingCompany(null);
      fetchCompanies();
    } catch (err) {
      setError(isAr ? 'فشل التحديث' : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (userId) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الشركة؟' : 'Are you sure you want to delete this company?')) return;
    
    try {
      await api.delete(`/owner/companies/${userId}`, {
        headers: { 'x-owner-secret': OWNER_PASSWORD }
      });
      fetchCompanies();
    } catch (err) {
      alert(isAr ? 'فشل الحذف' : 'Delete failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#050a14', 
        color: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div className="card card-glow" style={{ maxWidth: '400px', width: '100%', padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '70px', height: '70px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem', fontSize: '2rem',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
            }}>👑</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              {isAr ? 'لوحة المالك' : 'Owner Panel'}
            </h1>
            <p className="text-muted">Super Admin Authentication</p>
          </div>

          <form onSubmit={handleOwnerLogin}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">{isAr ? 'كلمة مرور المالك' : 'Owner Password'}</label>
              <input
                type="password"
                className="form-control"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ padding: '1rem' }}
              />
            </div>
            {error && <div style={{ color: '#ef4444', marginBottom: '1.5rem', fontSize: '0.9rem', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px' }}>⚠️ {error}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: '700' }}>
              {isAr ? 'دخول النظام' : 'Enter System'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#050a14', 
      color: '#fff', 
      fontFamily: "'Outfit', sans-serif",
      direction: isAr ? 'rtl' : 'ltr'
    }}>
      {/* Header Bar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 5%',
        backgroundColor: '#0a1120',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            width: '35px', height: '35px', borderRadius: '8px', 
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
          }}>👑</div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
            {isAr ? 'لوحة المالك' : 'Owner Super-Panel'}
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => i18n.changeLanguage(isAr ? 'en' : 'ar')} 
            className="btn btn-outline" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            {isAr ? 'English' : 'العربية'}
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-outline" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: 'none', color: 'rgba(255,255,255,0.4)' }}
          >
            {isAr ? 'الخروج' : 'Exit'}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 5%' }}>
        {/* Top Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>
              {isAr ? 'لوحة المالك' : 'Owner Super-Panel'}
            </h1>
            <p className="text-muted">{isAr ? 'التحكم الكامل في الشركات، الاشتراكات، وعقل النظام الذكي' : 'Full control over companies, subscriptions, and the AI brain'}</p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => setIsAuthenticated(false)}
            style={{ padding: '0.8rem 1.5rem', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            {isAr ? 'خروج' : 'Logout'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { key: 'companies', label: isAr ? '🏢 إدارة الشركات' : '🏢 Companies', color: '#10b981' },
            { key: 'jobs', label: isAr ? '📋 كل الوظائف' : '📋 All Jobs', color: '#ef4444' },
            { key: 'plans', label: isAr ? '💳 الباقات' : '💳 Plans & Limits', color: '#fca311' },
            { key: 'requests', label: isAr ? '📩 طلبات الاشتراك' : '📩 Requests', color: '#3b82f6' },
            { key: 'ai', label: isAr ? '🧠 إعدادات عقل النظام' : '🧠 AI Brain Settings', color: '#8b5cf6' },
            { key: 'footer', label: isAr ? '🌐 إعدادات الفوتر' : '🌐 Footer Settings', color: '#06b6d4' },
            { key: 'manual', label: isAr ? '📖 الدليل الإرشادي' : '📖 User Manual', color: '#f43f5e' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s',
                backgroundColor: activeTab === tab.key ? tab.color : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.5)',
                boxShadow: activeTab === tab.key ? `0 0 20px ${tab.color}40` : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid #10b981' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#10b981' }}>{stats.totalCompanies}</div>
            <div className="text-muted" style={{ fontWeight: '600' }}>{isAr ? 'إجمالي الشركات' : 'Total Companies'}</div>
          </div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#3b82f6' }}>{stats.totalApplicants}</div>
            <div className="text-muted" style={{ fontWeight: '600' }}>{isAr ? 'إجمالي المتقدمين' : 'Total Applicants'}</div>
          </div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid #fca311' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fca311' }}>{stats.activeJobs}</div>
            <div className="text-muted" style={{ fontWeight: '600' }}>{isAr ? 'الوظائف النشطة' : 'Active Jobs'}</div>
          </div>
        </div>

        {/* ===== COMPANIES TAB ===== */}
        {activeTab === 'companies' && (<>

        {/* Create Form */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ padding: '0.8rem 1.5rem', fontWeight: '600' }}
          >
            {showCreateForm ? (isAr ? '✕ إغلاق' : '✕ Close') : (isAr ? '➕ إضافة شركة' : '➕ Add Company')}
          </button>
        </div>

        {showCreateForm && (
          <div className="fade-in" style={{ marginBottom: '3rem' }}>
            <div className="card card-glow" style={{ padding: '3rem', border: '1px solid var(--color-primary-glow)' }}>
              <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem', fontWeight: '800' }}>
                {isAr ? '📝 إنشاء حساب شركة جديد' : '📝 Create New Company Account'}
              </h2>

              <form onSubmit={handleCreateCompany}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'اسم الشركة' : 'Company Name'}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newCompany.companyName}
                      onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                      placeholder={isAr ? 'شركة الحلول الذكية' : 'Smart Solutions Co.'}
                      required
                      style={{ padding: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'رابط شعار الشركة (اختياري)' : 'Company Logo URL (Optional)'}</label>
                    <input
                      type="url"
                      className="form-control"
                      value={newCompany.logo}
                      onChange={(e) => setNewCompany({ ...newCompany, logo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      style={{ padding: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newCompany.email}
                      onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                      placeholder="admin@company.com"
                      required
                      style={{ padding: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'اسم المستخدم' : 'Username'}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newCompany.username}
                      onChange={(e) => setNewCompany({ ...newCompany, username: e.target.value })}
                      placeholder="company_admin"
                      required
                      style={{ padding: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'كلمة المرور' : 'Password'}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newCompany.password}
                      onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      style={{ padding: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'باقة الاشتراك' : 'Subscription Plan'}</label>
                    <select
                      className="form-control"
                      value={newCompany.subscription}
                      onChange={(e) => setNewCompany({ ...newCompany, subscription: e.target.value })}
                      style={{ padding: '0.8rem' }}
                    >
                      {plans.length > 0 ? plans.map(p => (
                        <option key={p.name} value={p.name}>
                          {p.displayName} — {p.cvLimit >= 9999 ? '∞' : p.cvLimit} {isAr ? 'CV/شهر' : 'CVs/mo'} | {p.jobLimit >= 9999 ? '∞' : p.jobLimit} {isAr ? 'وظيفة' : 'jobs'} | ${p.price}/mo
                        </option>
                      )) : (
                        <>
                          <option value="free">{isAr ? 'مجاني' : 'Free'}</option>
                          <option value="starter">{isAr ? 'الذكاء الأساسي' : 'Core Intelligence'}</option>
                          <option value="professional">{isAr ? 'الإدراك الاحترافي' : 'Pro Cognitive'}</option>
                          <option value="enterprise">{isAr ? 'العصب المؤسسي' : 'Enterprise Neural'}</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {error && <div style={{ color: '#ef4444', marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>⚠️ {error}</div>}
                {success && <div style={{ color: '#10b981', marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', whiteSpace: 'pre-wrap' }}>{success}</div>}

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', fontWeight: '700' }}>
                    {loading ? (isAr ? 'جاري التنفيذ...' : 'Executing...') : (isAr ? '🚀 إنشاء الحساب والشركة' : '🚀 Create Account & Company')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="card" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-primary)' }}>
              {isAr ? '💡 كيفية العمل' : '💡 How it works'}
            </h3>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'rgba(255,255,255,0.7)' }}>
              <li>{isAr ? 'كل شركة يتم إنشاؤها تحصل على قاعدة بيانات معزولة' : 'Each created company gets an isolated data scope'}</li>
              <li>{isAr ? 'المدير يمكنه الدخول عبر رابط /login باستخدام البيانات أعلاه' : 'Admin can login via /login using the credentials above'}</li>
              <li>{isAr ? 'يمكن لكل شركة إدارة وظائفها ومتقدميها بشكل مستقل' : 'Each company manages its jobs and applicants independently'}</li>
              <li>{isAr ? 'النظام يدعم تعدد اللغات (العربية والإنجليزية) تلقائياً' : 'System supports multi-language (Arabic/English) automatically'}</li>
            </ul>
          </div>

          <div className="card" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-secondary)' }}>
              {isAr ? '📊 تقارير النظام' : '📊 System Reports'}
            </h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              {isAr ? 'نظرة سريعة على أداء المنصة الإجمالي' : 'Quick overview of overall platform performance'}
            </p>
            <div style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span>{isAr ? 'معدل نمو الشركات' : 'Company Growth Rate'}</span>
                <span style={{ color: '#10b981' }}>+12%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span>{isAr ? 'معدل تحويل المتقدمين' : 'Applicant Conversion'}</span>
                <span style={{ color: '#3b82f6' }}>68%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{isAr ? 'استهلاك الذكاء الاصطناعي' : 'AI Usage Depth'}</span>
                <span style={{ color: '#fca311' }}>Normal</span>
              </div>
            </div>
          </div>
        </div>
        {/* Companies List Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ padding: '1.5rem 2rem', backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
              {isAr ? '📋 سجل الشركات المشتركة' : '📋 Subscriber Directory'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              {isAr ? `إجمالي: ${companies.length} شركة` : `Total: ${companies.length} companies`}
            </span>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                  <th style={{ padding: '1rem 2rem' }}>{isAr ? 'الشركة' : 'Company'}</th>
                  <th style={{ padding: '1rem 2rem' }}>{isAr ? 'المسؤول' : 'Admin User'}</th>
                  <th style={{ padding: '1rem 2rem' }}>{isAr ? 'البريد' : 'Email'}</th>
                  <th style={{ padding: '1rem 2rem' }}>{isAr ? 'الباقة' : 'Plan'}</th>
                  <th style={{ padding: '1rem 2rem' }}>{isAr ? 'الإجراء' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                      {isAr ? 'لا توجد شركات مسجلة حالياً' : 'No companies found in the system'}
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1.2rem 2rem' }}>
                        <div style={{ fontWeight: '700', color: '#fff' }}>{company.companyName}</div>
                      </td>
                      <td style={{ padding: '1.2rem 2rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>@{company.username}</span>
                      </td>
                      <td style={{ padding: '1.2rem 2rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{company.email}</span>
                      </td>
                      <td style={{ padding: '1.2rem 2rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                          backgroundColor: company.subscription === 'enterprise' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: company.subscription === 'enterprise' ? '#8b5cf6' : '#10b981'
                        }}>
                          {(company.subscription || 'Starter').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem 2rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button 
                            onClick={() => handleEditClick(company)}
                            style={{ 
                              background: 'none', border: 'none', color: 'var(--color-primary)', 
                              cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
                            }}
                          >
                            {isAr ? 'تعديل' : 'Edit'}
                          </button>
                          <button 
                            onClick={() => handleDeleteCompany(company._id)}
                            style={{ 
                              background: 'none', border: 'none', color: '#ef4444', 
                              cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
                            }}
                          >
                            {isAr ? 'حذف' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>)}

        {/* ===== AI BRAIN SETTINGS TAB ===== */}
        {activeTab === 'ai' && (
          <div className="fade-in">
            <div className="card" style={{ padding: '2.5rem', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 40px rgba(139,92,246,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🧠</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>{isAr ? 'إعدادات عقل النظام' : 'AI Brain Settings'}</h2>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{isAr ? 'تعديل شخصية الذكاء الاصطناعي وتعليمات النظام' : 'Modify AI personality and system instructions'}</p>
                </div>
              </div>

              {/* Status Bar */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '2rem', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{isAr ? 'آخر تحديث:' : 'Last updated:'}</span>
                <span style={{ fontSize: '0.8rem', color: aiSettings.isDefault ? '#fca311' : '#10b981', fontWeight: '600' }}>
                  {aiSettings.isDefault ? (isAr ? '⚠️ يستخدم الإعداد الافتراضي' : '⚠️ Using default settings') : new Date(aiSettings.updatedAt).toLocaleString()}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6', padding: '2px 10px', borderRadius: '20px', fontWeight: '600' }}>
                  {aiSettings.model}
                </span>
              </div>

              {/* Model Selector */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                  {isAr ? '🤖 نموذج الذكاء الاصطناعي' : '🤖 AI Model'}
                </label>
                <select
                  className="form-control"
                  value={aiSettings.model}
                  onChange={e => setAiSettings({ ...aiSettings, model: e.target.value })}
                  style={{ maxWidth: '300px', padding: '0.7rem' }}
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast & Cheap)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Balanced)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Most Powerful)</option>
                </select>
              </div>

              {/* System Prompt Editor */}
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', display: 'block' }}>
                  {isAr ? '📝 تعليمات النظام (System Prompt)' : '📝 System Instructions (System Prompt)'}
                </label>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {isAr
                    ? 'هذا النص هو "شخصية" الذكاء الاصطناعي. سيتم إرساله مع كل طلب تلقائياً كمرجع دائم للنموذج.'
                    : 'This text is the AI "personality". It will be sent with every request automatically as the model\'s permanent reference.'}
                </p>
                {aiLoading && !aiSettings.systemPrompt ? (
                  <div className="animate-pulse" style={{ color: '#8b5cf6', padding: '1rem' }}>{isAr ? 'جاري تحميل الإعدادات...' : 'Loading settings...'}</div>
                ) : (
                  <textarea
                    value={aiSettings.systemPrompt}
                    onChange={e => setAiSettings({ ...aiSettings, systemPrompt: e.target.value })}
                    rows={16}
                    className="form-control"
                    dir="auto"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      lineHeight: '1.7',
                      resize: 'vertical',
                      backgroundColor: '#050a14',
                      border: '1px solid rgba(139,92,246,0.3)',
                      color: '#e2e8f0',
                      padding: '1.25rem'
                    }}
                    placeholder={isAr ? 'اكتب تعليمات النظام هنا...' : 'Write system instructions here...'}
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{aiSettings.systemPrompt?.length || 0} {isAr ? 'حرف' : 'characters'}</span>
                </div>
              </div>

              {/* Feedback Messages */}
              {aiError && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠️ {aiError}</div>}
              {aiSuccess && <div style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{aiSuccess}</div>}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleSaveAiSettings}
                  disabled={aiLoading}
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '0.9rem', fontSize: '1rem', fontWeight: '700', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', border: 'none' }}
                >
                  {aiLoading ? (isAr ? '⏳ جاري الحفظ...' : '⏳ Saving...') : (isAr ? '💾 حفظ إعدادات عقل النظام' : '💾 Save AI Brain Settings')}
                </button>
                <button
                  onClick={fetchAiSettings}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.9rem' }}
                >
                  {isAr ? '🔄 استعادة الحالي' : '🔄 Reload Current'}
                </button>
              </div>
            </div>

            {/* Safety Notice */}
            <div style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', backgroundColor: 'rgba(252,163,17,0.05)', border: '1px solid rgba(252,163,17,0.15)', borderRadius: '10px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>🛡️</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fca311', marginBottom: '0.3rem' }}>{isAr ? 'إعدادات الأمان (Safety Settings)' : 'Safety Settings — Active'}</div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
                  {isAr
                    ? 'فلاتر الأمان من Google مفعّلة تلقائياً وتحمي النظام من الردود الضارة أو غير اللائقة في جميع الطلبات. لا يمكن تعطيلها لضمان سلامة المستخدمين.'
                    : 'Google Safety Filters are automatically active on all requests, protecting the system from harmful or inappropriate responses. Cannot be disabled to ensure user safety.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== ALL JOBS TAB ===== */}
        {activeTab === 'jobs' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{isAr ? '📋 كل الوظائف في النظام' : '📋 All Jobs in System'}</h3>
                <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                  {isAr ? 'جميع الوظائف من جميع الشركات — يمكن حذف أي وظيفة بدون قيود' : 'All jobs from all companies — delete any job without restrictions'}
                </p>
              </div>
              <button
                className="btn btn-outline"
                onClick={fetchAllJobs}
                disabled={jobsLoading}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                {jobsLoading ? '...' : (isAr ? '🔄 تحديث' : '🔄 Refresh')}
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              className="form-control"
              placeholder={isAr ? '🔍 ابحث بالاسم أو اسم الشركة...' : '🔍 Search by job name or company...'}
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
              style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}
            />

            {jobsLoading ? (
              <div className="animate-pulse" style={{ color: '#ef4444', padding: '2rem', textAlign: 'center' }}>
                {isAr ? 'جاري تحميل الوظائف...' : 'Loading jobs...'}
              </div>
            ) : allJobs.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <p className="text-muted">
                  {isAr ? 'اضغط على "تحديث" لتحميل الوظائف.' : 'Click "Refresh" to load all jobs.'}
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 1.5rem', backgroundColor: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)', fontSize: '0.8rem', color: '#ef4444', fontWeight: '600' }}>
                  ⚠️ {isAr ? `إجمالي ${allJobs.length} وظيفة في النظام` : `Total: ${allJobs.length} jobs in the system`}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'الوظيفة' : 'Job Title'}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'الشركة' : 'Company'}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{isAr ? 'أسئلة' : 'Questions'}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{isAr ? 'الحالة' : 'Status'}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{isAr ? 'التاريخ' : 'Date'}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{isAr ? 'حذف' : 'Delete'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allJobs
                      .filter(j => {
                        const q = jobSearch.toLowerCase();
                        return !q || (j.title_en || '').toLowerCase().includes(q) || (j.title_ar || '').includes(q) || (j.companyName || '').toLowerCase().includes(q);
                      })
                      .map(job => (
                        <tr key={job._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{job.title_en || '—'}</div>
                            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{job.title_ar}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>{job.companyName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>@{job.companyUsername}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.8rem' }}>
                              {job.customQuestionsCount} custom / {job.questionCount} total
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                              backgroundColor: job.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: job.active ? '#10b981' : '#ef4444'
                            }}>
                              {job.active ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'مخفية' : 'Inactive')}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                            {new Date(job.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteOwnerJob(job._id, job.title_en || job.title_ar)}
                              style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                color: '#ef4444', borderRadius: '6px', padding: '0.3rem 0.75rem',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => { e.target.style.background = '#ef4444'; e.target.style.color = '#fff'; }}
                              onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.1)'; e.target.style.color = '#ef4444'; }}
                            >
                              🗑 {isAr ? 'حذف' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== PLANS TAB ===== */}
        {activeTab === 'plans' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{isAr ? '💳 إدارة باقات الاشتراك' : '💳 Subscription Plans & Limits'}</h3>
                <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                  {isAr ? 'تعديل حدود الوظائف والسير الذاتية لكل باقة — يُطبّق فوراً على جميع الشركات' : 'Edit job & CV limits per plan — applied instantly to all subscribers'}
                </p>
              </div>
              <button className="btn btn-outline" onClick={fetchPlans} disabled={plansLoading} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                {plansLoading ? '...' : (isAr ? '🔄 تحديث' : '🔄 Refresh')}
              </button>
            </div>

            {planSuccess && <div style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{planSuccess}</div>}
            {planError && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>⚠️ {planError}</div>}

            {plansLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#fca311' }}>{isAr ? 'جاري تحميل الباقات...' : 'Loading plans...'}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {plans.map(plan => (
                  <div key={plan.name} className="card" style={{
                    padding: '2rem',
                    border: `1px solid ${plan.name === 'enterprise' ? 'rgba(139,92,246,0.4)' : plan.name === 'professional' ? 'rgba(59,130,246,0.3)' : plan.name === 'starter' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    position: 'relative'
                  }}>
                    {/* Plan Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.2rem' }}>{plan.displayName}</h3>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fca311', marginTop: '0.25rem' }}>
                          ${plan.price}<span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: '400' }}>/mo</span>
                        </div>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
                        backgroundColor: plan.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: plan.active ? '#10b981' : '#ef4444'
                      }}>
                        {plan.active ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'موقفة' : 'Paused')}
                      </span>
                    </div>

                    {/* Limits Display */}
                    {editingPlan === plan.name ? (
                      // EDIT MODE
                      <PlanEditForm plan={plan} onSave={handleUpdatePlan} onCancel={() => setEditingPlan(null)} isAr={isAr} />
                    ) : (
                      // VIEW MODE
                      <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{isAr ? 'حد الوظائف' : 'Job Limit'}</span>
                            <span style={{ fontWeight: '800', color: '#3b82f6' }}>
                              {plan.jobLimit >= 9999 ? '∞ Unlimited' : plan.jobLimit}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{isAr ? 'حد السير الذاتية / شهر' : 'CV Limit / month'}</span>
                            <span style={{ fontWeight: '800', color: '#10b981' }}>
                              {plan.cvLimit >= 9999 ? '∞ Unlimited' : plan.cvLimit}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingPlan(plan.name)}
                          style={{
                            width: '100%', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer',
                            background: 'rgba(252,163,17,0.1)', border: '1px solid rgba(252,163,17,0.3)',
                            color: '#fca311', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s'
                          }}
                        >
                          ✏️ {isAr ? 'تعديل الحدود' : 'Edit Limits'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Info Box */}
            <div style={{ marginTop: '2rem', padding: '1rem 1.5rem', backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px' }}>
              <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#3b82f6', marginBottom: '0.4rem' }}>
                💡 {isAr ? 'كيف يعمل النظام' : 'How it works'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }}>
                {isAr
                  ? 'عند تعديل حد أي باقة، يتم تطبيقه فوراً على جميع الشركات المشتركة في هذه الباقة. Unlimited = 9999. الحد يُحسب شهرياً للسير الذاتية ويتجدد تلقائياً.'
                  : 'Updating any plan limit takes effect immediately for all companies on that plan. Set to 9999 for unlimited. CV limit is calculated monthly and resets automatically.'}
              </div>
            </div>
          </div>
        )}

        {/* ===== FOOTER SETTINGS TAB ===== */}
        {activeTab === 'footer' && (
          <div className="fade-in">
            <div className="card" style={{ padding: '2.5rem', border: '1px solid rgba(6,182,212,0.3)', boxShadow: '0 0 40px rgba(6,182,212,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🌐</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>{isAr ? 'إعدادات الفوتر والروابط' : 'Footer & Links Settings'}</h2>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{isAr ? 'تعديل بيانات التواصل وروابط السوشيال ميديا في الفوتر' : 'Manage contact details and social media links in the global footer'}</p>
                </div>
              </div>

              {footerSuccess && <div style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{footerSuccess}</div>}
              {footerError && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>⚠️ {footerError}</div>}

              {footerLoading ? (
                <div className="animate-pulse" style={{ color: '#06b6d4', padding: '1rem' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="form-group">
                    <label className="form-label">{isAr ? '📧 البريد الإلكتروني للدعم' : '📧 Support Email'}</label>
                    <input type="email" className="form-control" value={footerLinks.email} onChange={e => setFooterLinks({...footerLinks, email: e.target.value})} placeholder="support@domain.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? '🌍 رابط الموقع الرسمي' : '🌍 Official Website'}</label>
                    <input type="url" className="form-control" value={footerLinks.website} onChange={e => setFooterLinks({...footerLinks, website: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? '💼 رابط LinkedIn' : '💼 LinkedIn URL'}</label>
                    <input type="url" className="form-control" value={footerLinks.linkedin} onChange={e => setFooterLinks({...footerLinks, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? '📘 رابط Facebook' : '📘 Facebook URL'}</label>
                    <input type="url" className="form-control" value={footerLinks.facebook} onChange={e => setFooterLinks({...footerLinks, facebook: e.target.value})} placeholder="https://facebook.com/..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? '🐦 رابط X (Twitter)' : '🐦 X (Twitter) URL'}</label>
                    <input type="url" className="form-control" value={footerLinks.x} onChange={e => setFooterLinks({...footerLinks, x: e.target.value})} placeholder="https://x.com/..." />
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveFooterLinks}
                disabled={footerLoading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1.1rem', fontWeight: '700', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', border: 'none' }}
              >
                {footerLoading ? (isAr ? '⏳ جاري الحفظ...' : '⏳ Saving...') : (isAr ? '💾 حفظ إعدادات الفوتر' : '💾 Save Footer Settings')}
              </button>
            </div>
          </div>
        )}

        {/* ===== USER MANUAL TAB ===== */}
        {activeTab === 'manual' && (
          <div className="fade-in">
            <div className="card" style={{ padding: '2.5rem', border: '1px solid rgba(244,63,94,0.3)', boxShadow: '0 0 40px rgba(244,63,94,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #f43f5e, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📖</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>{isAr ? 'الدليل الإرشادي للعميل' : 'Client User Manual'}</h2>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{isAr ? 'اكتب دليل الاستخدام خطوة بخطوة للعملاء ليظهر في صفحة المساعدة' : 'Write step-by-step instructions for clients to appear in the help page'}</p>
                </div>
              </div>

              {manualSuccess && <div style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{manualSuccess}</div>}
              {manualError && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>⚠️ {manualError}</div>}

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="form-label">{isAr ? 'محتوى الدليل' : 'Manual Content'}</label>
                  <span style={{ fontSize: '0.75rem', color: '#f43f5e' }}>{isAr ? 'يدعم العناوين والمسافات' : 'Supports headers and spacing'}</span>
                </div>
                <textarea
                  className="form-control"
                  style={{ minHeight: '400px', fontSize: '1rem', lineHeight: '1.6', padding: '1.5rem', fontFamily: 'monospace' }}
                  value={userManual.text}
                  onChange={e => setUserManual({ text: e.target.value })}
                  placeholder={isAr ? "## الخطوة الأولى...\n\n### إنشاء وظيفة\nقم بالدخول إلى..." : "## Step 1...\n\n### Create Job\nGo to..."}
                ></textarea>
              </div>

              <button
                onClick={handleSaveUserManual}
                disabled={manualLoading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1.1rem', fontWeight: '700', background: 'linear-gradient(135deg, #f43f5e, #ec4899)', border: 'none', marginTop: '1rem' }}
              >
                {manualLoading ? (isAr ? '⏳ جاري الحفظ...' : '⏳ Saving...') : (isAr ? '💾 نشر الدليل الإرشادي' : '💾 Publish User Manual')}
              </button>
            </div>
          </div>
        )}

        {/* ===== SUBSCRIPTION REQUESTS TAB ===== */}
        {activeTab === 'requests' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{isAr ? '📩 طلبات الاشتراك الجديدة' : '📩 Subscription Requests'}</h3>
                <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                  {isAr ? 'قائمة بالعملاء المحتملين الذين طلبوا الاشتراك من الصفحة الرئيسية' : 'List of potential clients who requested a subscription from the landing page'}
                </p>
              </div>
              <button
                className="btn btn-outline"
                onClick={fetchSubRequests}
                disabled={subReqLoading}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                {subReqLoading ? '...' : (isAr ? '🔄 تحديث' : '🔄 Refresh')}
              </button>
            </div>

            {subReqLoading ? (
              <div className="animate-pulse" style={{ color: '#3b82f6', padding: '2rem', textAlign: 'center' }}>
                {isAr ? 'جاري تحميل الطلبات...' : 'Loading requests...'}
              </div>
            ) : subRequests.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <p className="text-muted">
                  {isAr ? 'لا توجد طلبات اشتراك جديدة حتى الآن.' : 'No subscription requests yet.'}
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                      <th style={{ padding: '1rem', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'تاريخ الطلب' : 'Date'}</th>
                      <th style={{ padding: '1rem', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'العميل' : 'Client'}</th>
                      <th style={{ padding: '1rem', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'بيانات التواصل' : 'Contact Info'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>{isAr ? 'الباقة' : 'Plan'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>{isAr ? 'الحالة' : 'Status'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>{isAr ? 'إجراء' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subRequests.map(req => (
                      <tr key={req._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                          {new Date(req.createdAt).toLocaleDateString()} <br/>
                          <span style={{ fontSize: '0.75rem' }}>{new Date(req.createdAt).toLocaleTimeString()}</span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '700', fontSize: '1rem' }}>{req.clientName}</div>
                          <div style={{ fontSize: '0.85rem', color: '#10b981' }}>🏢 {req.companyName}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>📧 <a href={`mailto:${req.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{req.email}</a></div>
                          <div style={{ fontSize: '0.85rem' }}>📞 <a href={`https://wa.me/${req.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#10b981', textDecoration: 'none' }}>{req.phone}</a></div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                            {req.planRequested}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <select 
                            value={req.status} 
                            onChange={(e) => handleUpdateSubStatus(req._id, e.target.value)}
                            style={{
                              padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                              backgroundColor: req.status === 'pending' ? 'rgba(252,163,17,0.1)' : (req.status === 'contacted' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)'),
                              color: req.status === 'pending' ? '#fca311' : (req.status === 'contacted' ? '#3b82f6' : '#10b981'),
                              border: 'none', outline: 'none'
                            }}
                          >
                            <option value="pending" style={{ background: '#050a14', color: '#fff' }}>{isAr ? 'قيد الانتظار' : 'Pending'}</option>
                            <option value="contacted" style={{ background: '#050a14', color: '#fff' }}>{isAr ? 'تم التواصل' : 'Contacted'}</option>
                            <option value="converted" style={{ background: '#050a14', color: '#fff' }}>{isAr ? 'تم الاشتراك' : 'Converted'}</option>
                          </select>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteSubRequest(req._id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', transition: 'transform 0.2s' }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                            title={isAr ? 'حذف الطلب' : 'Delete Request'}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {editingCompany && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
            padding: '2rem'
          }}>
            <div className="card fade-in" style={{ maxWidth: '600px', width: '100%', padding: '2.5rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>{isAr ? '✏️ تعديل بيانات المشترك' : '✏️ Edit Subscriber'}</h2>
              <form onSubmit={handleUpdateCompany}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'اسم الشركة' : 'Company Name'}</label>
                    <input type="text" className="form-control" value={editForm.companyName} onChange={e => setEditForm({...editForm, companyName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'رابط شعار الشركة' : 'Company Logo URL'}</label>
                    <input type="url" className="form-control" value={editForm.logo} onChange={e => setEditForm({...editForm, logo: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'البريد' : 'Email'}</label>
                    <input type="email" className="form-control" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                    <input type="password" className="form-control" placeholder={isAr ? 'اتركها فارغة لعدم التغيير' : 'Leave empty for no change'} onChange={e => setEditForm({...editForm, password: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'الباقة' : 'Plan'}</label>
                    <select className="form-control" value={editForm.subscription} onChange={e => setEditForm({...editForm, subscription: e.target.value})}>
                      {plans.length > 0 ? plans.map(p => (
                        <option key={p.name} value={p.name}>
                          {p.displayName} — {p.cvLimit >= 9999 ? '∞' : p.cvLimit} {isAr ? 'CV/شهر' : 'CVs/mo'} | {p.jobLimit >= 9999 ? '∞' : p.jobLimit} {isAr ? 'وظيفة' : 'jobs'} | ${p.price}/mo
                        </option>
                      )) : (
                        <>
                          <option value="starter">Core Intelligence</option>
                          <option value="professional">Pro Cognitive</option>
                          <option value="enterprise">Enterprise Neural</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</button>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingCompany(null)} style={{ flex: 1 }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerPanel;
