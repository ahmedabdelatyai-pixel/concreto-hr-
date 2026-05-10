import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Footer() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const currentYear = new Date().getFullYear();
  const [footerLinks, setFooterLinks] = useState({
    email: '', website: '', linkedin: '', facebook: '', x: ''
  });

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const res = await axios.get(`${API_URL}/public/footer-links`);
        if (res.data) setFooterLinks(res.data);
      } catch (err) {
        console.error('Failed to fetch footer links:', err);
      }
    };
    fetchLinks();
  }, []);

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      padding: '3rem 2rem',
      marginTop: '4rem',
      borderTop: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Main Footer Content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* Column 1: About */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              TalentFlow
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              {isAr 
                ? 'منصة توظيف ذكية تستخدم الذكاء الاصطناعي لتقييم المرشحين وإجراء المقابلات بكفاءة واحترافية.'
                : 'An intelligent recruitment platform powered by AI to evaluate candidates and conduct interviews efficiently and professionally.'}
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              {isAr ? 'المنتج' : 'Product'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                { label: isAr ? 'محرك الذكاء الاصطناعي' : 'AI Engine', action: () => { if(window.location.pathname === '/') { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); } else { navigate('/#features'); } } },
                { label: isAr ? 'مختبر النزاهة' : 'Integrity Lab', action: () => { if(window.location.pathname === '/') { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); } else { navigate('/#features'); } } },
                { label: isAr ? 'تحليلات السلوك' : 'Behavioral Analytics', action: () => { if(window.location.pathname === '/') { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); } else { navigate('/#features'); } } }
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>
                  <button
                    onClick={item.action}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'color 0.3s',
                      textAlign: isAr ? 'right' : 'left',
                      padding: 0
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,1)'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              {isAr ? 'الشركة' : 'Company'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                { label: isAr ? 'الرؤية' : 'Vision', action: () => navigate('/') },
                { label: isAr ? 'مركز المساعدة' : 'Support Hub', action: () => navigate('/help') }
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>
                  <button
                    onClick={item.action}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'color 0.3s',
                      textAlign: isAr ? 'right' : 'left',
                      padding: 0
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,1)'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              {isAr ? 'القانوني' : 'Legal'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                { label: isAr ? 'درع الخصوصية' : 'Privacy Shield', to: '/privacy' },
                { label: isAr ? 'حوكمة البيانات' : 'Data Governance', to: '/terms' }
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => navigate(item.to)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'color 0.3s',
                      textAlign: isAr ? 'right' : 'left',
                      padding: 0
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,1)'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', marginTop: '2rem' }}>
          {/* Bottom Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
              © {currentYear} TalentFlow. {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}
            </p>

            {/* Social Links */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {footerLinks.email && (
                <a href={`mailto:${footerLinks.email}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  📧 {footerLinks.email}
                </a>
              )}
              {footerLinks.website && (
                <a href={footerLinks.website} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  🌍 {isAr ? 'الموقع' : 'Website'}
                </a>
              )}
              {[
                { label: 'X (Twitter)', icon: '𝕏', link: footerLinks.x },
                { label: 'LinkedIn', icon: 'in', link: footerLinks.linkedin },
                { label: 'Facebook', icon: 'f', link: footerLinks.facebook }
              ].filter(s => s.link).map((social, i) => (
                <a
                  key={i}
                  href={social.link}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    width: '35px',
                    height: '35px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    fontSize: '0.9rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.color = 'rgba(255,255,255,1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                  title={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Language */}
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
              {isAr ? 'العربية' : 'English'} • {isAr ? '2026 مايو' : 'May 2026'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
