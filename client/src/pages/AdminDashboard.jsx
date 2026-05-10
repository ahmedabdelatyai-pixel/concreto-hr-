import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { generateJD } from '../services/aiApi';


function AdminDashboard() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const t = (en, ar) => isAr ? ar : en;
  const reportRef = useRef(null);
  
  // Multi-tenant Auth (for real users)
  const { isAuthenticated, logout, user, company } = useAuth();
  
  // Demo Mode Auth (for testing)
  const isAdminLoggedIn = useAdminStore(state => state.isAdminLoggedIn);
  const adminLogout = useAdminStore(state => state.adminLogout);
  
  // Check if user is authenticated either way
  const isUserLoggedIn = isAuthenticated || isAdminLoggedIn;
  
  const jobs = useAdminStore(state => state.jobs);
  const addJob = useAdminStore(state => state.addJob);
  const deleteJob = useAdminStore(state => state.deleteJob);
  const applicants = useAdminStore(state => state.applicants);
  const fetchJobs = useAdminStore(state => state.fetchJobs);
  const fetchApplicants = useAdminStore(state => state.fetchApplicants);
  const clearApplicants = useAdminStore(state => state.clearApplicants);
  const updateJob = useAdminStore(state => state.updateJob);

  const [activeTab, setActiveTab] = useState('analytics');
  const [showAddJob, setShowAddJob] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [newJob, setNewJob] = useState({ 
    title_en: '', 
    title_ar: '', 
    department: '',
    description: '',   // ✅ JD field
    questionCount: 10,
    customQuestions: [] 
  });
  const [questionInput, setQuestionInput] = useState({ text: '', category: 'Technical' });
  const [jdGenerating, setJdGenerating] = useState(false); // ✅ AI JD helper state
  const [serverStatus, setServerStatus] = useState('checking');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJob, setFilterJob] = useState('all');


  useEffect(() => {
    const checkServer = async () => {
      try {
        // Use the centralized api service for health check
        await api.get('/health');
        setServerStatus('online');
      } catch (e) {
        setServerStatus('offline');
      }
    };
    checkServer();
  }, []);

  useEffect(() => {
    if (isUserLoggedIn) {
      fetchJobs();
      fetchApplicants();
    }
  }, [isUserLoggedIn, fetchJobs, fetchApplicants]);

  const handleDownloadPDF = () => {
    const element = reportRef.current;
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `TalentFlow_Report_${selectedApplicant.candidate.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use html2pdf (loaded via CDN in index.html)
    window.html2pdf().from(element).set(opt).save();
  };

  const handleDownloadCV = (app = selectedApplicant) => {
    if (app?.cvFile?.data) {
      const a = document.createElement('a');
      a.href = app.cvFile.data;
      a.download = app.cvFile.name || 'Candidate_CV';
      a.click();
    } else {
      alert('No CV file available for this applicant.');
    }
  };

  // Redirect if not logged in
  if (!isUserLoggedIn) {
    navigate('/admin/login');
    return null;
  }

  const handleGenerateJD = async () => {
    // Priority: use the title of the current language, fallback to the other
    const title = (isAr ? (newJob.title_ar || newJob.title_en) : (newJob.title_en || newJob.title_ar))?.trim();
    
    if (!title) {
      alert(isAr ? 'الرجاء إدخال مسمى الوظيفة أولاً.' : 'Please enter the job title first.');
      return;
    }

    setJdGenerating(true);
    try {
      const draft = await generateJD(title, newJob.department);
      if (draft) {
        setNewJob(prev => ({ ...prev, description: draft }));
      } else {
        throw new Error('Empty draft');
      }
    } catch (err) {
      console.error('JD Generation Error:', err);
      const msg = isAr 
        ? 'فشل توليد الوصف. تأكد من إعدادات الـ API Key ومحاولة مسمى وظيفة واضح.' 
        : 'Failed to generate JD. Please check your API key settings and try a clear job title.';
      alert(msg);
    } finally {
      setJdGenerating(false);
    }
  };


  const handleLogout = () => {

    if (isAdminLoggedIn) {
      adminLogout();
    } else {
      logout();
    }
    navigate('/');
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    try {
      // Validate required JD
      if (!newJob.description?.trim()) {
        alert(isAr ? 'الوصف الوظيفي مطلوب. استخدم زر "مساعد الـ AI" إذا احتجت مساعدة.' : 'Job Description is required. Use the "AI JD Helper" button if needed.');
        return;
      }

      let jobToSave = {
        ...newJob,
        questionCount: parseInt(newJob.questionCount) || 10
      };
      if (questionInput.text.trim()) {
        jobToSave.customQuestions = [...jobToSave.customQuestions, { ...questionInput }];
      }

      if (editingJob) {
        await updateJob(editingJob._id, jobToSave);
      } else {
        await addJob(jobToSave);
      }

      setNewJob({ title_en: '', title_ar: '', department: '', description: '', questionCount: 10, customQuestions: [] });
      setQuestionInput({ text: '', category: 'Technical' });
      setShowAddJob(false);
      setEditingJob(null);
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      alert(`${t('Failed to save job.', 'فشل حفظ الوظيفة.')}\n\nError Details:\n${serverMsg}`);
    }
  };


  const handleEditJob = (job) => {
    setEditingJob(job);
    setNewJob({
      title_en: job.title_en,
      title_ar: job.title_ar,
      department: job.department,
      description: job.description || job.description_en || '',  // ✅
      questionCount: job.questionCount || 10,
      customQuestions: [...(job.customQuestions || [])]
    });
    setShowAddJob(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  const addQuestionToNewJob = () => {
    if (!questionInput.text) return;
    setNewJob({
      ...newJob,
      customQuestions: [...newJob.customQuestions, { ...questionInput }]
    });
    setQuestionInput({ text: '', category: 'Technical' });
  };

  const removeQuestionFromNewJob = (idx) => {
    setNewJob({
      ...newJob,
      customQuestions: newJob.customQuestions.filter((_, i) => i !== idx)
    });
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j._id === jobId);
    return job ? (isAr ? job.title_ar : job.title_en) : (isAr ? 'غير معروف' : 'Unknown');
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Hired': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', ar: 'تم التوظيف' },
      'Shortlisted': { bg: 'rgba(252, 163, 17, 0.15)', color: '#fca311', ar: 'قائمة مختصرة' },
      'Rejected': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', ar: 'مرفوض' },
      'Pending': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', ar: 'قيد الانتظار' },
      'Strong Fit': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', ar: 'ملائم تماماً' },
      'Potential Fit': { bg: 'rgba(252, 163, 17, 0.15)', color: '#fca311', ar: 'ملائم جزئياً' },
      'Not Fit': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', ar: 'غير ملائم' },
      'Invalid Answers': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', ar: 'إجابات غير صالحة' },
    };
    const style = colors[status] || colors['Pending'];
    return (
      <span style={{
        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600',
        backgroundColor: style.bg, color: style.color,
      }}>{isAr ? style.ar : status}</span>
    );
  };

  // ─── Analytics Calculations ──────────────────────────
  const safeApplicants = Array.isArray(applicants) ? applicants : [];
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  const totalApplicants = safeApplicants.length;
  const strongFit = safeApplicants.filter(a => a.evaluation?.recommendation === 'Strong Fit').length;
  const potentialFit = safeApplicants.filter(a => a.evaluation?.recommendation === 'Potential Fit').length;
  const notFit = safeApplicants.filter(a => ['Not Fit', 'Invalid Answers'].includes(a.evaluation?.recommendation)).length;
  const avgScore = totalApplicants > 0
    ? Math.round(safeApplicants.reduce((sum, a) => sum + (a.evaluation?.total_score || 0), 0) / totalApplicants)
    : 0;
  const topJob = safeJobs.reduce((top, job) => {
    const count = safeApplicants.filter(a => a.jobId === job._id).length;
    return count > (top.count || 0) ? { title: isAr ? job.title_ar : job.title_en, count } : top;
  }, {});
  const thisWeek = safeApplicants.filter(a => {
    const d = new Date(a.appliedAt);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) <= 7;
  }).length;

  // ─── Filtered Applicants ──────────────────────────────
  const filteredApplicants = safeApplicants.filter(app => {
    const matchSearch = !searchQuery ||
      app.candidate?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate?.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || app.evaluation?.recommendation === filterStatus;
    const matchJob = filterJob === 'all' || app.jobId === filterJob;
    return matchSearch && matchStatus && matchJob;
  });

  const handleUpdateStatus = async (applicantId, newStatus) => {
    try {
      // Use centralized api service
      const response = await api.patch(`/applicants/${applicantId}/status`, { status: newStatus });
      if (response.status === 200) {
        // Update local state
        fetchApplicants();
        setSelectedApplicant(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', direction: isAr ? 'rtl' : 'ltr' }}>
      {/* Top Navbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem', backgroundColor: 'var(--color-card)',
        borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
          <span style={{ color: 'var(--color-primary)' }}>TalentFlow</span> {t('HR Dashboard', 'لوحة تحكم الموارد البشرية')}
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          >
            {isAr ? 'English' : 'العربية'}
          </button>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>👤 {t('Admin', 'المدير')}</span>
          <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            {t('Logout', 'تسجيل الخروج')}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveTab('analytics'); setSelectedApplicant(null); }}
            className={activeTab === 'analytics' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '0.6rem 1.5rem' }}
          >
            📊 {t('Analytics', 'الإحصائيات')}
          </button>
          <button
            onClick={() => { setActiveTab('applicants'); setSelectedApplicant(null); }}
            className={activeTab === 'applicants' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '0.6rem 1.5rem' }}
          >
            👥 {t('Applicants', 'المتقدمون')} ({applicants.length})
          </button>
          <button
            onClick={() => { setActiveTab('jobs'); setSelectedApplicant(null); }}
            className={activeTab === 'jobs' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '0.6rem 1.5rem' }}
          >
            📋 {t('Jobs', 'الوظائف')} ({jobs.length})
          </button>
          <button
            onClick={() => { setActiveTab('integrity'); setSelectedApplicant(null); }}
            className={activeTab === 'integrity' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '0.6rem 1.5rem', borderColor: '#ef4444', color: activeTab === 'integrity' ? '#fff' : '#ef4444' }}
          >
            🛡️ {t('Integrity', 'النزاهة')}
          </button>
        </div>

        {/* ========== ANALYTICS TAB ========== */}
        {activeTab === 'analytics' && (
          <div className="fade-in">
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: t('Total Applicants', 'إجمالي المتقدمين'), value: totalApplicants, icon: '👥', color: '#3b82f6' },
                { label: t('Avg. Score', 'متوسط الدرجات'), value: `${avgScore}/100`, icon: '⭐', color: '#fca311' },
                { label: t('Strong Fit', 'ملائم تماماً'), value: strongFit, icon: '✅', color: '#10b981' },
                { label: t('This Week', 'هذا الأسبوع'), value: thisWeek, icon: '📅', color: '#8b5cf6' },
              ].map((kpi, i) => (
                <div key={i} className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${kpi.color}`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{kpi.icon}</div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: kpi.color }}>{kpi.value}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{kpi.label}</div>
                  <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '5rem', opacity: 0.05 }}>{kpi.icon}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Recommendation Breakdown Chart */}
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>{t('Recommendation Breakdown', 'تصنيف التوصيات')}</h3>
                {totalApplicants === 0 ? (
                  <p className="text-muted">{t('No applicants yet.', 'لا يوجد متقدمون بعد.')}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { label: t('Strong Fit', 'ملائم تماماً'), count: strongFit, color: '#10b981' },
                      { label: t('Potential Fit', 'ملائم جزئياً'), count: potentialFit, color: '#fca311' },
                      { label: t('Not Fit / Invalid', 'غير ملائم'), count: notFit, color: '#ef4444' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                          <span style={{ fontWeight: '700', color: item.color }}>{item.count} ({totalApplicants > 0 ? Math.round(item.count / totalApplicants * 100) : 0}%)</span>
                        </div>
                        <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${totalApplicants > 0 ? (item.count / totalApplicants) * 100 : 0}%`, height: '100%', background: item.color, borderRadius: '999px', transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Applicants per Job */}
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>{t('Applicants per Job', 'المتقدمون لكل وظيفة')}</h3>
                {safeJobs.length === 0 ? (
                  <p className="text-muted">{t('No jobs yet.', 'لا توجد وظائف بعد.')}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {safeJobs.map((job) => {
                      const count = safeApplicants.filter(a => a.jobId === job._id).length;
                      const maxCount = Math.max(...safeJobs.map(j => safeApplicants.filter(a => a.jobId === j._id).length), 1);
                      return (
                        <div key={job._id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.85rem', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isAr ? job.title_ar : job.title_en}</span>
                            <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{count}</span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${(count / maxCount) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: '999px', transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Score Distribution */}
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>{t('Score Distribution', 'توزيع الدرجات')}</h3>
                {totalApplicants === 0 ? <p className="text-muted">{t('No data.', 'لا توجد بيانات.')}</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { label: t('80–100 (Excellent)', '٠٨٠٣-١٠٠ (ممتاز)'), range: [80, 100], color: '#10b981' },
                      { label: t('60–79 (Good)', '٦٠-٧٩ (جيد)'), range: [60, 79], color: '#fca311' },
                      { label: t('40–59 (Average)', '٤٠-٥٩ (متوسط)'), range: [40, 59], color: '#f97316' },
                      { label: t('0–39 (Poor)', '٠-٣٩ (ضعيف)'), range: [0, 39], color: '#ef4444' },
                    ].map((tier, i) => {
                      const count = safeApplicants.filter(a => {
                        const s = a.evaluation?.total_score || 0;
                        return s >= tier.range[0] && s <= tier.range[1];
                      }).length;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.85rem' }}>{tier.label}</span>
                            <span style={{ fontWeight: '700', color: tier.color }}>{count}</span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${(count / totalApplicants) * 100}%`, height: '100%', background: tier.color, borderRadius: '999px', transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Summary */}
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>{t('Quick Summary', 'ملخص سريع')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: t('Most Popular Job', 'أكثر وظيفة طلباً'), value: topJob.title ? `${topJob.title} (${topJob.count})` : t('N/A', 'غير متوفر'), icon: '🏆' },
                    { label: t('Acceptance Rate', 'نسبة القبول'), value: totalApplicants > 0 ? `${Math.round(strongFit / totalApplicants * 100)}%` : '0%', icon: '📈' },
                    { label: t('Rejection Rate', 'نسبة الرفض'), value: totalApplicants > 0 ? `${Math.round(notFit / totalApplicants * 100)}%` : '0%', icon: '📉' },
                    { label: t('Under Review', 'قيد المراجعة'), value: potentialFit, icon: '🔍' },
                    { label: t('Total Open Positions', 'إجمالي الوظائف المفتوحة'), value: safeJobs.length, icon: '💼' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.icon} {item.label}</span>
                      <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'jobs' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>{t('Active Job Positions', 'الوظائف المفتوحة')}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => { if(confirm(t('Clear all applicants?', 'هل تريد حذف جميع المتقدمين؟'))) { clearApplicants(); } }} style={{ padding: '0.5rem 1rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                  🗑 {t('Clear All Applicants', 'حذف جميع المتقدمين')}
                </button>
                <button className="btn btn-primary" onClick={() => { 
                  if(showAddJob && editingJob) {
                    setEditingJob(null);
                    setNewJob({ title_en: '', title_ar: '', department: '', questionCount: 10, customQuestions: [] });
                  }
                  setShowAddJob(!showAddJob);
                }} style={{ padding: '0.5rem 1rem' }}>
                  {showAddJob ? t('✕ Cancel', '✕ إلغاء') : t('+ Add Job', '+ إضافة وظيفة')}
                </button>
              </div>
            </div>

            {/* Add/Edit Job Form */}
            {showAddJob && (
              <div className="card fade-in" style={{ marginBottom: '1.5rem', border: '1px solid var(--color-primary)' }}>
                <h4 style={{ marginBottom: '1rem' }}>{editingJob ? t('Edit Job Position', 'تعديل وظيفة') : t('New Job Position', 'وظيفة جديدة')}</h4>
                <form onSubmit={handleAddJob}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">{t('Title (English)', 'المسمى (إنجليزي)')}</label>
                      <input type="text" className="form-control" required
                        value={newJob.title_en} onChange={(e) => setNewJob({ ...newJob, title_en: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('Title (Arabic)', 'المسمى (عربي)')}</label>
                      <input type="text" className="form-control" required dir="rtl"
                        value={newJob.title_ar} onChange={(e) => setNewJob({ ...newJob, title_ar: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('Department', 'القسم')}</label>
                      <input type="text" className="form-control" required
                        value={newJob.department} onChange={(e) => setNewJob({ ...newJob, department: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('Total Questions', 'إجمالي عدد الأسئلة')}</label>
                      <input type="number" className="form-control" min="1" max="30"
                        value={newJob.questionCount || 10} onChange={(e) => setNewJob({ ...newJob, questionCount: parseInt(e.target.value) })} />
                    </div>
                  </div>

                  {/* ✅ JD Field + AI Helper */}
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        📝 {t('Job Description (Required)', 'الوصف الوظيفي (إلزامي)')}
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateJD}
                        disabled={jdGenerating}
                        style={{
                          padding: '0.3rem 0.9rem', fontSize: '0.78rem', fontWeight: '700',
                          background: jdGenerating ? 'rgba(252,163,17,0.1)' : 'linear-gradient(135deg, #fca311, #f97316)',
                          border: 'none', borderRadius: '6px', color: jdGenerating ? '#fca311' : '#000',
                          cursor: jdGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        {jdGenerating ? '⏳ ...' : '✨ ' + t('AI JD Helper', 'مساعد الـ AI')}
                      </button>
                    </div>
                    <textarea
                      className="form-control"
                      required
                      rows={6}
                      value={newJob.description}
                      onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                      placeholder={isAr
                        ? 'اكتب الوصف الوظيفي هنا، أو اضغط "مساعد الـ AI" ليكتبه لك تلقائياً...'
                        : 'Write the job description here, or click "AI JD Helper" to auto-generate it...'}
                      style={{ resize: 'vertical', fontSize: '0.88rem', lineHeight: '1.6' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.3rem' }}>
                      💡 {t('The AI uses this JD to generate personalized questions for each candidate.', 'الذكاء الاصطناعي يستخدم هذا الوصف لتوليد أسئلة مخصصة لكل متقدم.')}
                    </div>
                  </div>

                  {/* Question Bank Input */}
                  <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <label className="form-label">📚 {t('Add Custom Questions to Bank (Optional)', 'إضافة أسئلة مخصصة (اختياري)')}</label>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <input 
                        type="text" className="form-control" placeholder={t('Enter question...', 'اكتب السؤال...')} 
                        value={questionInput.text} onChange={e => setQuestionInput({...questionInput, text: e.target.value})}
                        style={{ flex: 3 }}
                      />
                      <select 
                        className="form-control" style={{ flex: 1 }}
                        value={questionInput.category} onChange={e => setQuestionInput({...questionInput, category: e.target.value})}
                      >
                        <option value="Technical">{t('Technical', 'تقني')}</option>
                        <option value="Behavioral">{t('Behavioral', 'سلوكي')}</option>
                        <option value="Hybrid">{t('Hybrid', 'مختلط')}</option>
                      </select>
                      <button type="button" className="btn btn-primary" onClick={addQuestionToNewJob}>{t('Add', 'إضافة')}</button>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {newJob.customQuestions.map((q, i) => (
                        <div key={i} style={{ 
                          padding: '0.4rem 0.8rem', backgroundColor: 'var(--color-bg)', borderRadius: '4px', 
                          border: '1px solid var(--color-border)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                          <span>[{q.category}] {q.text}</span>
                          <button type="button" onClick={() => removeQuestionFromNewJob(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.6rem 2rem' }}>
                    {editingJob ? t('Update Job', 'تحديث الوظيفة') : t('Save Job', 'حفظ الوظيفة')}
                  </button>
                </form>
              </div>
            )}

            {/* Jobs List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {safeJobs.map(job => {
                const jobApplicants = safeApplicants.filter(a => a.jobId === job._id);
                return (
                  <div key={job._id} style={{ marginBottom: '1.5rem' }}>
                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ margin: 0, marginBottom: '0.3rem' }}>{isAr ? job.title_ar : job.title_en}</h4>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{isAr ? job.title_en : job.title_ar} · {job.department}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{job.customQuestions?.length || 0}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t('Custom', 'مخصص')}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fca311' }}>{job.questionCount || 10}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t('Target', 'المستهدف')}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{jobApplicants.length}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t('Applicants', 'متقدمون')}</div>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                        }}>{t('Active', 'نشطة')}</span>
                        <button className="btn btn-outline" onClick={() => handleEditJob(job)}
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
                          {t('Edit', 'تعديل')}
                        </button>
                        <button className="btn btn-outline" onClick={() => deleteJob(job._id)}
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                          {t('Delete', 'حذف')}
                        </button>
                      </div>
                    </div>
                        {/* Share Section */}
                        <div style={{ padding: '1.2rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '600' }}>🔗 {t('Direct Application Links', 'روابط التوظيف المباشرة')}</div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', backgroundColor: 'rgba(252, 163, 17, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                              {t('Tracking Enabled', 'التتبع مفعل')}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                            {[
                            { name: 'LinkedIn',  src: 'linkedin',  icon: '🔵', medium: 'social' },
                              { name: 'WhatsApp', src: 'whatsapp', icon: '🟢', medium: 'messaging' },
                              { name: 'Facebook', src: 'facebook', icon: '💠', medium: 'social' },
                              { name: 'Snapchat', src: 'snapchat', icon: '👻', medium: 'social' },
                              { name: 'Direct',   src: 'direct',   icon: '🔗', medium: 'direct' }
                            ].map(source => {
                              // UTM tracking link
                              const applyLink = `${window.location.origin}/apply?jobId=${job._id}&utm_source=${source.src}&utm_medium=${source.medium}&utm_campaign=hiring`;

                              return (
                                <div key={source.src} style={{ 
                                  display: 'flex', flexDirection: 'column', gap: '0.5rem', 
                                  backgroundColor: 'var(--color-bg)', padding: '0.75rem', 
                                  borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {source.icon} {source.name}
                                  </div>
                                  <button 
                                    className="btn btn-outline" 
                                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', width: '100%' }}
                                    onClick={() => {
                                      navigator.clipboard.writeText(applyLink);
                                      alert(isAr ? `تم نسخ رابط ${source.name} بنجاح!` : `Copied ${source.name} link!`);
                                    }}
                                  >
                                    {t('Copy Link', 'نسخ الرابط')}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== APPLICANTS TAB ========== */}
        {activeTab === 'applicants' && !selectedApplicant && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>
                {t('All Applicants', 'جميع المتقدمين')}
                <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                  ({filteredApplicants.length} {t('of', 'من')} {applicants.length})
                </span>
              </h3>
              <button className="btn btn-outline" onClick={() => { if(window.confirm(t('Clear all applicants?', 'حذف جميع المتقدمين؟'))) clearApplicants(); }}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                🗑 {t('Clear All', 'حذف الكل')}
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder={t('🔍 Search by name, email or role...', '🔍 ابحث بالاسم أو البريد...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ flex: '2', minWidth: '200px' }}
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="form-control"
                style={{ flex: '1', minWidth: '160px' }}
              >
                <option value="all">{t('All Statuses', 'جميع الحالات')}</option>
                <option value="Hired">✅ {t('Hired', 'تم التوظيف')}</option>
                <option value="Shortlisted">🔶 {t('Shortlisted', 'قائمة مختصرة')}</option>
                <option value="Pending">⌛ {t('Pending', 'قيد الانتظار')}</option>
                <option value="Rejected">❌ {t('Rejected', 'مرفوض')}</option>
              </select>
              <select
                value={filterJob}
                onChange={e => setFilterJob(e.target.value)}
                className="form-control"
                style={{ flex: '1', minWidth: '160px' }}
              >
                <option value="all">{t('All Jobs', 'جميع الوظائف')}</option>
                {safeJobs.map(j => <option key={j._id} value={j._id}>{isAr ? j.title_ar : j.title_en}</option>)}
              </select>
              {(searchQuery || filterStatus !== 'all' || filterJob !== 'all') && (
                <button className="btn btn-outline" onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterJob('all'); }}
                  style={{ padding: '0.5rem 1rem' }}>✕ {t('Clear', 'مسح')}</button>
              )}
            </div>

            {filteredApplicants.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <p className="text-muted" style={{ fontSize: '1.1rem' }}>
                  {applicants.length === 0 ? t('No applicants yet.', 'لا يوجد متقدمون بعد.') : t('No results match your search/filter.', 'لا توجد نتائج تطابق بحثك.')}
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>{t('Name', 'الاسم')}</th>
                      <th style={thStyle}>{t('Applied Role', 'الوظيفة')}</th>
                      <th style={thStyle}>{t('Score', 'الدرجة')}</th>
                      <th style={thStyle}>{t('Source', 'المصدر')}</th>
                      <th style={thStyle}>{t('Status', 'الحالة')}</th>
                      <th style={thStyle}>{t('Date', 'التاريخ')}</th>
                      <th style={thStyle}>{t('CV', 'السيرة الذاتية')}</th>
                      <th style={thStyle}>{t('Action', 'إجراء')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplicants.map((app, idx) => (
                      <tr key={app._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{...tdStyle, color: 'var(--color-text-muted)', fontSize: '0.8rem'}}>{idx + 1}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: '600' }}>{app.candidate?.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{app.candidate?.email}</div>
                        </td>
                        <td style={tdStyle}>{app.candidate?.jobTitle || getJobTitle(app.jobId)}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 'bold', color: (app.evaluation?.total_score || 0) >= 60 ? '#10b981' : '#ef4444', direction: 'ltr', display: 'inline-block' }}>
                            {app.evaluation?.total_score || 0} / 100
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                            {app.source || t('Website', 'الموقع الإلكتروني')}
                          </span>
                        </td>
                        <td style={tdStyle}>{getStatusBadge(app.status || 'Pending')}</td>
                        <td style={{...tdStyle, fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td style={tdStyle}>
                          {app.cvFile ? (
                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--color-info)', borderColor: 'var(--color-info)' }}
                              onClick={(e) => { e.stopPropagation(); handleDownloadCV(app); }}>
                              📥 {t('Download', 'تحميل')}
                            </button>
                          ) : <span className="text-muted" style={{ fontSize: '0.8rem' }}>{t('No File', 'لا يوجد')}</span>}
                        </td>
                        <td style={tdStyle}>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => setSelectedApplicant(app)}>
                            {t('View', 'عرض')}
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
        {/* ========== INTEGRITY TAB ========== */}
        {activeTab === 'integrity' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>🛡️ {t('Interview Integrity Logs', 'سجلات نزاهة المقابلات')}</h3>
              <button className="btn btn-outline" onClick={fetchIntegrityLogs} disabled={loadingLogs}>
                {loadingLogs ? '...' : '🔄 ' + t('Refresh', 'تحديث')}
              </button>
            </div>

            {integrityLogs.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <p className="text-muted">{t('No integrity incidents reported.', 'لا توجد مخالفات مسجلة.')}</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={thStyle}>{t('Candidate', 'المرشح')}</th>
                      <th style={thStyle}>{t('Incident', 'المخالفة')}</th>
                      <th style={thStyle}>{t('Severity', 'الخطورة')}</th>
                      <th style={thStyle}>{t('Details', 'التفاصيل')}</th>
                      <th style={thStyle}>{t('Time', 'الوقت')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integrityLogs.map((log) => (
                      <tr key={log._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: '600' }}>{log.applicant?.candidate?.name || 'N/A'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.applicant?.candidate?.email}</div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ 
                            padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem',
                            backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: '600'
                          }}>
                            {log.incidentType.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ 
                            color: log.severity === 'critical' ? '#ef4444' : (log.severity === 'high' ? '#f97316' : '#fca311'),
                            fontWeight: 'bold', fontSize: '0.85rem'
                          }}>
                            {log.severity.toUpperCase()}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: '0.85rem' }}>{log.description}</div>
                          {log.sessionData && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                              Q: {log.sessionData.questionNumber} | Time: {log.sessionData.timeRemaining}s
                            </div>
                          )}
                        </td>
                        <td style={{...tdStyle, fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========== APPLICANT DETAIL VIEW ========== */}
        {activeTab === 'applicants' && selectedApplicant && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setSelectedApplicant(null)}
                style={{ padding: '0.5rem 1rem' }}>
                ← {t('Back to Applicants', 'عودة للمتقدمين')}
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedApplicant?.cvFile && (
                  <button className="btn btn-outline" onClick={handleDownloadCV} style={{ padding: '0.5rem 1rem', borderColor: 'var(--color-info)', color: 'var(--color-info)' }}>
                    📄 {t('Download Original CV', 'تحميل السيرة الذاتية')}
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleDownloadPDF} style={{ padding: '0.5rem 1rem' }}>
                  📥 {t('Download PDF Report', 'تحميل تقرير PDF')}
                </button>
              </div>
            </div>
            <div ref={reportRef} style={{ padding: '10px' }}>
              <div style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #fca311', paddingBottom: '10px' }} className="pdf-only">
                <h1 style={{ color: '#000', margin: 0 }}>TalentFlow AI</h1>
                <p style={{ color: '#666', margin: 0 }}>AI Recruitment Report</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>{t('Candidate Information', 'بيانات المرشح')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <InfoRow label={t('Name', 'الاسم')} value={selectedApplicant.candidate.name} />
                      <InfoRow label={t('Email', 'البريد')} value={selectedApplicant.candidate.email} />
                      <InfoRow label={t('Applied Role', 'الوظيفة')} value={selectedApplicant.candidate.jobTitle || 'N/A'} />
                      <InfoRow label={t('Applied Date', 'تاريخ التقديم')} value={new Date(selectedApplicant.appliedAt).toLocaleDateString()} />
                    </div>
                  </div>

                  {selectedApplicant.cvData && (
                    <div className="card" style={{ borderLeft: '4px solid var(--color-info)' }}>
                      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📄 {t('CV AI Analysis', 'تحليل السيرة الذاتية')}
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', color: 'var(--color-info)' }}>
                          {selectedApplicant.cvData.technical_match}% Match
                        </span>
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                        {selectedApplicant.cvData.summary}
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>{t('Education', 'التعليم')}</label>
                          <div style={{ fontSize: '0.9rem' }}>{selectedApplicant.cvData.education}</div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>{t('Experience', 'الخبرة')}</label>
                          <div style={{ fontSize: '0.9rem' }}>{selectedApplicant.cvData.experience_years} {t('Years', 'سنوات')}</div>
                        </div>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{t('Extracted Skills', 'المهارات المستخرجة')}</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {selectedApplicant.cvData.skills.map((skill, i) => (
                            <span key={i} style={{
                              padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: 'var(--color-info)', fontSize: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>{t('AI Evaluation Scores', 'نتائج تقييم الذكاء الاصطناعي')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <ScoreBar label={t('Behavioral Score', 'درجة السلوك')} score={selectedApplicant.evaluation?.scores?.behavior || 0} max={10} color="#10b981" />
                      <ScoreBar label={t('Attitude Score', 'درجة الموقف')} score={selectedApplicant.evaluation?.scores?.attitude || 0} max={10} color="#fca311" />
                      <ScoreBar label={t('Personality Fit', 'توافق الشخصية')} score={selectedApplicant.evaluation?.scores?.personality || 0} max={10} color="#3b82f6" />
                      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('Overall Rating', 'التقييم العام')}</div>
                          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', direction: 'ltr', display: 'inline-block' }}>
                            {selectedApplicant.evaluation?.total_score || 0} / 100
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                          <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('Candidate Status', 'حالة المرشح')}</div>
                          <select 
                            value={selectedApplicant.status || 'Pending'}
                            onChange={(e) => handleUpdateStatus(selectedApplicant._id, e.target.value)}
                            style={{ 
                              padding: '0.4rem 1rem', borderRadius: '4px', backgroundColor: 'var(--color-bg)', 
                              color: '#fff', border: '1px solid var(--color-primary)', outline: 'none'
                            }}
                          >
                            <option value="Pending">⌛ Pending Review</option>
                            <option value="Shortlisted">🔶 Shortlisted</option>
                            <option value="Hired">✅ Hired</option>
                            <option value="Rejected">❌ Rejected</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedApplicant.evaluation?.disc && (
                    <div className="card">
                      <h3 style={{ marginBottom: '1.5rem' }}>{t('DISC Profile', 'ملف شخصية DISC')}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <ScoreBar label="Dominance (D)" score={selectedApplicant.evaluation.disc.d || 0} max={100} color="#ef4444" suffix="%" />
                        <ScoreBar label="Influence (I)" score={selectedApplicant.evaluation.disc.i || 0} max={100} color="#fca311" suffix="%" />
                        <ScoreBar label="Steadiness (S)" score={selectedApplicant.evaluation.disc.s || 0} max={100} color="#10b981" suffix="%" />
                        <ScoreBar label="Conscientiousness (C)" score={selectedApplicant.evaluation.disc.c || 0} max={100} color="#3b82f6" suffix="%" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ AI Insights + Strengths + Weaknesses */}
              <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>{t('AI Insights & Analysis', 'تحليل الذكاء الاصطناعي')}</h3>

                {selectedApplicant.evaluation?.strengths?.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: '#10b981', marginBottom: '0.75rem' }}>✅ {t('Strengths', 'نقاط القوة')}</h4>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                      {selectedApplicant.evaluation.strengths.map((s, i) => (
                        <li key={i} style={{ marginBottom: '0.4rem' }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedApplicant.evaluation?.weaknesses?.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: '#ef4444', marginBottom: '0.75rem' }}>⚠️ {t('Areas for Improvement', 'نقاط التحسين')}</h4>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                      {selectedApplicant.evaluation.weaknesses.map((w, i) => (
                        <li key={i} style={{ marginBottom: '0.4rem', color: 'rgba(255,255,255,0.8)' }}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ✅ Gap Analysis */}
                {selectedApplicant.evaluation?.gap_analysis && (
                  <div style={{
                    padding: '1rem', borderRadius: '8px', marginTop: '0.5rem',
                    backgroundColor: 'rgba(252,163,17,0.06)', border: '1px solid rgba(252,163,17,0.2)'
                  }}>
                    <h4 style={{ color: '#fca311', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
                      🔍 {t('Gap Analysis (CV vs Interview)', 'تحليل الفجوة')}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.7', color: 'rgba(255,255,255,0.85)' }}>
                      {selectedApplicant.evaluation.gap_analysis}
                    </p>
                  </div>
                )}
              </div>

              {/* ✅ Integrity Meter */}
              <div className="card" style={{ marginTop: '1.5rem', borderLeft: `4px solid ${
                (selectedApplicant.cheatAttempts || 0) === 0 ? '#10b981' :
                (selectedApplicant.cheatAttempts || 0) <= 2 ? '#fca311' : '#ef4444'
              }` }}>
                <h3 style={{ marginBottom: '1rem' }}>🛡️ {t('Integrity Meter', 'مقياس النزاهة')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  {[
                    {
                      label: t('Integrity Score', 'درجة النزاهة'),
                      value: `${selectedApplicant.integrityScore ?? 100}%`,
                      color: (selectedApplicant.integrityScore ?? 100) >= 80 ? '#10b981' :
                             (selectedApplicant.integrityScore ?? 100) >= 50 ? '#fca311' : '#ef4444'
                    },
                    {
                      label: t('Tab Switches', 'تغييرات التبويب'),
                      value: selectedApplicant.cheatAttempts || 0,
                      color: (selectedApplicant.cheatAttempts || 0) === 0 ? '#10b981' : '#ef4444'
                    },
                    {
                      label: t('Verdict', 'الحكم'),
                      value: (selectedApplicant.cheatAttempts || 0) === 0
                        ? (isAr ? 'نزاهة عالية ✅' : 'High Integrity ✅')
                        : (selectedApplicant.cheatAttempts || 0) <= 2
                          ? (isAr ? 'تحذير ⚠️' : 'Caution ⚠️')
                          : (isAr ? 'مختبر ❌' : 'Suspicious ❌'),
                      color: (selectedApplicant.cheatAttempts || 0) === 0 ? '#10b981' :
                             (selectedApplicant.cheatAttempts || 0) <= 2 ? '#fca311' : '#ef4444'
                    }
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* MCQ Score */}
                {(selectedApplicant.evaluation?.mcq_score !== undefined) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.8rem', backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                      {t('Auto-Scored (MCQ/T-F)', 'التصحيح التلقائي (MCQ / صح و خطأ)')}
                    </span>
                    <span style={{ fontWeight: '700', color: '#3b82f6', fontSize: '1rem' }}>
                      {selectedApplicant.evaluation.mcq_score}/40
                    </span>
                  </div>
                )}

                {/* UTM Source */}
                {selectedApplicant.utm_source && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                    🔗 {t('Applied via', 'جاء عن طريق')}: <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{selectedApplicant.utm_source}</span>
                    {selectedApplicant.utm_medium && <span> &rarr; {selectedApplicant.utm_medium}</span>}
                  </div>
                )}
              </div>


              {selectedApplicant.answers?.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>{t('Interview Answers', 'إجابات المقابلة')}</h3>
                  {selectedApplicant.answers.map((a, i) => (
                    <div key={i} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: i < selectedApplicant.answers.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: '600', color: 'var(--color-primary)', margin: 0 }}>Q{i + 1}: {a.question}</p>
                        {/* ✅ Show MCQ/T-F badge + correct/incorrect */}
                        {(a.type === 'mcq' || a.type === 'truefalse') && (
                          <span style={{
                            padding: '1px 7px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700',
                            backgroundColor: a.type === 'mcq' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                            color: a.type === 'mcq' ? '#3b82f6' : '#10b981'
                          }}>{a.type === 'mcq' ? 'MCQ' : 'T/F'}</span>
                        )}
                        {a.isCorrect === true && (
                          <span style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: '700' }}>✔ {t('Correct', 'صحيح')}</span>
                        )}
                        {a.isCorrect === false && (
                          <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: '700' }}>✘ {t('Incorrect', 'خطأ')}</span>
                        )}
                      </div>
                      <p style={{ color: 'var(--color-text)', lineHeight: '1.6', margin: 0, fontSize: '0.9rem' }}>{a.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Server Status Indicator */}
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', padding: '8px 12px',
        backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '20px', fontSize: '0.7rem',
        display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: serverStatus === 'online' ? '#10b981' : (serverStatus === 'offline' ? '#ef4444' : '#fca311')
        }}></div>
        <span style={{ color: '#fff' }}>Server: {serverStatus.toUpperCase()}</span>
      </div>
    </div>
  );
}

// Helper components
const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
    <span className="text-muted">{label}</span>
    <span style={{ fontWeight: '500' }}>{value}</span>
  </div>
);

const ScoreBar = ({ label, score, max, color, suffix = '' }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', direction: 'ltr' }}>
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{score}{suffix} / {max}{suffix}</span>
    </div>
    <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', direction: 'ltr' }}>
      <div style={{ width: `${(score / max) * 100}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
    </div>
  </div>
);

const thStyle = { padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '0.9rem 1rem', fontSize: '0.9rem' };

export default AdminDashboard;
