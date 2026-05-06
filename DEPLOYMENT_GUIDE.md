# HR Prime - AI-Driven Recruitment Platform

## 🚀 Production Deployment Guide

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Vercel account
- Domain: hr-prime.com

### Environment Variables Setup

#### 1. Server Environment (.env)
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hr_prime_prod?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key-for-sensitive-data

# AI Services
GEMINI_API_KEY=your-gemini-2-0-flash-api-key

# Security
ALLOWED_ORIGINS=https://hr-prime.com,https://www.hr-prime.com

# Server
PORT=5000
NODE_ENV=production
```

#### 2. Client Environment (.env.local)
```bash
VITE_GEMINI_API_KEY=your-gemini-2-0-flash-api-key
VITE_API_BASE_URL=https://hr-prime.com/api
```

### Vercel Deployment Steps

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

#### Step 2: Deploy Backend
```bash
cd server
vercel --prod
```
- Set environment variables in Vercel dashboard
- Note the deployment URL (e.g., `https://hr-prime-backend.vercel.app`)

#### Step 3: Update Client Environment
Update `client/.env.local`:
```bash
VITE_API_BASE_URL=https://hr-prime-backend.vercel.app
```

#### Step 4: Deploy Frontend
```bash
cd client
npm run build
vercel --prod
```

#### Step 5: Domain Configuration
1. Go to Vercel dashboard
2. Add custom domain: `hr-prime.com`
3. Configure DNS records as instructed
4. Update ALLOWED_ORIGINS in backend environment

### Database Setup

#### MongoDB Atlas Configuration
1. Create cluster
2. Create database user with read/write access
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Get connection string

#### Initial Data Setup
```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Create demo company
db.companies.insertOne({
  name: "Demo Company",
  email: "demo@hr-prime.com",
  subscription: "pro",
  maxApplicants: 500,
  maxJobs: 20,
  maxUsers: 10,
  active: true
})
```

### Security Checklist

- ✅ Environment variables configured
- ✅ MongoDB IP whitelisted
- ✅ JWT secret is strong (32+ chars)
- ✅ Encryption key is set
- ✅ CORS origins configured
- ✅ HTTPS enabled via Vercel
- ✅ Rate limiting active
- ✅ Helmet security headers enabled

### Monitoring & Maintenance

#### Logs
- Vercel dashboard for deployment logs
- MongoDB Atlas for database monitoring
- Application logs via console

#### Backups
- MongoDB Atlas automated backups
- Environment variables backed up securely

#### Updates
```bash
# Update dependencies
npm audit fix
npm update

# Rebuild and redeploy
vercel --prod
```

### Troubleshooting

#### Common Issues
1. **CORS errors**: Check ALLOWED_ORIGINS
2. **Database connection**: Verify MongoDB URI
3. **AI API failures**: Check GEMINI_API_KEY
4. **Build failures**: Ensure all dependencies installed

#### Performance Optimization
- Enable Vercel Analytics
- Monitor API response times
- Optimize MongoDB queries with indexes

### Support
For issues, check:
1. Vercel deployment logs
2. Browser console for client errors
3. Server logs for API errors
4. MongoDB Atlas monitoring

---

## 🔐 Security Features

- **Data Encryption**: Sensitive candidate data encrypted at rest
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: DDoS protection
- **Helmet Security**: Security headers
- **Input Validation**: Comprehensive validation
- **Multi-tenancy**: Company data isolation

## 📊 Compliance

- **PDPL Compliant**: Saudi Personal Data Protection Law
- **Data Encryption**: AES-256-GCM encryption
- **Audit Logs**: Integrity monitoring
- **Access Control**: Role-based permissions

---

*HR Prime v2.0 - Enterprise AI Recruitment Platform*