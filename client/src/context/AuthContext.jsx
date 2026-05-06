import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Verify token with server
  const verifyToken = useCallback(async (token) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Verifying token...');
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Token verified:', response.data);
      setUser(response.data.user);
      setCompany(response.data.company);
      setError(null);
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('token');
      setUser(null);
      setCompany(null);
      setError('جلسة غير صحيحة | Invalid session');
    } finally {
      setLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/auth/register', formData);
      
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setCompany(response.data.company);
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'خطأ في التسجيل | Registration error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Login
  const login = useCallback(async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/auth/login', { username, password });
      
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setCompany(response.data.company);
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'خطأ في تسجيل الدخول | Login error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setCompany(null);
    setError(null);
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/auth/users/${user._id}`, updates);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'خطأ في التحديث | Update error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if user has permission
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  }, [user]);

  const value = {
    user,
    company,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    hasRole,
    isAuthenticated: !!user,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
