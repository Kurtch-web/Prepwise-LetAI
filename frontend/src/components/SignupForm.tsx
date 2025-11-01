import { FormEvent, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { SignupResponse } from '../services/api';

type SignupFormProps = {
  heading: string;
  description: string;
  layout?: 'card' | 'modal';
  showExistingAccountHint?: boolean;
  onSuccess?: (response: SignupResponse) => void;
};

const cardContainerClasses =
  'space-y-5 rounded-3xl border border-white/10 bg-[#0b111a]/80 p-7 shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-xl';
const modalContainerClasses =
  'space-y-5 rounded-4xl border border-white/10 bg-[#0b111a]/95 p-8 shadow-[0_30px_60px_rgba(4,10,20,0.6)] backdrop-blur-2xl';

export function SignupForm({
  heading,
  description,
  layout = 'card',
  showExistingAccountHint = true,
  onSuccess
}: SignupFormProps) {
  const { signup } = useAuth();
  const [formValues, setFormValues] = useState({ username: '', password: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (event: FormEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    setFormValues(previous => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const response = await signup({
        username: formValues.username.trim(),
        password: formValues.password
      });
      setSuccessMessage(response.message);
      setFormValues({ username: '', password: '' });
      onSuccess?.(response);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Something went wrong while creating the account.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const containerClasses = layout === 'modal' ? modalContainerClasses : cardContainerClasses;

  return (
    <section className={containerClasses} aria-label={layout === 'modal' ? 'member signup dialog' : 'member signup module'}>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{heading}</h2>
        <p className="text-sm text-white/70">{description}</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="text-xs font-semibold uppercase tracking-widest text-white/70" htmlFor="signup-username">
          Choose a username
        </label>
        <input
          id="signup-username"
          name="username"
          className="w-full rounded-2xl border border-white/20 bg-[#080c14]/60 px-4 py-3 text-sm text-slate-100 transition focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
          autoComplete="username"
          value={formValues.username}
          onInput={handleChange}
          minLength={3}
          maxLength={64}
          required
          placeholder="Create a username"
        />
        <label className="text-xs font-semibold uppercase tracking-widest text-white/70" htmlFor="signup-password">
          Set a password
        </label>
        <div className="relative">
          <input
            id="signup-password"
            name="password"
            className="w-full rounded-2xl border border-white/20 bg-[#080c14]/60 px-4 py-3 pr-24 text-sm text-slate-100 transition focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
            autoComplete="new-password"
            value={formValues.password}
            onInput={handleChange}
            minLength={6}
            maxLength={128}
            required
            type={passwordVisible ? 'text' : 'password'}
            placeholder="Create a secure password"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
            onClick={() => setPasswordVisible(current => !current)}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          >
            {passwordVisible ? 'Hide' : 'Show'}
          </button>
        </div>
        {successMessage ? (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300" role="status">
            {successMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="rounded-xl bg-rose-500/20 px-3 py-2 text-sm text-rose-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <button
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-400/30 disabled:translate-y-0 disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      {showExistingAccountHint ? (
        <p className="text-xs text-white/60">Already registered? Use the sign-in form to the right.</p>
      ) : null}
    </section>
  );
}
