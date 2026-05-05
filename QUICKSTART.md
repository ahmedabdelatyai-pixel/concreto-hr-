# ⚡ خطوات البدء السريع - 5 دقائق

## 🚀 ابدأ الآن!

### الخطوة 1️⃣: نسخ ملفات البيئة (1 دقيقة)
```bash
cd HR
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

### الخطوة 2️⃣: الحد الأدنى من التكوين (2 دقيقة)

**في `server/.env`:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/talentflow-hr
JWT_SECRET=dev-secret-key-change-this-later
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
GEMINI_API_KEY=demo-key-for-testing
```

**في `client/.env.local`:**
```env
VITE_API_URL=http://localhost:5000/api
```

### الخطوة 3️⃣: التثبيت (1.5 دقيقة)
```bash
npm run install-all
```

### الخطوة 4️⃣: التشغيل (30 ثانية)
```bash
npm run start
```

### الخطوة 5️⃣: الوصول (في المتصفح)
```
http://localhost:5173
```

---

## 🔐 بيانات الدخول

```
Username: demo
Password: Demo@12345
```

---

## ✅ مراجعة سريعة

```
□ Frontend: http://localhost:5173 ✅
□ Backend:  http://localhost:5000 ✅
□ Health:   http://localhost:5000/api/health ✅
```

---

## 🎯 اختبر الميزات

1. **تسجيل جديد**
   - اضغط "تسجيل جديد"
   - أدخل بيانات شركة جديدة

2. **إنشاء وظيفة**
   - من Admin Dashboard
   - اضغط "إضافة وظيفة"

3. **إضافة متقدم**
   - اضغط "إضافة متقدم"
   - أدخل البيانات

4. **عرض الإحصائيات**
   - اذهب إلى "الإحصائيات"
   - شاهد الرسوم البيانية

---

## 📚 المراجع السريعة

- **التوثيق الكامل**: [ENTERPRISE_README.md](./ENTERPRISE_README.md)
- **دليل الإعداد**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **دليل الإطلاق**: [LAUNCH_GUIDE.md](./LAUNCH_GUIDE.md)
- **الملخص الشامل**: [SUMMARY.md](./SUMMARY.md)

---

## 🆘 في حالة المشاكل

### المشكلة: خطأ في MongoDB
**الحل:**
```bash
# تأكد أن MongoDB يعمل
# أو غير MONGODB_URI في .env
```

### المشكلة: Port مستخدم
**الحل:**
```bash
# غيّر PORT في .env إلى 5001
PORT=5001
```

### المشكلة: Module not found
**الحل:**
```bash
npm run install-all
```

---

## 💡 نصائح مفيدة

- استخدم قسم "Logs" لفهم الأخطاء
- افتح DevTools (F12) لرؤية الأخطاء
- تحقق من Network tab للـ API calls
- استخدم test accounts من الملف

---

## 🎉 تهانينا!

**أنت الآن جاهز للعمل** ✅

الآن يمكنك:
- ✅ تطوير ميزات جديدة
- ✅ اختبار النظام
- ✅ إضافة عملاء
- ✅ البدء بالبيع!

---

**دقيقة واحدة قراءة = ساعات من التطوير المحفوظة!** ⏰

**استمتع بالبناء!** 🚀
