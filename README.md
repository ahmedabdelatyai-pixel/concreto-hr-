# 🏗️ TalentFlow AI-HR Recruitment Platform

A cutting-edge, industrial-grade AI recruitment platform designed specifically for the **Concrete & Construction** industry. This platform automates the initial screening process using advanced Generative AI (Gemini 2.0 Flash) to perform technical interviews, analyze CVs, and provide deep psychological (DISC) and technical insights.

---

## 🌟 Key Features

### 🎙️ Immersive AI Interviewer
- **Interactive Voice-to-Text**: Candidates can speak their answers using real-time speech recognition.
- **Dynamic Questioning**: AI generates 10 tailored technical and behavioral questions based on the specific job role and the candidate's CV content.
- **Anti-Cheat System**: Real-time monitoring of focus loss and tab switching to ensure interview integrity.
- **Pulse Visualizer**: Modern, immersive UI with audio-visual feedback.

### 📄 Intelligent CV Parsing
- **Real PDF Extraction**: Uses `pdfjs-dist` to read the actual text content of uploaded CVs (not just metadata).
- **AI Summary**: Generates a professional summary, extracts skills, and calculates a "Technical Match" score instantly.

### 📊 Advanced HR Analytics Dashboard
- **KPI Overview**: Real-time stats on total applicants, average scores, and "Strong Fit" ratios.
- **Visual Charts**: Built-in visualization for score distribution, recommendation breakdowns, and applicant volume per job.
- **Advanced Search & Filtering**: Filter by role, status, or keyword with instant results.
- **PDF Report Generation**: Download a comprehensive 3-page AI evaluation report for any candidate.

### 🔐 Security & SaaS Ready
- **Demo Mode**: One-click login to showcase the platform capabilities.
- **Role-Based Routing**: Secure separation between candidate flow and administrative dashboard.
- **Multi-lingual Support**: Seamless switching between Arabic (RTL) and English (LTR).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Zustand (State Management), i18next, Lucide Icons.
- **Backend**: Node.js, Express.
- **Database**: MongoDB Atlas.
- **AI Engine**: Google Gemini 2.0 Flash API.
- **Utilities**: PDF.js (Parsing), html2pdf (Reports), Web Speech API.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- Google Gemini API Key

### 2. Installation
```bash
# Install root dependencies
npm install

# Install client and server dependencies
npm run install-all
```

### 3. Configuration
Create a `.env` file in the `server` directory and `client` directory:

**Server (.env):**
```env
MONGODB_URI=your_mongodb_uri
PORT=5000
```

**Client (.env):**
```env
VITE_GEMINI_API_KEY=your_gemini_key
VITE_API_URL=http://localhost:5000/api
```

### 4. Run Locally
```bash
npm start
```

---

## 📂 Project Structure

- `/client`: React application (Frontend)
- `/server`: Express API & MongoDB Models (Backend)
- `/shared`: Shared types and constants

---

## 📈 Roadmap (Next Steps)
- [ ] **Multi-Tenancy**: Support for multiple companies on one platform.
- [ ] **Video Interviews**: Real-time AI analysis of facial expressions.
- [ ] **Email Automation**: Automated notifications for candidates.

**Developed by TalentFlow - AI Solutions**

