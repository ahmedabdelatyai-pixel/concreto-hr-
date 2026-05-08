/**
 * AI Evaluation Service (Google Gemini Integration)
 * TalentFlow - HR Platform
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

  const prompt = `You are an expert CV parser and HR analyst for TalentFlow (AI-driven recruitment platform).
Analyze this job application carefully:

${contentDescription}

Extract and generate a structured candidate profile based on the content above.
Return a JSON object with these EXACT keys:
{
  "summary": "A 2-3 sentence professional summary highlighting the candidate's most relevant experience and key value proposition",
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  "experience_years": <integer 0-30>,
  "education": "Highest degree and field of study",
  "technical_match": <integer 0-100, based on relevance to the applied job role>,
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
  },
  en: {
    default: `
- 4 technical questions directly tied to real daily tasks of a "${'{jobTitle'}" (NOT generic)
- 2 situational questions about real problems/incidents this role faces
- 2 questions about safety culture and teamwork under operational pressure
- 2 personality questions testing accountability, punctuality, and self-driven learning`,
  },
};

const getBlueprintForRole = (jobTitle, lang) => {
  const blueprints = ROLE_BLUEPRINTS[lang === 'ar' ? 'ar' : 'en'];
  return blueprints.default.replace('{jobTitle}', jobTitle);
};

export const generateQuestions = async (jobTitle, cvData, language = 'en', customBank = [], targetCount = 10) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  // Calculate how many AI questions we need to fill the gap
  const customCount = customBank.length;
  const needed = Math.max(0, targetCount - customCount);

  // If we already have enough custom questions, just return them formatted
  if (needed === 0) {
    return customBank.slice(0, targetCount).map(q => ({
      question: typeof q === 'string' ? q : q.text,
      category: q.category || 'Technical',
      weight: q.weight || 1
    }));
  }

  const isArabic = language === 'ar';
  const langText = isArabic ? 'Arabic (العربية)' : 'English';
  const blueprint = getBlueprintForRole(jobTitle, language);
  const cvContext = cvData
    ? `\nThe candidate's CV summary: "${cvData.summary}". Their declared skills: ${cvData.skills?.join(', ')}.`
    : '';

  const prompt = isArabic ? `
أنت محاور تقني محترف في منصة TalentFlow.
مهمتك: توليد ${needed} أسئلة مقابلة إضافية للوظيفة: "${jobTitle}" لتكملة قائمة الأسئلة المخصصة.

قواعد صارمة:
1. الأسئلة يجب أن تكون باللغة العربية فقط.
2. لا تكرر أي فكرة موجودة في الـ CV أو الأسئلة العامة.
3. التوزيع المطلوب للـ ${needed} أسئلة:
${blueprint}
${cvContext}

أخرج JSON array فقط يحتوي على بالضبط ${needed} objects بهذا الشكل:
[{"question": "السؤال هنا", "category": "Technical|Behavioral|Attitude|Hybrid", "weight": 1.0}, ...]` 
  : `
You are a professional technical interviewer on TalentFlow.
Your task: Generate exactly ${needed} additional interview questions for the role: "${jobTitle}" to complete the interview set.

Strict Rules:
1. Questions MUST be in English only.
2. Distribution for these ${needed} questions:
${blueprint}
${cvContext}

Return ONLY a JSON array of exactly ${needed} objects in this format:
[{"question": "Question here", "category": "Technical|Behavioral|Attitude|Hybrid", "weight": 1.0}, ...]`;

  try {
    const aiResult = await callGemini(apiKey, prompt, true, 0.85);
    let aiQuestions = [];
    
    if (Array.isArray(aiResult)) {
      aiQuestions = aiResult;
    } else {
      aiQuestions = Object.values(aiResult).find(v => Array.isArray(v)) || [];
    }

    // Format Custom Questions
    const formattedCustom = customBank.map(q => ({
      question: typeof q === 'string' ? q : q.text,
      category: q.category || 'Technical',
      weight: q.weight || 1
    }));

    // Format AI Questions
    const formattedAi = aiQuestions.map(q => ({
      question: typeof q === 'string' ? q : q.question,
      category: q.category || 'Technical',
      weight: q.weight || 1
    }));

    // Merge: Custom first, then AI
    return [...formattedCustom, ...formattedAi].slice(0, targetCount);
    
  } catch (error) {
    console.error('Gemini Question Generation Error:', error);
    return null;
  }
};



export const evaluateInterview = async (answers, jobTitle = "Candidate", questionCategories = []) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("No Gemini API key found. Falling back to Mock Evaluation.");
    return fallbackMockEvaluation(answers, questionCategories);
  }

  // Map answers with categories and weights
  const formattedAnswers = answers.map((a, i) => {
    const category = questionCategories[i] || 'Technical';
    const weight = a.weight || 1;
    return `[Question ${i + 1}] (${category}, Weight: ${weight}x): ${a.question}\n[Candidate Answer]: ${a.answer}`;
  }).join('\n\n');

  const prompt = `You are a Senior Industrial Psychologist and Technical Interview Auditor for TalentFlow AI recruitment platform. Your mission is to perform a rigorous, unbiased evaluation that distinguishes between genuine behavioral traits and diplomatic/canned responses.

CRITICAL ANALYSIS FRAMEWORK:

### DISTINGUISHING AUTHENTIC vs DIPLOMATIC RESPONSES
- **Authentic Responses**: Include specific details, concrete examples, measurable outcomes, and personal reflections. Show genuine problem-solving approaches and learning experiences.
- **Diplomatic/Canned Responses**: Generic phrases like "I work well in teams," "I'm a hard worker," "I communicate effectively." Lack specific examples, timelines, or measurable results.

### STAR METHOD ENFORCEMENT
Every behavioral question MUST be evaluated on STAR method usage:
- **Situation**: Did they describe the specific context/problem?
- **Task**: Did they explain their specific responsibility?
- **Action**: Did they detail the steps they took (not "we" but "I")?
- **Result**: Did they provide measurable outcomes and lessons learned?

PENALIZE HEAVILY (subtract 3-5 points) for:
- Not using STAR method in behavioral questions
- Vague or generic answers
- Diplomatic responses without examples
- Answers that sound rehearsed or scripted

### QUESTION CATEGORY ANALYSIS
**Technical Questions**: Evaluate depth of knowledge, problem-solving approach, and industry expertise.
**Behavioral Questions**: Require complete STAR method. Penalize generic teamwork/safety answers.
**Attitude Questions**: Look for genuine work ethic, accountability, and professional maturity.
**Hybrid Questions**: Combine technical accuracy with behavioral demonstration.

### SCORING SYSTEM (0-10 Rubric per question, weighted)
- 0: Gibberish, random letters, "ok/yes/no", completely irrelevant.
- 1-3: Poor, unprofessional, or generic response lacking any knowledge of the "${jobTitle}" role.
- 4-6: Average, meets basic requirements but lacks depth or specific examples.
- 7-8: Good, professional, shows solid experience and industry knowledge.
- 9-10: Exceptional, highly detailed, demonstrates absolute mastery of the "${jobTitle}" role, leadership, and safety-first mindset.

### WEIGHTED SCORING BY CATEGORY
- Technical questions: Base score × weight (default 1.0)
- Behavioral questions: Base score × weight (default 1.0) - focus on STAR method usage
- Attitude questions: Base score × weight (default 1.0) - evaluate professionalism and work ethic
- Hybrid questions: Base score × weight (default 1.2) - combined technical + behavioral assessment

### CATEGORY MAPPING WITH WEIGHTS
1. BEHAVIOR (Q1-Q3): Sum weighted scores, scale to 40 max
2. ATTITUDE (Q4-Q6): Sum weighted scores, scale to 30 max  
3. PERSONALITY (Q7-Q10): Sum weighted scores, scale to 30 max

### MANDATORY RULES
- If ANY answer is random typing (e.g., "asdasd", "hhhh", "123") -> Score 0 for that question.
- Penalize diplomatic answers: Subtract 2 points for generic phrases.
- Require STAR method for behavioral questions: -3 points if missing.
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
const fallbackMockEvaluation = (answers, questionCategories = []) => {
  const scoreAnswer = (text, category = 'Technical', weight = 1) => {
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
    
    // Apply category bonus
    if (category === 'Behavioral' && (lower.includes('situation') || lower.includes('task') || lower.includes('action') || lower.includes('result'))) {
      score += 1; // STAR method bonus
    }
    
    return Math.min(Math.round(score * weight), 10);
  };

  const padded = [...answers];
  while (padded.length < 10) padded.push({ answer: '', category: 'Technical', weight: 1 });

  const bScores = [scoreAnswer(padded[0].answer, questionCategories[0], padded[0].weight), 
                   scoreAnswer(padded[1].answer, questionCategories[1], padded[1].weight), 
                   scoreAnswer(padded[2].answer, questionCategories[2], padded[2].weight)];
  const aScores = [scoreAnswer(padded[3].answer, questionCategories[3], padded[3].weight), 
                   scoreAnswer(padded[4].answer, questionCategories[4], padded[4].weight), 
                   scoreAnswer(padded[5].answer, questionCategories[5], padded[5].weight)];
  const pScores = [scoreAnswer(padded[6].answer, questionCategories[6], padded[6].weight), 
                   scoreAnswer(padded[7].answer, questionCategories[7], padded[7].weight), 
                   scoreAnswer(padded[8].answer, questionCategories[8], padded[8].weight), 
                   scoreAnswer(padded[9].answer, questionCategories[9], padded[9].weight)];

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
