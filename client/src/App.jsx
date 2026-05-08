import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';

// Auth Pages
import AuthPage from './pages/AuthPage';

// Candidate Pages
import LandingPage from './pages/LandingPage';
import CandidateProfile from './pages/CandidateProfile';
import CvUpload from './pages/CvUpload';
import InterviewPhase from './pages/InterviewPhase';
import CompletionScreen from './pages/CompletionScreen';
import EvaluationResult from './pages/EvaluationResult';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import OwnerPanel from './pages/OwnerPanel';

// Info Pages
import NotFound from './pages/NotFound';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Help from './pages/Help';

function App() {
  const { i18n } = useTranslation();

  // Update text direction based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="app-container">
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/apply" element={<CandidateProfile />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/profile" element={<CandidateProfile />} />
          <Route path="/upload-cv" element={<CvUpload />} />
          <Route path="/interview" element={<InterviewPhase />} />
          <Route path="/completion" element={<CompletionScreen />} />
          <Route path="/evaluation" element={<EvaluationResult />} />
          <Route path="/owner" element={<OwnerPanel />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/help" element={<Help />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRoles={['admin', 'hr', 'recruiter', 'viewer']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

