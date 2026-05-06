import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function NotFound() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>😕</div>
        
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: 'var(--color-primary)'
        }}>
          404
        </h1>
        
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
          {isAr ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h2>
        
        <p style={{ 
          color: 'var(--color-text-muted)', 
          fontSize: '1.1rem',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          {isAr 
            ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. يرجى العودة للصفحة الرئيسية.'
            : 'Sorry, the page you\'re looking for doesn\'t exist or has been moved. Please go back to the homepage.'}
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexDirection: isAr ? 'row-reverse' : 'row' }}>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ flex: 1, padding: '0.7rem' }}
          >
            {isAr ? '🏠 الرئيسية' : '🏠 Home'}
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => navigate(-1)}
            style={{ flex: 1, padding: '0.7rem' }}
          >
            {isAr ? '← رجوع' : '← Back'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
