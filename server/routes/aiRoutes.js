const express = require('express');
const router = express.Router();
const axios = require('axios');
const { apiLimiter } = require('../middleware/rateLimiter');

// Fallback template generator (Guarantees 100% success if AI fails)
const generateFallbackJD = (title, department) => {
  const isArabic = /[\u0600-\u06FF]/.test(title);
  
  if (isArabic) {
    return `الوصف الوظيفي: ${title}
القسم: ${department || 'غير محدد'}

المهام والمسؤوليات الأساسية:
- إدارة المهام اليومية المتعلقة بدور ${title} بكفاءة وفعالية.
- التعاون مع فريق ${department || 'العمل'} لتحقيق أهداف الشركة.
- إعداد التقارير الدورية وتحليل البيانات المتعلقة بالعمل.
- الالتزام بمعايير الجودة والسياسات الداخلية للشركة.

المتطلبات والمؤهلات:
- درجة بكالوريوس في تخصص ذي صلة أو خبرة معادلة.
- خبرة عملية سابقة في نفس المجال.
- مهارات تواصل ممتازة وقدرة على العمل ضمن فريق.
- إجادة استخدام البرامج والأدوات المتعلقة بالعمل.

(ملاحظة: هذا وصف وظيفي افتراضي تم توليده بسبب استنفاد حصة الذكاء الاصطناعي. يرجى تعديله حسب الحاجة الفعليه للوظيفة).`;
  }

  return `Job Description: ${title}
Department: ${department || 'Not Specified'}

Key Responsibilities:
- Manage daily operations and tasks related to the ${title} role effectively.
- Collaborate closely with the ${department || 'team'} to achieve organizational goals.
- Prepare regular reports and analyze relevant data to improve workflows.
- Ensure strict compliance with company policies and quality standards.

Requirements & Qualifications:
- Bachelor's degree in a related field or equivalent practical experience.
- Proven track record and relevant experience in a similar role.
- Excellent communication and teamwork skills.
- Proficiency in industry-standard software and tools.

(Note: This is a fallback template generated because AI quota was exceeded. Please edit and expand as needed for your specific requirements.)`;
};


// Helper to call Gemini with a specific key and model
async function callGemini(apiKey, prompt, systemPrompt, modelName) {
  // Using v1beta to support newer models like gemini-2.0-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  const response = await axios.post(url, {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { 
      temperature: 0.7, 
      maxOutputTokens: 2000,
      topP: 0.95
    }
  });

  if (response.data.error) throw new Error(response.data.error.message);
  
  if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Empty or invalid response structure from Gemini');
  }

  return response.data.candidates[0].content.parts[0].text;
}

// Helper to call OpenAI with a specific key
async function callOpenAI(apiKey, prompt, systemPrompt) {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const response = await axios.post(url, {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.data.choices?.[0]?.message?.content) {
    throw new Error('Invalid response structure from OpenAI');
  }

  return response.data.choices[0].message.content;
}

// Extract multiple keys from environment
const getKeys = (prefix) => {
  const keys = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (key.includes(prefix) && value && value.trim() !== '') {
      keys.push(value.trim());
    }
  }
  return [...new Set(keys)]; // Unique keys only
};


