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
        source: 'Website',
      },
      customQuestions: [],
      cvData: null,
      cvFile: null,
      generatedQuestions: [],
      interviewAnswers: [],
      evaluation: null,

      setCandidateInfo: (info) => set((state) => ({ 
        candidate: { ...state.candidate, ...info } 
      })),

      setCvData: (data) => set({ cvData: data }),
      setCvFile: (file) => set({ cvFile: file }),

      setQuestions: (questions) => {
        console.log("Setting dynamic questions in store:", questions);
        set({ generatedQuestions: questions });
      },

      addAnswer: (question, answer) => set((state) => ({
        interviewAnswers: [...state.interviewAnswers, { question, answer }]
      })),

      setEvaluation: (evaluation) => set({ evaluation }),

      reset: () => set({
        candidate: { name: '', email: '', role: '', jobTitle: '' },
        cvData: null,
        cvFile: null,
        generatedQuestions: [],
        interviewAnswers: [],
        evaluation: null
      })
    }),
    {
      name: 'concreto-interview-v2', // Changed version to force refresh
      partialize: (state) => 
        Object.fromEntries(
          Object.entries(state).filter(([key]) => key !== 'cvFile')
        ),
    }
  )
);
