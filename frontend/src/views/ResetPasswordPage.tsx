import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';
import { authService } from '../services/authService';

type ResetStep = 'email' | 'code' | 'success';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Step 1: Request reset code
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!email.endsWith('@cvsu.edu.ph')) {
      newErrors.email = 'Strictly use CVSU email (@cvsu.edu.ph)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitSuccess('Reset code sent to your email. Check your inbox.');
      setStep('code');
      
      // Start resend countdown
      setResendCountdown(60);
      const interval = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset password with code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = 'Reset code is required';
    } else if (code.length !== 6) {
      newErrors.code = 'Code must be 6 digits';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Password confirmation is required';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email, code, newPassword, confirmPassword);
      setStep('success');
      setSubmitSuccess('Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend reset code
  const handleResendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsLoading(true);
    
    try {
      await authService.forgotPassword(email);
      setSubmitSuccess('Reset code resent to your email.');
      
      setResendCountdown(60);
      const interval = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to resend reset code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-200 ${
        isLightMode
          ? 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'
          : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
      }`}
    >
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <div className={`text-5xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent`}>
              🔑
            </div>
          </div>
          <h1 className={`text-3xl font-black mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            Reset Password
          </h1>
          <p className={`text-base font-medium ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Regain access to your account
          </p>
        </div>

        {/* Main Card */}
        <div
          className={`rounded-3xl p-8 backdrop-blur-xl border transition-all duration-300 ${
            isLightMode
              ? 'bg-white/95 border-slate-200 shadow-xl'
              : 'bg-slate-800/50 border-slate-700 shadow-2xl'
          }`}
        >
          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="juan.delacruz@cvsu.edu.ph"
                  className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isLightMode
                      ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                      : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                  } outline-none`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {errors.email}
                  </p>
                )}
                <p
                  className={`text-xs mt-2 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}
                >
                  Enter the email address associated with your account.
                </p>
              </div>

              {submitError && (
                <div
                  className={`rounded-xl p-4 text-sm font-medium ${
                    isLightMode
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-red-900/20 border border-red-800 text-red-300'
                  }`}
                >
                  <p className="flex items-center gap-2">
                    <span>❌</span> {submitError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:-translate-y-0 transition-all duration-300"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin">⏳</span> Sending Code...
                  </span>
                ) : (
                  '📧 Send Reset Code'
                )}
              </button>

              <div className={`text-center text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors">
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Code & Password */}
          {step === 'code' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {submitSuccess && (
                <div
                  className={`rounded-xl p-3 text-xs font-medium ${
                    isLightMode
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-emerald-900/20 border border-emerald-800 text-emerald-300'
                  }`}
                >
                  <p className="flex items-center gap-2">
                    <span>✅</span> {submitSuccess}
                  </p>
                </div>
              )}

              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}
                >
                  Reset Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(val);
                    if (errors.code) {
                      setErrors(prev => ({ ...prev, code: '' }));
                    }
                  }}
                  placeholder="000000"
                  className={`w-full rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest transition-all border ${
                    errors.code
                      ? isLightMode
                        ? 'border-red-500 bg-white text-slate-900 focus:ring-2 focus:ring-red-100'
                        : 'border-red-500 bg-slate-700/50 text-white focus:ring-2 focus:ring-red-500/20'
                      : isLightMode
                      ? 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                      : 'border-slate-600 bg-slate-700/50 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  } placeholder:text-slate-400 outline-none`}
                />
                {errors.code && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {errors.code}
                  </p>
                )}
                <p
                  className={`text-xs mt-2 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}
                >
                  Check your email for the 6-digit code.
                </p>
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) {
                        setErrors(prev => ({ ...prev, newPassword: '' }));
                      }
                    }}
                    placeholder="8+ characters"
                    className={`w-full rounded-xl px-4 py-3 pr-12 text-sm font-medium transition-all border ${
                      isLightMode
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                        : 'bg-slate-700/50 border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
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
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {errors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                    placeholder="Confirm password"
                    className={`w-full rounded-xl px-4 py-3 pr-12 text-sm font-medium transition-all border ${
                      isLightMode
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                        : 'bg-slate-700/50 border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                    } outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${
                      isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {submitError && (
                <div
                  className={`rounded-xl p-4 text-sm font-medium ${
                    isLightMode
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-red-900/20 border border-red-800 text-red-300'
                  }`}
                >
                  <p className="flex items-center gap-2">
                    <span>❌</span> {submitError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:-translate-y-0 transition-all duration-300"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin">⏳</span> Resetting...
                  </span>
                ) : (
                  '🔐 Reset Password'
                )}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading || resendCountdown > 0}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    resendCountdown > 0
                      ? isLightMode
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                      : isLightMode
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : '🔄 Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setErrors({});
                    setSubmitError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isLightMode
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  ← Back
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="space-y-6 text-center">
              <div className="text-6xl animate-bounce">✅</div>
              <div>
                <h2
                  className={`text-2xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}
                >
                  Password Reset Complete!
                </h2>
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Your password has been successfully updated.
                </p>
              </div>
              <div
                className={`rounded-xl p-4 text-sm ${
                  isLightMode
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-emerald-900/20 border border-emerald-800 text-emerald-300'
                }`}
              >
                <p className="flex items-center gap-2 justify-center">
                  <span>🎉</span> {submitSuccess}
                </p>
              </div>
              <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                Redirecting to sign in page...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Need help?{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