// POST /api/ai/generate-jd
router.post('/generate-jd', apiLimiter, async (req, res) => {
  const { title, department } = req.body;
  
  // Collect all potential keys to allow rotation if one is exhausted
  const geminiKeys = getKeys('GEMINI_API_KEY');
  const openaiKeys = getKeys('OPENAI_API_KEY');

  // Fetch dynamic AI settings from DB (configured in Owner Panel)
  let systemPrompt = "You are a professional HR Director. Write a detailed, structured job description including Responsibilities and Requirements. Keep it professional.";
  let selectedModel = 'gemini-1.5-flash';
  try {
    const SystemSettings = require('../models/SystemSettings');
    const setting = await SystemSettings.findOne({ key: 'ai_system_prompt' });
    if (setting && setting.value) {
      if (setting.value.systemPrompt) systemPrompt = setting.value.systemPrompt;
      if (setting.value.model) selectedModel = setting.value.model;
    }
  } catch (err) {
    console.warn('[AI Server] Could not fetch DB AI settings, using defaults.', err.message);
  }

  const prompt = `Write a professional JD for the following position:
Title: "${title}"
Department: "${department}"
Language: Please write in English unless the title is purely in Arabic.
Format: Plain text with clear sections.`;

  console.log(`[AI Server] JD Request for: "${title}" (${department || 'N/A'}) using model: ${selectedModel}`);

  // Try Gemini keys first
  for (let i = 0; i < geminiKeys.length; i++) {
    try {
      console.log(`[AI Server] Attempting Gemini (Key ${i + 1}/${geminiKeys.length})...`);
      const result = await callGemini(geminiKeys[i], prompt, systemPrompt, selectedModel);
      return res.json({ text: result, provider: 'gemini', model: selectedModel });
    } catch (err) {
      console.error(`[AI Server] Gemini Key ${i + 1} failed:`, err.message);
      // Continue to next key
    }
  }

  // Try OpenAI keys as fallback
  for (let i = 0; i < openaiKeys.length; i++) {
    try {
      console.log(`[AI Server] Attempting OpenAI fallback (Key ${i + 1}/${openaiKeys.length})...`);
      const result = await callOpenAI(openaiKeys[i], prompt, systemPrompt);
      return res.json({ text: result, provider: 'openai' });
    } catch (err) {
      console.error(`[AI Server] OpenAI Key ${i + 1} failed:`, err.message);
      // Continue to next key
    }
  }

  // If ALL keys failed (or no keys exist), use RADICAL FALLBACK
  console.log(`[AI Server] ALL AI PROVIDERS FAILED OR QUOTA EXCEEDED. Using Fallback Template.`);
  const fallbackDraft = generateFallbackJD(title, department);
  
  // Return HTTP 200 with the fallback draft so the frontend NEVER breaks
  return res.status(200).json({ 
    text: fallbackDraft, 
    provider: 'fallback_template',
    notice: 'AI Quota Exceeded. Used fallback template.'
  });
});

