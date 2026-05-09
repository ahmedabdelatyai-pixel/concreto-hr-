import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useInterviewStore = create(
  persist(
    (set) => ({
      candidate: {
        name: '',
        email: '',
        role: '',
        jobTitle: '',
        jobId: '',
        applicantId: '',
        accessSecret: '',
        questionCount: 10,
        customQuestions: [],
        source: 'Website',
        jobDescription: '', // ✅ for AI JD-based question generation
      },
      cvData: null,
      cvFile: null,
      generatedQuestions: [],
      // ✅ { index: correctAnswer } — for MCQ/T-F instant auto-scoring
      correctAnswers: {},
      interviewAnswers: [],
      evaluation: null,
      // ✅ integrity tracking (cheat counter)
      cheatAttempts: 0,

      setCandidateInfo: (info) => set((state) => ({
        candidate: { ...state.candidate, ...info }
      })),

      setCvData: (data) => set({ cvData: data }),
      setCvFile: (file) => set({ cvFile: file }),

      setQuestions: (questions) => {
        console.log('Setting dynamic questions in store:', questions.length);
        set({ generatedQuestions: questions });
      },

      // ✅ store correct answers map (generated alongside questions)
      setCorrectAnswers: (answersMap) => set({ correctAnswers: answersMap }),

      // type: 'essay' | 'mcq' | 'truefalse'
      addAnswer: (question, answer, category = 'Technical', weight = 1, type = 'essay', questionIndex = null) =>
        set((state) => ({
          interviewAnswers: [
            ...state.interviewAnswers,
            { question, answer, category, weight, type, questionIndex }
          ]
        })),

      setEvaluation: (evaluation) => set({ evaluation }),

      // ✅ called from InterviewPhase anti-cheat
      incrementCheat: () => set((state) => ({ cheatAttempts: state.cheatAttempts + 1 })),

      reset: () => set({
        candidate: {
          name: '', email: '', role: '', jobTitle: '', jobId: '',
          applicantId: '', accessSecret: '', questionCount: 10,
          customQuestions: [], source: 'Website', jobDescription: ''
        },
        cvData: null,
        cvFile: null,
        generatedQuestions: [],
        correctAnswers: {},
        interviewAnswers: [],
        evaluation: null,
        cheatAttempts: 0,
      })
    }),
    {
      name: 'talentflow-interview-v4',
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => key !== 'cvFile')
        ),
    }
  )
);
