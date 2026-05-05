# 🚀 TalentFlow HR Platform - v2.0 Enterprise Edition

منصة توظيف ذكية مع نظام SaaS متعدد المستخدمين - جاهزة للبيع والنشر
---

## 📋 محتويات المشروع

- [التثبيت](#التثبيت)
- [التكوين](#التكوين)
- [البدء السريع](#البدء-السريع)
- [البنية المعمارية](#البنية-المعمارية)
- [واجهات API](#واجهات-api)
- [الميزات](#الميزات)
- [النشر](#النشر)
- [الترخيص](#الترخيص)

---

## 🎯 الميزات الرئيسية

### ✅ نظام المستخدمين المتقدم
- ✔️ تسجيل وتسجيل دخول آمن مع JWT
- ✔️ إدارة الأدوار (Admin, HR, Recruiter, Viewer)
- ✔️ نظام تحقق من كلمة المرور قوي
- ✔️ إنشاء مستخدمين متعددين لكل شركة

### ✅ نظام متعدد المستأجرين (Multi-Tenant)
- ✔️ كل شركة لها بيانات معزولة تماماً
- ✔️ فصل كامل لـ Jobs و Applicants حسب الشركة
- ✔️ صلاحيات مختلفة لكل مستخدم

### ✅ إدارة الوظائف والمتقدمين
- ✔️ إنشاء وإدارة وظائف ثنائية اللغة
- ✔️ تتبع المتقدمين مع التفاصيل الكاملة
- ✔️ تحديث حالة المتقدم (Pending/Shortlisted/Hired/Rejected)
- ✔️ إحصائيات تفصيلية ورسوم بيانية

### ✅ مقابلات الذكاء الاصطناعي
- ✔️ تكامل Google Gemini 2.0 Flash
- ✔️ استخلاص نصوص PDF الحقيقية
- ✔️ تحليل السيرة الذاتية التلقائي
- ✔️ توليد أسئلة مخصصة

### ✅ الأمان والحماية
- ✔️ تشفير كلمات المرور مع Bcrypt
- ✔️ JWT Tokens مع انتهاء الصلاحية
- ✔️ Rate Limiting لمنع الهجمات
- ✔️ Helmet للحماية من ثغرات الويب
- ✔️ CORS محدود وآمن
- ✔️ Input Validation على جميع المدخلات

### ✅ دعم ثنائي اللغة
- ✔️ العربية (RTL) و الإنجليزية (LTR)
- ✔️ تنقل سلس بين اللغات
- ✔️ واجهة محلية بالكامل

---

## 📦 المتطلبات

- **Node.js** v18+ 
- **MongoDB** (Atlas أو محلي)
- **npm** أو **yarn**

---

## 🔧 التثبيت

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd HR
```

### 2. تثبيت المكتبات
```bash
npm run install-all
```

### 3. إنشاء ملف .env
**في `server/.env`:**
```bash
cp server/.env.example server/.env
```

**احتويات الملف النموذجي:**
```env
PORT=5000
NODE_ENV=development

# MongoDB (أنشئ cluster جديد على MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/talentflow-hr?retryWrites=true&w=majority

# JWT (غيّر هذا إلى مفتاح عشوائي طويل)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24h

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Gemini API
GEMINI_API_KEY=your-gemini-api-key-from-google
```

**في `client/.env.local`:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your-gemini-api-key
```

---

## 🚀 البدء السريع

### في وضع التطوير

```bash
# من جذر المشروع
npm run start

# أو في terminals منفصلة:

# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

ثم افتح المتصفح:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`

### اختبار سريع

استخدم حساب Demo:
- **Username**: `demo`
- **Password**: `Demo@12345`

---

## 🏗️ البنية المعمارية

```
HR/
├── client/                  # React Frontend
│   ├── src/
│   │   ├── pages/          # صفحات التطبيق
│   │   ├── components/     # مكونات React
│   │   ├── context/        # Auth Context
│   │   ├── services/       # API Services
│   │   ├── locales/        # ملفات الترجمة
│   │   └── store/          # Zustand Store
│   └── package.json
│
├── server/                  # Node.js Backend
│   ├── models/             # نماذج Mongoose
│   │   ├── User.js         # نموذج المستخدم
│   │   ├── Company.js      # نموذج الشركة
│   │   ├── Job.js          # نموذج الوظيفة
│   │   └── Applicant.js    # نموذج المتقدم
│   │
│   ├── routes/             # المسارات
│   │   ├── authRoutes.js   # التسجيل والدخول
│   │   ├── jobRoutes.js    # إدارة الوظائف
│   │   ├── applicantRoutes.js  # إدارة المتقدمين
│   │   └── companyRoutes.js    # إدارة الشركة
│   │
│   ├── middleware/         # Middleware
│   │   ├── auth.js         # JWT و Authorization
│   │   ├── rateLimiter.js  # Rate Limiting
│   │   └── validation.js   # Input Validation
│   │
│   ├── index.js            # نقطة الدخول
│   ├── .env.example        # متغيرات البيئة
│   └── package.json
│
├── package.json            # Root Package
└── vercel.json            # إعدادات Vercel
```

---

## 🔌 واجهات API الرئيسية

### المصادقة
```
POST   /api/auth/register           - تسجيل شركة جديدة
POST   /api/auth/login              - تسجيل دخول
GET    /api/auth/me                 - بيانات المستخدم الحالي
GET    /api/auth/company/users      - قائمة مستخدمي الشركة
POST   /api/auth/company/users      - إضافة مستخدم جديد
PUT    /api/auth/users/:id          - تحديث المستخدم
```

### الوظائف
```
GET    /api/jobs                    - قائمة الوظائف
GET    /api/jobs/:id                - تفاصيل الوظيفة
POST   /api/jobs                    - إنشاء وظيفة جديدة
PUT    /api/jobs/:id                - تحديث الوظيفة
PATCH  /api/jobs/:id/status         - تغيير حالة الوظيفة
DELETE /api/jobs/:id                - حذف الوظيفة
```

### المتقدمين
```
GET    /api/applicants              - قائمة المتقدمين
GET    /api/applicants/:id          - تفاصيل المتقدم
POST   /api/applicants              - إضافة متقدم جديد
PUT    /api/applicants/:id          - تحديث المتقدم
PATCH  /api/applicants/:id/status   - تغيير الحالة
DELETE /api/applicants/:id          - حذف المتقدم
GET    /api/applicants/stats        - إحصائيات المتقدمين
```

### الشركة
```
GET    /api/company/profile         - ملف الشركة
PUT    /api/company/profile         - تحديث الملف
GET    /api/company/stats           - إحصائيات الشركة
GET    /api/company/subscription    - معلومات الاشتراك
POST   /api/company/upgrade         - ترقية الخطة
```

---

## 📊 نماذج البيانات

### User (المستخدم)
```javascript
{
  username: String,          // فريد
  email: String,              // فريد
  password: String,           // مشفرة
  company: ObjectId,          // مرجع الشركة
  role: 'admin'|'hr'|'recruiter'|'viewer',
  name: String,
  active: Boolean,
  lastLogin: Date,
  createdAt: Date
}
```

### Company (الشركة)
```javascript
{
  name: String,               // فريد
  email: String,              // فريد
  subscription: 'free'|'starter'|'pro'|'enterprise',
  maxApplicants: Number,      // حد أقصى للمتقدمين
  maxJobs: Number,            // حد أقصى للوظائف
  maxUsers: Number,           // حد أقصى للمستخدمين
  active: Boolean,
  settings: { language, timezone, darkMode },
  createdAt: Date
}
```

### Job (الوظيفة)
```javascript
{
  company: ObjectId,          // مرجع الشركة
  title_en: String,
  title_ar: String,
  department: String,
  description_en: String,
  description_ar: String,
  customQuestions: [{
    text: String,
    category: 'Technical'|'Behavioral'|'Hybrid'
  }],
  active: Boolean,
  createdAt: Date
}
```

### Applicant (المتقدم)
```javascript
{
  company: ObjectId,          // مرجع الشركة
  candidate: {
    name: String,
    email: String,
    phone: String,
    jobTitle: String
  },
  cvData: {
    summary: String,
    skills: [String],
    technical_match: Number
  },
  evaluation: {
    total_score: Number,
    recommendation: String,
    disc: { d, i, s, c },
    strengths: [String],
    weaknesses: [String]
  },
  status: 'Pending'|'Shortlisted'|'Hired'|'Rejected',
  appliedAt: Date
}
```

---

## 🔐 نظام الأدوار والصلاحيات

| الدور | المستخدمون | الوظائف | إدارة | الإحصائيات |
|------|-----------|--------|------|-----------|
| **Admin** | ✅ إنشاء/تعديل/حذف | ✅ كامل التحكم | ✅ كامل | ✅ مرئية كاملة |
| **HR** | ✅ عرض فقط | ✅ إنشاء | ✅ جزئي | ✅ مرئية جزئية |
| **Recruiter** | ❌ | ✅ إضافة متقدمين | ❌ | ✅ أساسية |
| **Viewer** | ❌ | ❌ | ❌ | ✅ عرض فقط |

---

## 💰 خطط الاشتراك

```
┌─────────────┬──────────┬──────────┬──────────┬───────────────┐
│ الخطة       │ مجاني    │ بداية    │ احترافي  │ إنتاج        │
├─────────────┼──────────┼──────────┼──────────┼───────────────┤
│ السعر       │ $0       │ $99/شهر  │ $299/شهر │ مخصص          │
│ متقدمين    │ 10       │ 100      │ 1000     │ غير محدود     │
│ وظائف      │ 1        │ 5        │ 20       │ غير محدود     │
│ مستخدمين   │ 1        │ 3        │ 10       │ غير محدود     │
└─────────────┴──────────┴──────────┴──────────┴───────────────┘
```

---

## 🌐 النشر على Vercel

### 1. ربط مع Git
```bash
git add .
git commit -m "TalentFlow v2.0 Enterprise"
git push origin main
```

### 2. ربط مع Vercel
```bash
npm install -g vercel
vercel --prod
```

### 3. متغيرات البيئة في Vercel
من لوحة التحكم:
```
MONGODB_URI = your-connection-string
JWT_SECRET = your-secret-key
ALLOWED_ORIGINS = your-domain.com
GEMINI_API_KEY = your-key
```

### 4. النتيجة
- Frontend: `https://your-domain.vercel.app`
- Backend: `https://your-domain.vercel.app/api`

---

## 🛡️ أفضل الممارسات الأمنية

✅ **تم تطبيقه:**
- ✔️ تشفير كلمات المرور مع Bcrypt
- ✔️ JWT Tokens آمن
- ✔️ Rate Limiting على endpoints الحساسة
- ✔️ CORS محدود
- ✔️ Helmet Protection
- ✔️ Input Validation
- ✔️ SQL Injection Protection (MongoDB)
- ✔️ XSS Protection

⚠️ **إجراءات إضافية للإنتاج:**
- استخدم HTTPS فقط
- فعّل HTTPS-only cookies
- أضف CMS/Web Application Firewall
- استخدم VPN للـ Database
- راقب الأنشطة المريبة
- روتين backup يومي
- أضف 2FA للـ Admin

---

## 📝 أمثلة الاستخدام

### تسجيل شركة جديدة
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ali_company",
    "email": "ali@company.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "companyName": "Ali Company",
    "fullName": "Ali Ahmed"
  }'
```

### تسجيل الدخول
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ali_company",
    "password": "SecurePass123"
  }'
```

### الحصول على بيانات المستخدم
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 استكشاف الأخطاء

### الخطأ: "MongoDB connection failed"
- تحقق من `MONGODB_URI` في `.env`
- تأكد من السماح برابط IP في MongoDB Atlas

### الخطأ: "Invalid token"
- تأكد من صلاحية الـ JWT_SECRET
- امسح الـ localStorage وأعد تسجيل الدخول

### الخطأ: "CORS error"
- تحقق من `ALLOWED_ORIGINS` في `.env`
- تأكد من إضافة domain الواجهة الأمامية

---

## 📚 الموارد الإضافية

- [MongoDB Documentation](https://docs.mongodb.com)
- [Express.js Guide](https://expressjs.com)
- [React Documentation](https://react.dev)
- [Google Gemini API](https://ai.google.dev)

---

## 💬 الدعم والمساعدة

للمزيد من المساعدة:
1. تحقق من logs الخادم في Terminal
2. استخدم DevTools في المتصفح
3. تحقق من network requests في Network tab

---

## 📄 الترخيص

جميع الحقوق محفوظة © 2026 TalentFlow ™

---

## 🎉 شكراً لاستخدامك TalentFlow!

**جاهز للبيع والنشر** ✅

---

**آخر تحديث**: مايو 2026 | **الإصدار**: 2.0.0