// POST /api/ai/generate-jd-questions
router.post('/generate-jd-questions', apiLimiter, async (req, res) => {
  const { title, department, description, count, language } = req.body;
  
  const targetCount = count || 5;
  const isAr = language === 'ar';
  
  const geminiKeys = getKeys('GEMINI_API_KEY');
  const openaiKeys = getKeys('OPENAI_API_KEY');

  const jdContext = description ? `\nJOB DESCRIPTION:\n${description.slice(0, 2000)}` : '';

  const structuredPrompt = isAr ? `
أنت خبير توظيف لمنصة TalentFlow.
مهمتك: توليد بالضبط ${targetCount} سؤال مقابلة.

الوظيفة: "${title}" (${department || 'غير محدد'})
${jdContext}

يجب أن تكون الأسئلة موزعة هكذا (بالنسب الأقرب لـ ${targetCount} أسئلة):
- 30% أسئلة صح أو غلط (truefalse)
- 40% أسئلة اختيار من متعدد (mcq) مع 4 خيارات واضحة
- 30% أسئلة مقالية (essay)

القواعد:
1. الأسئلة باللغة العربية
2. مبنية فقط على الوصف الوظيفي (JD) المقدم.
3. الأسئلة التقنية يجب أن تختبر مهارات حقيقية.

أخرج JSON array فقط بهذا الشكل:
[{
  "type": "truefalse",
  "text": "نص السؤال",
  "correctAnswer": "true أو false",
  "category": "Technical",
  "weight": 1
}, {
  "type": "mcq",
  "text": "نص السؤال",
  "choices": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
  "correctAnswer": "الخيار الصحيح كما هو مكتوب في choices",
  "category": "Technical",
  "weight": 1.2
}, {
  "type": "essay",
  "text": "نص السؤال المقالي",
  "category": "Behavioral",
  "weight": 1
}]`
  : `
You are a recruitment expert for TalentFlow.
Task: Generate exactly ${targetCount} interview questions.

Job Title: "${title}" (${department || 'Unspecified'})
${jdContext}

Distribute questions as follows (closest distribution for ${targetCount} questions):
- 30% True/False questions (truefalse)
- 40% Multiple Choice questions (mcq) with 4 clear answer choices
- 30% Essay questions (essay)

Rules:
1. Questions MUST be in English
2. Base the questions entirely on the provided Job Description (JD).
3. Technical questions must test real, specific skills.

Return ONLY a JSON array in this format:
[{
  "type": "truefalse",
  "text": "Question text",
  "correctAnswer": "true or false",
  "category": "Technical",
  "weight": 1
}, {
  "type": "mcq",
  "text": "Question text",
  "choices": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The exact correct option text as written in choices",
  "category": "Technical",
  "weight": 1.2
}, {
  "type": "essay",
  "text": "Open-ended question",
  "category": "Behavioral",
  "weight": 1
}]`;

  console.log(`[AI Server] JD-Questions Request for: "${title}"`);

  // Try Gemini keys
  for (let i = 0; i < geminiKeys.length; i++) {
    try {
      const resultStr = await callGemini(geminiKeys[i], structuredPrompt, "You are a senior technical recruiter. Return JSON ONLY.", 'gemini-1.5-flash');
      
      // Parse JSON from result
      let parsed = [];
      try {
        const raw = resultStr.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/i, '').trim();
        parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) && parsed.questions) parsed = parsed.questions;
      } catch(e) {
         console.warn("[AI Server] Gemini JD-Questions JSON parse failed", e);
      }
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ questions: parsed, provider: 'gemini' });
      }
    } catch (err) {
      console.error(`[AI Server] Gemini Key ${i + 1} failed for questions:`, err.message);
    }
  }

  // Try OpenAI keys
  for (let i = 0; i < openaiKeys.length; i++) {
    try {
      const resultStr = await callOpenAI(openaiKeys[i], structuredPrompt, "You are a senior technical recruiter. Return JSON ONLY.");
      let parsed = [];
      try {
        const raw = resultStr.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/i, '').trim();
        parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) && parsed.questions) parsed = parsed.questions;
      } catch(e) {}

      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ questions: parsed, provider: 'openai' });
      }
    } catch (err) {
      console.error(`[AI Server] OpenAI Key ${i + 1} failed for questions:`, err.message);
    }
  }

  // Fallback if APIs fail or quota exceeded
  console.log(`[AI Server] JD-Questions FAILED. Using Fallback.`);
  const fallbackQuestions = isAr ? [
    { type: "essay", text: "بناءً على خبرتك، كيف يمكنك أداء مهام هذه الوظيفة بنجاح؟", category: "Technical", weight: 1 },
    { type: "truefalse", text: "العمل الجماعي والتعاون ضروريان لنجاح أي قسم في الشركة.", correctAnswer: "true", category: "Behavioral", weight: 1 },
    { type: "mcq", text: "ما هي المهارة الأهم لإدارة ضغط العمل؟", choices: ["التنظيم الجيد", "تجاهل المهام", "تأجيل العمل", "العمل الفردي"], correctAnswer: "التنظيم الجيد", category: "Behavioral", weight: 1.2 },
    { type: "essay", text: "أخبرنا عن موقف واجهت فيه تحدياً في مشروع مشابه وكيف حللته.", category: "Hybrid", weight: 1 },
    { type: "truefalse", text: "الالتزام بمواعيد التسليم غير مهم طالما جودة العمل جيدة.", correctAnswer: "false", category: "Attitude", weight: 1 }
  ] : [
    { type: "essay", text: "Based on your experience, how would you successfully perform the tasks of this job?", category: "Technical", weight: 1 },
    { type: "truefalse", text: "Teamwork and collaboration are essential to the success of any department.", correctAnswer: "true", category: "Behavioral", weight: 1 },
    { type: "mcq", text: "What is the most important skill for managing work pressure?", choices: ["Good Organization", "Ignoring tasks", "Procrastination", "Working alone"], correctAnswer: "Good Organization", category: "Behavioral", weight: 1.2 },
    { type: "essay", text: "Tell us about a time you faced a challenge in a similar project and how you resolved it.", category: "Hybrid", weight: 1 },
    { type: "truefalse", text: "Meeting deadlines is unimportant as long as the work quality is good.", correctAnswer: "false", category: "Attitude", weight: 1 }
  ];

  return res.status(200).json({ questions: fallbackQuestions.slice(0, targetCount), provider: 'fallback_template' });
});

