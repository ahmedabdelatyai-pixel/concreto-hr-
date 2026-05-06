import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function OwnerPanel() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [ownerPassword, setOwnerPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [companies, setCompanies] = useState([]);
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

  // Owner password (set this to something secret in production)
  const OWNER_PASSWORD = 'owner_concreto_2025';

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

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate inputs
      if (!newCompany.companyName || !newCompany.email || !newCompany.username || !newCompany.password) {
        setError(isAr ? 'جميع الحقول مطلوبة' : 'All fields are required');
        setLoading(false);
        return;
      }

      if (newCompany.password.length < 8) {
        setError(isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      // Create company via API
      const response = await axios.post('/api/auth/register', {
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
        
        // Reset form
        setNewCompany({
          companyName: '',
          email: '',
          username: '',
          password: '',
          subscription: 'starter'
        });
        setShowCreateForm(false);

        // Refresh companies list
        fetchCompanies();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(isAr ? `خطأ: ${msg}` : `Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    // Note: This would need an API endpoint to list all companies
    // For now, just a placeholder
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem'
      }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            {isAr ? '🔐 لوحة التحكم - المالك' : '🔐 Owner Control Panel'}
          </h2>

          <form onSubmit={handleOwnerLogin}>
            <div className="form-group">
              <label className="form-label">
                {isAr ? 'كلمة المرور' : 'Owner Password'}
              </label>
              <input
                type="password"
                className="form-control"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder={isAr ? 'أدخل كلمة المرور السرية' : 'Enter owner password'}
                required
              />
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠️ {error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.7rem' }}>
              {isAr ? 'دخول' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0 }}>
            {isAr ? '🏢 إدارة العملاء' : '🏢 Client Management'}
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{ padding: '0.6rem 1.5rem' }}
            >
              {showCreateForm 
                ? (isAr ? '❌ إلغاء' : '❌ Cancel')
                : (isAr ? '➕ إضافة عميل جديد' : '➕ Add New Client')
              }
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setIsAuthenticated(false)}
              style={{ padding: '0.6rem 1.5rem', borderColor: '#ef4444' }}
            >
              {isAr ? 'خروج' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>
              {isAr ? '📝 إضافة عميل جديد' : '📝 Create New Client'}
            </h2>

            <form onSubmit={handleCreateCompany}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Company Name */}
                <div className="form-group">
                  <label className="form-label">
                    {isAr ? 'اسم الشركة' : 'Company Name'}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={newCompany.companyName}
                    onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                    placeholder={isAr ? 'مثال: شركة الذهب' : 'Ex: Gold Company'}
                    required
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label">
                    {isAr ? 'بريد الشركة' : 'Company Email'}
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    placeholder="company@example.com"
                    required
                  />
                </div>

                {/* Username */}
                <div className="form-group">
                  <label className="form-label">
                    {isAr ? 'Username (للدخول)' : 'Username (for login)'}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={newCompany.username}
                    onChange={(e) => setNewCompany({ ...newCompany, username: e.target.value })}
                    placeholder={isAr ? 'مثال: ahmed_company' : 'Ex: ahmed_company'}
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label">
                    {isAr ? 'كلمة المرور' : 'Password'}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={newCompany.password}
                    onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                    placeholder={isAr ? '8+ حروف وأرقام وحروف كبيرة' : 'Min 8 chars, numbers, uppercase'}
                    required
                  />
                </div>

                {/* Subscription Plan */}
                <div className="form-group">
                  <label className="form-label">
                    {isAr ? 'خطة الاشتراك' : 'Subscription Plan'}
                  </label>
                  <select
                    className="form-control"
                    value={newCompany.subscription}
                    onChange={(e) => setNewCompany({ ...newCompany, subscription: e.target.value })}
                  >
                    <option value="free">{isAr ? 'مجاني' : 'Free'}</option>
                    <option value="starter">{isAr ? 'مبتدئ' : 'Starter'}</option>
                    <option value="pro">{isAr ? 'احترافي' : 'Pro'}</option>
                    <option value="enterprise">{isAr ? 'مؤسسي' : 'Enterprise'}</option>
                  </select>
                </div>
              </div>

              {error && (
                <div style={{ color: '#ef4444', marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div style={{ color: '#10b981', marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '8px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {success}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, padding: '0.7rem' }}>
                  {loading ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? '✅ إنشاء الحساب' : '✅ Create Account')}
                </button>
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateForm(false)}
                  style={{ flex: 1, padding: '0.7rem' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info Box */}
        <div className="card" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            {isAr ? '📋 معلومات النظام' : '📋 System Information'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Subscription Plans Info */}
            <div>
              <h4>{isAr ? '💰 خطط الاشتراك' : '💰 Subscription Plans'}</h4>
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '0.5rem' }}><strong>{isAr ? 'مجاني' : 'Free'}</strong></td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>1 وظيفة، 10 متقدمين</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '0.5rem' }}><strong>{isAr ? 'مبتدئ' : 'Starter'}</strong></td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>5 وظائف، 100 متقدم</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '0.5rem' }}><strong>{isAr ? 'احترافي' : 'Pro'}</strong></td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>50 وظيفة، 1000 متقدم</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem' }}><strong>{isAr ? 'مؤسسي' : 'Enterprise'}</strong></td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{isAr ? 'غير محدود' : 'Unlimited'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Developer Info */}
            <div>
              <h4>{isAr ? '🔧 معلومات تقنية' : '🔧 Technical Info'}</h4>
              <p style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>
                {isAr ? '🔐 كل عميل يحصل على:' : '🔐 Each client gets:'}
              </p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.85rem' }}>
                <li>{isAr ? 'حساب منفصل (User)' : 'Separate account (User)'}</li>
                <li>{isAr ? 'شركة (Company) مع ID فريد' : 'Company with unique ID'}</li>
                <li>{isAr ? 'Dashboard خاص به' : 'Private Dashboard'}</li>
                <li>{isAr ? 'بيانات معزولة تماماً' : 'Completely isolated data'}</li>
                <li>{isAr ? 'JWT Authentication' : 'JWT Authentication'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerPanel;
