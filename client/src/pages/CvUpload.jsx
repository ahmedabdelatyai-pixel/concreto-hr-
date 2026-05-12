import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useInterviewStore } from '../store/interviewStore';
import { analyzeCv, generateQuestions } from '../services/aiApi';

function CvUpload() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const setCvData = useInterviewStore(state => state.setCvData);
  const setCvFile = useInterviewStore(state => state.setCvFile);
  const setQuestions = useInterviewStore(state => state.setQuestions);
  const setCorrectAnswers = useInterviewStore(state => state.setCorrectAnswers);
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
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result;
          setCvFile({ name: file.name, type: file.type, data: base64Data });

          const isDemoMode = useInterviewStore.getState().isDemoMode;

          // Step 1: Analyze CV
          setProcessingStep(isArabic ? 'جاري تحليل السيرة الذاتية...' : 'Analyzing CV...');
          let atsResult = null;
          if (isDemoMode) {
            // Mock ATS Result to completely save API usage
            atsResult = {
              summary: isArabic ? "مرشح تجريبي يتمتع بمهارات ممتازة في تطوير البرمجيات." : "Demo candidate with excellent software engineering skills.",
              skills: ["React", "JavaScript", "Node.js", "Teamwork"],
              experience_years: 4,
              education: "B.Sc. in Computer Science",
              technical_match: 85,
              is_fit_for_interview: true
            };
            // Simulate short loading
            await new Promise(r => setTimeout(r, 600));
          } else {
            try {
              atsResult = await analyzeCv(file);
            } catch (cvErr) {
              console.warn('CV Analysis skipped due to error:', cvErr.message);
            }
          }

          setCvData(atsResult || {
            summary: "CV Analysis unavailable.",
            skills: [],
            experience_years: 0,
            education: "",
            technical_match: 50,
            is_fit_for_interview: true
          });

          // Step 2: Init applicant (with UTM source)
          setProcessingStep(isArabic ? 'جاري تسجيل طلبك...' : 'Registering your application...');
          
          // Read UTM params from URL or Store (Store is more reliable during navigation)
          const utm_source = candidate.utm_source || searchParams.get('utm_source') || 'direct';
          const utm_medium = candidate.utm_medium || searchParams.get('utm_medium') || '';
          const utm_campaign = candidate.utm_campaign || searchParams.get('utm_campaign') || '';

          if (isDemoMode) {
            useInterviewStore.getState().setCandidateInfo({
              applicantId: 'demo-' + Date.now(),
              accessSecret: 'demo-secret'
            });
          } else {
            try {
              const initRes = await api.post('/public/applicants/init', {
                candidate: {
                  name: candidate.name,
                  email: candidate.email,
                  jobTitle: candidate.jobTitle
                },
                jobId: candidate.jobId,
                source: utm_source,
                utm_source,
                utm_medium,
                utm_campaign,
              });
              if (initRes.data.applicantId) {
                useInterviewStore.getState().setCandidateInfo({
                  applicantId: initRes.data.applicantId,
                  accessSecret: initRes.data.accessSecret
                });
              }
            } catch (e) {
              console.error('Failed to init applicant:', e.response?.data || e.message);
            }
          }

          // Step 3: Generate structured questions (MCQ + T/F + Essay)
          setProcessingStep(isArabic ? 'جاري توليد الأسئلة المخصصة...' : 'Generating personalized questions...');
          const customBank = useInterviewStore.getState().candidate.customQuestions || [];
          const targetCount = Number(useInterviewStore.getState().candidate.questionCount || 10);
          const jobDescription = useInterviewStore.getState().candidate.jobDescription || '';

          let finalQuestions = [];
          let correctAnswers = {};

          if (isDemoMode) {
            // Completely mock questions offline to save API bandwidth
            const demoQuestions = isArabic ? [
              { type: 'truefalse', question: 'هل تعتبر لغة جافاسكربت لغة برمجة كائنية التوجه بالكامل؟', category: 'Technical', weight: 1 },
              { type: 'mcq', question: 'ما هي الميزة الرئيسية لاستخدام React؟', choices: ['DOM الافتراضي', 'قواعد البيانات', 'التصميم فقط', 'لا شيء مما سبق'], correctAnswer: 'DOM الافتراضي', category: 'Technical', weight: 1.2 },
              { type: 'essay', question: 'تحدث عن مشروع معقد قمت ببنائه وأبرز التحديات التي واجهتها.', category: 'Behavioral', weight: 1 }
            ] : [
              { type: 'truefalse', question: 'Is JavaScript considered a purely functional programming language?', category: 'Technical', weight: 1 },
              { type: 'mcq', question: 'What is the core feature of React?', choices: ['Virtual DOM', 'Direct Database Access', 'Only CSS Styling', 'None of the above'], correctAnswer: 'Virtual DOM', category: 'Technical', weight: 1.2 },
              { type: 'essay', question: 'Describe a complex project you developed and the challenges you overcame.', category: 'Behavioral', weight: 1 }
            ];
            
            // Map correct answers indices
            demoQuestions.forEach((dq, idx) => {
              if (dq.correctAnswer) correctAnswers[idx] = dq.correctAnswer;
              else if (dq.type === 'truefalse') correctAnswers[idx] = dq.question.includes('React') || dq.question.includes('جافاسكربت') ? 'true' : 'false';
            });
            finalQuestions = demoQuestions;
            await new Promise(r => setTimeout(r, 600));
          } else {
            try {
              const result = await generateQuestions(
                candidate.jobTitle,
                atsResult,
                i18n.language,
                customBank,
                targetCount,
                jobDescription
              );
              finalQuestions = result.questions || [];
              correctAnswers = result.correctAnswers || {};
            } catch (e) {
              console.error('AI Generation failed:', e.message);
            }
          }

          if (finalQuestions.length > 0) {
            setQuestions(finalQuestions);
            setCorrectAnswers(correctAnswers);
          } else {
            const fallback = customBank.length > 0
              ? customBank.map(q => ({ type: 'essay', question: q.text || q, category: q.category || 'General', weight: 1 }))
              : [{ type: 'essay', question: isArabic ? 'أخبرنا عن نفسك.' : 'Tell us about yourself.', category: 'General', weight: 1 }];
            setQuestions(fallback);
          }

          setIsProcessing(false);
          navigate('/interview');
        } catch (globalErr) {
          console.error("Critical error during upload process:", globalErr);
          setIsProcessing(false);
          alert(isArabic ? "حدث خطأ غير متوقع. يرجى المتابعة." : "An unexpected error occurred. Please proceed.");
          navigate('/interview'); // Proceed anyway so they don't get stuck
        }
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Upload error:', error);
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
          {isArabic ? 'ارفع سيرتك الذاتية لكي يقوم الذكاء الاصطناعي بتحليلها وتوليد أسئلة مخصصة لك' : 'Upload your CV for AI analysis and personalized question generation'}
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
              <div className="animate-pulse" style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '1rem' }}>
                {processingStep || (isArabic ? 'جاري المعالجة...' : 'Processing...')}
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
