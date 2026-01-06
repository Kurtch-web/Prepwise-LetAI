import { FormEvent, useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { PASSWORD_RESET_API_BASE } from '../config/backends';

type Step = 'email' | 'code' | 'password' | 'success';

async function passwordResetRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PASSWORD_RESET_API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = (errorBody as { detail?: string; message?: string }).detail ??
      (errorBody as { message?: string }).message ??
      response.statusText;
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await passwordResetRequest<void>('/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await passwordResetRequest<{ valid: boolean; message: string }>('/auth/verify-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email, code })
      });
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await passwordResetRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, new_password: newPassword })
      });
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
      <div
        className={`w-full max-w-md rounded-3xl border p-7 shadow-2xl backdrop-blur-xl transition-all ${
          isLightMode
            ? 'light-mode-card border-emerald-200 shadow-[0_18px_40px_rgba(0,0,0,0.08)]'
            : 'border-white/10 bg-[#0b111a]/90 shadow-[0_18px_40px_rgba(4,10,20,0.55)]'
        }`}
      >
        {step === 'success' ? (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <div className="flex justify-center text-5xl">✅</div>
              <h2 className={`text-2xl font-bold ${isLightMode ? 'light-mode-text-primary' : 'text-white'}`}>
                Password Reset
              </h2>
              <p className={isLightMode ? 'light-mode-text-secondary' : 'text-white/70'}>
                Your password has been successfully reset
              </p>
            </div>
            <p className={`text-sm ${isLightMode ? 'light-mode-text-secondary' : 'text-white/60'}`}>
              You can now sign in with your new password
            </p>
            <button
              type="button"
              className={`w-full rounded-2xl px-4 py-3 font-semibold transition hover:-translate-y-0.5 ${
                isLightMode
                  ? 'light-mode-button-primary'
                  : 'bg-gradient-to-br from-indigo-500 to-sky-400 text-slate-900'
              }`}
              onClick={onClose}
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${isLightMode ? 'light-mode-text-primary' : 'text-white'}`}>
                  Reset Password
                </h2>
              </div>
              <div className="flex gap-2">
                {(['email', 'code', 'password'] as const).map((s, i) => {
                  const allSteps = ['email', 'code', 'password', 'success'] as const;
                  const stepIndex = allSteps.indexOf(step);
                  const isActive = stepIndex >= i;
                  return (
                    <div
                      key={s}
                      className={`h-2 flex-1 rounded-full transition ${
                        isActive
                          ? 'bg-emerald-500'
                          : isLightMode
                            ? 'bg-gray-300'
                            : 'bg-white/20'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {error && (
              <p
                className={`rounded-xl border px-3 py-2 text-sm ${
                  isLightMode
                    ? 'border-red-300/50 bg-red-100 text-red-700'
                    : 'border-rose-400/30 bg-rose-500/20 text-rose-300'
                }`}
              >
                {error}
              </p>
            )}

            {step === 'email' && (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label
                    className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${
                      isLightMode ? 'light-mode-text-secondary' : 'text-white/70'
                    }`}
                    htmlFor="reset-email"
                  >
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-4 ${
                      isLightMode
                        ? 'light-mode-input focus:border-emerald-400 focus:ring-emerald-500/20'
                        : 'border-white/20 bg-[#080c14]/60 text-slate-100 focus:border-indigo-400 focus:ring-indigo-500/20'
                    }`}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <p className={`text-xs ${isLightMode ? 'light-mode-text-secondary' : 'text-white/60'}`}>
                  We'll send a reset code to your email address
                </p>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className={`w-full rounded-2xl px-4 py-3 font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 ${
                    isLightMode
                      ? 'light-mode-button-primary'
                      : 'bg-gradient-to-br from-indigo-500 to-sky-400 text-slate-900'
                  }`}
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            )}

            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label
                    className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${
                      isLightMode ? 'light-mode-text-secondary' : 'text-white/70'
                    }`}
                    htmlFor="reset-code"
                  >
                    Reset Code
                  </label>
                  <input
                    id="reset-code"
                    type="text"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm text-center tracking-widest font-mono transition focus:outline-none focus:ring-4 ${
                      isLightMode
                        ? 'light-mode-input focus:border-emerald-400 focus:ring-emerald-500/20'
                        : 'border-white/20 bg-[#080c14]/60 text-slate-100 focus:border-indigo-400 focus:ring-indigo-500/20'
                    }`}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <p className={`text-xs ${isLightMode ? 'light-mode-text-secondary' : 'text-white/60'}`}>
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className={`flex-1 rounded-2xl px-4 py-3 font-semibold transition ${
                      isLightMode
                        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        : 'border border-white/20 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className={`flex-1 rounded-2xl px-4 py-3 font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 ${
                      isLightMode
                        ? 'light-mode-button-primary'
                        : 'bg-gradient-to-br from-indigo-500 to-sky-400 text-slate-900'
                    }`}
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </div>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${
                      isLightMode ? 'light-mode-text-secondary' : 'text-white/70'
                    }`}
                    htmlFor="new-password"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={passwordVisible ? 'text' : 'password'}
                      className={`w-full rounded-2xl border px-4 py-3 pr-20 text-sm transition focus:outline-none focus:ring-4 ${
                        isLightMode
                          ? 'light-mode-input focus:border-emerald-400 focus:ring-emerald-500/20'
                          : 'border-white/20 bg-[#080c14]/60 text-slate-100 focus:border-indigo-400 focus:ring-indigo-500/20'
                      }`}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        isLightMode
                          ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      onClick={() => setPasswordVisible(!passwordVisible)}
                    >
                      {passwordVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${
                      isLightMode ? 'light-mode-text-secondary' : 'text-white/70'
                    }`}
                    htmlFor="confirm-password"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type={passwordVisible ? 'text' : 'password'}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-4 ${
                      isLightMode
                        ? 'light-mode-input focus:border-emerald-400 focus:ring-emerald-500/20'
                        : 'border-white/20 bg-[#080c14]/60 text-slate-100 focus:border-indigo-400 focus:ring-indigo-500/20'
                    }`}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Confirm your password"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('code');
                      setError('');
                    }}
                    className={`flex-1 rounded-2xl px-4 py-3 font-semibold transition ${
                      isLightMode
                        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        : 'border border-white/20 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newPassword || newPassword !== confirmPassword}
                    className={`flex-1 rounded-2xl px-4 py-3 font-semibold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 ${
                      isLightMode
                        ? 'light-mode-button-primary'
                        : 'bg-gradient-to-br from-indigo-500 to-sky-400 text-slate-900'
                    }`}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
            {(step as any) !== 'success' && <button onClick={onClose}>Back to Sign In</button>}
          </div>
        )}
      </div>
    </div>
  );
}
