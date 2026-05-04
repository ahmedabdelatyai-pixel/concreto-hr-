import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [serverStatus, setServerStatus] = useState('checking');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get(API_URL.replace('/api', '/'));
        setServerStatus('online');
      } catch (e) {
        setServerStatus('offline');
      }
    };
    checkServer();
  }, [API_URL]);

  const isArabic = i18n.language === 'ar';

  return (
    <div style={{ backgroundColor: '#050a14', color: '#fff', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.5rem 10%', position: 'sticky', top: 0, backgroundColor: 'rgba(5, 10, 20, 0.8)',
        backdropFilter: 'blur(12px)', zIndex: 1000, borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary)', letterSpacing: '-1px' }}>
          Concreto<span style={{ color: '#fff' }}>AI</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <button onClick={() => i18n.changeLanguage(isArabic ? 'en' : 'ar')} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            {isArabic ? 'English' : 'العربية'}
          </button>
          <button onClick={() => navigate('/admin/login')} className="btn btn-outline" style={{ border: 'none', color: 'rgba(255,255,255,0.7)' }}>
            {isArabic ? 'لوحة التحكم' : 'Admin'}
          </button>
          <button onClick={() => navigate('/profile')} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: '600' }}>
            {isArabic ? 'ابدأ الآن' : 'Get Started'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ 
        padding: '8rem 10% 4rem', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(252, 163, 17, 0.08) 0%, transparent 70%)',
          zIndex: 0, pointerEvents: 'none'
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '0.5rem 1.2rem', borderRadius: '999px', marginBottom: '2rem',
            background: 'rgba(252, 163, 17, 0.1)', border: '1px solid rgba(252, 163, 17, 0.2)',
            fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: '600'
          }}>
            ✨ {isArabic ? 'مستقبل التوظيف هنا' : 'The future of hiring is here'}
          </div>
          <h1 style={{ fontSize: '4.5rem', fontWeight: '900', lineHeight: '1.1', marginBottom: '1.5rem', letterSpacing: '-2px', maxWidth: '900px', margin: '0 auto 1.5rem' }}>
            {isArabic ? 'وظّف أفضل الكوادر بذكاء اصطناعي متخصص' : 'Hire Top Talent with Specialized AI Interviews'}
          </h1>
          <p style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.6)', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
            {isArabic 
              ? 'منصة خبيرة في قطاع الخرسانة والإنشاءات، تقوم بإجراء مقابلات واقعية وتحليل الشخصية والمهارات بدقة متناهية.'
              : 'The only AI platform specialized in the concrete and construction industry, performing realistic technical interviews and deep candidate analysis.'}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/profile')} className="btn btn-primary" style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', boxShadow: '0 10px 40px rgba(252, 163, 17, 0.3)' }}>
              {isArabic ? 'قدم الآن كمرشح' : 'Apply as Candidate'}
            </button>
            <button onClick={() => navigate('/admin/login')} className="btn btn-outline" style={{ padding: '1.2rem 3rem', fontSize: '1.2rem' }}>
              {isArabic ? 'عرض لوحة الشركات' : 'For Employers'}
            </button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section style={{ padding: '8rem 10%', background: '#080e1a' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
            {isArabic ? 'لماذا تختار كونكريتو؟' : 'Why Choose Concreto AI?'}
          </h2>
          <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-primary)', margin: '0 auto' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5rem' }}>
          {[
            { 
              title: isArabic ? 'ذكاء اصطناعي تخصصي' : 'Industry Specialized', 
              desc: isArabic ? 'ليس مجرد ذكاء اصطناعي عام، بل خبير في معايير الخرسانة والإنشاءات.' : 'Not just generic AI. It understands slump tests, mix designs, and safety protocols.',
              icon: '🏗️'
            },
            { 
              title: isArabic ? 'تحليل الشخصية DISC' : 'DISC Personality Profiling', 
              desc: isArabic ? 'نحلل نمط سلوك المرشح لضمان ملاءمته لثقافة شركتك.' : 'Analyze behavior patterns to ensure cultural and operational fit.',
              icon: '🧠'
            },
            { 
              title: isArabic ? 'نظام مضاد للغش' : 'Anti-Cheat Protection', 
              desc: isArabic ? 'مراقبة حية للتركيز ومنع محاولات البحث عن إجابات أثناء المقابلة.' : 'Live focus monitoring ensures candidates don\'t search for answers during the session.',
              icon: '🛡️'
            },
            { 
              title: isArabic ? 'تقارير PDF احترافية' : 'Automated PDF Reports', 
              desc: isArabic ? 'احصل على تقرير مفصل لكل مرشح مع درجات فنية وتقييم شامل.' : 'Generate professional evaluation reports instantly with detailed AI insights.',
              icon: '📄'
            },
            { 
              title: isArabic ? 'تحويل الصوت لنص' : 'Voice-to-Text Interview', 
              desc: isArabic ? 'يمكن للمرشحين الإجابة صوتياً، مما يجعل المقابلة أكثر واقعية.' : 'Candidates can speak their answers, making the interview feel like a real 1-on-1.',
              icon: '🎙️'
            },
            { 
              title: isArabic ? 'لوحة تحكم ذكية' : 'Advanced Dashboard', 
              desc: isArabic ? 'إحصائيات كاملة وفلاتر بحث متقدمة لإدارة مئات المتقدمين بسهولة.' : 'Full analytics and search filters to manage hundreds of applicants with ease.',
              icon: '📊'
            }
          ].map((feat, i) => (
            <div key={i} className="card" style={{ 
              padding: '2.5rem', border: '1px solid rgba(255,255,255,0.05)', 
              backgroundColor: '#0a1120', transition: 'transform 0.3s ease',
              display: 'flex', flexDirection: 'column', alignItems: isArabic ? 'flex-end' : 'flex-start'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>{feat.icon}</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1rem' }}>{feat.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', fontSize: '1rem', textAlign: isArabic ? 'right' : 'left' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '6rem 10%', display: 'flex', justifyContent: 'space-around', backgroundColor: '#050a14', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { label: isArabic ? 'توفير في الوقت' : 'Time Saved', val: '70%' },
          { label: isArabic ? 'دقة التقييم' : 'Accuracy', val: '95%' },
          { label: isArabic ? 'متقدم تم تقييمه' : 'Applicants Evaluated', val: '+2.5k' },
          { label: isArabic ? 'شركة تستخدمنا' : 'Companies Trust Us', val: '50+' }
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--color-primary)' }}>{s.val}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* CTA Footer */}
      <footer style={{ 
        padding: '6rem 10%', textAlign: 'center', background: 'linear-gradient(180deg, #080e1a 0%, #050a14 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '2rem' }}>
          {isArabic ? 'هل أنت جاهز للتحول الرقمي؟' : 'Ready to Transform Your Hiring?'}
        </h2>
        <button onClick={() => navigate('/profile')} className="btn btn-primary" style={{ padding: '1.5rem 4rem', fontSize: '1.3rem', fontWeight: '700' }}>
          {isArabic ? 'ابدأ تجربة المقابلة الآن' : 'Start AI Interview Now'}
        </button>
        <div style={{ marginTop: '4rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
          © 2026 Concreto Ready Mix. All rights reserved. Powered by AI.
        </div>
      </footer>
      
      {/* Server Status Indicator */}
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', padding: '8px 12px',
        backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '20px', fontSize: '0.7rem',
        display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000,
        border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: serverStatus === 'online' ? '#10b981' : (serverStatus === 'offline' ? '#ef4444' : '#fca311')
        }}></div>
        <span style={{ color: '#fff' }}>SYSTEM: {serverStatus.toUpperCase()}</span>
      </div>
    </div>
  );
}

export default LandingPage;

