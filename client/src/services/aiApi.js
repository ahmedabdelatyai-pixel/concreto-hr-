/**
 * AI Evaluation Service (Google Gemini Integration)
 * Concreto Ready Mix - HR Platform
 */

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

const callGemini = async (apiKey, prompt, jsonMode = true, temperature = 0.5) => {
  const response = await fetch(GEMINI_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        topP: 0.9,
        maxOutputTokens: 4096,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  const raw = data.candidates[0].content.parts[0].text;
  return jsonMode ? JSON.parse(raw) : raw;
};

// Extract real text from PDF file using pdfjs-dist
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
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText.trim().slice(0, 6000); // Limit to avoid token overflow
  } catch (err) {
    console.warn('PDF extraction failed, using file metadata:', err.message);
    return null;
  }
};

export const analyzeCv = async (file) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  // Try to extract real text from PDF
  let pdfText = null;
  if (file.type === 'application/pdf') {
    pdfText = await extractPdfText(file);
  }

  const contentDescription = pdfText
    ? `Full CV Text Content:\n---\n${pdfText}\n---`
    : `File Name: "${file.name}", File Size: ${(file.size / 1024).toFixed(1)} KB, File Type: ${file.type}`;

  const prompt = `You are an expert CV parser and HR analyst for Concreto Ready Mix (concrete & construction industry).
Analyze this job application carefully:

${contentDescription}

Extract and generate a structured candidate profile based on the content above.
Return a JSON object with these EXACT keys:
{
  "summary": "A 2-3 sentence professional summary highlighting the candidate's most relevant experience and key value proposition",
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  "experience_years": <integer 0-30>,
  "education": "Highest degree and field of study",
  "technical_match": <integer 0-100, based on relevance to construction/concrete industry>,
  "is_fit_for_interview": <true if technical_match >= 40, false otherwise>
}`;

  try {
    return await callGemini(apiKey, prompt, true, 0.3);
  } catch (error) {
    console.error('CV Analysis Error:', error);
    return null;
  }
};

// Role-specific question blueprints to guide the AI
const ROLE_BLUEPRINTS = {

  ar: {
    default: `
- 4 أسئلة تقنية تتعلق بمهام العمل اليومية الحقيقية لهذه الوظيفة (ليست عامة)
- 2 سؤال عن حوادث أو مشاكل فعلية واجهتها في العمل وكيف تعاملت معها
- 2 سؤال عن السلامة والتعامل مع زملاء أو مدراء في بيئة عمل صعبة
- 2 سؤال يختبر شخصيتك ومدى التزامك وقدرتك على تحمل المسؤولية`,
    concrete: `
- 3 أسئلة عن نسب الخلط، ضبط الجودة، وإجراءات الـ slump test
- 2 سؤال عن مشاكل فعلية واجهتها في المصنع أو الموقع (تأخر إمدادات، عطل ماكينة، إلخ)
- 2 سؤال عن قواعد السلامة في مصنع الخرسانة الجاهزة
- 3 أسئلة عن التعامل مع ضغط العمل وإدارة الوقت في المشاريع`,
  },
  en: {
    default: `
- 4 technical questions directly tied to real daily tasks of a "${'{jobTitle}'}" (NOT generic)
- 2 situational questions about real problems/incidents this role faces on site or in the field
- 2 questions about safety culture and teamwork under operational pressure
- 2 personality questions testing accountability, punctuality, and self-driven learning`,
    concrete: `
- 3 questions about mix designs, quality control procedures, and slump/air content testing
- 2 questions about real incidents: equipment failure, supply delays, rejected loads
- 2 questions about concrete plant safety standards and PPE protocols
- 3 questions about time management under client deadline pressure and multi-project workload`,
  },
};

const getBlueprintForRole = (jobTitle, lang) => {
  const lc = jobTitle.toLowerCase();
  const blueprints = ROLE_BLUEPRINTS[lang === 'ar' ? 'ar' : 'en'];
  const isConcrete = ['concrete', 'خرسانة', 'mixer', 'خلاط', 'batching', 'quality control', 'جودة', 'driver', 'سائق', 'operator', 'مشغل'].some(k => lc.includes(k));
  return isConcrete ? blueprints.concrete.replace('{jobTitle}', jobTitle) : blueprints.default.replace('{jobTitle}', jobTitle);
};

