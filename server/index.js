const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const DB_PATH = path.join(__dirname, 'database.json');

// Initialize Local DB if doesn't exist (Only in local development)
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ applicants: [], jobs: [] }, null, 2));
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));

// Global State (for Local Fallback)
let useLocalDB = false;

// Helpers for Local DB
const readLocal = () => JSON.parse(fs.readFileSync(DB_PATH));
const writeLocal = (data) => {
  if (process.env.NODE_ENV === 'production') return;
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// Routes
// Health Check
app.get('/', (req, res) => res.send('TalentFlow AI API is running...'));
app.get('/api', (req, res) => res.send('TalentFlow AI API is running (at /api)...'));
let lastDbError = null;

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.7',
    mode: useLocalDB ? 'local' : 'cloud',
    dbConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    mongodbUriExists: !!process.env.MONGODB_URI,
    lastError: lastDbError
  });
});

// Job Routes
app.get('/api/jobs', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (useLocalDB) return res.json(readLocal().jobs);
  try {
    const Job = require('./models/Job');
    res.json(await Job.find());
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/jobs', async (req, res) => {
  if (useLocalDB) {
    const db = readLocal();
    const newJob = { ...req.body, _id: Date.now().toString(), createdAt: new Date() };
    db.jobs.push(newJob);
    writeLocal(db);
    return res.status(201).json(newJob);
  }
  try {
    const Job = require('./models/Job');
    const job = new Job(req.body);
    res.status(201).json(await job.save());
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/jobs/:id', async (req, res) => {
  if (useLocalDB) {
    const db = readLocal();
    db.jobs = db.jobs.filter(j => j._id !== req.params.id);
    writeLocal(db);
    return res.json({ message: 'Job deleted' });
  }
  try {
    const Job = require('./models/Job');
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Applicant Routes
app.get('/api/applicants', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (useLocalDB) return res.json(readLocal().applicants.sort((a,b) => new Date(b.appliedAt) - new Date(a.appliedAt)));
  try {
    const Applicant = require('./models/Applicant');
    res.json(await Applicant.find().sort({ appliedAt: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/applicants', async (req, res) => {
  if (useLocalDB) {
    const db = readLocal();
    const newApp = { ...req.body, _id: Date.now().toString(), appliedAt: new Date() };
    db.applicants.push(newApp);
    writeLocal(db);
    return res.status(201).json(newApp);
  }
  try {
    const Applicant = require('./models/Applicant');
    console.log('Received applicant:', req.body.candidate?.name);
    console.log('Has cvFile in body?', !!req.body.cvFile);
    const app = new Applicant(req.body);
    const saved = await app.save();
    console.log('Saved with cvFile?', !!saved.cvFile);
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/applicants/clear', async (req, res) => {
  if (useLocalDB) {
    const db = readLocal();
    db.applicants = [];
    writeLocal(db);
    return res.json({ message: 'Cleared' });
  }
  try {
    const Applicant = require('./models/Applicant');
    await Applicant.deleteMany({});
    res.json({ message: 'Cleared' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/applicants/:id/status', async (req, res) => {
  const { status } = req.body;
  if (useLocalDB) {
    const db = readLocal();
    const index = db.applicants.findIndex(a => a._id === req.params.id);
    if (index !== -1) {
      db.applicants[index].status = status;
      writeLocal(db);
      return res.json(db.applicants[index]);
    }
    return res.status(404).json({ message: 'Not found' });
  }
  try {
    const Applicant = require('./models/Applicant');
    const updated = await Applicant.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Server Start & DB Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Connection logic for Serverless
let isConnecting = false;

const connectDB = async () => {
  if (useLocalDB) return;
  if (mongoose.connection.readyState >= 1) return;
  
  if (!MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined.');
    if (process.env.NODE_ENV !== 'production') {
      useLocalDB = true;
      return;
    }
    throw new Error('Database connection string missing in production.');
  }

  if (!isConnecting) {
    isConnecting = true;
    try {
      mongoose.set('bufferCommands', false); // Disable hanging
      await mongoose.connect(MONGODB_URI.trim(), {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      console.log('Connected to MongoDB Atlas');
      useLocalDB = false;
      lastDbError = null;
    } catch (err) {
      console.error('Cloud DB connection failed:', err.message);
      lastDbError = err.message;
      if (process.env.NODE_ENV !== 'production') {
        useLocalDB = true;
      }
    } finally {
      isConnecting = false;
    }
  }
};

// Apply connectDB middleware to all API routes
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection error: ' + err.message });
  }
});

// Export for Vercel
module.exports = app;

// Only listen if not running as a Vercel function
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT} (Mode: ${useLocalDB ? 'Local' : 'Cloud'})`));
}
