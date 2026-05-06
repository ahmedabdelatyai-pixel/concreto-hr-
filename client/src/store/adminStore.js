import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jobService, applicantService } from '../services/api';

export const useAdminStore = create(
  persist(
    (set, get) => ({
      // Admin authentication
      isAdminLoggedIn: false,
      adminLogin: (password) => {
        if (password === 'concreto2025') {
          set({ isAdminLoggedIn: true });
          return true;
        }
        return false;
      },
      adminLogout: () => set({ isAdminLoggedIn: false }),

      // Jobs management
      jobs: [],
      
      fetchJobs: async () => {
        try {
          console.log('Fetching jobs...');
          const res = await jobService.getAll();
          console.log('Jobs fetched:', res.data);
          set({ jobs: res.data });
        } catch (err) {
          console.error("Error fetching jobs:", err);
          set({ jobs: [] });
        }
      },

      addJob: async (job) => {
        try {
          console.log('Adding job:', job);
          const res = await jobService.create(job);
          set((state) => ({ jobs: [...state.jobs, res.data] }));
        } catch (err) {
          console.error("Error adding job:", err);
          throw err;
        }
      },

      deleteJob: async (id) => {
        try {
          await jobService.delete(id);
          set((state) => ({ jobs: state.jobs.filter(j => j._id !== id) }));
        } catch (err) {
          console.error("Error deleting job:", err);
        }
      },

      // Applicants management
      applicants: [],

      fetchApplicants: async () => {
        try {
          console.log('Fetching applicants...');
          const res = await applicantService.getAll();
          console.log('Applicants fetched:', res.data);
          set({ applicants: res.data });
        } catch (err) {
          console.error("Error fetching applicants:", err);
          set({ applicants: [] });
        }
      },

      addApplicant: async (applicant) => {
        try {
          const res = await applicantService.create(applicant);
          set((state) => ({ applicants: [...state.applicants, res.data] }));
        } catch (err) {
          console.error("Error adding applicant:", err);
        }
      },

      clearApplicants: async () => {
        try {
          await applicantService.clear();
          set({ applicants: [] });
        } catch (err) {
          console.error("Error clearing applicants:", err);
        }
      }
    }),
    {
      name: 'concreto-admin-store',
    }
  )
);
