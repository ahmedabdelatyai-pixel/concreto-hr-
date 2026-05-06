import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function CompletionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="split-layout fade-in">
      <div className="split-image" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Decorative success pattern */}
        <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
          <circle cx="150" cy="150" r="140" stroke="rgba(255,255,255,0.1)" strokeWidth="40" />
          <circle cx="150" cy="150" r="100" stroke="rgba(255,255,255,0.15)" strokeWidth="30" />
          <path d="M 100 150 L 140 190 L 200 110" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <div className="split-content">
        <div className="card text-center" style={{ border: 'none', boxShadow: 'none', backgroundColor: 'transparent' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            backgroundColor: 'var(--color-success)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 2rem'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          
          <h1 style={{ color: 'var(--color-success)', fontSize: '2.5rem' }}>{t('completion.title')}</h1>
          <p className="text-muted" style={{ marginBottom: '2.5rem', fontSize: '1.2rem' }}>
            {t('completion.message')}
          </p>
          
          <button className="btn btn-outline" onClick={() => navigate('/evaluation')} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            {t('completion.view_results')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompletionScreen;
