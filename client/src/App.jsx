import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Candidate Pages
import LandingPage from './pages/LandingPage';
import CandidateProfile from './pages/CandidateProfile';
import CvUpload from './pages/CvUpload';
import InterviewPhase from './pages/InterviewPhase';
import CompletionScreen from './pages/CompletionScreen';
import EvaluationResult from './pages/EvaluationResult';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { i18n } = useTranslation();

  // Update text direction based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/profile" element={<CandidateProfile />} />
        <Route path="/upload-cv" element={<CvUpload />} />
        <Route path="/interview" element={<InterviewPhase />} />
        <Route path="/completion" element={<CompletionScreen />} />
        <Route path="/evaluation" element={<EvaluationResult />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;

