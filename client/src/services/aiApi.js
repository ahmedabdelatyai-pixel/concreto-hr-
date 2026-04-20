/**
 * AI Evaluation Service (Google Gemini Integration)
 * Concreto Ready Mix - HR Platform
 */

export const analyzeCv = async (file) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  // In a real production app, we would use a library like pdfjs-dist here.
  // For this high-end demo, we simulate the extraction of text from the file name and metadata
  // and use Gemini to provide a professional profile based on the context.
  
  const prompt = `Analyze this candidate's application for a construction industry role. 
  File Name: ${file.name}
  File Size: ${(file.size / 1024).toFixed(2)} KB
  
  Based on the file name and industry context (Concreto Ready Mix), generate a professional candidate profile.
  Return a raw JSON object:
  {
    "summary": "Professional summary...",
    "skills": ["Skill 1", "Skill 2", ...],
    "experience_years": <number>,
    "education": "Degree name...",
    "technical_match": <0-100 percentage>,
    "is_fit_for_interview": true/false
  }`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, responseMimeType: "application/json" }
        })
      }
    );
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("CV Analysis Error:", error);
    return null;
  }
};

export const generateQuestions = async (jobTitle, cvData, language = 'en') => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const cvContext = cvData ? `Candidate Summary: ${cvData.summary}. Skills: ${cvData.skills.join(', ')}.` : '';
  const langText = language === 'ar' ? 'Arabic (العربية)' : 'English';

  const prompt = `You are a professional recruiter. Generate 10 interview questions for the role of "${jobTitle}" at a concrete company.
The questions must be in ${langText}.
Structure: 3 behavior, 3 attitude, 4 personality.
${cvContext ? `Tailor questions to this candidate: ${cvContext}` : ''}

Output MUST be a valid JSON array of 10 strings.
Example: ["Question 1", "Question 2", ...]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.8,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          }
        })
      }
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    let text = data.candidates[0].content.parts[0].text;
    // Remove potential markdown code blocks
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.error("Gemini Question Generation Error:", error);
    return null;
  }
};

export const evaluateInterview = async (answers) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("No Gemini API key found. Falling back to Mock Evaluation.");
    return fallbackMockEvaluation(answers);
  }

  const formattedAnswers = answers.map((a, i) => `[Question ${i + 1}]: ${a.question}\n[Candidate Answer]: ${a.answer}`).join('\n\n');

  const prompt = `You are a highly critical Industrial Psychologist and Senior Recruitment Auditor for Concreto Ready Mix. Your job is to perform a FAIL-SAFE evaluation of interview answers.

### SCORING SYSTEM (0-10 Rubric per question)
- 0: Gibberish, random letters, "ok/yes/no", or completely irrelevant.
- 1-3: Poor, unprofessional, or extremely brief (one-line generic response).
- 4-6: Average, meets basic requirements but lacks depth or specific examples.
- 7-8: Good, professional, shows experience and industry knowledge.
- 9-10: Exceptional, detailed, demonstrates leadership, safety-first mindset, and construction expertise.

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