export const generateQuestions = async (jobTitle, cvData, language = 'en') => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const isArabic = language === 'ar';
  const langText = isArabic ? 'Arabic (العربية)' : 'English';
  const blueprint = getBlueprintForRole(jobTitle, language);
  const cvContext = cvData
    ? `\nThe candidate's CV summary: "${cvData.summary}". Their declared skills: ${cvData.skills?.join(', ')}.`
    : '';

  const prompt = isArabic ? `
أنت محاور تقني متخصص في شركة كونكريتو ريدي ميكس (صناعة الخرسانة والإنشاءات).
مهمتك: توليد 10 أسئلة مقابلة واقعية وحقيقية للوظيفة: "${jobTitle}".

قواعد صارمة:
1. الأسئلة يجب أن تكون باللغة العربية فقط.
2. لا تستخدم الأسئلة التقليدية المملة مثل "ما هي نقاط قوتك؟" أو "أين ترى نفسك بعد 5 سنوات؟".
3. كل سؤال يجب أن يكون محدداً لوظيفة "${jobTitle}" في بيئة العمل الميدانية الفعلية.
4. اجعل الأسئلة تستحضر مواقف حقيقية، أرقام فعلية، أو قرارات صعبة.
5. ابتعد عن الإنشاء والعموميات.

توزيع الأسئلة:
${blueprint}
${cvContext}

أخرج JSON array فقط يحتوي على 10 strings.
مثال على سؤال جيد: "وصف لنا موقفاً واجهت فيه طبخة خرسانة مرفوضة في الموقع - كيف تعاملت مع العميل وكيف حليت المشكلة في نفس اليوم؟"
مثال على سؤال ممنوع: "ما هي نقاط قوتك؟"` 
  : `
You are a hard-nosed technical interviewer at Concreto Ready Mix (concrete & construction industry).
Your task: Generate exactly 10 realistic, specific interview questions for the role: "${jobTitle}".

Strict Rules:
1. Questions MUST be in English only.
2. NEVER use cliché questions like "What are your strengths?" or "Where do you see yourself in 5 years?".
3. Every question MUST be specific to the daily reality of a "${jobTitle}" in a construction/concrete environment.
4. Ground questions in real situations: specific numbers, equipment names, failure scenarios, decision points.
5. Avoid vague, philosophical, or classroom-style questions.

Question Distribution:
${blueprint}
${cvContext}

Return ONLY a JSON array of exactly 10 strings.
Example of a GOOD question: "You've just received a call that a concrete truck has been rejected on site due to high slump. The client is furious and the pour window is closing in 90 minutes. Walk me through your exact steps."
Example of a BANNED question: "What are your strengths?"`;

  try {
    const result = await callGemini(apiKey, prompt, true, 0.85);
    if (Array.isArray(result) && result.length >= 10) return result.slice(0, 10);
    // If Gemini returns an object with a key containing the array
    const firstArray = Object.values(result).find(v => Array.isArray(v));
    if (firstArray && firstArray.length >= 10) return firstArray.slice(0, 10);
    return null;
  } catch (error) {
    console.error('Gemini Question Generation Error:', error);
    return null;
  }
};



