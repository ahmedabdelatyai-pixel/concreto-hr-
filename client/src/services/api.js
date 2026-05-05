import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const applicantService = {
  getAll: () => api.get('/applicants'),
  create: (data) => api.post('/applicants', data),
  clear: () => api.delete('/applicants/clear'),
};

export const jobService = {
  getAll: () => api.get('/jobs'),
  create: (data) => api.post('/jobs', data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

export default api;
