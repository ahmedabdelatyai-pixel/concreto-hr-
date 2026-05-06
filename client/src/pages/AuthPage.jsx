import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, error, clearError } = useAuth();
  const { i18n } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    fullName: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    try {
      if (isLogin) {
        // Login
        await login(formData.username, formData.password);
        navigate('/admin');
      } else {
        // Register
        await register(formData);
        navigate('/admin');
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4 ${
        i18n.language === 'ar' ? 'rtl' : 'ltr'
      }`}
    >
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-white rounded-full mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">TF</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TalentFlow</h1>
          <p className="text-indigo-100">منصة التوظيف الذكية | Intelligent Recruitment Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Tab Buttons */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => {
                setIsLogin(true);
                clearError();
                setFormData({
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  companyName: '',
                  fullName: ''
                });
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                isLogin
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <LogIn className="w-5 h-5 inline mr-2" />
              تسجيل الدخول | Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                clearError();
                setFormData({
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  companyName: '',
                  fullName: ''
                });
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UserPlus className="w-5 h-5 inline mr-2" />
              تسجيل جديد | Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المستخدم | Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="أدخل اسم المستخدم"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Email (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني | Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required={!isLogin}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Company Name (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الشركة | Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="اسم شركتك"
                  required={!isLogin}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Full Name (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل | Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="اسمك الكامل"
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور | Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  isLogin
                    ? 'أدخل كلمة المرور'
                    : 'حد أدنى 8 أحرف، حرف كبير وصغير ورقم'
                }
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">
                  يجب أن تحتوي على: 8 أحرف على الأقل، حرف كبير (A-Z)، حرف صغير (a-z)، رقم (0-9)
                </p>
              )}
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تأكيد كلمة المرور | Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="أدخل كلمة المرور مرة أخرى"
                  required={!isLogin}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-6"
            >
              {loading ? 'جاري المعالجة... | Processing...' : isLogin ? 'تسجيل الدخول | Login' : 'إنشاء حساب | Create Account'}
            </button>
          </form>

          {/* Demo Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setFormData({
                  username: 'demo',
                  password: 'Demo@12345',
                  confirmPassword: '',
                  email: '',
                  companyName: '',
                  fullName: ''
                });
                setIsLogin(true);
              }}
              className="w-full py-2 px-4 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-all"
            >
              جرب النسخة التجريبية | Try Demo
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-indigo-100 text-sm">
            منصة V2.0 احترافية للتوظيف الذكي
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
