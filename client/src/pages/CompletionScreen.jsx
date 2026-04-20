import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function CompletionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="split-layout fade-in">
      <div className="split-image" style={{ backgroundImage: "url('/pump-img.png')" }}>
        {/* Pump image on the left/right depending on RTL */}
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
