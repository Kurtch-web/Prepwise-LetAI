import { FormEvent, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { LoginRequest, UserRole } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { setCookie } from '../services/cookies';
import { ForgotPasswordModal } from './ForgotPasswordModal';

const defaultCredentials: Record<UserRole, { username: string; password: string }> = {
  user: { username: '', password: '' },
  admin: { username: '', password: '' }
};

export function LoginForm({
  role,
  heading,
  description,
  onShowSignup,
  successMessage
}: {
  role: UserRole;
  heading: string;
  description: string;
  onShowSignup?: () => void;
  successMessage?: string | null;
}) {
  const { login, isAuthenticating, errorMessage } = useAuth();
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [formValues, setFormValues] = useState(defaultCredentials[role]);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event: FormEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    setFormValues(previous => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: LoginRequest = {
      role,
      username: formValues.username.trim(),
      password: formValues.password
    };
    try {
      await login(payload);
      setCookie('login_time', new Date().toISOString(), 7);
      if (role === 'admin') {
        navigate('/admin/console', { replace: true });
      } else {
        navigate('/user', { replace: true });
      }
    } catch {
      // error message surfaced via context state
    }
  };

  return (
    <section
      className={`space-y-5 rounded-3xl border p-6 sm:p-7 backdrop-blur-xl transition-all ${
        isLightMode
          ? 'light-mode-card shadow-[0_18px_40px_rgba(0,0,0,0.08)]'
          : 'border-white/10 bg-[#0b111a]/80 shadow-[0_18px_40px_rgba(4,10,20,0.55)]'
      }`}
      aria-label={`${role} login module`}
    >
      <div className="space-y-2">
        <h2 className={`text-lg sm:text-xl font-semibold ${isLightMode ? 'light-mode-text-primary' : 'text-white'}`}>{heading}</h2>
        <p className={`text-sm ${isLightMode ? 'light-mode-text-secondary' : 'text-white/70'}`}>{description}</p>
      </div>
      {successMessage ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${
          isLightMode
            ? 'border-emerald-300/50 bg-emerald-100 text-emerald-700'
            : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
        }`} role="status">
          {successMessage}
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${
            isLightMode ? 'light-mode-text-secondary' : 'text-white/70'
          }`} htmlFor={`${role}-username`}>
            Username
          </label>
          <input
            id={`${role}-username`}
            name="username"
            className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-4 ${
              isLightMode
                ? 'light-mode-input focus:border-emerald-400 focus:ring-emerald-500/20'
                : 'border-white/20 bg-[#080c14]/60 text-slate-100 focus:border-indigo-400 focus:ring-indigo-500/20'
            }`}
            autoComplete="username"
            value={formValues.username}
            onInput={handleChange}
            required
            minLength={3}
            placeholder="Enter your username"
          />
        </div>
        <div>
          <label className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${
            isLightMode ? 'light-mode-text-secondary' : 'text-white/70'
          }`} htmlFor={`${role}-password`}>
            Password
          </label>
          <div className="relative">
            <input
              id={`${role}-password`}
              name="password"
              className={`w-full rounded-2xl border px-4 py-3 pr-20 sm:pr-24 text-sm transition focus:outline-none focus:ring-4 ${
                isLightMode
                  ? 'light-mode-input focus:border-emerald-400 focus:ring-emerald-500/20'
                  : 'border-white/20 bg-[#080c14]/60 text-slate-100 focus:border-indigo-400 focus:ring-indigo-500/20'
              }`}
              autoComplete={`${role === 'admin' ? 'current-password' : 'new-password'}`}
              value={formValues.password}
              onInput={handleChange}
              required
              minLength={6}
              type={passwordVisible ? 'text' : 'password'}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 text-xs font-semibold transition whitespace-nowrap ${
                isLightMode
                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              onClick={() => setPasswordVisible(current => !current)}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            >
              {passwordVisible ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className={`text-xs font-semibold transition ${
                isLightMode
                  ? 'text-emerald-600 hover:text-emerald-700'
                  : 'text-sky-300 hover:text-sky-200'
              }`}
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot password?
            </button>
          </div>
        </div>
        {errorMessage ? (
          <p className={`rounded-xl px-3 py-2 text-sm ${
            isLightMode
              ? 'bg-red-100 text-red-700 border border-red-300/50'
              : 'bg-rose-500/20 text-rose-400'
          }`}>{errorMessage}</p>
        ) : null}
        <button
          className={`flex h-12 w-full items-center justify-center rounded-2xl font-semibold transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:translate-y-0 disabled:opacity-60 ${
            isLightMode
              ? 'light-mode-button-primary hover:shadow-emerald-500/30'
              : 'bg-gradient-to-br from-indigo-500 to-sky-400 text-slate-900 hover:shadow-sky-500/30'
          }`}
          type="submit"
          disabled={isAuthenticating}
        >
          {isAuthenticating ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {onShowSignup ? (
        <p className={`text-xs ${isLightMode ? 'light-mode-text-secondary' : 'text-white/60'}`}>
          Need to make an account?{' '}
          <button
            type="button"
            className={`font-semibold transition ${
              isLightMode
                ? 'text-emerald-600 hover:text-emerald-700'
                : 'text-sky-300 hover:text-sky-200'
            }`}
            onClick={onShowSignup}
          >
            Create one now.
          </button>
        </p>
      ) : null}
      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
    </section>
  );
}
