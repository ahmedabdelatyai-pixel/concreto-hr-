import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTranslation } from 'react-i18next';

export default function InstallAppButton() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (!isInstallable || isInstalled) return null;

  return (
    <button 
      onClick={installApp} 
      className="btn btn-primary"
      style={{
        background: 'linear-gradient(135deg, #10b981, #059669)',
        border: 'none',
        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
        fontSize: '0.85rem',
        padding: '0.5rem 1rem',
        borderRadius: '8px'
      }}
    >
      📱 {isAr ? 'تحميل التطبيق' : 'Install App'}
    </button>
  );
}
