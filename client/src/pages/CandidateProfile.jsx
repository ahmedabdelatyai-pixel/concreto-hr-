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
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    const fetchJobs = async () => {
      const jobId = searchParams.get('jobId');
      console.log('Fetching jobs for jobId:', jobId);
      try {
        setLoading(true);
        setError('');

        if (jobId) {
          console.log('Fetching specific job:', jobId);
          const response = await axios.get(`${API_URL}/public/jobs/${jobId}`);
          const job = response.data.job;
          console.log('Job fetched:', job);
          if (job) {
            setJobs([job]);
            setFormData(prev => ({ ...prev, role: job._id }));
          } else {
            setError(i18n.language === 'ar' ? 'الوظيفة غير متاحة حالياً' : 'Job is not available');
          }
        } else {
          console.log('Fetching all jobs');
          const response = await axios.get(`${API_URL}/public/jobs`);
          console.log('All jobs fetched:', response.data);
          setJobs(response.data.jobs || []);
        }
      } catch (err) {
        console.error('Failed to load jobs:', err);
        setError(i18n.language === 'ar' ? 'فشل تحميل الوظائف. حاول مرة أخرى لاحقاً.' : 'Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [API_URL, i18n.language, searchParams]);

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
    console.log('Setting Candidate Info from Job:', { jobTitle, questionCount, customQuestionsCount: customQuestions.length });

    setCandidateInfo({ ...formData, jobTitle, jobId: formData.role, customQuestions, questionCount, jobDescription });
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
          {loading ? (
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              {isArabic ? 'جاري تحميل الوظائف...' : 'Loading jobs...'}
            </p>
          ) : error ? (
            <p className="text-danger" style={{ marginBottom: '1rem' }}>{error}</p>
          ) : (
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
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.9rem' }}>
            {t('profile.next')} →
          </button>
        </form>
      </div>
    </div>
  );
}

export default CandidateProfile;
