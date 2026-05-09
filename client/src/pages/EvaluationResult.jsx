import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useInterviewStore } from '../store/interviewStore';
import { useAdminStore } from '../store/adminStore';
import { evaluateInterview } from '../services/aiApi';

function EvaluationResult() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const savedRef = useRef(false);
  
  const candidate = useInterviewStore(state => state.candidate);
  const answers = useInterviewStore(state => state.interviewAnswers);
  const evaluation = useInterviewStore(state => state.evaluation);
  const setEvaluation = useInterviewStore(state => state.setEvaluation);
  const addApplicant = useAdminStore(state => state.addApplicant);
  const generatedQuestions = useInterviewStore(state => state.generatedQuestions);
  // ✅ NEW
  const correctAnswers = useInterviewStore(state => state.correctAnswers);
  const cheatAttempts = useInterviewStore(state => state.cheatAttempts);

  useEffect(() => {
    const fetchEvaluation = async () => {
      let evalResult = evaluation;
      if (!evalResult) {
        const questionCategories = generatedQuestions.map(q =>
          typeof q === 'string' ? 'Technical' : (q.category || 'Technical')
        );
        const cvData = useInterviewStore.getState().cvData;
        const jobDescription = useInterviewStore.getState().candidate?.jobDescription || '';

        // ✅ Pass correctAnswers, cvData, jobDescription for MCQ scoring + Gap Analysis
        evalResult = await evaluateInterview(
          answers,
          candidate.jobTitle,
          questionCategories,
          correctAnswers,
          cvData,
          jobDescription
        );
        setEvaluation(evalResult);
      }

      // Save applicant results to backend (once)
      if (!savedRef.current && evalResult && candidate.applicantId) {
        savedRef.current = true;
        try {
          // Calculate integrity score (100 - 10 per cheat, min 0)
          const integrityScore = Math.max(0, 100 - (cheatAttempts * 10));

          const mappedData = {
            answers: evalResult.answers || answers, // ✅ Use scored answers
            cvData: useInterviewStore.getState().cvData,

            cvFile: useInterviewStore.getState().cvFile,
            accessSecret: candidate.accessSecret,
            evaluation: {
              ...evalResult,
              scores: {
                behavior: evalResult.behavior_score,
                attitude: evalResult.attitude_score,
                personality: evalResult.personality_score
              },
              mcq_score: evalResult.mcq_score,
              gap_analysis: evalResult.gap_analysis || ''
            },
            // ✅ Integrity data
            cheatAttempts,
            integrityScore,
          };

          const submitRes = await api.patch(`/public/applicants/${candidate.applicantId}/submit`, mappedData);
          console.log('Application submitted successfully:', submitRes.data);
        } catch (error) {
          console.error('Failed to submit application:', error.response?.data || error.message);
        }
      } else if (!candidate.applicantId) {
        console.error('CRITICAL: Candidate ID is missing. Cannot save results.');
      }

      setLoading(false);
    };

    fetchEvaluation();
  }, [answers, evaluation, setEvaluation, candidate, generatedQuestions, correctAnswers, cheatAttempts]);


  const getStatusColor = (score) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-primary)';
    return 'var(--color-danger)';
  };

  if (loading) {
    return (
      <div className="container text-center" style={{ marginTop: '15vh' }}>
        <div className="animate-pulse" style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
          {t('evaluating') || 'جاري تحليل إجاباتك وإنشاء التقرير النهائي...'}
        </div>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Using Gemini 2.0 Flash AI</p>
        <div className="progress-container" style={{ marginTop: '2rem', margin: '0 auto', width: '60%' }}>
          <div className="progress-bar" style={{ width: '100%', animation: 'shimmer 2s infinite linear' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ marginTop: '5vh' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{t('evaluation.title')}</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* CV AI Analysis Section */}
          {useInterviewStore.getState().cvData && (
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: 'rgba(59, 130, 246, 0.05)', 
              borderRadius: 'var(--border-radius)', 
              border: '1px solid rgba(59, 130, 246, 0.1)',
              marginBottom: '1rem'
            }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 {i18n.language === 'ar' ? 'تحليل السيرة الذاتية' : 'CV AI Analysis'}
                <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', color: 'var(--color-primary)' }}>
                  {useInterviewStore.getState().cvData.technical_match}% Match
                </span>
              </h3>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text)' }}>
                {useInterviewStore.getState().cvData.summary}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                {useInterviewStore.getState().cvData.skills?.slice(0, 5).map((skill, i) => (
                  <span key={i} style={{
                    padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)',
                    fontSize: '0.75rem', border: '1px solid var(--color-border)'
                  }}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Main Scores */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{t('evaluation.behavior')} (40)</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{evaluation.behavior_score}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{t('evaluation.attitude')} (30)</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{evaluation.attitude_score}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{t('evaluation.personality')} (30)</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{evaluation.personality_score}</span>
          </div>

          {/* DISC Profile Section */}
          {evaluation.disc && (
            <div style={{ marginTop: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>{t('evaluation.disc_profile')}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>{t('evaluation.disc_d')}</span>
                    <span>{evaluation.disc.d || 0}%</span>
                  </div>
                  <div className="progress-container" style={{ height: '6px', marginBottom: '0' }}>
                    <div className="progress-bar" style={{ width: `${evaluation.disc.d || 0}%`, backgroundColor: '#ef4444' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>{t('evaluation.disc_i')}</span>
                    <span>{evaluation.disc.i || 0}%</span>
                  </div>
                  <div className="progress-container" style={{ height: '6px', marginBottom: '0' }}>
                    <div className="progress-bar" style={{ width: `${evaluation.disc.i || 0}%`, backgroundColor: '#fca311' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>{t('evaluation.disc_s')}</span>
                    <span>{evaluation.disc.s || 0}%</span>
                  </div>
                  <div className="progress-container" style={{ height: '6px', marginBottom: '0' }}>
                    <div className="progress-bar" style={{ width: `${evaluation.disc.s || 0}%`, backgroundColor: '#10b981' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>{t('evaluation.disc_c')}</span>
                    <span>{evaluation.disc.c || 0}%</span>
                  </div>
                  <div className="progress-container" style={{ height: '6px', marginBottom: '0' }}>
                    <div className="progress-bar" style={{ width: `${evaluation.disc.c || 0}%`, backgroundColor: '#3b82f6' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Total & Recommendation Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flexDirection: 'column',
            padding: '3rem 1.5rem',
            background: 'radial-gradient(circle, var(--color-primary-glow) 0%, transparent 80%)',
            borderRadius: 'var(--border-radius)',
            marginTop: '1rem',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              border: `8px solid rgba(255,255,255,0.05)`,
              borderTopColor: getStatusColor(evaluation.total_score),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: `0 0 30px ${getStatusColor(evaluation.total_score)}33`
            }}>
              <div style={{ fontSize: '3rem', fontWeight: '900', color: getStatusColor(evaluation.total_score) }}>
                {evaluation.total_score}
              </div>
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>SCORE</div>
            </div>

            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: '900', 
              color: getStatusColor(evaluation.total_score),
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              {evaluation.recommendation}
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', maxWidth: '400px' }}>
              {i18n.language === 'ar' 
                ? 'تم تحليل إجاباتك بنجاح من قبل نظام الذكاء الاصطناعي بناءً على المعايير الفنية والسلوكية.'
                : 'Your answers have been successfully analyzed by our AI engine based on technical and behavioral criteria.'}
            </p>
          </div>
          
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ padding: '0.7rem 2rem' }}>
            {i18n.language === 'ar' ? 'العودة للرئيسية' : 'Return Home'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EvaluationResult;
