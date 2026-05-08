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
          if (get().isAdminLoggedIn) {
            set({ jobs: [
              { _id: 'demo1', title_ar: 'مدير مشروع خرسانة', title_en: 'Concrete Project Manager', department: 'Engineering', active: true },
              { _id: 'demo2', title_ar: 'مهندس جودة', title_en: 'Quality Engineer', department: 'QC', active: true }
            ]});
          } else {
            set({ jobs: [] });
          }
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

      updateJob: async (id, jobData) => {
        try {
          console.log('Updating job:', id, jobData);
          const res = await jobService.update(id, jobData);
          set((state) => ({
            jobs: state.jobs.map(j => j._id === id ? res.data : j)
          }));
        } catch (err) {
          console.error("Error updating job:", err);
          throw err;
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
          if (get().isAdminLoggedIn) {
            set({ applicants: [
              { _id: 'a1', candidate: { name: 'أحمد محمد', email: 'ahmed@example.com', jobTitle: 'مدير مشروع' }, evaluation: { total_score: 85, recommendation: 'Strong Fit' }, appliedAt: new Date().toISOString() },
              { _id: 'a2', candidate: { name: 'Sami Ali', email: 'sami@example.com', jobTitle: 'Quality Engineer' }, evaluation: { total_score: 72, recommendation: 'Shortlisted' }, appliedAt: new Date().toISOString() }
            ]});
          } else {
            set({ applicants: [] });
          }
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
