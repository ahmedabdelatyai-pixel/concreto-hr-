import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import { useState, useEffect } from 'react';
import axios from 'axios';

function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get('http://localhost:5000/');
        setServerStatus('online');
      } catch (e) {
        setServerStatus('offline');
      }
    };
    checkServer();
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="split-layout fade-in">
      <div className="split-content">
        <div style={{ maxWidth: '520px', width: '100%' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0.4rem 1rem', borderRadius: '999px', marginBottom: '1.5rem',
            background: 'var(--color-primary-glow)', border: '1px solid rgba(252, 163, 17, 0.2)',
            fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></span>
            {i18n.language === 'ar' ? 'تقييم ذكي بالذكاء الاصطناعي' : 'AI-Powered Assessment'}
          </div>

          <h1 style={{ fontSize: '3rem', lineHeight: '1.15', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            {t('landing.title')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontSize: '1.15rem', lineHeight: '1.7' }}>
            {t('landing.subtitle')}
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <button className="btn btn-primary" onClick={() => navigate('/profile')} style={{ padding: '1rem', fontSize: '1.1rem' }}>
              {t('landing.start_application')}
            </button>
            <button className="btn btn-outline" onClick={toggleLanguage} style={{ padding: '1rem', fontSize: '1.1rem' }}>
              {t('landing.switch_lang')}
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>10</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{i18n.language === 'ar' ? 'أسئلة مقابلة' : 'Interview Q\'s'}</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>DISC</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{i18n.language === 'ar' ? 'تحليل الشخصية' : 'Personality'}</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>AI</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{i18n.language === 'ar' ? 'تقييم فوري' : 'Instant Score'}</div>
            </div>
          </div>

          {/* Admin link */}
          <div style={{ marginTop: '2rem' }}>
            <button onClick={() => navigate('/admin/login')} style={{
              background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.8rem',
              cursor: 'pointer', textDecoration: 'underline', padding: 0,
            }}>
              {i18n.language === 'ar' ? 'دخول لوحة التحكم' : 'Admin Dashboard →'}
            </button>
          </div>
        </div>
      </div>
      <div className="split-image" style={{ backgroundImage: "url('/hero-bg.png')" }}></div>
      
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

export default LandingPage;
