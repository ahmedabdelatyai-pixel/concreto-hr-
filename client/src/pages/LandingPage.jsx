import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useInterviewStore } from '../store/interviewStore';

function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setCandidateInfo = useInterviewStore(state => state.setCandidateInfo);
  const [serverStatus, setServerStatus] = useState('checking');
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  // Subscription Request Modal State
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [subForm, setSubForm] = useState({ clientName: '', companyName: '', email: '', phone: '' });
  const [subLoading, setSubLoading] = useState(false);
  const [subSuccess, setSubSuccess] = useState('');
  const [subError, setSubError] = useState('');

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    setSubLoading(true);
    setSubError('');
    try {
      await axios.post(`${API_URL}/public/subscription-request`, {
        ...subForm,
        planRequested: selectedPlanName
      });
      setSubSuccess(isArabic ? 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.' : 'Request submitted successfully! We will contact you soon.');
      setTimeout(() => {
        setShowSubModal(false);
        setSubSuccess('');
        setSubForm({ clientName: '', companyName: '', email: '', phone: '' });
      }, 3000);
    } catch (err) {
      setSubError(err.response?.data?.message || err.message);
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    // Capture UTM / Source Tracking from tracking links
    const utm_source = searchParams.get('utm_source') || searchParams.get('src');
    const utm_medium = searchParams.get('utm_medium') || '';
    if (utm_source) {
      setCandidateInfo({ source: utm_source, utm_source, utm_medium });
    }
  }, [searchParams, setCandidateInfo]);

  const [dbPlans, setDbPlans] = useState([]);

  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get(`${API_URL}/public/jobs`, { timeout: 5000 });
        setServerStatus('online');
      } catch (err) {
        setServerStatus('offline');
      }
    };
    checkServer();

    const fetchPlans = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/plans`);
        if (res.data && res.data.length > 0) {
          setDbPlans(res.data);
        }
      } catch (err) {
        console.error('Failed to load pricing plans:', err);
      }
    };
    fetchPlans();
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
        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#6366f1', letterSpacing: '-1px' }}>
          TalentFlow<span style={{ color: '#fff' }}>AI</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/admin/login')} 
            className="btn btn-outline" 
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#6366f1' }}
          >
            {isArabic ? 'لوحة الإدارة' : 'Admin'}
          </button>
          <button 
            className="btn btn-outline" 
            onClick={() => i18n.changeLanguage(isArabic ? 'en' : 'ar')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {isArabic ? 'English' : 'العربية'}
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
            {isArabic ? 'وظّف أفضل الكوادر بذكاء اصطناعي متقدم' : 'Hire Top Talent with AI-Powered Interviews'}
          </h1>
          <p style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.6)', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
            {isArabic 
              ? 'منصة ذكية شاملة لجميع القطاعات، تقوم بإجراء مقابلات واقعية وتحليل الشخصية والمهارات بدقة متناهية.'
              : 'A comprehensive AI platform for all industries, performing realistic technical interviews and deep candidate analysis with unmatched precision.'}
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
      <section id="features" style={{ padding: '8rem 10%', background: '#080e1a' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
            {isArabic ? 'لماذا تختار TalentFlow؟' : 'Why Choose TalentFlow AI?'}
          </h2>
          <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-primary)', margin: '0 auto' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5rem' }}>
          {[
            { 
              title: isArabic ? 'ذكاء اصطناعي متعدد التخصصات' : 'Multi-Industry AI', 
              desc: isArabic ? 'يتكيف مع جميع القطاعات: الهندسة، الموارد البشرية، التقنية، المبيعات، وغيرها.' : 'Adapts to all sectors: engineering, HR, tech, sales, healthcare, and more.',
              icon: '🌐'
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

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '8rem 10%', background: '#080e1a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
            {isArabic ? 'باقات السعة الذكية' : 'Intelligence Capacity Plans'}
          </h2>
          <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-primary)', margin: '0 auto' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {(dbPlans.length > 0 ? dbPlans : [
            {
              name: 'starter',
              displayName: 'Core Intelligence',
              price: 0,
              jobLimit: 5,
              cvLimit: 50
            },
            {
              name: 'professional',
              displayName: 'Pro Cognitive',
              price: 49,
              jobLimit: 15,
              cvLimit: 300
            },
            {
              name: 'enterprise',
              displayName: 'Enterprise Neural',
              price: 199,
              jobLimit: 9999,
              cvLimit: 9999
            }
          ]).map((plan, i) => {
            const isPro = plan.name === 'professional';
            const color = plan.name === 'starter' ? '#10b981' : (plan.name === 'professional' ? '#3b82f6' : '#8b5cf6');
            const descAr = plan.name === 'starter' ? 'سعة معالجة ذكية للشركات الناشئة التي تبحث عن الدقة.' : (plan.name === 'professional' ? 'قوة تحليلية متقدمة لفرق التوظيف الطموحة.' : 'حلول شاملة وقدرات معالجة فائقة للمؤسسات الكبرى.');
            const descEn = plan.name === 'starter' ? 'Smart processing capacity for startups seeking precision.' : (plan.name === 'professional' ? 'Advanced analytical power for ambitious recruitment teams.' : 'Comprehensive solutions and superior processing for large enterprises.');
            const extraFeatsAr = plan.name === 'starter' ? ['تقييم الذكاء الاصطناعي', 'لوحة تحكم أساسية'] : (plan.name === 'professional' ? ['تحليل الشخصية DISC', 'تقارير PDF احترافية', 'دعم فني سريع'] : ['تخصيص كامل للنظام', 'مكافحة الغش المتقدمة', 'مدير حساب مخصص']);
            const extraFeatsEn = plan.name === 'starter' ? ['AI Evaluation', 'Basic Dashboard'] : (plan.name === 'professional' ? ['DISC Personality Profiling', 'Professional PDF Reports', 'Priority Support'] : ['Full System Customization', 'Advanced Anti-Cheat', 'Dedicated Account Manager']);
            
            return (
              <div key={plan._id || i} style={{
                background: isPro ? 'linear-gradient(180deg, rgba(59,130,246,0.1) 0%, rgba(5,10,20,1) 100%)' : '#050a14',
                border: `1px solid ${isPro ? color : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '16px', padding: '3rem 2rem', position: 'relative',
                display: 'flex', flexDirection: 'column', transition: 'transform 0.3s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-10px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {isPro && (
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)',
                    background: color, color: '#fff', padding: '0.4rem 1.5rem', borderRadius: '20px',
                    fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase'
                  }}>
                    {isArabic ? 'الأكثر اختياراً' : 'Most Popular'}
                  </div>
                )}
                <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem', color: color, textAlign: 'center' }}>
                  {isArabic ? (plan.name === 'starter' ? 'الذكاء الأساسي' : (plan.name === 'professional' ? 'الإدراك الاحترافي' : 'العصب المؤسسي')) : plan.displayName}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textAlign: 'center', minHeight: '50px', marginBottom: '2rem' }}>
                  {isArabic ? descAr : descEn}
                </p>
                <div style={{ fontSize: '3.5rem', fontWeight: '900', textAlign: 'center', marginBottom: '2rem' }}>
                  ${plan.price}<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>/{isArabic ? 'شهر' : 'mo'}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 3rem 0', flex: 1 }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', fontSize: '1rem' }}>
                    <span style={{ color: color }}>✓</span> {plan.jobLimit >= 9999 ? (isArabic ? 'وظائف غير محدودة' : 'Unlimited Jobs') : `${plan.jobLimit} ${isArabic ? 'وظائف نشطة' : 'Active Jobs'}`}
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', fontSize: '1rem' }}>
                    <span style={{ color: color }}>✓</span> {plan.cvLimit >= 9999 ? (isArabic ? 'سير ذاتية غير محدودة' : 'Unlimited CVs') : `${plan.cvLimit} ${isArabic ? 'سيرة ذاتية / شهر' : 'CVs / month'}`}
                  </li>
                  {(isArabic ? extraFeatsAr : extraFeatsEn).map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', fontSize: '1rem' }}>
                      <span style={{ color: color }}>✓</span> {feat}
                    </li>
                  ))}
                </ul>
                <button 
                  className="btn" 
                  onClick={() => {
                    setSelectedPlanName(isArabic ? (plan.name === 'starter' ? 'الذكاء الأساسي' : (plan.name === 'professional' ? 'الإدراك الاحترافي' : 'العصب المؤسسي')) : plan.displayName);
                    setShowSubModal(true);
                  }}
                  style={{
                    background: isPro ? color : 'transparent',
                    border: `2px solid ${color}`,
                    color: isPro ? '#fff' : color,
                    padding: '1rem', width: '100%', fontSize: '1.1rem', fontWeight: '700', borderRadius: '8px'
                  }}
                >
                  {isArabic ? 'ابدأ الآن' : 'Get Started'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: '6rem 10%', textAlign: 'center', background: 'linear-gradient(180deg, #080e1a 0%, #050a14 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: '800' }}>
          {isArabic ? 'مستعد لتوظيف أفضل المواهب؟' : 'Ready to hire the best talent?'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '3rem', fontSize: '1.1rem' }}>
          {isArabic ? 'انضم للشركات التي تعتمد على الذكاء الاصطناعي في التوظيف' : 'Join companies relying on AI for recruitment'}
        </p>
        <button className="btn btn-primary" onClick={() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
          {isArabic ? 'تصفح الباقات الذكية' : 'View Intelligence Plans'}
        </button>
      </section>
      
      {/* Subscription Modal */}
      {showSubModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card fade-in" style={{ 
            maxWidth: '500px', width: '100%', padding: '1.5rem', position: 'relative', 
            border: '1px solid rgba(59,130,246,0.3)', maxHeight: '90vh', overflowY: 'auto' 
          }}>
            <button 
              onClick={() => setShowSubModal(false)}
              style={{ position: 'absolute', top: '15px', right: isArabic ? 'auto' : '15px', left: isArabic ? '15px' : 'auto', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.4rem', color: '#3b82f6' }}>
              {isArabic ? 'طلب اشتراك' : 'Subscription Request'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {isArabic ? `لقد اخترت باقة: ` : `You selected: `}
              <strong style={{ color: '#fff' }}>{selectedPlanName}</strong>
            </p>

            {subSuccess ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#10b981', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <h3>{subSuccess}</h3>
              </div>
            ) : (
              <form onSubmit={handleSubSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {subError && <div style={{ color: '#ef4444', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>{subError}</div>}
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>{isArabic ? 'اسمك بالكامل' : 'Your Name'}</label>
                  <input type="text" required className="form-control" style={{ padding: '0.7rem' }} value={subForm.clientName} onChange={e => setSubForm({...subForm, clientName: e.target.value})} placeholder={isArabic ? 'أحمد محمد' : 'John Doe'} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>{isArabic ? 'اسم الشركة' : 'Company Name'}</label>
                  <input type="text" required className="form-control" style={{ padding: '0.7rem' }} value={subForm.companyName} onChange={e => setSubForm({...subForm, companyName: e.target.value})} placeholder={isArabic ? 'شركة التقنية الحديثة' : 'Acme Corp'} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>{isArabic ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <input type="email" required className="form-control" style={{ padding: '0.7rem' }} value={subForm.email} onChange={e => setSubForm({...subForm, email: e.target.value})} placeholder="email@company.com" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>{isArabic ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}</label>
                  <input type="tel" required className="form-control" style={{ padding: '0.7rem' }} value={subForm.phone} onChange={e => setSubForm({...subForm, phone: e.target.value})} placeholder="+966 50 000 0000" />
                </div>
                
                <button type="submit" disabled={subLoading} className="btn btn-primary" style={{ padding: '0.8rem', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 'bold' }}>
                  {subLoading ? (isArabic ? 'جاري الإرسال...' : 'Sending...') : (isArabic ? 'إرسال الطلب' : 'Submit Request')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* Server Status Indicator */}
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', padding: '8px 15px',
        backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
        display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000,
        border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          backgroundColor: serverStatus === 'online' ? '#10b981' : (serverStatus === 'offline' ? '#ef4444' : '#fca311'),
          boxShadow: serverStatus === 'online' ? '0 0 10px #10b981' : 'none',
          animation: serverStatus === 'online' ? 'pulse 2s infinite' : 'none'
        }}></div>
        <style>
          {`
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
              70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
              100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
          `}
        </style>
        <span style={{ color: '#fff', letterSpacing: '0.5px' }}>
          {serverStatus === 'online' ? (isArabic ? 'الشبكة العصبية: نشطة' : 'Neural Network: Active') : (isArabic ? 'الشبكة العصبية: غير متصلة' : 'Neural Network: Offline')}
        </span>
      </div>
    </div>
  );
}

export default LandingPage;

