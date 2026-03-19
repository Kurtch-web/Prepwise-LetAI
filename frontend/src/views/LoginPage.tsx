import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';

export function LoginPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { login, isLoading } = useAuth();
  const isLightMode = theme === 'light';

  const [formData, setFormData] = useState({
    email_or_id: '',
    password: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email_or_id.trim()) {
      newErrors.email_or_id = 'Email or School ID is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email_or_id, formData.password);
      navigate('/dashboard');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'
        : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    }`}>
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <div className={`text-5xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent`}>
              💡
            </div>
          </div>
          <h1 className={`text-3xl font-black mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            Welcome Back
          </h1>
          <p className={`text-base font-medium ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Continue your LET exam prep journey
          </p>
        </div>

        {/* Main Card */}
        <div className={`rounded-3xl p-8 backdrop-blur-xl border transition-all duration-300 ${
          isLightMode
            ? 'bg-white/95 border-slate-200 shadow-xl'
            : 'bg-slate-800/50 border-slate-700 shadow-2xl'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email or School ID */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                Email or School ID
              </label>
              <input
                type="text"
                name="email_or_id"
                value={formData.email_or_id}
                onChange={handleChange}
                placeholder="juan@school.edu or 2024-001"
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isLightMode
                    ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                    : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                } outline-none`}
              />
              {errors.email_or_id && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {errors.email_or_id}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl px-4 py-3 pr-12 text-sm font-medium transition-all ${
                    isLightMode
                      ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                      : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                  } outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${
                    isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {errors.password}
                </p>
              )}
              <Link
                to="/reset-password"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors inline-block mt-2"
              >
                🔑 Forgot password?
              </Link>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-600 cursor-pointer"
              />
              <label htmlFor="rememberMe" className={`text-sm font-medium cursor-pointer ${
                isLightMode ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Remember me on this device
              </label>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className={`rounded-xl p-4 text-sm font-medium ${
                isLightMode
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-red-900/20 border border-red-800 text-red-300'
              }`}>
                <p className="flex items-center gap-2">
                  <span>❌</span> {submitError}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:-translate-y-0 transition-all duration-300"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin">⏳</span> Signing in...
                </span>
              ) : (
                '🚀 Sign In'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className={`absolute inset-0 flex items-center ${
                isLightMode ? 'border-t border-slate-300' : 'border-t border-slate-600'
              }`} />
              <div className="relative flex justify-center">
                <span className={`px-3 text-xs font-medium ${
                  isLightMode ? 'bg-white text-slate-600' : 'bg-slate-800/50 text-slate-400'
                }`}>
                  New here?
                </span>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className={`w-full py-3 rounded-xl font-bold text-sm border-2 transition-all duration-300 ${
                isLightMode
                  ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white'
                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/10 bg-slate-700/30'
              }`}
            >
              ✨ Create Account
            </button>

            {/* Back to Home */}
            <div className={`text-center text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              <Link to="/" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors">
                ← Back to Home
              </Link>
            </div>
          </form>
        </div>

        {/* Security & Stats Section */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className={`rounded-2xl p-4 text-center font-medium transition-all hover:shadow-lg ${
            isLightMode
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'bg-blue-900/30 text-blue-300 border border-blue-800'
          }`}>
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-xs font-semibold">Secure Login</div>
          </div>
          <div className={`rounded-2xl p-4 text-center font-medium transition-all hover:shadow-lg ${
            isLightMode
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-green-900/30 text-green-300 border border-green-800'
          }`}>
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-xs font-semibold">Fast Access</div>
          </div>
        </div>

        {/* Testimonial */}
        <div className={`mt-8 rounded-2xl p-5 border ${
          isLightMode
            ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
            : 'bg-yellow-900/20 border-yellow-800 text-yellow-200'
        }`}>
          <p className="text-sm font-medium text-center">
            💬 "Helped me pass my LET on the first try!" - <strong>Maria R.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
