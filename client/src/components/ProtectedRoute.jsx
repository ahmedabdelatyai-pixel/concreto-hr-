import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminStore } from '../store/adminStore';

const ProtectedRoute = ({ children, requiredRoles = null }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const isAdminLoggedIn = useAdminStore(state => state.isAdminLoggedIn);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        minHeight: '100vh', backgroundColor: '#050a14', color: '#fff' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', height: '48px', border: '4px solid #6366f1', 
            borderTopColor: 'transparent', borderRadius: '50%', 
            animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' 
          }}></div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>{document.documentElement.lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Allow access if either real auth OR demo mode is active
  if (!isAuthenticated && !isAdminLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  // If in demo mode, we bypass further role checks (demo is effectively admin)
  if (isAdminLoggedIn) {
    return children;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
