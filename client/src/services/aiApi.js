/**
 * AI Evaluation Service (Google Gemini Integration)
 * TalentFlow - HR Platform
 * v4.0 — MCQ + T/F + Essay + JD Generator + Gap Analysis
 */

// ─── System Prompt Cache ───────────────────────────────────────────────────────
let _cachedSystemPrompt = null;
let _cachedModel = 'gemini-1.5-flash';

const getSystemSettings = async () => {
  if (_cachedSystemPrompt) return { systemPrompt: _cachedSystemPrompt, model: _cachedModel };
  try {
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    const res = await fetch(`${API_BASE}/owner/ai-settings/public`);
    if (res.ok) {
      const data = await res.json();
      _cachedSystemPrompt = data.systemPrompt;
      _cachedModel = data.model || 'gemini-2.0-flash';
    }
  } catch (e) {
    console.warn('Could not fetch AI settings, using defaults.');
  }
  if (!_cachedSystemPrompt) {
    _cachedSystemPrompt = `أنت الخبير الرائد (Senior HR Director) في منصة TalentFlow، تمتلك خبرة دولية تزيد عن 50 عاماً في إدارة الموارد البشرية والتوظيف. أنت استشاري إداري محنك يتميز بالفراسة والموضوعية المطلقة. مهامك: تحليل السير الذاتية، توليد أسئلة ذكية، وتقييم الإجابات بدقة جراحية.`;
    _cachedModel = 'gemini-1.5-flash';
  }
  return { systemPrompt: _cachedSystemPrompt, model: _cachedModel };
};

export const refreshAiSettings = () => { _cachedSystemPrompt = null; };

// ─── Safety Settings ──────────────────────────────────────────────────────────
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

// ─── Core Gemini Caller ───────────────────────────────────────────────────────
const callGemini = async (apiKey, prompt, jsonMode = true, temperature = 0.5) => {
  const { systemPrompt, model } = await getSystemSettings();
  // Using v1beta to support newer models like gemini-2.0-flash
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        topP: 0.9,
        maxOutputTokens: 8192,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
      safetySettings: SAFETY_SETTINGS,
    }),
  });

    const data = await response.json();
    if (data.error) {
      console.error('Gemini API Details:', data.error);
      refreshAiSettings(); // Clear cache on error to try fresh settings next time
      throw new Error(`Gemini Error: ${data.error.message} (Code: ${data.error.code})`);
    }
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Empty response from Gemini API');
  }
  const raw = data.candidates[0].content.parts[0].text;
  return jsonMode ? JSON.parse(raw) : raw;
};

// ─── OpenAI Caller (Fallback) ────────────────────────────────────────────────
const callOpenAI = async (apiKey, prompt, jsonMode = true) => {
  const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a Senior HR Director. Provide expert analysis.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`OpenAI Error: ${data.error.message}`);
  const raw = data.choices[0].message.content;
  return jsonMode ? JSON.parse(raw) : raw;
};


// ─── Extract PDF Text ─────────────────────────────────────────────────────────
const extractPdfText = async (file) => {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + '\n';
    }
    return fullText.trim().slice(0, 6000);
  } catch (err) {
    console.warn('PDF extraction failed:', err.message);
    return null;
  }
};

// ─── CV Analysis ──────────────────────────────────────────────────────────────
export const analyzeCv = async (file) => {
  const API_BASE = import.meta.env.VITE_API_URL || '/api';
  let pdfText = null;
  if (file.type === 'application/pdf') {
    pdfText = await extractPdfText(file);
  }

  const contentDescription = pdfText
    ? `Full CV Text Content:\n---\n${pdfText}\n---`
    : `File Name: "${file.name}", File Size: ${(file.size / 1024).toFixed(1)} KB`;

  try {
    const response = await fetch(`${API_BASE}/ai/analyze-cv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentDescription })
    });
    if (!response.ok) throw new Error('Server AI failure');
    return await response.json();
  } catch (error) {
    console.error('CV Analysis Proxy Error:', error);
    return null;
  }
};


// ─── ✅ NEW: Generate Job Description (Using Server Proxy) ────────────────────
export const generateJD = async (jobTitle, department = '') => {
  const API_BASE = import.meta.env.VITE_API_URL || '/api';
  
  try {
    console.log('[AI Client] Requesting JD from server proxy...');
    const response = await fetch(`${API_BASE}/ai/generate-jd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: jobTitle, department })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Server AI failure');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('JD Generation Proxy Error:', error);
    return '';
  }
};

