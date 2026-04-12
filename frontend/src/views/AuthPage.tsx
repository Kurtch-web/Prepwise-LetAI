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
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [hotlineNumber] = useState(() => `1-800-${Math.floor(Math.random() * 900000) + 100000}`);
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
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'
        : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    }`}>
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className={`text-4xl sm:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4`}>
            💡
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black mb-2 sm:mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            LET Review Hub
          </h1>
          <p className={`text-sm sm:text-lg font-medium ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Master your GenEd & ProfEd exams today
          </p>
        </div>

        {/* Main Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl border transition-all duration-300"
          style={{
            borderColor: isLightMode ? '#cbd5e1' : '#475569',
            backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 41, 59, 0.5)'
          }}>

          {/* Left Side - Info Section */}
          <div className={`p-6 sm:p-12 flex flex-col justify-between ${
            isLightMode
              ? 'bg-gradient-to-br from-emerald-50 to-blue-50'
              : 'bg-gradient-to-br from-emerald-900/20 to-blue-900/20'
          }`}>
            <div>
              <h2 className={`text-xl sm:text-3xl font-black mb-4 sm:mb-6 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {mode === 'signin' ? '🔐 Welcome Back' : '✨ Join Us Today'}
              </h2>
              <p className={`text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                {mode === 'signin'
                  ? 'Continue your LET exam preparation journey and achieve your goals with our comprehensive study materials.'
                  : '“Education is the most powerful weapon which you can use to change the world.” — Nelson Mandela'}
              </p>

              {/* Features List */}
              <div className="space-y-3 sm:space-y-4">
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
                      <div className="text-2xl mt-1">�</div>
                      <div>
                        <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          “The beautiful thing about learning is that no one can take it away from you.”
                        </p>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>— B.B. King</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">⏳</div>
                      <div>
                        <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          “Success is the sum of small efforts, repeated day in and day out.”
                        </p>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>— Robert Collier</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">�</div>
                      <div>
                        <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          “There are no shortcuts to any place worth going.”
                        </p>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>— Beverly Sills</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Stats Section Removed */}
          </div>

          {/* Right Side - Form Section */}
          <div className="p-6 sm:p-12 flex flex-col justify-center">
            {/* Mode Slider */}
            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8">
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
                className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
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
                className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
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
              <form onSubmit={verificationCodeSent ? handleVerifySignUpCode : handleSendVerificationCode} className="space-y-4 max-h-[500px] sm:max-h-[650px] overflow-y-auto pr-2">
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
        <div className="text-center mt-6 sm:mt-8">
          <p className={`text-xs sm:text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Need help? <button onClick={() => setShowSupportModal(true)} className="text-emerald-600 hover:text-emerald-700 font-semibold bg-none border-none cursor-pointer">Contact support</button>
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
            <h3 className="font-bold mb-2">1. Acceptance of Terms</h3>
            <p className="text-justify">
              By creating an account, accessing the platform, or using any of the learning materials, quizzes, AI diagnostics, analytics, or related features of PREPWISE LET AI, you agree to be bound by these Terms of Service and any future updates we publish. If you do not agree, you may not use the service.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">2. User Eligibility</h3>
            <p className="text-justify">
              PREPWISE LET AI is intended for LET takers, education students, review center participants, and other individuals who are lawfully using the platform for board exam preparation and study support. You represent that any information you submit is true, current, and belongs to you or that you have permission to provide it.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. Account Responsibility</h3>
            <p className="text-justify">
              You are responsible for maintaining the confidentiality of your login credentials, including your password and any verification codes, and for all activity that occurs under your account. You must immediately notify us if you suspect unauthorized access, account takeover, or misuse of your account.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">4. Educational Purpose and AI Disclaimer</h3>
            <p className="text-justify">
              The platform provides review materials, practice questions, learning materials, and AI-assisted diagnostics for educational support only. The AI diagnostics, recommendations, scoring estimates, and study insights are not a guarantee that a user will pass the actual LET examination. Results may vary depending on the user’s preparation, performance, and other factors. The platform does not replace formal instruction, official PRC materials, professional judgment, or independent study.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">5. Permitted Use</h3>
            <p className="text-justify">
              You may use the service for personal, lawful, and educational purposes only. You may view, read, practice, and review content made available by the platform, but you may not reproduce, distribute, publicly display, sell, sublicense, or exploit the materials except as explicitly allowed by law or by us in writing.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">6. Prohibited Conduct</h3>
            <p className="text-justify">
              You agree that you will not hack, probe, scan, or bypass security controls; scrape, harvest, or collect data from the platform; attempt to reverse engineer the service; upload malware or harmful code; impersonate another person; use the AI to generate illegal, abusive, harassing, defamatory, hateful, or infringing content; or use the service in any way that violates law, regulation, school policy, or the rights of others.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">7. User Content and Responsibility</h3>
            <p className="text-justify">
              If you submit answers, notes, messages, reports, or other content, you remain responsible for that content. You grant us the limited right to process such content to operate, improve, secure, and support the platform. You must not submit information that you are not allowed to share, including another person’s sensitive information without authorization.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">8. Suspension and Termination</h3>
            <p className="text-justify">
              We may suspend, restrict, or permanently terminate access to any account or content at any time if we believe a user violated these Terms, endangered the platform, abused the AI features, misused data, or engaged in conduct that could harm other users, the service, or our legal and security obligations.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">9. Availability and Changes</h3>
            <p className="text-justify">
              We may change, update, suspend, or discontinue any part of the platform at any time, with or without notice. We may also revise these Terms from time to time. Continued use after changes means you accept the updated Terms.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">10. Governing Law</h3>
            <p className="text-justify">
              These Terms are governed by and interpreted under the laws of the Republic of the Philippines. Any dispute arising from or related to the use of the platform will be resolved under Philippine law, subject to any mandatory legal process that may apply.
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
            <h3 className="font-bold mb-2">1. Our Commitment to the Safety of the Guest&apos;s Data</h3>
            <p className="text-justify">
              We recognize that student records, learning progress, assessment activity, and account details require strong protection. This Privacy Policy explains how we collect, use, store, share, and protect personal data in connection with PREPWISE LET AI, including information that may be considered Sensitive Personal Information under the Data Privacy Act of 2012 (DPA).
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">2. Personal Information Controller</h3>
            <p className="text-justify">
              The Personal Information Controller (PIC) is the person or team operating PREPWISE LET AI and determining the purposes and means of processing your information. The PIC is responsible for ensuring that the data you provide is handled lawfully, fairly, and transparently, and that the platform only processes what is necessary to deliver educational services, maintain accounts, and improve the learning experience.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. Information We Collect</h3>
            <p className="text-justify">
              We collect the information you provide directly when you register, update your profile, use review features, submit answers, upload videos or files, or contact support. This may include your name, email address, username, password, school or course details, study preferences, assessment history, exam preparation data, and other account-related information. We may also collect usage data such as device information, IP address, timestamps, pages visited, quiz attempts, and activity logs to keep the service secure and functional.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">4. Sensitive Personal Information</h3>
            <p className="text-justify">
              Because the platform is designed for students and LET review users, some of the information we process may qualify as Sensitive Personal Information or closely related educational data. We only collect and process this information when it is necessary to provide the service and when there is a valid legal basis, including user consent, fulfillment of a user request, legitimate educational purposes, or other grounds allowed by the DPA and applicable regulations. We do not process sensitive data beyond what is needed to operate the platform.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">5. How We Use Information</h3>
            <p className="text-justify">
              We use the information we collect to create and maintain accounts, personalize lessons and quizzes, provide AI diagnostics, track progress, generate reports, prevent abuse, secure the platform, respond to support requests, and improve our services. We may also use data to troubleshoot errors, monitor performance, and ensure that the content and services are delivered correctly across web and mobile browsers.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">6. Third-Party Service Providers and Data Disclosure</h3>
            <p className="text-justify">
              To operate the platform, certain data may be processed by trusted third-party service providers. Our frontend and backend are hosted on Vercel. Our database is stored in Supabase. Video files are stored in R2 Cloud Storage. Video playback and delivery are handled through Bunny CDN. These providers may process data on our behalf strictly to host, store, transmit, cache, or deliver content and to keep the service available. We disclose information to these providers only as necessary for service operation, security, analytics, or legal compliance. Where applicable, we require these providers to protect data using appropriate technical and organizational safeguards.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">7. Data Subject Rights</h3>
            <p className="text-justify">
              Under the DPA, you may exercise the following rights, subject to the conditions and exceptions provided by law: the right to be informed, the right to access, the right to object, the right to erasure or blocking, the right to damages, the right to rectify, the right to file a complaint, and the right to data portability. You may contact us to request access to your data, corrections to inaccurate records, deletion where appropriate, or explanations regarding how your information is handled.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">8. Data Retention</h3>
            <p className="text-justify">
              We keep personal data only for as long as reasonably necessary to deliver the service, comply with legal obligations, resolve disputes, enforce agreements, and maintain security. Unless a longer retention period is required by law or needed for a legitimate operational reason, we generally retain account data and related learning records for up to one year after the user&apos;s last login or account activity. After that period, data is reviewed for deletion, anonymization, or archival as appropriate.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">9. Data Disposal and Deletion</h3>
            <p className="text-justify">
              When data is no longer needed, we dispose of it using permanent deletion methods, including digital shredding, secure database deletion, and removal from active storage systems and connected backups where technically feasible. For stored media and files, we use deletion processes intended to prevent reasonable reconstruction of the data after disposal.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">10. Data Security</h3>
            <p className="text-justify">
              We use administrative, technical, and physical safeguards intended to protect data from unauthorized access, loss, misuse, disclosure, alteration, or destruction. These safeguards may include access controls, authentication, encryption in transit where supported, limited internal access, logging, and monitoring. However, no online system is completely secure, so you should also protect your own account credentials and devices.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">11. DPO and Privacy Contact</h3>
            <p className="text-justify">
              If you have questions, requests, or concerns about how your data is handled, you may contact our Data Protection Officer or privacy contact at support@letreviewhub.edu. Please include enough detail so we can identify your request and respond appropriately.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">12. Changes to This Policy</h3>
            <p className="text-justify">
              We may update this Privacy Policy from time to time to reflect changes in law, our services, or our data handling practices. When we do, we will update the effective date or otherwise provide notice where appropriate. Continued use of the platform after changes means you acknowledge the updated policy.
            </p>
          </div>
        </div>
      </Modal>

      {/* Support Contact Modal */}
      <Modal
        title="Support & Resources"
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      >
        <div className="space-y-8">
          {/* Platform Support Section */}
          <div>
            <h3 className={`text-lg font-bold mb-4 pb-3 border-b ${isLightMode ? 'text-emerald-700 border-emerald-200' : 'text-emerald-300 border-emerald-800'}`}>
              📞 Platform Support
            </h3>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isLightMode ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-900/20 border border-emerald-800'}`}>
                <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`}>MAIN HOTLINE</p>
                <p className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>1-800-PREPWISE</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Mon-Fri, 9AM-5PM</p>
              </div>

              <div className={`p-4 rounded-lg ${isLightMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/20 border border-blue-800'}`}>
                <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>EMAIL SUPPORT</p>
                <p className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>support@prepwise.edu.ph</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Response within 24 hours</p>
              </div>
            </div>
          </div>

          {/* Crisis & Abuse Support Section */}
          <div>
            <h3 className={`text-lg font-bold mb-4 pb-3 border-b ${isLightMode ? 'text-red-700 border-red-200' : 'text-red-300 border-red-800'}`}>
              🆘 Crisis & Abuse Support
            </h3>
            <p className={`text-sm mb-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              If you or someone you know needs help, please reach out to these resources:
            </p>
            <div className="space-y-3">
              <div className={`p-4 rounded-lg ${isLightMode ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 border border-red-800'}`}>
                <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-red-600' : 'text-red-400'}`}>🏠 DOMESTIC ABUSE HOTLINE</p>
                <p className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>1-800-799-7233 (SAFE)</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>National Domestic Violence Hotline - 24/7</p>
              </div>

              <div className={`p-4 rounded-lg ${isLightMode ? 'bg-orange-50 border border-orange-200' : 'bg-orange-900/20 border border-orange-800'}`}>
                <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-orange-600' : 'text-orange-400'}`}>🏫 SCHOOL ABUSE & BULLYING</p>
                <p className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>1-800-4-A-CHILD (1-800-422-4453)</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Childhelp National Child Abuse Hotline - 24/7</p>
              </div>

              <div className={`p-4 rounded-lg ${isLightMode ? 'bg-cyan-50 border border-cyan-200' : 'bg-cyan-900/20 border border-cyan-800'}`}>
                <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-cyan-600' : 'text-cyan-400'}`}>🧠 MENTAL HEALTH & SUICIDE PREVENTION</p>
                <p className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>988 (Suicide & Crisis Lifeline)</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Call or text 988 - Available 24/7</p>
              </div>

              <div className={`p-4 rounded-lg ${isLightMode ? 'bg-pink-50 border border-pink-200' : 'bg-pink-900/20 border border-pink-800'}`}>
                <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-pink-600' : 'text-pink-400'}`}>⚖️ SEXUAL ASSAULT & HARASSMENT</p>
                <p className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>1-800-656-HOPE (4673)</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>RAINN National Sexual Assault Hotline - 24/7</p>
              </div>

              <div className={`p-4 rounded-lg ${isLightMode ? 'bg-indigo-50 border border-indigo-200' : 'bg-indigo-900/20 border border-indigo-800'}`}>
                <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-indigo-600' : 'text-indigo-400'}`}>💊 SUBSTANCE ABUSE & ADDICTION</p>
                <p className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>1-800-662-4357 (SAMHSA)</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Substance Abuse & Mental Health Services - 24/7</p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className={`p-4 rounded-lg border-l-4 ${isLightMode ? 'bg-yellow-50 border-l-yellow-500 border border-yellow-200' : 'bg-yellow-900/20 border-l-yellow-500 border border-yellow-800'}`}>
            <p className={`text-sm font-semibold mb-2 ${isLightMode ? 'text-yellow-800' : 'text-yellow-200'}`}>
              ⚠️ In Case of Emergency
            </p>
            <p className={`text-sm ${isLightMode ? 'text-yellow-700' : 'text-yellow-300'}`}>
              If you are in immediate danger, please call 911 or your local emergency services. These hotlines are confidential and free.
            </p>
          </div>
        </div>
      </Modal>

    </div>
  );
}
