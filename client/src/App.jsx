import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';
import { useInterviewStore } from './store/interviewStore';

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
  const location = useLocation();

  const RequireCandidate = ({ children }) => {
    const candidate = useInterviewStore(state => state.candidate);
    if (!candidate?.jobId) return <Navigate to="/apply" replace />;
    return children;
  };

  const RequireInterview = ({ children }) => {
    const candidate = useInterviewStore(state => state.candidate);
    if (!candidate?.applicantId) return <Navigate to="/apply" replace />;
    return children;
  };

  // Update text direction based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="app-container">
          <Toaster position="bottom-right" toastOptions={{
            style: { background: '#111a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } }
          }} />
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public Routes */}
              <Route path="/login" element={<PageTransition><AuthPage /></PageTransition>} />
              <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
              <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="/apply" element={<PageTransition><CandidateProfile /></PageTransition>} />
              <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><CandidateProfile /></PageTransition>} />
              <Route path="/upload-cv" element={<RequireCandidate><PageTransition><CvUpload /></PageTransition></RequireCandidate>} />
              <Route path="/interview" element={<RequireInterview><PageTransition><InterviewPhase /></PageTransition></RequireInterview>} />
              <Route path="/completion" element={<RequireInterview><PageTransition><CompletionScreen /></PageTransition></RequireInterview>} />
              <Route path="/evaluation" element={<RequireInterview><PageTransition><EvaluationResult /></PageTransition></RequireInterview>} />
              <Route path="/owner" element={<PageTransition><OwnerPanel /></PageTransition>} />
              <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
              <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
              <Route path="/help" element={<PageTransition><Help /></PageTransition>} />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'hr', 'recruiter', 'viewer']}>
                    <PageTransition><AdminDashboard /></PageTransition>
                  </ProtectedRoute>
                }
              />

              {/* Catch All */}
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </AnimatePresence>
      </div>
      <Footer />
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

