const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// ============== MIDDLEWARE ==============
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============== DATABASE CONNECTION ==============
let dbConnected = false;

const connectDB = async () => {
  if (dbConnected) return;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) return;

  try {
    await mongoose.connect(MONGODB_URI.trim());
    console.log('✅ Connected to MongoDB');
    dbConnected = true;

    // Auto-seed default subscription plans (runs only once)
    const Plan = require('./models/Plan');
    await Plan.seedDefaults();
  } catch (err) {
    console.error('❌ DB Error:', err.message);
  }
};


// Vercel support
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ============== ROUTES ==============
app.get('/', (req, res) => res.send('🚀 API Running'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: dbConnected }));

// Core Routes (Made public for stability)
app.use('/api/applicants', require('./routes/applicantRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/owner', require('./routes/ownerRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/integrity', require('./routes/integrityRoutes'));


// ============== SERVER START ==============
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on ${PORT}`));
}

module.exports = app;