export const evaluateInterview = async (answers, jobTitle = "Candidate") => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("No Gemini API key found. Falling back to Mock Evaluation.");
    return fallbackMockEvaluation(answers);
  }

  const formattedAnswers = answers.map((a, i) => `[Question ${i + 1}]: ${a.question}\n[Candidate Answer]: ${a.answer}`).join('\n\n');

  const prompt = `You are a highly critical Industrial Psychologist and Senior Technical Auditor for Concreto Ready Mix. Your job is to perform a FAIL-SAFE evaluation of interview answers for the specific role of "${jobTitle}".

### STRICT ROLE EXPECTATIONS FOR "${jobTitle}"
You MUST penalize the candidate heavily if their answers lack the specific technical vocabulary, safety awareness, or operational knowledge expected for a "${jobTitle}". General or vague answers should receive a maximum score of 4/10.

### SCORING SYSTEM (0-10 Rubric per question)
- 0: Gibberish, random letters, "ok/yes/no", completely irrelevant.
- 1-3: Poor, unprofessional, or generic response lacking any knowledge of the "${jobTitle}" role.
- 4-6: Average, meets basic requirements but lacks depth or specific examples.
- 7-8: Good, professional, shows solid experience and industry knowledge.
- 9-10: Exceptional, highly detailed, demonstrates absolute mastery of the "${jobTitle}" role, leadership, and safety-first mindset.

### CATEGORY MAPPING
1. BEHAVIOR (Q1-Q3): Total Max 40. Sum the scores of Q1-Q3 and scale to 40.
2. ATTITUDE (Q4-Q6): Total Max 30. Sum the scores of Q4-Q6 and scale to 30.
3. PERSONALITY (Q7-Q10): Total Max 30. Sum the scores of Q7-Q10 and scale to 30.

### MANDATORY RULES
- If ANY answer is random typing (e.g., "asdasd", "hhhh", "123") -> Score 0 for that question.
- You MUST provide a clear "reasoning" for each score category.
- Total score must be the mathematical sum of the three category scores.
- Be extremely stingy with high scores. Only 80+ for truly impressive candidates.

### OUTPUT FORMAT (Raw JSON only)
{
  "behavior_score": <number>,
  "behavior_reasoning": "<short explanation in Arabic or English>",
  "attitude_score": <number>,
  "attitude_reasoning": "<short explanation in Arabic or English>",
  "personality_score": <number>,
  "personality_reasoning": "<short explanation in Arabic or English>",
  "total_score": <number>,
  "disc": { "d": <0-100>, "i": <0-100>, "s": <0-100>, "c": <0-100> },
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendation": "<Strong Fit | Potential Fit | Not Fit | Invalid Answers>"
}

Candidate Answers:
${formattedAnswers}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1, // Near zero for maximum consistency
            responseMimeType: "application/json",
          }
        })
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    return result;

  } catch (error) {
    console.error("Gemini AI Evaluation Error:", error);
    return fallbackMockEvaluation(answers);
  }
};

// ============ Gibberish Detection ============
const isGibberish = (text) => {
  if (!text || text.trim().length < 5) return true;
  const trimmed = text.trim();
  if (/^(.)\1{3,}$/i.test(trimmed)) return true;
  if (trimmed.length > 5 && !/[aeiouAEIOUأإاوي\s]/i.test(trimmed)) return true;
  if (/^\d+$/.test(trimmed)) return true;
  if (trimmed.split(/\s+/).length < 3 && trimmed.length < 15) return true;
  return false;
};

// ============ Fallback Mock Evaluation ============
const fallbackMockEvaluation = (answers) => {
  const scoreAnswer = (text) => {
    if (isGibberish(text)) return 0;
    const lower = text.toLowerCase();
    let score = 4;
    if (text.length > 40) score += 2;
    if (text.length > 100) score += 2;
    if (text.length > 200) score += 2;
    const keywords = ['team', 'safety', 'plan', 'resolve', 'communicate', 'listen', 'focus', 'accuracy', 'quality', 'schedule', 'manage', 'lead', 'inspect', 'test', 'report', 'حل', 'فريق', 'سلامة', 'جودة', 'استمع', 'مشكلة', 'مدير', 'عمل', 'فحص', 'تقرير', 'خطة'];
    let hits = 0;
    keywords.forEach(kw => { if (lower.includes(kw)) hits++; });
    score += Math.min(hits * 1.5, 4);
    return Math.min(Math.round(score), 10);
  };

  const padded = [...answers];
  while (padded.length < 10) padded.push({ answer: '' });

  const bScores = [scoreAnswer(padded[0].answer), scoreAnswer(padded[1].answer), scoreAnswer(padded[2].answer)];
  const aScores = [scoreAnswer(padded[3].answer), scoreAnswer(padded[4].answer), scoreAnswer(padded[5].answer)];
  const pScores = [scoreAnswer(padded[6].answer), scoreAnswer(padded[7].answer), scoreAnswer(padded[8].answer), scoreAnswer(padded[9].answer)];

  const bRaw = bScores.reduce((a, b) => a + b, 0);
  const aRaw = aScores.reduce((a, b) => a + b, 0);
  const pRaw = pScores.reduce((a, b) => a + b, 0);

  const behavior_score = bRaw === 0 ? 0 : Math.min(40, Math.round((bRaw / 30) * 40));
  const attitude_score = aRaw === 0 ? 0 : Math.min(30, Math.round((aRaw / 30) * 30));
  const personality_score = pRaw === 0 ? 0 : Math.min(30, Math.round((pRaw / 40) * 30));
  const total_score = behavior_score + attitude_score + personality_score;

  let recommendation = 'Not Fit';
  if (total_score === 0) recommendation = 'Invalid Answers';
  else if (total_score >= 80) recommendation = 'Strong Fit';
  else if (total_score >= 60) recommendation = 'Potential Fit';

  const disc = {
    d: pScores[0] === 0 ? 0 : Math.min(100, pScores[0] * 10 + 10),
    i: pScores[1] === 0 ? 0 : Math.min(100, pScores[1] * 10 + 5),
    s: pScores[2] === 0 ? 0 : Math.min(100, pScores[2] * 10 + 15),
    c: pScores[3] === 0 ? 0 : Math.min(100, pScores[3] * 10 + 20),
  };

  const validCount = [...bScores, ...aScores, ...pScores].filter(s => s > 0).length;

  return {
    behavior_score, attitude_score, personality_score, total_score, disc,
    strengths: validCount === 0 ? [] : ['Adequate technical awareness', 'Responsive to structured questions'],
    weaknesses: validCount === 0 ? ['All answers were invalid or random text.'] : ['Answers lacked depth', 'Consider providing real-world examples'],
    recommendation
  };
};
