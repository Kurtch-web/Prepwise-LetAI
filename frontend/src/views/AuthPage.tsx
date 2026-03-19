import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import { API_BASE } from '../config/backends';

interface Instructor {
  id: number;
  username: string;
  fullName: string;
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { signup, login, isLoading } = useAuth();
  const isLightMode = theme === 'light';

  const initialMode = location.pathname === '/login' ? 'signin' : 'signup';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const [signInData, setSignInData] = useState({
    username: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    review_type: 'GenEd',
    target_exam_date: '',
    instructor_id: ''
  });

  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [codeVerificationStep, setCodeVerificationStep] = useState<'input' | 'verify'>('input');
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Fetch instructors on mount
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await fetch(`${API_BASE}/instructors`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setInstructors(data.instructors || []);
        }
      } catch (error) {
        console.error('Failed to fetch instructors:', error);
      }
    };

    fetchInstructors();
  }, []);

  // Email validation helper
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setEmailValidation(null);
      return;
    }

    const isCVSU = email.endsWith('@cvsu.edu.ph');
    setEmailValidation({
      isValid: isCVSU,
      message: isCVSU ? '✅ Valid CVSU email' : '❌ Strictly use CVSU email (@cvsu.edu.ph)'
    });
  };

  // Sign In validation
  const validateSignIn = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!signInData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!signInData.password) {
      newErrors.password = 'Password is required';
    }

    setSignInErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sign Up validation
  const validateSignUp = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!signUpData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!signUpData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!signUpData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!signUpData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!signUpData.email.endsWith('@cvsu.edu.ph')) {
      newErrors.email = 'Strictly use CVSU email (@cvsu.edu.ph)';
    }

    if (signUpData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (signUpData.password !== signUpData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    if (!agreed) {
      newErrors.agreed = 'You must agree to the Terms & Privacy Policy';
    }

    if (!signUpData.instructor_id) {
      newErrors.instructor_id = 'Please select an instructor';
    }

    setSignUpErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Sign In (Simple - no code)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateSignIn()) {
      return;
    }

    try {
      await login(signInData.username, signInData.password);
      navigate('/dashboard');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  };


  // Handle Sign Up - Send Code (inline)
  const handleSendVerificationCode = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setSubmitError(null);
    setCodeError(null);
    setResendMessage(null);

    if (!verificationCodeSent && !validateSignUp()) {
      return;
    }

    try {
      const full_name = signUpData.middle_name
        ? `${signUpData.first_name} ${signUpData.middle_name} ${signUpData.last_name}`
        : `${signUpData.first_name} ${signUpData.last_name}`;

      const response = await fetch(`${API_BASE}/auth/send-verification-code`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: signUpData.email,
          full_name,
          username: signUpData.username
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { detail?: string }).detail || 'Failed to send verification code');
      }

      // Show code input field
      setVerificationCodeSent(true);
      setCodeVerificationStep('input');
      if (!verificationCode) {
        setVerificationCode('');
      }

      // Start 60-second countdown before resend is allowed
      setResendCountdown(60);
      setResendMessage('Code sent! Check your email.');

      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'Failed to send code. Please try again.');
    }
  };

  // Handle Sign Up - Verify Code and Create Account
  const handleVerifySignUpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);

    if (verificationCode.length !== 6) {
      setCodeError('Code must be 6 digits');
      return;
    }

    try {
      const full_name = signUpData.middle_name
        ? `${signUpData.first_name} ${signUpData.middle_name} ${signUpData.last_name}`
        : `${signUpData.first_name} ${signUpData.last_name}`;

      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name,
          username: signUpData.username,
          email: signUpData.email,
          password: signUpData.password,
          password_confirm: signUpData.password_confirm,
          review_type: signUpData.review_type,
          target_exam_date: signUpData.target_exam_date || undefined,
          instructor_id: signUpData.instructor_id ? parseInt(signUpData.instructor_id) : null,
          verification_code: verificationCode
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { detail?: string }).detail || 'Sign up failed');
      }

      const result = await response.json();

      if (result.success && result.token && result.user) {
        // Store token and user
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_user', JSON.stringify(result.user));

        // Reset states
        setVerificationCodeSent(false);
        setCodeVerificationStep('input');
        setVerificationCode('');
        setResendCountdown(0);
        setResendMessage(null);
        setSignUpData({
          first_name: '',
          last_name: '',
          middle_name: '',
          username: '',
          email: '',
          password: '',
          password_confirm: '',
          review_type: 'GenEd',
          target_exam_date: '',
          instructor_id: ''
        });

        navigate('/dashboard');
      }
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'Verification failed. Please try again.');
    }
  };

  // Modal Component
  const Modal = ({ title, children, isOpen, onClose }: { title: string; children: React.ReactNode; isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`rounded-2xl max-w-2xl w-full my-auto pointer-events-auto flex flex-col max-h-[90vh] ${
            isLightMode
              ? 'bg-white'
              : 'bg-slate-800'
          }`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b bg-inherit rounded-t-2xl"
            style={{
              borderColor: isLightMode ? '#e2e8f0' : '#334155'
            }}>
            <h2 className={`text-lg sm:text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {title}
            </h2>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className={`text-2xl leading-none pointer-events-auto cursor-pointer ${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              ×
            </button>
          </div>
          <div className={`p-4 sm:p-6 text-sm leading-relaxed overflow-y-auto flex-1 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'
        : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    }`}>
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`text-6xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4`}>
            💡
          </div>
          <h1 className={`text-4xl font-black mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            LET Review Hub
          </h1>
          <p className={`text-lg font-medium ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Master your GenEd & ProfEd exams today
          </p>
        </div>

        {/* Main Container */}
        <div className="grid grid-cols-2 gap-0 rounded-3xl overflow-hidden backdrop-blur-xl border transition-all duration-300"
          style={{
            borderColor: isLightMode ? '#cbd5e1' : '#475569',
            backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 41, 59, 0.5)'
          }}>
          
          {/* Left Side - Info Section */}
          <div className={`p-12 flex flex-col justify-between ${
            isLightMode
              ? 'bg-gradient-to-br from-emerald-50 to-blue-50'
              : 'bg-gradient-to-br from-emerald-900/20 to-blue-900/20'
          }`}>
            <div>
              <h2 className={`text-3xl font-black mb-6 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {mode === 'signin' ? '🔐 Welcome Back' : '✨ Join Us Today'}
              </h2>
              <p className={`text-lg leading-relaxed mb-8 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                {mode === 'signin'
                  ? 'Continue your LET exam preparation journey and achieve your goals with our comprehensive study materials.'
                  : 'Get instant access to updated GenEd & ProfEd materials aligned with the latest PRC standards.'}
              </p>

              {/* Features List */}
              <div className="space-y-4">
                {mode === 'signin' ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">📚</div>
                      <div>
                        <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Personalized Learning</p>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Based on your chosen review type</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">🎯</div>
                      <div>
                        <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Study Plans</p>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Custom schedules for your target date</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">⚡</div>
                      <div>
                        <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Quick Access</p>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Instant access to all your materials</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">🚀</div>
                      <div>
                        <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Free Forever</p>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>No credit card required to start</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">✅</div>
                      <div>
                        <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>PRC Aligned</p>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Latest 2024 exam standards</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">🎓</div>
                      <div>
                        <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Expert Content</p>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Curated by education professionals</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Stats Section Removed */}
          </div>

          {/* Right Side - Form Section */}
          <div className="p-12 flex flex-col justify-center">
            {/* Mode Slider */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => {
                  setMode('signin');
                  setSubmitError(null);
                  setVerificationCodeSent(false);
                  setVerificationCode('');
                  setCodeError(null);
                  setResendCountdown(0);
                  setResendMessage(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                  mode === 'signin'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/40'
                    : isLightMode
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                }`}
              >
                🔐 Sign In
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setSubmitError(null);
                  setVerificationCodeSent(false);
                  setVerificationCode('');
                  setCodeError(null);
                  setResendCountdown(0);
                  setResendMessage(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/40'
                    : isLightMode
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                }`}
              >
                ✨ Sign Up
              </button>
            </div>

            {/* Sign In Form */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={signInData.username}
                    onChange={(e) => {
                      setSignInData(prev => ({ ...prev, username: e.target.value }));
                      if (signInErrors.username) {
                        setSignInErrors(prev => ({ ...prev, username: '' }));
                      }
                    }}
                    placeholder="Enter your username"
                    className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isLightMode
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                        : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                    } outline-none`}
                  />
                  {signInErrors.username && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {signInErrors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label className={`text-sm font-semibold mb-2 block ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInData.password}
                      onChange={(e) => {
                        setSignInData(prev => ({ ...prev, password: e.target.value }));
                        if (signInErrors.password) {
                          setSignInErrors(prev => ({ ...prev, password: '' }));
                        }
                      }}
                      placeholder="Enter your password"
                      className={`w-full rounded-xl px-4 py-3 pr-12 text-sm font-medium transition-all ${
                        isLightMode
                          ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                          : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                      } outline-none`}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowPassword(!showPassword);
                      }}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg pointer-events-auto ${
                        isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      tabIndex={-1}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {signInErrors.password && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {signInErrors.password}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/reset-password')}
                  className={`text-xs font-semibold transition-colors mt-3 ${
                    isLightMode
                      ? 'text-emerald-600 hover:text-emerald-700 underline'
                      : 'text-emerald-400 hover:text-emerald-300 underline'
                  }`}
                >
                  Forgot Password?
                </button>

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
              </form>
            )}

            {/* Sign Up Form */}
            {mode === 'signup' && (
              <form onSubmit={verificationCodeSent ? handleVerifySignUpCode : handleSendVerificationCode} className="space-y-4 max-h-[650px] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${
                      isLightMode ? 'text-slate-900' : 'text-white'
                    }`}>
                      First Name <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={signUpData.first_name}
                      onChange={(e) => {
                        setSignUpData(prev => ({ ...prev, first_name: e.target.value }));
                        if (signUpErrors.first_name) {
                          setSignUpErrors(prev => ({ ...prev, first_name: '' }));
                        }
                      }}
                      placeholder="Juan"
                      className={`w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                        isLightMode
                          ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                          : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                      } outline-none`}
                    />
                    {signUpErrors.first_name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠️</span> {signUpErrors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${
                      isLightMode ? 'text-slate-900' : 'text-white'
                    }`}>
                      Last Name <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={signUpData.last_name}
                      onChange={(e) => {
                        setSignUpData(prev => ({ ...prev, last_name: e.target.value }));
                        if (signUpErrors.last_name) {
                          setSignUpErrors(prev => ({ ...prev, last_name: '' }));
                        }
                      }}
                      placeholder="Dela Cruz"
                      className={`w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                        isLightMode
                          ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                          : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                      } outline-none`}
                    />
                    {signUpErrors.last_name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠️</span> {signUpErrors.last_name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    Middle Name <span className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={signUpData.middle_name}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, middle_name: e.target.value }))}
                    placeholder="Santos"
                    className={`w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                      isLightMode
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                        : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    Username <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={signUpData.username}
                    onChange={(e) => {
                      setSignUpData(prev => ({ ...prev, username: e.target.value }));
                      if (signUpErrors.username) {
                        setSignUpErrors(prev => ({ ...prev, username: '' }));
                      }
                    }}
                    placeholder="juandelacruz"
                    className={`w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                      isLightMode
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                        : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                    } outline-none`}
                  />
                  {signUpErrors.username && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>⚠️</span> {signUpErrors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    CVSU Email <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="email"
                    disabled={verificationCodeSent}
                    value={signUpData.email}
                    onChange={(e) => {
                      const email = e.target.value;
                      setSignUpData(prev => ({ ...prev, email }));
                      validateEmail(email);
                      if (signUpErrors.email) {
                        setSignUpErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="juan.delacruz@cvsu.edu.ph"
                    className={`w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-all border ${
                      verificationCodeSent
                        ? isLightMode
                          ? 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'
                          : 'border-slate-600 bg-slate-800/30 text-slate-500 cursor-not-allowed'
                        : emailValidation?.isValid
                        ? isLightMode
                          ? 'border-emerald-500 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-100'
                          : 'border-emerald-500 bg-slate-700/50 text-white focus:ring-2 focus:ring-emerald-500/20'
                        : signUpErrors.email
                        ? isLightMode
                          ? 'border-red-500 bg-white text-slate-900 focus:ring-2 focus:ring-red-100'
                          : 'border-red-500 bg-slate-700/50 text-white focus:ring-2 focus:ring-red-500/20'
                        : isLightMode
                        ? 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                        : 'border-slate-600 bg-slate-700/50 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    } placeholder:text-slate-400 outline-none`}
                  />
                  {emailValidation && !verificationCodeSent && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${
                      emailValidation.isValid
                        ? 'text-emerald-500'
                        : 'text-red-500'
                    }`}>
                      {emailValidation.message}
                    </p>
                  )}
                  {signUpErrors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>❌</span> {signUpErrors.email}
                    </p>
                  )}

                  {!verificationCodeSent && (
                    <button
                      type="submit"
                      disabled={isLoading || !emailValidation?.isValid}
                      className="w-full mt-2 py-2 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="inline-block animate-spin">⏳</span> Sending Code...
                        </span>
                      ) : (
                        '📧 Send Code'
                      )}
                    </button>
                  )}
                </div>

                {verificationCodeSent && (
                  <div>
                    <div className={`rounded-lg p-3 text-xs mb-3 ${
                      isLightMode
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-emerald-900/20 border border-emerald-800 text-emerald-300'
                    }`}>
                      <p className="flex items-center gap-2">
                        <span>✅</span> Verification code sent to {signUpData.email}
                      </p>
                    </div>

                    <label className={`block text-sm font-semibold mb-1.5 ${
                      isLightMode ? 'text-slate-900' : 'text-white'
                    }`}>
                      Enter 6-Digit Code <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(val);
                        if (codeError) {
                          setCodeError(null);
                        }
                      }}
                      placeholder="000000"
                      className={`w-full rounded-lg px-3 py-2.5 text-xs font-medium text-center text-2xl tracking-widest transition-all border ${
                        codeError
                          ? isLightMode
                            ? 'border-red-500 bg-white text-slate-900 focus:ring-2 focus:ring-red-100'
                            : 'border-red-500 bg-slate-700/50 text-white focus:ring-2 focus:ring-red-500/20'
                          : isLightMode
                          ? 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                          : 'border-slate-600 bg-slate-700/50 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      } placeholder:text-slate-400 outline-none`}
                    />
                    {codeError && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <span>❌</span> {codeError}
                      </p>
                    )}
                    {resendMessage && (
                      <p className="text-emerald-500 text-xs mt-1.5 flex items-center gap-1">
                        <span>✅</span> {resendMessage}
                      </p>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendVerificationCode()}
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
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${
                      isLightMode ? 'text-slate-900' : 'text-white'
                    }`}>
                      Review Type <span className="text-emerald-600">*</span>
                    </label>
                    <select
                      value={signUpData.review_type}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, review_type: e.target.value }))}
                      className={`w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                        isLightMode
                          ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                          : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      } outline-none`}
                    >
                      <option value="GenEd">📚 GenEd</option>
                      <option value="ProfEd">🎓 ProfEd</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${
                      isLightMode ? 'text-slate-900' : 'text-white'
                    }`}>
                      Target Exam
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={signUpData.target_exam_date}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, target_exam_date: e.target.value }))}
                      className={`w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                        isLightMode
                          ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                          : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      } outline-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    Assigned Instructor <span className="text-emerald-600">*</span>
                  </label>
                  <select
                    value={signUpData.instructor_id}
                    onChange={(e) => {
                      setSignUpData(prev => ({ ...prev, instructor_id: e.target.value }));
                      if (signUpErrors.instructor_id) {
                        setSignUpErrors(prev => ({ ...prev, instructor_id: '' }));
                      }
                    }}
                    className={`w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                      isLightMode
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                        : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    } outline-none`}
                  >
                    <option value="">-- Select an instructor --</option>
                    {instructors.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.fullName}
                      </option>
                    ))}
                  </select>
                  {signUpErrors.instructor_id && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>⚠️</span> {signUpErrors.instructor_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    Password <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signUpData.password}
                      onChange={(e) => {
                        setSignUpData(prev => ({ ...prev, password: e.target.value }));
                        if (signUpErrors.password) {
                          setSignUpErrors(prev => ({ ...prev, password: '' }));
                        }
                      }}
                      placeholder="8+ characters"
                      className={`w-full rounded-lg px-3 py-2.5 pr-10 text-xs font-medium transition-all ${
                        isLightMode
                          ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                          : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                      } outline-none`}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowPassword(!showPassword);
                      }}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-base pointer-events-auto ${
                        isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      tabIndex={-1}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {signUpErrors.password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>⚠️</span> {signUpErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    Confirm Password <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signUpData.password_confirm}
                      onChange={(e) => {
                        setSignUpData(prev => ({ ...prev, password_confirm: e.target.value }));
                        if (signUpErrors.password_confirm) {
                          setSignUpErrors(prev => ({ ...prev, password_confirm: '' }));
                        }
                      }}
                      placeholder="Confirm password"
                      className={`w-full rounded-lg px-3 py-2.5 pr-10 text-xs font-medium transition-all ${
                        isLightMode
                          ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                          : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                      } outline-none`}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowConfirmPassword(!showConfirmPassword);
                      }}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-base pointer-events-auto ${
                        isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {signUpErrors.password_confirm && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>⚠️</span> {signUpErrors.password_confirm}
                    </p>
                  )}
                </div>

                <div className={`rounded-lg p-3.5 ${
                  isLightMode
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-blue-900/20 border border-blue-800'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="agreed"
                      checked={agreed}
                      onChange={(e) => {
                        setAgreed(e.target.checked);
                        if (e.target.checked && signUpErrors.agreed) {
                          setSignUpErrors(prev => ({
                            ...prev,
                            agreed: ''
                          }));
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                    />
                    <label htmlFor="agreed" className={`text-xs leading-snug cursor-pointer font-medium ${
                      isLightMode ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
                      >
                        Terms
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
                      >
                        Privacy
                      </button>
                    </label>
                  </div>
                  {signUpErrors.agreed && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <span>⚠️</span> {signUpErrors.agreed}
                    </p>
                  )}
                </div>

                {submitError && (
                  <div className={`rounded-lg p-3 text-xs font-medium ${
                    isLightMode
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-red-900/20 border border-red-800 text-red-300'
                  }`}>
                    <p className="flex items-center gap-2">
                      <span>❌</span> {submitError}
                    </p>
                  </div>
                )}

                {submitError && (
                  <div className={`rounded-lg p-3 text-xs font-medium ${
                    isLightMode
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-red-900/20 border border-red-800 text-red-300'
                  }`}>
                    <p className="flex items-center gap-2">
                      <span>❌</span> {submitError}
                    </p>
                  </div>
                )}

                {verificationCodeSent && (
                  <button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 6}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:-translate-y-0 transition-all duration-300"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block animate-spin">⏳</span> Creating Account...
                      </span>
                    ) : (
                      '✨ Create Account'
                    )}
                  </button>
                )}

                {verificationCodeSent && (
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationCodeSent(false);
                      setCodeVerificationStep('input');
                      setVerificationCode('');
                      setCodeError(null);
                      setResendCountdown(0);
                      setResendMessage(null);
                    }}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isLightMode
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    Change Email
                  </button>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Need help? <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold">Contact support</a>
          </p>
        </div>
      </div>

      {/* Terms Modal */}
      <Modal 
        title="Terms of Service" 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)}
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">1. Use License</h3>
            <p className="text-justify">
              Permission is granted to temporarily download one copy of the materials (information or software) on LET Review Hub for personal, non-commercial transitory viewing only.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">2. Disclaimer</h3>
            <p className="text-justify">
              The materials on LET Review Hub are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. Limitations</h3>
            <p className="text-justify">
              In no event shall LET Review Hub or its suppliers be liable for any damages arising out of the use or inability to use the materials on the site.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">4. Accuracy of Materials</h3>
            <p className="text-justify">
              The materials appearing on LET Review Hub could include technical, typographical, or photographic errors. We do not warrant that any of the materials are accurate, complete, or current.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">5. Modifications</h3>
            <p className="text-justify">
              LET Review Hub may revise these terms of service for the site at any time without notice. By using this site, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </div>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        title="Privacy Policy"
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">1. Information We Collect</h3>
            <p className="text-justify">
              We collect information you provide directly to us, such as when you create an account, including your name, email address, username, and password.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">2. How We Use Your Information</h3>
            <p className="text-justify">
              We use the information we collect to provide, maintain, and improve our service, to send you technical notices and support messages.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. Data Security</h3>
            <p className="text-justify">
              We implement appropriate technical and organizational measures designed to protect personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">4. Information Sharing</h3>
            <p className="text-justify">
              We do not sell, trade, or rent your personal identification information to others. We may share aggregated demographic information with our business partners.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">5. Your Rights</h3>
            <p className="text-justify">
              You have the right to access, update, or delete your personal information at any time by logging into your account or contacting us.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">6. Changes to This Policy</h3>
            <p className="text-justify">
              We reserve the right to modify this privacy policy at any time. Your continued use of the service means that you accept and agree to the changes.
            </p>
          </div>
        </div>
      </Modal>

    </div>
  );
}
