import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If it's a 401 error, only redirect if NOT in demo mode
    const isAdminLoggedIn = localStorage.getItem('concreto-admin-store') 
      ? JSON.parse(localStorage.getItem('concreto-admin-store')).state.isAdminLoggedIn 
      : false;

    if (error.response?.status === 401 && !isAdminLoggedIn) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const applicantService = {
  getAll: (query = {}) => api.get('/applicants', { params: query }),
  getOne: (id) => api.get(`/applicants/${id}`),
  create: (data) => api.post('/applicants', data),
  update: (id, data) => api.put(`/applicants/${id}`, data),
  updateStatus: (id, status) => api.patch(`/applicants/${id}/status`, { status }),
  delete: (id) => api.delete(`/applicants/${id}`),
  clear: () => api.delete('/applicants/clear/all'),
  getStats: () => api.get('/applicants/stats'),
};

export const integrityService = {
  getAll: () => api.get('/integrity'),
  getOne: (id) => api.get(`/integrity/${id}`),
  delete: (id) => api.delete(`/integrity/${id}`),
};

export const jobService = {
  getAll: (query = {}) => api.get('/jobs', { params: query }),
  getOne: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  updateStatus: (id, active) => api.patch(`/jobs/${id}/status`, { active }),
  delete: (id) => api.delete(`/jobs/${id}`),
};

export const companyService = {
  getProfile: () => api.get('/company/profile'),
  updateProfile: (data) => api.put('/company/profile', data),
  getStats: () => api.get('/company/stats'),
  getSubscription: () => api.get('/company/subscription'),
  upgrade: (plan) => api.post('/company/upgrade', { plan }),
};

export const userService = {
  getMe: () => api.get('/auth/me'),
  getCompanyUsers: () => api.get('/auth/company/users'),
  createUser: (data) => api.post('/auth/company/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  disableUser: (id) => api.patch(`/auth/users/${id}/disable`),
};

export default api;
