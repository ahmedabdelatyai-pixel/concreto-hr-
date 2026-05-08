import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

function AdminLogin() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const adminLogin = useAdminStore(state => state.adminLogin);
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Check Demo Password First (Instant access)
    if (password === 'concreto2025') {
      adminLogin(password);
      setTimeout(() => navigate('/admin'), 100);
      return;
    }

    // 2. Otherwise try full company login
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      console.error('Login error details:', err);
      const serverMsg = err.response?.data?.message;
      const status = err.response?.status;
      
      if (status === 401 || status === 403) {
        setError(isArabic ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password.');
      } else if (status === 404) {
        setError(isArabic ? 'خطأ: لم يتم العثور على رابط تسجيل الدخول (404)' : 'Error: Login API not found (404).');
      } else {
        setError(isArabic ? `حدث خطأ في النظام (${status || 'Network Error'})` : `System error (${status || 'Network Error'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (e) => {
    e.preventDefault();
    adminLogin('concreto2025');
    navigate('/admin');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#050a14', 
      color: '#fff', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ 
        maxWidth: '420px', 
        width: '100%', 
        padding: '2.5rem',
        backgroundColor: '#0a1120',
        borderRadius: '20px',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(99, 102, 241, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.2rem', fontSize: '1.8rem',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)'
          }}>🔒</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            {isArabic ? 'لوحة التحكم' : 'Admin Panel'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            {isArabic ? 'سجل الدخول لإدارة التوظيف' : 'Sign in to manage recruitment'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
              {isArabic ? 'اسم المستخدم' : 'Username'}
            </label>
            <input
              type="text"
              placeholder={isArabic ? 'أدخل اسم المستخدم' : 'Enter username'}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              required
              style={{ 
                padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: '#050a14', color: '#fff', outline: 'none', fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
              {isArabic ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              placeholder={isArabic ? 'أدخل كلمة المرور' : 'Enter password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
              style={{ 
                padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: '#050a14', color: '#fff', outline: 'none', fontSize: '1rem'
              }}
            />
          </div>

          {error && (
            <div style={{ 
              color: '#ef4444', fontSize: '0.85rem', padding: '0.7rem', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ 
            marginTop: '0.5rem', padding: '1rem', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff',
            fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
          }}>
            {loading ? (isArabic ? 'جاري الدخول...' : 'Signing in...') : (isArabic ? 'دخول النظام' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
          <button 
            type="button"
            onClick={handleDemoLogin}
            style={{ 
              background: 'none', border: '1px solid #6366f1', color: '#6366f1',
              padding: '0.7rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
            }}
          >
            🚀 {isArabic ? 'النسخة التجريبية' : 'Demo Mode'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            {isArabic ? '← العودة للرئيسية' : '← Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
