// Input validation middleware
exports.validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

exports.validateUsername = (username) => {
  // 3-20 characters, alphanumeric and underscore
  const re = /^[a-zA-Z0-9_]{3,20}$/;
  return re.test(username);
};

exports.validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
};

exports.validateApplicant = (data) => {
  const errors = [];

  if (!data.candidate?.name || data.candidate.name.trim().length < 2) {
    errors.push('الاسم يجب أن يكون على الأقل حرفين | Name must be at least 2 characters');
  }

  if (!data.candidate?.email || !exports.validateEmail(data.candidate.email)) {
    errors.push('البريد الإلكتروني غير صحيح | Invalid email');
  }

  if (data.evaluation?.total_score && (data.evaluation.total_score < 0 || data.evaluation.total_score > 100)) {
    errors.push('الدرجة يجب أن تكون بين 0 و 100 | Score must be between 0 and 100');
  }

  return errors;
};

exports.sanitizeInput = (obj) => {
  // Remove potentially dangerous fields
  if (typeof obj !== 'object') return obj;
  
  const sanitized = JSON.parse(JSON.stringify(obj));
  delete sanitized.__proto__;
  delete sanitized.constructor;
  delete sanitized.prototype;
  return sanitized;
};
