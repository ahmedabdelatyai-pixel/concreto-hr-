import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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
import OwnerPanel from './pages/OwnerPanel';

function App() {
  const { i18n } = useTranslation();

  // Update text direction based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AuthProvider>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/admin/login" element={<AuthPage />} />
          <Route path="/apply" element={<CandidateProfile />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/profile" element={<CandidateProfile />} />
          <Route path="/upload-cv" element={<CvUpload />} />
          <Route path="/interview" element={<InterviewPhase />} />
          <Route path="/completion" element={<CompletionScreen />} />
          <Route path="/evaluation" element={<EvaluationResult />} />
          <Route path="/owner" element={<OwnerPanel />} />

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;