// POST /api/ai/analyze-cv
router.post('/analyze-cv', apiLimiter, async (req, res) => {
  const { contentDescription } = req.body;
  const geminiKeys = getKeys('GEMINI_API_KEY');
  const openaiKeys = getKeys('OPENAI_API_KEY');

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
  "is_fit_for_interview": <boolean true/false>
}`;

  for (let key of geminiKeys) {
    try {
      const resultStr = await callGemini(key, prompt, "You are a senior technical recruiter. Return JSON ONLY.", 'gemini-1.5-flash');
      const raw = resultStr.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/i, '').trim();
      return res.json(JSON.parse(raw));
    } catch(e) {}
  }
  
  for (let key of openaiKeys) {
    try {
      const resultStr = await callOpenAI(key, prompt, "You are a senior technical recruiter. Return JSON ONLY.");
      const raw = resultStr.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/i, '').trim();
      return res.json(JSON.parse(raw));
    } catch(e) {}
  }
  
  return res.status(500).json({ message: "AI Analysis failed" });
});

// POST /api/ai/generate-questions
router.post('/generate-questions', apiLimiter, async (req, res) => {
  const { jobTitle, cvData, language, customBank, targetCount, jobDescription } = req.body;
  const geminiKeys = getKeys('GEMINI_API_KEY');
  const openaiKeys = getKeys('OPENAI_API_KEY');
  
  const hasArabicCustom = (customBank || []).some(q => {
    const text = typeof q === 'string' ? q : (q.text || q.question || '');
    return /[\u0600-\u06FF]/.test(text);
  });
  const finalLanguage = hasArabicCustom ? 'ar' : (language || 'en');
  const isAr = finalLanguage === 'ar';

  const cvContext = cvData
    ? `\nCANDIDATE CV:\nSummary: "${cvData.summary}"\nSkills: ${(cvData.skills||[]).join(', ')}\nExperience: ${cvData.experience_years} years`
    : '';
  const jdContext = jobDescription
    ? `\nJOB DESCRIPTION:\n${jobDescription.slice(0, 1500)}`
    : '';

  const customCount = Math.min((customBank || []).length, targetCount);
  const aiCount = Math.max(0, targetCount - customCount);

  const structuredPrompt = isAr ? `
أنت محاور ذكاء اصطناعي متخصص في التوظيف.
العدد المطلوب: ${aiCount} سؤال.
الوظيفة: "${jobTitle}"
${jdContext}
${cvContext}
يجب أن تكون الأسئلة موزعة: 30% صح أو غلط، 40% اختيارات متعدة، 30% مقالية. قم بدمج سؤال واحد من نوع "سيناريو" (scenario) لمحاكاة دور وتفاعل حي.
الأسئلة باللغة العربية ومخصصة للمتقدم.
أخرج JSON array بهذا الشكل:
[{ "type": "truefalse", "question": "...", "correctAnswer": "true", "category": "Technical", "weight": 1 },
 { "type": "mcq", "question": "...", "choices": ["أ", "ب", "ج", "د"], "correctAnswer": "أ", "category": "Technical", "weight": 1.2 },
 { "type": "essay", "question": "...", "category": "Behavioral", "weight": 1 },
 { "type": "scenario", "question": "أنت تواجه العميل الغاضب... ماذا تفعل؟", "category": "Hybrid", "weight": 2 }]`
  : `
You are an AI interviewer. Generate ${aiCount} questions.
Job Title: "${jobTitle}"
${jdContext}
${cvContext}
Distribution: 30% True/False, 40% MCQ, 30% Essay. Include at least 1 "scenario" type question for Role-Play simulation.
Questions MUST be in English and personalized.
Return ONLY a JSON array:
[{ "type": "truefalse", "question": "...", "correctAnswer": "true", "category": "Technical", "weight": 1 },
 { "type": "mcq", "question": "...", "choices": ["A", "B", "C", "D"], "correctAnswer": "A", "category": "Technical", "weight": 1.2 },
 { "type": "essay", "question": "...", "category": "Behavioral", "weight": 1 },
 { "type": "scenario", "question": "You are facing this angry customer situation... How do you respond?", "category": "Hybrid", "weight": 2 }]`;

  let aiQuestions = [];
  try {
    for (let key of geminiKeys) {
      try {
        const resultStr = await callGemini(key, structuredPrompt, "Return JSON ONLY.", 'gemini-1.5-flash');
        const raw = resultStr.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/i, '').trim();
        const parsed = JSON.parse(raw);
        aiQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        if(aiQuestions.length > 0) break;
      } catch(e) {}
    }
    if (aiQuestions.length === 0) {
      for (let key of openaiKeys) {
        try {
          const resultStr = await callOpenAI(key, structuredPrompt, "Return JSON ONLY.");
          const raw = resultStr.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/i, '').trim();
          const parsed = JSON.parse(raw);
          aiQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
          if(aiQuestions.length > 0) break;
        } catch(e) {}
      }
    }

    const correctAnswers = {};
    const formattedCustom = (customBank || []).slice(0, customCount).map((q, i) => {
      const type = q.type || 'essay';
      if (q.correctAnswer) correctAnswers[i] = String(q.correctAnswer);
      return { type, question: typeof q === 'string' ? q : (q.text || q.question || ''), category: q.category || 'Technical', weight: q.weight || 1, choices: q.choices || [] };
    });

    const formattedAi = aiQuestions.slice(0, aiCount).map((q, i) => {
      const globalIndex = formattedCustom.length + i;
      if (q.correctAnswer) correctAnswers[globalIndex] = String(q.correctAnswer);
      return { type: q.type || 'essay', question: q.question || q.text || '', choices: q.choices || [], category: q.category || 'Technical', weight: q.weight || 1 };
    });

    const merged = [...formattedCustom, ...formattedAi];
    return res.json({ questions: merged.slice(0, targetCount), correctAnswers });
  } catch(e) {
    return res.status(500).json({ error: "Failed to generate questions" });
  }
});

// POST /api/ai/evaluate
router.post('/evaluate', apiLimiter, async (req, res) => {
  const { answers, jobTitle, questionCategories, correctAnswers, cvData, jobDescription } = req.body;
  const geminiKeys = getKeys('GEMINI_API_KEY');
  const openaiKeys = getKeys('OPENAI_API_KEY');

  let mcqCorrect = 0;
  let mcqTotal = 0;
  const scoredAnswers = answers.map((a, i) => {
    if (a.type === 'mcq' || a.type === 'truefalse') {
      mcqTotal++;
      const expected = String(correctAnswers[i] || '').trim().toLowerCase();
      const given = String(a.answer || '').trim().toLowerCase();
      const isCorrect = given === expected || given.includes(expected) || expected.includes(given);
      if (isCorrect) mcqCorrect++;
      return { ...a, isCorrect, score: isCorrect ? 10 : 0 };
    }
    return { ...a, isCorrect: null, score: null };
  });

  const mcqScore = mcqTotal > 0 ? Math.round((mcqCorrect / mcqTotal) * 40) : 0;
  const essayAnswers = scoredAnswers.filter(a => a.type === 'essay');

  const formattedEssays = essayAnswers.map((a, i) => {
    const category = (questionCategories || [])[answers.indexOf(a)] || 'Technical';
    return `[Essay ${i + 1}] (${category}): ${a.question}\n[Answer]: ${a.answer}`;
  }).join('\n\n');

  const prompt = `You are a Senior HR Director and Expert Psychometrician evaluating a candidate for "${jobTitle}".
OBJECTIVE EVALUATION — Essay Questions Only:
${formattedEssays}

CANDIDATE CV SKILLS CLAIMED: ${cvData?.skills?.join(', ') || ''}
JOB DESCRIPTION SUMMARY: ${jobDescription ? jobDescription.slice(0, 500) : 'Not provided'}

SCORING RULES & EXPECTATIONS:
1. Cross-reference the answers with the CV skills. If the candidate claims high experience but gives shallow answers, flag this as a potential inconsistency.
2. Score behavior, attitude, and personality from 0 to 40/30/30 respectively.
3. Write a "detailed_reasoning" paragraph explaining exactly why the candidate got these scores. Be critical and professional.
4. Calculate a "cv_consistency_score" (0-100) indicating if their answers prove their CV claims.
5. Provide "lie_detection_flags" if there are major discrepancies between claimed skills and actual answers.

MANDATORY OUTPUT (raw JSON only, no markdown formatting blocks):
{ 
  "behavior_score": <0-40>, 
  "behavior_reasoning": "...", 
  "attitude_score": <0-30>, 
  "attitude_reasoning": "...", 
  "personality_score": <0-30>, 
  "personality_reasoning": "...", 
  "total_score": <sum of all scores>, 
  "disc": { "d": 50, "i": 50, "s": 50, "c": 50 }, 
  "strengths": ["..."], 
  "weaknesses": ["..."], 
  "recommendation": "<Strong Fit | Potential Fit | Not Fit>", 
  "gap_analysis": "...", 
  "retention_probability": <0-100>,
  "cv_consistency_score": <0-100>,
  "detailed_reasoning": "Comprehensive paragraph explaining the scoring...",
  "lie_detection_flags": ["Any specific contradictions found, or empty array if none"]
}`;

  try {
    let rawStr = null;
    for (let key of geminiKeys) {
      try {
        rawStr = await callGemini(key, prompt, "Return JSON ONLY.", 'gemini-1.5-flash');
        if (rawStr) break;
      } catch(e) {}
    }
    if (!rawStr) {
      for (let key of openaiKeys) {
        try {
          rawStr = await callOpenAI(key, prompt, "Return JSON ONLY.");
          if (rawStr) break;
        } catch(e) {}
      }
    }
    
    if (rawStr) {
      const raw = rawStr.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/i, '').trim();
      const result = JSON.parse(raw);
      const blendedTotal = Math.min(100, Math.round((result.total_score * 0.6) + (mcqScore * 1.0)));
      let recommendation = result.recommendation;
      if (blendedTotal >= 80) recommendation = 'Strong Fit';
      else if (blendedTotal >= 60) recommendation = 'Potential Fit';
      
      // Calculate Retention Probability heuristically if AI omitted it
      let retention_probability = result.retention_probability || 0;
      if (retention_probability === 0) {
        retention_probability = Math.min(99, Math.round((blendedTotal * 0.7) + (result.disc.s * 0.5) + (result.disc.c * 0.3)));
      }

      return res.json({ ...result, total_score: blendedTotal, recommendation, mcq_score: mcqScore, essay_score: result.total_score, mcqCorrect, mcqTotal, gap_analysis: result.gap_analysis || '', retention_probability, answers: scoredAnswers });
    }
  } catch(e) {}

  return res.status(500).json({ message: "Evaluation failed" });
});

module.exports = router;
