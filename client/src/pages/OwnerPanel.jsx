import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function OwnerPanel() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [ownerPassword, setOwnerPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({ totalCompanies: 0, totalApplicants: 0, activeJobs: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newCompany, setNewCompany] = useState({
    companyName: '',
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
    }
  }, [isAuthenticated]);

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
    email: '',
    username: '',
    password: '',
    subscription: ''
  });

  const handleEditClick = (company) => {
    setEditingCompany(company);
    setEditForm({
      companyName: company.companyName || '',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>
              {isAr ? 'إدارة المشتركين' : 'Subscriber Management'}
            </h1>
            <p className="text-muted">{isAr ? 'التحكم الكامل في الشركات والاشتراكات' : 'Full control over companies and subscriptions'}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{ padding: '0.8rem 1.5rem', fontWeight: '600' }}
            >
              {showCreateForm ? (isAr ? '✕ إغلاق' : '✕ Close') : (isAr ? '➕ إضافة شركة' : '➕ Add Company')}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setIsAuthenticated(false)}
              style={{ padding: '0.8rem 1.5rem', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {isAr ? 'خروج' : 'Logout'}
            </button>
          </div>
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

        {/* Create Form Modal Style */}
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
                      <option value="free">{isAr ? 'مجاني' : 'Free'}</option>
                      <option value="starter">{isAr ? 'مبتدئ' : 'Starter'}</option>
                      <option value="pro">{isAr ? 'احترافي' : 'Pro'}</option>
                      <option value="enterprise">{isAr ? 'مؤسسي' : 'Enterprise'}</option>
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
                      <option value="starter">Starter (50/mo)</option>
                      <option value="professional">Professional (200/mo)</option>
                      <option value="enterprise">Enterprise (Unlimited)</option>
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
