const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Load env from root
dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));

// Global State
let useLocalDB = false;
let lastDbError = null;

// MongoDB Connection Logic
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  
  if (!MONGODB_URI) {
    lastDbError = 'MONGODB_URI is missing';
    return;
  }

  try {
    mongoose.set('bufferCommands', false);
    await mongoose.connect(MONGODB_URI.trim(), {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    lastDbError = null;
  } catch (err) {
    lastDbError = err.message;
  }
};

// Apply connectDB to all routes
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Base Routes for Frontend Health Check
app.get(['/', '/api', '/api/'], (req, res) => res.send('TalentFlow API is Online'));

// Health Check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.9',
    dbConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    mongodbUriExists: !!MONGODB_URI,
    lastError: lastDbError
  });
});

// Job Routes
app.get(['/jobs', '/api/jobs'], async (req, res) => {
  try {
    const Job = require('../server/models/Job');
    res.json(await Job.find());
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post(['/jobs', '/api/jobs'], async (req, res) => {
  try {
    const Job = require('../server/models/Job');
    const job = new Job(req.body);
    res.status(201).json(await job.save());
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete(['/jobs/:id', '/api/jobs/:id'], async (req, res) => {
  try {
    const Job = require('../server/models/Job');
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Applicant Routes
app.get(['/applicants', '/api/applicants'], async (req, res) => {
  try {
    const Applicant = require('../server/models/Applicant');
    res.json(await Applicant.find().sort({ appliedAt: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post(['/applicants', '/api/applicants'], async (req, res) => {
  try {
    const Applicant = require('../server/models/Applicant');
    const app = new Applicant(req.body);
    res.status(201).json(await app.save());
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch(['/applicants/:id/status', '/api/applicants/:id/status'], async (req, res) => {
  const { status } = req.body;
  try {
    const Applicant = require('../server/models/Applicant');
    const updated = await Applicant.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = app;
