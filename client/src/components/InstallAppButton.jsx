import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTranslation } from 'react-i18next';

export default function InstallAppButton() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // We will always show the button for testing purposes.
  // If not installable, we can show an alert instead.
  // if (!isInstallable || isInstalled) return null;

  return (
    <button 
      onClick={() => {
        if (isInstallable) installApp();
        else alert(isAr ? 'التطبيق مثبت بالفعل أو متصفحك لا يدعم هذه الميزة حالياً.' : 'App is already installed or your browser does not support this feature.');
      }} 
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
