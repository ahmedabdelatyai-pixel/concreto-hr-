import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useInterviewStore } from '../store/interviewStore';
import { analyzeCv, generateQuestions } from '../services/aiApi';

function CvUpload() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const setCvData = useInterviewStore(state => state.setCvData);
  const setCvFile = useInterviewStore(state => state.setCvFile);
  const setQuestions = useInterviewStore(state => state.setQuestions);
  const candidate = useInterviewStore(state => state.candidate);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setIsProcessing(true);
    
    try {
      // Save raw file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        setCvFile({
          name: file.name,
          type: file.type,
          data: base64Data
        });

        // 1. Analyze CV (Now uses Gemini to generate a profile)
        const atsResult = await analyzeCv(file);
        setCvData(atsResult);

        // 2. Initialize Applicant Record Early (for integrity logging)
        console.log("Initializing applicant with job ID:", candidate.jobId);
        try {
          const initRes = await api.post('/public/applicants/init', {
            candidate: {
              name: candidate.name,
              email: candidate.email,
              jobTitle: candidate.jobTitle
            },
            jobId: candidate.jobId,
            source: candidate.source || 'Website'
          });
          console.log("Applicant initialized successfully:", initRes.data);
          if (initRes.data.applicantId) {
            useInterviewStore.getState().setCandidateInfo({ 
              applicantId: initRes.data.applicantId,
              accessSecret: initRes.data.accessSecret
            });
          }
        } catch (e) {
          console.error("Failed to init applicant:", e.response?.data || e.message);
        }

        // 3. Generate Tailored Questions based on Job Title AND CV background
        const customBank = useInterviewStore.getState().candidate.customQuestions || [];
        const targetCount = useInterviewStore.getState().candidate.questionCount || 10;
        
        let dynamicQuestions = [];
        try {
          dynamicQuestions = await generateQuestions(candidate.jobTitle, atsResult, i18n.language, customBank, targetCount);
        } catch (e) {
          console.error("AI Generation failed, using bank/fallback");
        }

        if (dynamicQuestions && dynamicQuestions.length > 0) {
          setQuestions(dynamicQuestions);
        } else {
          // Fallback to custom bank if AI fails, or generic if bank is empty
          const fallback = customBank.length > 0 ? customBank : (
            isArabic 
              ? ["أخبرنا عن نفسك وخبراتك.", "لماذا تريد العمل في شركتنا؟", "ما هي أقوى مهاراتك التقنية؟"]
              : ["Tell us about yourself and your experience.", "Why do you want to work with us?", "What are your strongest technical skills?"]
          );
          setQuestions(fallback);
        }
        
        setIsProcessing(false);
        navigate('/interview');
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error("Upload/Generation error:", error);
      setIsProcessing(false);
    }
  };

  const isArabic = i18n.language === 'ar';

  return (
    <div className="container fade-in" style={{ marginTop: '5vh' }}>
      {/* Step Indicator */}
      <div className="step-indicator">
        <div className="step-dot done"></div>
        <div className="step-line done"></div>
        <div className="step-dot active"></div>
        <div className="step-line"></div>
        <div className="step-dot"></div>
        <div className="step-line"></div>
        <div className="step-dot"></div>
      </div>

      <div className="card text-center card-glow">
        <h2 style={{ marginBottom: '0.5rem' }}>{t('cv.title')}</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          {isArabic ? 'ارفع سيرتك الذاتية لكي يقوم الذكاء الاصطناعي بتحليلها' : 'Upload your CV for AI analysis'}
        </p>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".pdf,.doc,.docx" 
          style={{ display: 'none' }} 
        />

        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--border-radius)',
            padding: '3rem 2rem',
            marginBottom: '2rem',
            backgroundColor: 'var(--color-bg)',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            borderColor: file ? 'var(--color-primary)' : 'var(--color-border)',
          }}
        >
          {isProcessing ? (
            <div>
              <div className="animate-pulse" style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '1rem' }}>
                {isArabic ? 'جاري تحليل البيانات وتوليد الأسئلة...' : 'Analyzing data and generating questions...'}
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: '100%', animation: 'shimmer 2s infinite linear' }}></div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{file ? '📄' : '📤'}</div>
              <p style={{ fontWeight: '600', color: file ? 'var(--color-primary)' : 'inherit' }}>
                {file ? file.name : (isArabic ? 'اضغط هنا لرفع الملف' : 'Click here to upload your file')}
              </p>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                PDF, DOCX (Max 5MB)
              </p>
            </div>
          )}
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={handleUpload} 
          disabled={isProcessing || !file}
          style={{ width: '100%', padding: '0.9rem' }}
        >
          {t('cv.next')} →
        </button>
      </div>
    </div>
  );
}

export default CvUpload;
