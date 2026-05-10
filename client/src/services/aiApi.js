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
  const { systemPrompt } = await getSystemSettings();
  const model = 'gemini-1.5-flash'; 
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  let pdfText = null;
  if (file.type === 'application/pdf') {
    pdfText = await extractPdfText(file);
  }

  const contentDescription = pdfText
    ? `Full CV Text Content:\n---\n${pdfText}\n---`
    : `File Name: "${file.name}", File Size: ${(file.size / 1024).toFixed(1)} KB`;

  const prompt = `You are an expert CV parser for TalentFlow AI recruitment platform.
Analyze this CV carefully:

${contentDescription}

Return a JSON object with EXACT keys:
{
  "summary": "2-3 sentence professional summary",
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  "experience_years": <integer 0-30>,
  "education": "Highest degree and field",
  "technical_match": <integer 0-100>,
  "is_fit_for_interview": <true if technical_match >= 40>
}`;

  try {
    return await callGemini(apiKey, prompt, true, 0.3);
  } catch (error) {
    console.error('CV Analysis Error:', error);
    return null;
  }
};

// ─── ✅ NEW: Generate Job Description ─────────────────────────────────────────
export const generateJD = async (jobTitle, department = '') => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return '';

  const prompt = `You are a senior HR consultant writing a professional Job Description for TalentFlow recruitment platform.

Write a comprehensive, professional Job Description for the following role:
- Job Title: "${jobTitle}"
- Department: "${department || 'General'}"

The JD should include:
1. Role Overview (2-3 sentences)
2. Key Responsibilities (5-7 bullet points)
3. Required Qualifications (4-5 points)
4. Preferred Skills (3-4 points)

Keep it concise, professional, and relevant to the role.
Write in the same language as the job title (Arabic if Arabic title, English if English title).
Return as plain text only — no markdown, no JSON.`;

  try {
    console.log('Generating JD for:', jobTitle);
    const draft = await callGemini(apiKey, prompt, false, 0.6);
    if (!draft) throw new Error('Gemini returned empty JD');
    return draft;
  } catch (error) {
    console.error('JD Generation Service Error:', error);
    throw error; // Rethrow to be caught by UI
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('No Gemini API key. Using custom bank + fallback.');
    return { questions: buildFallbackQuestions(customBank, targetCount, language), correctAnswers: {} };
  }

  const isAr = language === 'ar';
  const cvContext = cvData
    ? `\nCANDIDATE CV:\nSummary: "${cvData.summary}"\nSkills: ${cvData.skills?.join(', ')}\nExperience: ${cvData.experience_years} years`
    : '';
  const jdContext = jobDescription
    ? `\nJOB DESCRIPTION:\n${jobDescription.slice(0, 1500)}`
    : '';

  // Custom questions count (always essay type)
  const customCount = Math.min(customBank.length, targetCount);
  // AI fills the rest: always generate 10 structured questions (3 T/F + 4 MCQ + 3 Essay)
  const aiCount = Math.max(0, targetCount - customCount);

  // Build structured request
  const structuredPrompt = isAr ? `
أنت محاور ذكاء اصطناعي متخصص في التوظيف لمنصة TalentFlow.
مهمتك: توليد بالضبط ${aiCount} سؤال مقابلة مخصص لهذا المتقدم.

الوظيفة: "${jobTitle}"
${jdContext}
${cvContext}

يجب أن تكون الأسئلة موزعة هكذا (بالنسب الأقرب لـ ${aiCount} أسئلة):
- 30% أسئلة صح أو غلط (truefalse)
- 40% أسئلة اختيار من متعدد (mcq) مع 4 خيارات واضحة
- 30% أسئلة مقالية (essay) تقيس التفكير

القواعد:
1. الأسئلة باللغة العربية
2. مخصصة لهذا المتقدم بناءً على الـ CV والـ JD
3. الأسئلة التقنية يجب أن تختبر مهارات حقيقية وليست عامة

أخرج JSON array فقط بهذا الشكل:
[{
  "type": "truefalse",
  "question": "نص السؤال",
  "correctAnswer": "true أو false",
  "category": "Technical",
  "weight": 1
}, {
  "type": "mcq",
  "question": "نص السؤال",
  "choices": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
  "correctAnswer": "الخيار الصحيح كما هو مكتوب في choices",
  "category": "Technical",
  "weight": 1.2
}, {
  "type": "essay",
  "question": "نص السؤال المقالي",
  "category": "Behavioral",
  "weight": 1
}]`
  : `
You are an AI interviewer for TalentFlow recruitment platform.
Task: Generate exactly ${aiCount} personalized interview questions for this candidate.

Job Title: "${jobTitle}"
${jdContext}
${cvContext}

Distribute questions as follows (closest distribution for ${aiCount} questions):
- 30% True/False questions (truefalse)
- 40% Multiple Choice questions (mcq) with 4 clear answer choices
- 30% Essay questions (essay) testing depth of thought

Rules:
1. Questions MUST be in English
2. Personalize based on the candidate's CV and the Job Description
3. Technical questions must test real, specific skills — NOT generic questions

Return ONLY a JSON array in this format:
[{
  "type": "truefalse",
  "question": "Question text",
  "correctAnswer": "true or false",
  "category": "Technical",
  "weight": 1
}, {
  "type": "mcq",
  "question": "Question text",
  "choices": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The exact correct option text as written in choices",
  "category": "Technical",
  "weight": 1.2
}, {
  "type": "essay",
  "question": "Open-ended question",
  "category": "Behavioral",
  "weight": 1
}]`;

  try {
    const aiResult = await callGemini(apiKey, structuredPrompt, true, 0.7);
    let aiQuestions = Array.isArray(aiResult) ? aiResult
      : (Array.isArray(aiResult?.questions) ? aiResult.questions
        : Object.values(aiResult).find(v => Array.isArray(v)) || []);

    // Build correct answers map (index → answer) — never exposed to UI directly
    const correctAnswers = {};

    // Format custom questions (always essay)
    const formattedCustom = customBank.slice(0, customCount).map((q, i) => ({
      type: 'essay',
      question: typeof q === 'string' ? q : (q.text || q.question || ''),
      category: q.category || 'Technical',
      weight: q.weight || 1,
    }));

    // Format AI questions + extract correct answers
    const formattedAi = aiQuestions.slice(0, aiCount).map((q, i) => {
      const globalIndex = formattedCustom.length + i;
      if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
        correctAnswers[globalIndex] = String(q.correctAnswer);
      }
      return {
        type: q.type || 'essay',
        question: q.question || q.text || '',
        choices: q.choices || [],
        category: q.category || 'Technical',
        weight: q.weight || (q.type === 'mcq' ? 1.2 : 1),
      };
    });

    let merged = [...formattedCustom, ...formattedAi];

    // Pad with fallbacks if needed
    if (merged.length < targetCount) {
      const padding = getStaticFallback(language, targetCount - merged.length, merged.map(q => q.question));
      merged = [...merged, ...padding];
    }

    return { questions: merged.slice(0, targetCount), correctAnswers };

  } catch (error) {
    console.error('Gemini Question Generation Error:', error);
    return {
      questions: buildFallbackQuestions(customBank, targetCount, language),
      correctAnswers: {}
    };
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // ── Step 1: Auto-score MCQ and T/F ──
  let mcqCorrect = 0;
  let mcqTotal = 0;
  const scoredAnswers = answers.map((a, i) => {
    if (a.type === 'mcq' || a.type === 'truefalse') {
      mcqTotal++;
      const expected = correctAnswers[i];
      const given = String(a.answer || '').trim().toLowerCase();
      const correct = String(expected || '').trim().toLowerCase();
      const isCorrect = given === correct || given.includes(correct) || correct.includes(given);
      if (isCorrect) mcqCorrect++;
      return { ...a, isCorrect, score: isCorrect ? 10 : 0 };
    }
    return { ...a, isCorrect: null, score: null };
  });

  const mcqScore = mcqTotal > 0 ? Math.round((mcqCorrect / mcqTotal) * 40) : 0; // MCQ = 40% of total

  // ── Step 2: AI evaluates essay questions only ──
  const essayAnswers = scoredAnswers.filter(a => a.type === 'essay');

  if (!apiKey) {
    const fallback = fallbackMockEvaluation(answers, questionCategories);
    return { ...fallback, mcq_score: mcqScore, mcqCorrect, mcqTotal };
  }

  const formattedEssays = essayAnswers.map((a, i) => {
    const category = questionCategories[answers.indexOf(a)] || 'Technical';
    return `[Essay ${i + 1}] (${category}): ${a.question}\n[Answer]: ${a.answer}`;
  }).join('\n\n');

  const cvSkills = cvData?.skills?.join(', ') || '';
  const prompt = `You are a Senior HR Director evaluating a candidate for "${jobTitle}".

OBJECTIVE EVALUATION — Essay Questions Only (MCQ/T-F already auto-scored):

${formattedEssays}

CANDIDATE CV SKILLS: ${cvSkills}
JOB DESCRIPTION SUMMARY: ${jobDescription ? jobDescription.slice(0, 500) : 'Not provided'}

SCORING RULES:
- Score each essay 0-10 based on STAR method, depth, and relevance
- Penalize generic or vague answers (-2 to -4 points)
- Penalize gibberish/random text (score = 0)
- Be strict: only 9-10 for truly impressive, detailed answers

MANDATORY OUTPUT (raw JSON only):
{
  "behavior_score": <0-40>,
  "behavior_reasoning": "<explanation>",
  "attitude_score": <0-30>,
  "attitude_reasoning": "<explanation>",
  "personality_score": <0-30>,
  "personality_reasoning": "<explanation>",
  "total_score": <sum of the three above>,
  "disc": { "d": <0-100>, "i": <0-100>, "s": <0-100>, "c": <0-100> },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendation": "<Strong Fit | Potential Fit | Not Fit | Invalid Answers>",
  "gap_analysis": "<A smart 2-3 sentence paragraph about skills the candidate claimed in CV but showed weakness in the interview answers. Be specific. Write in the same language as answers.>"
}`;

  try {
    const result = await callGemini(apiKey, prompt, true, 0.1);
    // Blend MCQ score with essay evaluation
    const blendedTotal = Math.min(100, Math.round(
      (result.total_score * 0.6) + (mcqScore * 1.0)
    ));
    let recommendation = result.recommendation;
    if (blendedTotal >= 80) recommendation = 'Strong Fit';
    else if (blendedTotal >= 60) recommendation = 'Potential Fit';
    else if (blendedTotal > 0) recommendation = 'Not Fit';

    return {
      ...result,
      total_score: blendedTotal,
      recommendation,
      mcq_score: mcqScore,
      essay_score: result.total_score,
      mcqCorrect,
      mcqTotal,
      gap_analysis: result.gap_analysis || '',
      answers: scoredAnswers // ✅ Return the answers with isCorrect flags
    };


  } catch (error) {
    console.error('Gemini AI Evaluation Error:', error);
    const fallback = fallbackMockEvaluation(answers, questionCategories);
    return { ...fallback, mcq_score: mcqScore, mcqCorrect, mcqTotal };
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
