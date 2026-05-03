import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../store/interviewStore';
import { useAdminStore } from '../store/adminStore';
import { evaluateInterview } from '../services/aiApi';

function EvaluationResult() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const savedRef = useRef(false);
  
  const candidate = useInterviewStore(state => state.candidate);
  const answers = useInterviewStore(state => state.interviewAnswers);
  const evaluation = useInterviewStore(state => state.evaluation);
  const setEvaluation = useInterviewStore(state => state.setEvaluation);
  const addApplicant = useAdminStore(state => state.addApplicant);

  useEffect(() => {
    const fetchEvaluation = async () => {
      let evalResult = evaluation;
      if (!evalResult) {
        evalResult = await evaluateInterview(answers, candidate.jobTitle);
        setEvaluation(evalResult);
      }

      // Save applicant to admin store (once)
      if (!savedRef.current && evalResult) {
        savedRef.current = true;
        
        // Map scores to backend structure
        const mappedApplicant = {
          candidate,
          jobId: candidate.jobId,
          answers,
          cvData: useInterviewStore.getState().cvData,
          cvFile: useInterviewStore.getState().cvFile,
          evaluation: {
            ...evalResult,
            scores: {
              behavior: evalResult.behavior_score,
              attitude: evalResult.attitude_score,
              personality: evalResult.personality_score
            }
          }
        };
        
        addApplicant(mappedApplicant);
      }

      setLoading(false);
    };
    
    fetchEvaluation();
  }, [answers, evaluation, setEvaluation, candidate, addApplicant]);

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

          {/* Total & Recommendation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1.5rem',
            backgroundColor: 'var(--color-bg)',
            borderRadius: 'var(--border-radius)',
            marginTop: '1rem'
          }}>
            <div>
              <div className="text-muted">{t('evaluation.total')}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: getStatusColor(evaluation.total_score) }}>
                {evaluation.total_score} / 100
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-muted">{t('evaluation.status')}</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: getStatusColor(evaluation.total_score),
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                marginTop: '0.5rem'
              }}>
                {evaluation.recommendation}
              </div>
            </div>
          </div>
          
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default EvaluationResult;
