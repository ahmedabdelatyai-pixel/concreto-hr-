import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useInterviewStore } from '../store/interviewStore';

function CandidateProfile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setCandidateInfo = useInterviewStore(state => state.setCandidateInfo);
  const resetStore = useInterviewStore(state => state.reset);
  
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Is this a direct application (Demo Mode) or a real client link?
  const isDirectApply = !searchParams.get('jobId');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError('');

        if (isDirectApply) {
          // ─── DEMO MODE ──────────────────────────────────────────────────────────
          // Create Mock Jobs for Demo
          const mockJobs = [
            {
              _id: 'demo1',
              title_en: 'Software Engineer (Demo)',
              title_ar: 'مهندس برمجيات (تجريبي)',
              description: 'This is a demo job description to test the AI interviewer capabilities for a Software Engineering role. We are looking for someone with React and Node.js experience.',
              questionCount: 3,
              company: { name: 'TalentFlow Demo', logo: '' },
              customQuestions: []
            },
            {
              _id: 'demo2',
              title_en: 'Sales Representative (Demo)',
              title_ar: 'مندوب مبيعات (تجريبي)',
              description: 'We are looking for an energetic sales representative with excellent communication skills to drive revenue.',
              questionCount: 3,
              company: { name: 'TalentFlow Demo', logo: '' },
              customQuestions: []
            }
          ];
          setJobs(mockJobs);
          // Set store as Demo Mode so it doesn't save to DB at the end
          useInterviewStore.setState({ isDemoMode: true });
        } else {
          // ─── REAL MODE ──────────────────────────────────────────────────────────
          useInterviewStore.setState({ isDemoMode: false });
          const jobId = searchParams.get('jobId');
          
          // Fetch all jobs so candidate can see options
          const response = await axios.get(`${API_URL}/public/jobs`);
          const allJobs = response.data.jobs || [];
          
          if (allJobs.length > 0) {
            setJobs(allJobs);
            // Pre-select the job from the link
            const matchedJob = allJobs.find(j => j._id === jobId);
            if (matchedJob) {
              setFormData(prev => ({ ...prev, role: matchedJob._id }));
            }
          } else {
            setError(i18n.language === 'ar' ? 'لا توجد وظائف متاحة حالياً.' : 'No open positions available.');
          }
        }
      } catch (err) {
        console.error('Failed to load jobs:', err);
        setError(i18n.language === 'ar' ? 'فشل تحميل الوظائف. حاول مرة أخرى لاحقاً.' : 'Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [API_URL, i18n.language, isDirectApply, searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    resetStore(); // Clear any previous interview data

    const selectedJob = jobs.find(j => j._id === formData.role);
    if (!selectedJob) {
      setError(i18n.language === 'ar' ? 'الرجاء اختيار الوظيفة قبل المتابعة.' : 'Please select a job before continuing.');
      return;
    }

    const isArabic = i18n.language === 'ar';
    const jobTitle = isArabic ? selectedJob.title_ar : selectedJob.title_en;
    const customQuestions = selectedJob?.customQuestions || [];
    const questionCount = Number(selectedJob?.questionCount || 10);

    const jobDescription = selectedJob?.description || selectedJob?.description_en || '';
    
    // Save to store (using actual or mock jobId)
    setCandidateInfo({ 
      ...formData, 
      jobTitle, 
      jobId: selectedJob._id, 
      customQuestions, 
      questionCount, 
      jobDescription,
      utm_source: searchParams.get('utm_source') || '',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || ''
    });
    
    // Also save Demo Flag again just to be safe
    useInterviewStore.setState({ isDemoMode: isDirectApply });
    
    navigate('/upload-cv');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isArabic = i18n.language === 'ar';
  
  // Get the selected job for branding
  const selectedJobObj = jobs.find(j => j._id === formData.role);
  const companyName = selectedJobObj?.company?.name || (isDirectApply ? 'TalentFlow Demo' : '');
  const companyLogo = selectedJobObj?.company?.logo || null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#050a14',
      color: '#fff',
      direction: isArabic ? 'rtl' : 'ltr',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Header with Language Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '1rem 5%',
        position: 'absolute',
        top: 0,
        width: '100%',
        zIndex: 10
      }}>
        <button
          onClick={() => i18n.changeLanguage(isArabic ? 'en' : 'ar')}
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontWeight: '600',
            backdropFilter: 'blur(10px)'
          }}
        >
          {isArabic ? 'English' : 'العربية'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      
      {/* Decorative Orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: '300px', height: '300px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ 
        width: '100%', maxWidth: '550px', 
        background: 'rgba(255, 255, 255, 0.03)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '3rem 2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        zIndex: 10
      }}>
        
        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} style={{ height: '70px', objectFit: 'contain', marginBottom: '1.5rem', borderRadius: '12px' }} />
          ) : (
            <div style={{ 
              width: '70px', height: '70px', margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
              borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 'bold', color: '#fff',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)'
            }}>
              {companyName ? companyName.charAt(0).toUpperCase() : 'T'}
            </div>
          )}
          
          <h1 style={{ 
            fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem',
            background: 'linear-gradient(to right, #fff, #a5b4fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            {isDirectApply ? (isArabic ? 'جرب تجربة TalentFlow' : 'Experience TalentFlow') : (isArabic ? 'بوابة التوظيف' : 'Career Portal')}
          </h1>
          
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', margin: 0 }}>
            {companyName ? (isArabic ? `الانضمام إلى ${companyName}` : `Apply to ${companyName}`) : (isArabic ? 'أدخل بياناتك للبدء' : 'Enter your details to begin')}
          </p>
        </div>

        {/* Step Indicator inside card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
          {['Profile', 'CV', 'Interview', 'Result'].map((step, idx) => (
            <div key={idx} style={{ 
              width: idx === 0 ? '30px' : '20px', height: idx === 0 ? '30px' : '20px', 
              borderRadius: '50%', background: idx === 0 ? '#6366f1' : 'rgba(255,255,255,0.1)',
              border: idx === 0 ? 'none' : '2px solid rgba(255,255,255,0.2)',
              position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: idx === 0 ? '0 0 15px rgba(99, 102, 241, 0.6)' : 'none',
              transition: 'all 0.3s'
            }}>
              {idx === 0 && <span style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%' }}></span>}
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
              {t('profile.name')}
            </label>
            <input 
              type="text" name="name" required value={formData.name} onChange={handleChange} 
              placeholder={isArabic ? 'ادخل اسمك الكامل' : 'John Doe'}
              style={{
                width: '100%', padding: '1rem 1.2rem', borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
              {t('profile.email')}
            </label>
            <input 
              type="email" name="email" required value={formData.email} onChange={handleChange}
              placeholder={isArabic ? 'example@email.com' : 'john@example.com'} 
              style={{
                width: '100%', padding: '1rem 1.2rem', borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.6)', padding: '0.5rem 0' }}>
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              {isArabic ? 'جاري تحميل الوظائف...' : 'Loading positions...'}
            </div>
          ) : error ? (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem' }}>
              {error}
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
                {t('profile.role')}
              </label>
              <div style={{ position: 'relative' }}>
                <select 
                  name="role" required value={formData.role} onChange={handleChange}
                  style={{
                    width: '100%', padding: '1rem 1.2rem', borderRadius: '12px',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '1rem', outline: 'none', appearance: 'none', cursor: 'pointer',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)', transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                  <option value="" disabled style={{ color: '#000' }}>{isArabic ? '-- اختر الوظيفة المتقدم إليها --' : '-- Select the position you are applying for --'}</option>
                  {jobs.map(job => (
                    <option key={job._id} value={job._id} style={{ color: '#000', padding: '10px' }}>
                      {isArabic ? job.title_ar : job.title_en}
                    </option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }}>
                  ▼
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !formData.role}
            style={{ 
              width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: '12px',
              background: (loading || !formData.role) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(to right, #6366f1, #8b5cf6)',
              color: (loading || !formData.role) ? 'rgba(255,255,255,0.4)' : '#fff',
              border: 'none', fontSize: '1.1rem', fontWeight: '600', cursor: (loading || !formData.role) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s', boxShadow: (loading || !formData.role) ? 'none' : '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
            }}
          >
            {t('profile.next')} &rarr;
          </button>
          
          {isDirectApply && (
            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#fca311' }}>
              {isArabic ? '💡 أنت الآن في وضع التجربة الحي. جرب مهارات المحاور الذكي!' : '💡 You are in Live Demo Mode. Test the AI Interviewer!'}
            </div>
          )}
        </form>
      </div>
      
      {/* Required for the spinner animation */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default CandidateProfile;