// ─── ✅ NEW: Generate Questions from Job Description ────────────────────────
export const generateJDQuestions = async (jobTitle, department = '', description = '', count = 5, language = 'en') => {
  const API_BASE = import.meta.env.VITE_API_URL || '/api';
  
  try {
    console.log('[AI Client] Requesting JD Questions from server proxy...');
    const response = await fetch(`${API_BASE}/ai/generate-jd-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: jobTitle, department, description, count, language })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Server AI failure');
    }

    const data = await response.json();
    return data.questions || [];
  } catch (error) {
    console.error('JD Questions Generation Error:', error);
    throw error;
  }
};




// ─── ✅ REBUILT: Generate Structured Questions (MCQ + T/F + Essay) ─────────────
/**
 * Generates 10 personalized questions based on JD + CV.
 * Returns: { questions: [...], correctAnswers: { index: answer } }
 *
 * Question format:
 * - type: 'truefalse' | 'mcq' | 'essay'
 * - question: string
 * - choices: string[] (for MCQ only — 4 options)
 * - correctAnswer: string (for MCQ/T-F — stored in correctAnswers map, NOT shown to candidate)
 * - category: string
 * - weight: number
 */
export const generateQuestions = async (jobTitle, cvData, language = 'en', customBank = [], targetCount = 10, jobDescription = '') => {
  const API_BASE = import.meta.env.VITE_API_URL || '/api';
  try {
    const response = await fetch(`${API_BASE}/ai/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobTitle, cvData, language, customBank, targetCount, jobDescription })
    });
    if (!response.ok) throw new Error('Server AI failure');
    return await response.json();
  } catch (error) {
    console.error('Generate Questions Proxy Error:', error);
    return { questions: buildFallbackQuestions(customBank, targetCount, language), correctAnswers: {} };
  }
};

// ─── Fallback helpers ─────────────────────────────────────────────────────────
const getStaticFallback = (lang, count, existingQuestions = []) => {
  const isAr = lang === 'ar';
  const pool = isAr ? [
    'أخبرنا عن أكبر تحدي واجهته في عملك السابق وكيف تعاملت معه؟',
    'كيف تدير وقتك عندما يكون لديك مهام متعددة ذات مواعيد ضيقة؟',
    'لماذا تعتقد أنك المرشح الأنسب لهذه الوظيفة؟',
    'حدثنا عن موقف اضطررت فيه للتعامل مع زميل صعب.',
    'ما هي طموحاتك المهنية للخمس سنوات القادمة؟',
    'كيف تحافظ على مستوى أدائك تحت ضغط العمل؟',
    'صف موقفاً اتخذت فيه مبادرة لتحسين سير العمل.',
    'ما هي أهم مهارة تقنية اكتسبتها مؤخراً وكيف طبقتها؟',
  ] : [
    'Tell us about the biggest challenge you faced and how you handled it.',
    'How do you manage your time when you have multiple tasks with tight deadlines?',
    'Why do you think you are the best fit for this position?',
    'Tell us about a time you had to deal with a difficult colleague.',
    'What are your career goals for the next five years?',
    'How do you maintain your performance level under work pressure?',
    'Describe a situation where you took initiative to improve workflow.',
    'What is the most important technical skill you recently acquired?',
  ];

  const result = [];
  pool.forEach(q => {
    if (result.length < count && !existingQuestions.includes(q)) {
      result.push({ type: 'essay', question: q, category: 'General', weight: 1 });
    }
  });
  while (result.length < count) {
    result.push({
      type: 'essay',
      question: isAr ? 'ما هي أهم إنجازاتك المهنية؟' : 'What is your greatest professional achievement?',
      category: 'General', weight: 1
    });
  }
  return result;
};

