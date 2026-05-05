const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT Token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'لا يوجد رمز مصادقة | No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hr-secret-key-change-this');
    const user = await User.findById(decoded.userId).populate('company');
    
    if (!user || !user.active) {
      return res.status(401).json({ message: 'المستخدم غير نشط | User is inactive' });
    }

    req.user = user;
    req.companyId = user.company._id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'انتهت صلاحية الرمز | Token expired' });
    }
    return res.status(401).json({ message: 'رمز غير صحيح | Invalid token' });
  }
};

// Authorize by role
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'يجب تسجيل الدخول أولاً | Please login first' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'ليس لديك صلاحية لهذا الإجراء | Unauthorized' });
    }

    next();
  };
};

// Get user's company data only
exports.companyOnly = (req, res, next) => {
  if (!req.companyId) {
    return res.status(401).json({ message: 'معرف الشركة غير موجود | Company ID missing' });
  }
  next();
};
