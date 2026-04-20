import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../store/interviewStore';
import { useAdminStore } from '../store/adminStore';

function CandidateProfile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setCandidateInfo = useInterviewStore(state => state.setCandidateInfo);
  const resetStore = useInterviewStore(state => state.reset);
  const jobs = useAdminStore(state => state.jobs);
  const fetchJobs = useAdminStore(state => state.fetchJobs);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSubmit = (e) => {
    e.preventDefault();
    resetStore(); // Clear any previous interview data
    
    // Find job title
    const selectedJob = jobs.find(j => j._id === formData.role);
    const isArabic = i18n.language === 'ar';
    const jobTitle = selectedJob ? (isArabic ? selectedJob.title_ar : selectedJob.title_en) : '';
    
    setCandidateInfo({ ...formData, jobTitle, jobId: formData.role });
    navigate('/upload-cv');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isArabic = i18n.language === 'ar';

  return (
    <div className="container fade-in" style={{ marginTop: '5vh' }}>
      {/* Step Indicator */}
      <div className="step-indicator">
        <div className="step-dot active"></div>
        <div className="step-line"></div>
        <div className="step-dot"></div>
        <div className="step-line"></div>
        <div className="step-dot"></div>
        <div className="step-line"></div>
        <div className="step-dot"></div>
      </div>

      <div className="card card-glow">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{t('profile.title')}</h2>
          <p className="text-muted">
            {isArabic ? 'أدخل بياناتك الأساسية للبدء' : 'Enter your basic information to get started'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('profile.name')}</label>
            <input type="text" name="name" className="form-control" required value={formData.name} onChange={handleChange} 
              placeholder={isArabic ? 'ادخل اسمك الكامل' : 'Enter your full name'} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('profile.email')}</label>
            <input type="email" name="email" className="form-control" required value={formData.email} onChange={handleChange}
              placeholder={isArabic ? 'example@email.com' : 'example@email.com'} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('profile.role')}</label>
            <select name="role" className="form-control" required value={formData.role} onChange={handleChange}>
              <option value="">{isArabic ? '-- اختر الوظيفة --' : '-- Select Position --'}</option>
              {jobs.map(job => (
                <option key={job._id} value={job._id}>
                  {isArabic ? job.title_ar : job.title_en}
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.9rem' }}>
            {t('profile.next')} →
          </button>
        </form>
      </div>
    </div>
  );
}

export default CandidateProfile;
