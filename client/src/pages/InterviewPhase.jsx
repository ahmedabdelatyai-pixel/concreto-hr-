import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../store/interviewStore';
import { generateQuestions } from '../services/aiApi';

function InterviewPhase() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const addAnswer = useInterviewStore(state => state.addAnswer);
  const candidate = useInterviewStore(state => state.candidate);
  const cvData = useInterviewStore(state => state.cvData);
  const generatedQuestions = useInterviewStore(state => state.generatedQuestions);
  const setQuestions = useInterviewStore(state => state.setQuestions);
  
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const isArabic = i18n.language === 'ar';
  
  const startInterview = useCallback((qs) => {
    // Reset messages to clear any old ones
    setMessages([]);
    const greet = isArabic 
      ? `مرحباً ${candidate.name || ''}! أنا المحاور الذكي الخاص بشركة كونكريتو ريدي ميكس. سأطرح عليك ١٠ أسئلة لتقييم مهاراتك كـ ${candidate.jobTitle}. أجب بصدق وتفصيل.`
      : `Hello ${candidate.name || ''}! I'm the AI Interviewer for Concreto Ready Mix. I will ask you 10 questions to evaluate your skills as a ${candidate.jobTitle}. Please answer honestly and in detail.`;

    setMessages([{ role: 'ai', text: greet }]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: qs[0] }]);
      setIsTyping(false);
      setInputEnabled(true);
      setIsInitializing(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }, 1500);
  }, [candidate.name, candidate.jobTitle, isArabic]);

  useEffect(() => {
    const init = async () => {
      // Logic: If questions are empty OR they belong to a different role (via some check) 
      // OR we just want to be sure and always re-generate if we are at step 0.
      
      console.log("Interview Phase Init. Current Questions Count:", generatedQuestions?.length);
      
      if (generatedQuestions && generatedQuestions.length >= 10) {
        console.log("Using existing questions from store.");
        startInterview(generatedQuestions);
      } else if (candidate.jobTitle) {
        console.log("Generating fresh questions for:", candidate.jobTitle);
        const qs = await generateQuestions(candidate.jobTitle, cvData, i18n.language);
        if (qs && qs.length >= 10) {
          setQuestions(qs);
          startInterview(qs);
        } else {
          console.warn("AI Generation failed, using safe fallback.");
          const fallbackQs = isArabic 
            ? [
                `حدثنا عن خبرتك في مجال ${candidate.jobTitle}.`,
                "ما هو أكبر تحدي واجهته في عملك السابق؟",
                "كيف تتعامل مع ضغط العمل والمواعيد النهائية؟",
                "لماذا تريد الانضمام لشركة كونكريتو؟",
                "كيف تحافظ على معايير الجودة في عملك؟",
                "صف لنا موقفاً اختلفت فيه مع زميل وكيف حللته.",
                "ما هي طريقتك في تنظيم مهامك اليومية؟",
                "كيف تطور مهاراتك بشكل مستمر؟",
                "ما الذي يميزك عن غيرك من المتقدمين؟",
                "أين ترى نفسك بعد 5 سنوات في الشركة؟"
              ]
            : [
                `Tell us about your experience as a ${candidate.jobTitle}.`,
                "What is the biggest challenge you faced in your previous job?",
                "How do you handle work pressure and tight deadlines?",
                "Why do you want to join Concreto Ready Mix?",
                "How do you maintain quality standards in your work?",
                "Describe a situation where you disagreed with a colleague.",
                "What is your method for organizing daily tasks?",
                "How do you continuously develop your skills?",
                "What sets you apart from other applicants?",
                "Where do you see yourself in 5 years?"
              ];
          setQuestions(fallbackQs);
          startInterview(fallbackQs);
        }
      } else {
        navigate('/');
      }
    };
    init();
  }, []); // Run once on mount

  const questions = generatedQuestions || [];

  if (isInitializing) {
    return (
      <div className="container text-center" style={{ marginTop: '20vh' }}>
        <div className="animate-pulse" style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {isArabic ? 'جاري تحضير مقابلة مخصصة لك...' : 'Crafting your personalized interview...'}
        </div>
        <p className="text-muted" style={{ marginTop: '1rem' }}>
          {isArabic ? 'يقوم الذكاء الاصطناعي الآن بتحليل بياناتك وتوليد الأسئلة' : 'Our AI is analyzing your profile to generate relevant questions'}
        </p>
        <div className="progress-container" style={{ margin: '2rem auto', width: '50%' }}>
          <div className="progress-bar" style={{ width: '100%', animation: 'shimmer 2s infinite linear' }}></div>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!answer.trim() || !inputEnabled) return;

    const userMsg = answer.trim();
    addAnswer(questions[currentStep], userMsg);
    
    // Add user bubble
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAnswer('');
    setInputEnabled(false);
    setIsTyping(true);

    const nextStep = currentStep + 1;

    if (nextStep < questions.length) {
      // Show typing, then next question
      setTimeout(() => {
        const ack = isArabic
          ? ['تمام، سؤال تالي:', 'شكراً على إجابتك. السؤال التالي:', 'فهمت. ننتقل للسؤال التالي:']
          : ['Got it. Next question:', 'Thank you for your answer. Moving on:', 'Understood. Here is your next question:'];
        const randomAck = ack[Math.floor(Math.random() * ack.length)];
        
        setMessages(prev => [...prev, { role: 'ai', text: randomAck }]);
        
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'ai', text: questions[nextStep] }]);
          setIsTyping(false);
          setInputEnabled(true);
          setCurrentStep(nextStep);
          textareaRef.current?.focus();
        }, 800);
      }, 1000);
    } else {
      // Final message
      setTimeout(() => {
        const finalMsg = isArabic
          ? 'شكراً جزيلاً على وقتك وإجاباتك. تم إكمال المقابلة بنجاح! سيتم الآن تحليل إجاباتك بواسطة الذكاء الاصطناعي...'
          : 'Thank you for your time and answers. The interview is now complete! Your answers will now be analyzed by our AI system...';
        setMessages(prev => [...prev, { role: 'ai', text: finalMsg }]);
        setIsTyping(false);
        
        setTimeout(() => navigate('/completion'), 2500);
      }, 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const progressPercentage = ((currentStep + 1) / questions.length) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--color-bg)' }}>
      
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-card)', display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
        }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
            {isArabic ? 'المحاور الذكي - كونكريتو' : 'AI Interviewer - Concreto'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }}></span>
            {isArabic ? 'متصل الآن' : 'Online'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            {t('interview.question', { current: currentStep + 1, total: questions.length })}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-container" style={{ margin: 0, borderRadius: 0, height: '3px' }}>
        <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
      </div>

      {/* Chat Messages */}
      <div className="chat-container" style={{ flex: 1 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-user'}`}>
            {msg.text}
          </div>
        ))}
        
        {isTyping && (
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        )}
        
        <div ref={chatEndRef}></div>
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <textarea
          ref={textareaRef}
          rows="1"
          placeholder={isArabic ? 'اكتب إجابتك هنا...' : 'Type your answer here...'}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!inputEnabled}
          style={{ opacity: inputEnabled ? 1 : 0.5 }}
        ></textarea>
        <button 
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!answer.trim() || !inputEnabled}
          title="Send"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default InterviewPhase;
