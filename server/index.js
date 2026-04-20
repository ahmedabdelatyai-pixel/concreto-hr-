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

// Initialize Local DB if doesn't exist
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ applicants: [], jobs: [] }, null, 2));
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: '*', // For development, we'll restrict this later in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));

// Global State (for Local Fallback)
let useLocalDB = false;

// Helpers for Local DB
const readLocal = () => JSON.parse(fs.readFileSync(DB_PATH));
const writeLocal = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// Routes
app.get('/', (req, res) => res.send('Concreto HR AI API is running... (Mode: ' + (useLocalDB ? 'Local' : 'Cloud') + ')'));

// Job Routes
app.get('/api/jobs', async (req, res) => {
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
    const app = new Applicant(req.body);
    res.status(201).json(await app.save());
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

// Server Start & DB Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Connection logic
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB Atlas');
      useLocalDB = false;
    })
    .catch(err => {
      console.error('Cloud DB connection failed, switching to LOCAL DB mode.');
      useLocalDB = true;
    });
} else {
  useLocalDB = true;
}

// Export for Vercel
module.exports = app;

// Only listen if not running as a Vercel function
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT} (Mode: ${useLocalDB ? 'Local' : 'Cloud'})`));
}
