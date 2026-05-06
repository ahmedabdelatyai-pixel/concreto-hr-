const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// ============== MIDDLEWARE ==============

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration (More secure)
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 3600
};
app.use(cors(corsOptions));

// Rate limiting
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
app.use('/api/auth/', authLimiter);
app.use('/api/', apiLimiter);

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'));

// ============== DATABASE CONNECTION ==============

let lastDbError = null;
let dbConnected = false;

const connectDB = async () => {
  if (dbConnected) return;

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not defined - using local development mode');
    return;
  }

  try {
    mongoose.set('bufferCommands', false);
    await mongoose.connect(MONGODB_URI.trim(), {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    dbConnected = true;
    lastDbError = null;
    
    // Create indexes
    const User = require('./models/User');
    const Company = require('./models/Company');
    const Job = require('./models/Job');
    const Applicant = require('./models/Applicant');
    const Subscription = require('./models/Subscription');
    const IntegrityLog = require('./models/IntegrityLog');
    
    await User.collection.createIndex({ username: 1, company: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await Company.collection.createIndex({ email: 1 }, { unique: true });
    await Job.collection.createIndex({ company: 1 });
    await Applicant.collection.createIndex({ company: 1 });
    await Subscription.collection.createIndex({ company: 1 }, { unique: true });
    await IntegrityLog.collection.createIndex({ applicant: 1, timestamp: -1 });
    await IntegrityLog.collection.createIndex({ company: 1, incidentType: 1 });

  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    lastDbError = err.message;
    dbConnected = false;
  }
};

// Vercel Serverless Function Support - Connect DB on each request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ============== ROUTES ==============

// Health Check
app.get('/', (req, res) => {
  res.send('🚀 TalentFlow HR Platform API is running...');
});

app.get('/api', (req, res) => {
  res.send('🚀 TalentFlow HR Platform API (at /api)...');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    version: '2.0.0',
    dbConnected,
    mongoConnected: mongoose.connection.readyState === 1,
    lastError: lastDbError || null,
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Applicant Routes
const applicantRoutes = require('./routes/applicantRoutes');
app.use('/api/applicants', applicantRoutes);

// Public Routes
const publicRoutes = require('./routes/publicRoutes');
app.use('/api/public', publicRoutes);

// Job Routes
const jobRoutes = require('./routes/jobRoutes');
app.use('/api/jobs', jobRoutes);

// Company Routes
const companyRoutes = require('./routes/companyRoutes');
app.use('/api/company', companyRoutes);

// Subscription Routes
const subscriptionRoutes = require('./routes/subscriptionRoutes');
app.use('/api/subscriptions', subscriptionRoutes);

// Integrity Routes
const integrityRoutes = require('./routes/integrityRoutes');
app.use('/api/integrity', integrityRoutes);

// ============== ERROR HANDLING ==============

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: 'المسار غير موجود | Route not found',
    path: req.path
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'خطأ في التحقق من البيانات | Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `${field} موجود بالفعل | ${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'رمز غير صحيح | Invalid token'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'خطأ في الخادم | Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============== SERVER START ==============

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Try to connect to MongoDB
    await connectDB();

    // Start server regardless of DB connection (local development mode)
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   🚀 TalentFlow HR Platform API        ║
║   v2.0.0 - Enterprise Edition          ║
╚════════════════════════════════════════╝
Server running on: http://localhost:${PORT}
API Endpoint: http://localhost:${PORT}/api
Status: ${dbConnected ? '✅ Production Mode' : '⏸️ Development Mode (Local DB)'}
Environment: ${process.env.NODE_ENV || 'development'}
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        if (mongoose.connection.readyState === 1) {
          mongoose.connection.close();
        }
        process.exit(0);
      });
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start server if not running in a serverless environment
if (require.main === module) {
  startServer();
}

module.exports = app;
