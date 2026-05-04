import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../store/interviewStore';
import { generateQuestions } from '../services/aiApi';

// Memoized Typewriter to avoid re-running on parent re-renders
const TypewriterText = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      i++;
      if (i <= text.length) {
        setDisplayedText(text.slice(0, i));
      } else {
        clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, 18);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};



function InterviewPhase() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Timer & Focus States
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [cheatAttempts, setCheatAttempts] = useState(0);

  // Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Ref to hold the latest handleSend to avoid stale closure inside timer useEffect
  const handleSendRef = useRef(null);

  const addAnswer = useInterviewStore(state => state.addAnswer);
  const candidate = useInterviewStore(state => state.candidate);
  const cvData = useInterviewStore(state => state.cvData);
  const generatedQuestions = useInterviewStore(state => state.generatedQuestions);
  const setQuestions = useInterviewStore(state => state.setQuestions);
  
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const isArabic = i18n.language === 'ar';
  
  // Anti-Cheat (Focus Loss)
  useEffect(() => {
    const handleBlur = () => {
      if (!isInitializing && timerActive && !showWarning) {
        setShowWarning(true);
        setCheatAttempts(prev => prev + 1);
      }
    };
    
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isInitializing, timerActive, showWarning]);

  // Timer logic — uses ref to call handleSend to avoid stale closure
  useEffect(() => {
    if (!timerActive || showWarning) return;
    if (timeLeft <= 0) {
      setTimerActive(false);
      handleSendRef.current?.(true);
      return;
    }
    const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, showWarning]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, answer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startInterview = useCallback((qs) => {
    setMessages([]);
    const greet = isArabic 
      ? `مرحباً ${candidate.name || ''}! أنا المحاور الذكي الخاص بكونكريتو. سأطرح عليك ${qs.length} أسئلة لتقييم مهاراتك كـ ${candidate.jobTitle}. أجب بصدق وتفصيل، ولديك دقيقتان لكل سؤال.`
      : `Hello ${candidate.name || ''}! I'm the AI Interviewer. I will ask you ${qs.length} questions to evaluate your skills as a ${candidate.jobTitle}. You have 2 minutes per question.`;

    setMessages([{ id: Date.now(), role: 'ai', text: greet, typed: false }]);
  }, [candidate.name, candidate.jobTitle, isArabic]);

  useEffect(() => {
    const init = async () => {
      if (generatedQuestions && generatedQuestions.length >= 10) {
        startInterview(generatedQuestions);
      } else if (candidate.jobTitle) {
        const qs = await generateQuestions(candidate.jobTitle, cvData, i18n.language);
        if (qs && qs.length >= 10) {
          setQuestions(qs);
          startInterview(qs);
        } else {
          // Fallback - role-specific basic questions
          const role = candidate.jobTitle || 'موظف';
          const fallbackQs = isArabic
            ? [
                `صف لنا يومك النموذجي في وظيفة ${role} - من لحظة وصولك لغاية انتهاء الوردية.`,
                `ما هي الأدوات أو المعدات التي تعمل عليها يومياً في هذا المجال؟`,
                `وصف لنا أصعب موقف تقني واجهته في عملك الحالي أو السابق وكيف تعاملت معه.`,
                `إذا اكتشفت خطأً في عمل زميلك يمكن أن يؤثر على جودة المنتج أو سلامة الموقع، ماذا ستفعل؟`,
                `كيف تتصرف لو طُلب منك إنجاز عمل بجودة عالية في وقت أقل من المعتاد؟`,
                `ما هي إجراءات السلامة التي تلتزم بها أولاً قبل بدء أي مهمة في موقع العمل؟`,
                `هل سبق وأن اختلفت مع مشرفك على قرار تقني؟ كيف تصرفت؟`,
                `كيف تتعامل مع ضغط العمل الشديد وتعدد المهام في نفس الوقت؟`,
                `ما الذي تفتقده في مكان عملك الحالي أو السابق وتأمل أن تجده هنا؟`,
                `لو أعطيناك فرصة لتطوير أي شيء في طريقة عمل قسمك، ما هو أول شيء ستغيره؟`
              ]
            : [
                `Walk us through a typical day as a ${role} — from when you arrive until end of shift.`,
                `What tools, equipment, or software do you use on a daily basis in this role?`,
                `Describe the most technically challenging situation you faced in your current or previous job and how you resolved it.`,
                `If you discovered an error in a colleague's work that could affect product quality or site safety, what would you do?`,
                `How do you handle a situation where you're asked to deliver high-quality work in less time than normal?`,
                `What are the first safety checks you perform before starting any task on site or at the plant?`,
                `Have you ever disagreed with your supervisor on a technical decision? How did you handle it?`,
                `How do you manage multiple urgent tasks at the same time without compromising quality?`,
                `What is missing from your current workplace that you hope to find here at Concreto?`,
                `If you were given the chance to improve one process in your department, what would you change and why?`
              ];
          setQuestions(fallbackQs);
          startInterview(fallbackQs);
        }
      } else {
        navigate('/');
      }
    };
    init();

    // Init Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      // Set language based on app language
      recognitionRef.current.lang = i18n.language === 'ar' ? 'ar-SA' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setAnswer(prev => prev + (prev.endsWith(' ') ? '' : ' ') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) {
      alert(isArabic ? "متصفحك لا يدعم التعرف على الصوت" : "Your browser does not support Speech Recognition.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Update lang just in case
      recognitionRef.current.lang = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }, [isRecording, isArabic, i18n.language]);

  const questions = generatedQuestions || [];

  const handleTypingComplete = useCallback((msgId) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, typed: true } : m));
    
    if (isInitializing) {
      setTimeout(() => {
        setIsInitializing(false);
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: questions[0], typed: false }]);
          setIsTyping(false);
        }, 900);
      }, 1200);
    } else {
      setInputEnabled(true);
      setTimerActive(true);
      setTimeLeft(120);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isInitializing, questions]);

  const handleSend = useCallback((force = false) => {
    if ((!answer.trim() && !force) || (!inputEnabled && !force)) return;

    const userMsg = answer.trim() || (isArabic ? "[لم يتم تقديم إجابة ضمن الوقت المحدد]" : "[No answer provided in time]");
    addAnswer(questions[currentStep], userMsg);
    
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userMsg, typed: true }]);
    setAnswer('');
    setInputEnabled(false);
    setTimerActive(false);
    setIsTyping(true);
    if (isRecording) {
      toggleRecording();
    }

    const nextStep = currentStep + 1;

    if (nextStep < questions.length) {
      setTimeout(() => {
        const ack = isArabic ? ['شكراً، ننتقل للتالي:', 'ممتاز، السؤال التالي:'] : ['Thank you, moving on:', 'Got it, next question:'];
        const randomAck = ack[Math.floor(Math.random() * ack.length)];
        
        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: randomAck + " " + questions[nextStep], typed: false }]);
        setIsTyping(false);
        setCurrentStep(nextStep);
      }, 1500);
    } else {
      setTimeout(() => {
        const finalMsg = isArabic
          ? 'تم إكمال المقابلة بنجاح! سيتم الآن تقييم إجاباتك...'
          : 'Interview complete! Analyzing your answers...';
        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: finalMsg, typed: false }]);
        setIsTyping(false);
        
        setTimeout(() => navigate('/completion'), 3500);
      }, 1500);
    }
  }, [answer, inputEnabled, currentStep, questions, isArabic, addAnswer, navigate]);

  // Keep the ref always pointing to the latest handleSend
  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isInitializing && messages.length === 0) {
    return (
      <div className="container text-center" style={{ marginTop: '20vh' }}>
        <div className="animate-pulse" style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {isArabic ? 'يتم الاتصال بالمحاور الذكي...' : 'Connecting to AI Interviewer...'}
        </div>
        <div className="progress-container" style={{ margin: '2rem auto', width: '50%' }}>
          <div className="progress-bar" style={{ width: '100%', animation: 'shimmer 2s infinite linear' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#050a14' }}>
      
      {/* Anti-Cheat Warning */}
      {showWarning && (
        <div className="focus-warning">
          <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</h1>
          <h2>{isArabic ? 'تحذير تشتت أو خروج من الشاشة!' : 'Focus Warning!'}</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', textAlign: 'center', maxWidth: '600px' }}>
            {isArabic 
              ? `هذه مقابلة رسمية، يرجى عدم مغادرة الشاشة للبحث عن إجابات. (تم رصد ${cheatAttempts} محاولات خروج)`
              : `This is an official interview. Please do not leave this screen or open other tabs. (${cheatAttempts} warnings recorded)`}
          </p>
          <button className="btn btn-primary" onClick={() => setShowWarning(false)}>
            {isArabic ? 'أعتذر، سأتابع المقابلة بتركيز' : 'I understand, return to interview'}
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#0a1120', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '45px', height: '45px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
            }}>🤖</div>
            <span style={{ position: 'absolute', bottom: 2, right: 2, width: '10px', height: '10px', backgroundColor: 'var(--color-success)', borderRadius: '50%', border: '2px solid #0a1120' }}></span>
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', letterSpacing: '0.5px' }}>
              {isArabic ? 'المحاور الذكي - كونكريتو' : 'AI Interviewer - Concreto'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{isArabic ? 'مقابلة حية' : 'Live Interview'}</span>
              {(!inputEnabled && !isInitializing) && (
                <div className="audio-visualizer">
                  <div className="visualizer-bar"></div><div className="visualizer-bar"></div>
                  <div className="visualizer-bar"></div><div className="visualizer-bar"></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              {isArabic ? 'السؤال' : 'Question'}
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)' }}>
              {currentStep + 1} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>/ {questions.length}</span>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem', paddingRight: '1.5rem', minWidth: '120px' }}>
            <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              {isArabic ? 'الوقت المتبقي' : 'Time Left'}
            </div>
            <div className={timeLeft <= 30 ? 'timer-urgent' : ''} style={{ fontWeight: 'bold', fontSize: '1.4rem', fontFamily: 'monospace' }}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', width: '100%', zIndex: 10 }}>
        <div style={{ width: `${((currentStep + 1) / questions.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', transition: 'width 0.5s' }}></div>
      </div>

      {/* Chat Messages */}
      <div className="chat-container" style={{ flex: 1, padding: '2rem 15%', backgroundImage: 'radial-gradient(circle at center, rgba(252, 163, 17, 0.03) 0%, transparent 70%)', backgroundColor: '#050a14', border: 'none' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.role === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-user'}`} style={{ fontSize: '1.05rem', padding: '1.2rem 1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', maxWidth: '85%' }}>
            {msg.role === 'ai' && !msg.typed ? (
              <TypewriterText text={msg.text} onComplete={() => handleTypingComplete(msg.id)} />
            ) : (
              msg.text
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="typing-indicator" style={{ backgroundColor: 'transparent', padding: '0.5rem 1rem' }}>
            <span></span><span></span><span></span>
          </div>
        )}
        
        <div ref={chatEndRef} style={{ height: '20px' }}></div>
      </div>

      {/* Input Area */}
      <div className="chat-input-area" style={{ 
        padding: '1.5rem 10%', 
        backgroundColor: '#0a1120', 
        borderTop: '1px solid rgba(255,255,255,0.05)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Microphone Button */}
        <button 
          className={`mic-btn ${isRecording ? 'active animate-pulse' : ''}`}
          onClick={toggleRecording}
          disabled={!inputEnabled}
          style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '16px', 
            backgroundColor: isRecording ? '#ef4444' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isRecording ? '#ef4444' : 'var(--color-border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputEnabled ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            color: isRecording ? '#fff' : 'var(--color-text)'
          }}
          title={isArabic ? 'تحدث' : 'Speak'}
        >
          <span style={{ fontSize: '1.4rem' }}>{isRecording ? '⏹️' : '🎤'}</span>
        </button>

        <textarea
          ref={textareaRef}
          rows="1"
          placeholder={isRecording ? (isArabic ? 'جاري الاستماع...' : 'Listening...') : (isArabic ? 'اكتب إجابتك هنا بتركيز...' : 'Type your answer here...')}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!inputEnabled}
          style={{ 
            opacity: inputEnabled ? 1 : 0.5, 
            fontSize: '1.05rem', 
            padding: '1rem 1.5rem', 
            borderRadius: '16px', 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            color: 'var(--color-text)', 
            border: `1px solid ${isRecording ? '#ef4444' : 'var(--color-border)'}`, 
            flex: 1, 
            resize: 'none',
            maxHeight: '120px',
            transition: 'border-color 0.3s ease'
          }}
        ></textarea>

        <button 
          className="chat-send-btn"
          onClick={() => handleSend(false)}
          disabled={!answer.trim() || !inputEnabled}
          style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '16px', 
            backgroundColor: 'var(--color-primary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (answer.trim() && inputEnabled) ? 'pointer' : 'not-allowed',
            opacity: (answer.trim() && inputEnabled) ? 1 : 0.5
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>

        {/* Recording Visualizer Overlay */}
        {isRecording && (
          <div style={{ 
            position: 'absolute', 
            top: '-30px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            padding: '4px 16px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: '600',
            pointerEvents: 'none'
          }}>
            {isArabic ? 'جاري تحويل صوتك لنص...' : 'Transcribing voice to text...'}
          </div>
        )}
      </div>
    </div>

  );
}

export default InterviewPhase;
