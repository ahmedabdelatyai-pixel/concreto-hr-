/**
 * Validation Utilities
 * Centralized input validation and sanitization
 */

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
};

// Username validation (3-20 characters, alphanumeric + underscore)
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Password validation (8+ chars, at least one uppercase, one lowercase, one number)
export const isValidPassword = (password) => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isLongEnough = password.length >= 8 && password.length <= 100;
  
  return hasUppercase && hasLowercase && hasNumber && isLongEnough;
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 1000); // Max 1000 characters
};

// Validate company name (2-100 characters)
export const isValidCompanyName = (name) => {
  return name.length >= 2 && name.length <= 100;
};

// Validate phone number (basic, 10-15 digits)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9\s\-\+]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Get password strength indicator
export const getPasswordStrength = (password) => {
  if (!password) return { level: 0, text: 'None', color: '#ef4444' };
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;

  const levels = [
    { level: 0, text: 'Very Weak', textAr: 'ضعيفة جداً', color: '#ef4444' },
    { level: 1, text: 'Weak', textAr: 'ضعيفة', color: '#ef4444' },
    { level: 2, text: 'Fair', textAr: 'مقبولة', color: '#fca311' },
    { level: 3, text: 'Good', textAr: 'جيدة', color: '#fca311' },
    { level: 4, text: 'Strong', textAr: 'قوية', color: '#10b981' },
    { level: 5, text: 'Very Strong', textAr: 'قوية جداً', color: '#10b981' },
    { level: 6, text: 'Excellent', textAr: 'ممتازة', color: '#10b981' }
  ];

  return levels[Math.min(strength, 6)];
};

export default {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  sanitizeInput,
  isValidCompanyName,
  isValidPhone,
  getPasswordStrength
};
