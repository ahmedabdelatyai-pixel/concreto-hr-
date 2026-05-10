const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { authenticate, authorize, companyOnly } = require('../middleware/auth');
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { validateEmail, validateUsername, validatePassword, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'hr-secret-key-change-this';
const JWT_EXPIRY = '24h';

// Generate JWT Token
const generateToken = (userId, companyId) => {
  return jwt.sign({ userId, companyId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Register New Company & User
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, confirmPassword, companyName, logo, fullName } = req.body;

    // Validation
    if (!username || !email || !password || !companyName) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة | All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'كلمات المرور غير متطابقة | Passwords do not match' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'البريد الإلكتروني غير صحيح | Invalid email' });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ message: 'اسم المستخدم يجب أن يكون 3-20 أحرف (حروف وأرقام والشرطة السفلية فقط) | Username must be 3-20 alphanumeric characters' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل، حرف كبير وصغير ورقم | Password must be at least 8 characters with uppercase, lowercase, and number' });
    }

    // Check if user exists
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.status(400).json({ message: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل | User already exists' });
    }

    // Check if company exists
    let company = await Company.findOne({ email });
    if (company) {
      return res.status(400).json({ message: 'هذه الشركة مسجلة بالفعل | Company already registered' });
    }

    // Create company
    company = new Company({
      name: companyName,
      logo: logo || '',
      email: email,
      active: true
    });
    await company.save();

    // Create user
    user = new User({
      username: sanitizeInput(username),
      email: email.toLowerCase(),
      password: password,
      company: company._id,
      role: 'admin',
      name: fullName || username,
      active: true
    });
    await user.save();

    // Generate token
    const token = generateToken(user._id, company._id);

    res.status(201).json({
      message: 'تم التسجيل بنجاح | Registration successful',
      token,
      user: user.toJSON(),
      company: {
        _id: company._id,
        name: company.name,
        subscription: company.subscription
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'خطأ في التسجيل | Registration error', error: err.message });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'اسم المستخدم وكلمة المرور مطلوبة | Username and password required' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }]
    }).select('+password').populate('company');

    if (!user) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة | Invalid credentials' });
    }

    if (!user.active || !user.company.active) {
      return res.status(401).json({ message: 'الحساب معطل | Account is disabled' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة | Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.company._id);

    res.json({
      message: 'تم تسجيل الدخول بنجاح | Login successful',
      token,
      user: user.toJSON(),
      company: {
        _id: user.company._id,
        name: user.company.name,
        subscription: user.company.subscription
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'خطأ في تسجيل الدخول | Login error' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: req.user.toJSON(),
    company: {
      _id: req.user.company._id,
      name: req.user.company.name,
      subscription: req.user.company.subscription
    }
  });
});

// Get all users in company
router.get('/company/users', authenticate, authorize('admin', 'hr'), companyOnly, async (req, res) => {
  try {
    const users = await User.find({ company: req.companyId }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new user in company
router.post('/company/users', authenticate, authorize('admin'), companyOnly, async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;

    if (!validateEmail(email) || !validateUsername(username)) {
      return res.status(400).json({ message: 'بيانات غير صحيحة | Invalid data' });
    }

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'المستخدم موجود بالفعل | User already exists' });
    }

    const newUser = new User({
      username: sanitizeInput(username),
      email: email.toLowerCase(),
      password: password || Math.random().toString(36),
      company: req.companyId,
      role: role || 'recruiter',
      name,
      active: true
    });

    await newUser.save();
    res.status(201).json({
      message: 'تم إنشاء المستخدم بنجاح | User created successfully',
      user: newUser.toJSON()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.put('/users/:id', authenticate, async (req, res) => {
  try {
    const { name, password, role } = req.body;

    // Users can only update themselves, admins can update anyone
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'ليس لديك صلاحية | Unauthorized' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (password && validatePassword(password)) {
      updates.password = password;
    }
    if (role && req.user.role === 'admin') {
      updates.role = role;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود | User not found' });
    }

    res.json({
      message: 'تم تحديث المستخدم بنجاح | User updated',
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Disable user
router.patch('/users/:id/disable', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود | User not found' });
    }

    res.json({
      message: 'تم تعطيل المستخدم | User disabled',
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