const buildFallbackQuestions = (customBank, targetCount, language) => {
  const formatted = customBank.map(q => ({
    type: 'essay',
    question: typeof q === 'string' ? q : (q.text || q.question || ''),
    category: q.category || 'Technical',
    weight: q.weight || 1,
    choices: [],
  }));
  const padding = getStaticFallback(language, Math.max(0, targetCount - formatted.length), formatted.map(q => q.question));
  return [...formatted, ...padding].slice(0, targetCount);
};

// ─── ✅ UPDATED: Evaluate Interview (MCQ auto-score + Essay AI + Gap Analysis) ─
/**
 * @param {Array} answers - all candidate answers
 * @param {string} jobTitle
 * @param {Array} questionCategories
 * @param {Object} correctAnswers - { index: correctAnswer } map
 * @param {Object} cvData - for gap analysis
 * @param {string} jobDescription - for gap analysis
 */
export const evaluateInterview = async (
  answers,
  jobTitle = 'Candidate',
  questionCategories = [],
  correctAnswers = {},
  cvData = null,
  jobDescription = ''
) => {
  const API_BASE = import.meta.env.VITE_API_URL || '/api';
  try {
    const response = await fetch(`${API_BASE}/ai/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, jobTitle, questionCategories, correctAnswers, cvData, jobDescription })
    });
    if (!response.ok) throw new Error('Server AI failure');
    return await response.json();
  } catch (error) {
    console.error('Evaluate Interview Proxy Error:', error);
    const fallback = fallbackMockEvaluation(answers, questionCategories);
    return { ...fallback, mcq_score: 0, mcqCorrect: 0, mcqTotal: 0, answers };
  }
};


// ─── Gibberish Detection ──────────────────────────────────────────────────────
const isGibberish = (text) => {
  if (!text || text.trim().length < 5) return true;
  const t = text.trim();
  if (/^(.)\1{3,}$/i.test(t)) return true;
  if (t.length > 5 && !/[aeiouAEIOUأإاوي\s]/i.test(t)) return true;
  if (/^\d+$/.test(t)) return true;
  return false;
};

// ─── Fallback Mock Evaluation ─────────────────────────────────────────────────
const fallbackMockEvaluation = (answers, questionCategories = []) => {
  const score = (text, cat = 'Technical', w = 1) => {
    if (isGibberish(text)) return 0;
    let s = 4;
    if (text.length > 40) s += 2;
    if (text.length > 100) s += 2;
    if (text.length > 200) s += 2;
    return Math.min(Math.round(s * w), 10);
  };

  const padded = [...answers];
  while (padded.length < 10) padded.push({ answer: '', category: 'Technical', weight: 1, type: 'essay' });

  const bRaw = [0, 1, 2].reduce((s, i) => s + score(padded[i].answer, questionCategories[i], padded[i].weight), 0);
  const aRaw = [3, 4, 5].reduce((s, i) => s + score(padded[i].answer, questionCategories[i], padded[i].weight), 0);
  const pRaw = [6, 7, 8, 9].reduce((s, i) => s + score(padded[i].answer, questionCategories[i], padded[i].weight), 0);

  const behavior_score = Math.min(40, Math.round((bRaw / 30) * 40));
  const attitude_score = Math.min(30, Math.round((aRaw / 30) * 30));
  const personality_score = Math.min(30, Math.round((pRaw / 40) * 30));
  const total_score = behavior_score + attitude_score + personality_score;

  let recommendation = 'Not Fit';
  if (total_score === 0) recommendation = 'Invalid Answers';
  else if (total_score >= 80) recommendation = 'Strong Fit';
  else if (total_score >= 60) recommendation = 'Potential Fit';

  return {
    behavior_score, behavior_reasoning: 'Auto-evaluated',
    attitude_score, attitude_reasoning: 'Auto-evaluated',
    personality_score, personality_reasoning: 'Auto-evaluated',
    total_score, recommendation,
    disc: { d: 50, i: 50, s: 50, c: 50 },
    strengths: ['Completed the interview', 'Responsive'],
    weaknesses: ['Answers lacked depth', 'Consider specific examples'],
    gap_analysis: ''
  };
};
