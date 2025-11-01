import { useEffect, useRef, useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { SignupForm } from '../components/SignupForm';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import type { SignupResponse } from '../services/api';

const getCardShellClasses = (isDark: boolean) =>
  isDark
    ? 'rounded-3xl border border-blue-500/20 bg-[#002459]/80 p-7 shadow-[0_18px_40px_rgba(0,36,89,0.45)] backdrop-blur-xl'
    : 'light-mode-card rounded-3xl border p-7 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm';

const getSubtleButtonClasses = (isDark: boolean) =>
  isDark
    ? 'rounded-2xl border border-blue-500/30 px-5 py-3 font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/30'
    : 'light-mode-button-secondary rounded-2xl border px-5 py-3 font-semibold transition';

type EntryStep = 'choice' | 'signup';

export function UserLoginPage() {
  const { session, logout } = useAuth();
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const isUserAuthenticated = session?.role === 'user';
  const [entryStep, setEntryStep] = useState<EntryStep>('choice');
  const [isEntryModalOpen, setEntryModalOpen] = useState(() => !isUserAuthenticated);
  const [hasDismissedEntry, setHasDismissedEntry] = useState(false);
  const [signupBanner, setSignupBanner] = useState<string | null>(null);
  const previousAuthRef = useRef(isUserAuthenticated);

  useEffect(() => {
    if (isUserAuthenticated) {
      setEntryModalOpen(false);
      setSignupBanner(null);
      setHasDismissedEntry(false);
    } else if (previousAuthRef.current) {
      setHasDismissedEntry(false);
      setEntryStep('choice');
      setEntryModalOpen(true);
    } else if (!hasDismissedEntry) {
      setEntryModalOpen(true);
    }
    previousAuthRef.current = isUserAuthenticated;
  }, [isUserAuthenticated, hasDismissedEntry]);

  useEffect(() => {
    if (isEntryModalOpen && !isUserAuthenticated) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isEntryModalOpen, isUserAuthenticated]);

  const handleReturningUser = () => {
    setEntryModalOpen(false);
    setHasDismissedEntry(true);
    setEntryStep('choice');
  };

  const handleLaunchSignup = () => {
    setEntryStep('signup');
    setEntryModalOpen(true);
    setHasDismissedEntry(false);
    setSignupBanner(null);
  };

  const handleSignupSuccess = (response: SignupResponse) => {
    setEntryModalOpen(false);
    setHasDismissedEntry(true);
    setEntryStep('choice');
    setSignupBanner(`Account created for ${response.username}. You can sign in now.`);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="grid max-w-[780px] gap-2 sm:gap-3">
        <h1 className={`text-2xl sm:text-4xl md:text-5xl font-extrabold leading-tight ${
          isLightMode ? 'light-mode-text-primary' : 'text-white'
        }`}>Log in to stay connected</h1>
        <p className={`max-w-xl text-base sm:text-lg ${
          isLightMode ? 'light-mode-text-secondary' : 'text-white/70'
        }`}>
          Access your workspace, chat with the team, and keep your status updated automatically.
        </p>
      </div>
      {!isUserAuthenticated && isEntryModalOpen && (
        <div className={`fixed inset-0 z-50 grid place-items-center px-4 sm:px-6 backdrop-blur-xl ${
          isLightMode ? 'light-mode-modal-overlay' : 'bg-[#001233]/80'
        }`}>
          <div className={`w-full max-w-xl space-y-6 rounded-3xl sm:rounded-[36px] border p-6 sm:p-8 shadow-[0_30px_60px_rgba(4,10,20,0.65)] ${
            isLightMode
              ? 'light-mode-modal'
              : 'border-blue-500/20 bg-[#002459]/95'
          }`}>
            {entryStep === 'choice' ? (
              <div className="space-y-6 text-center">
                <div className="space-y-2">
                  <h2 className={`text-xl sm:text-2xl font-semibold ${isLightMode ? 'light-mode-text-primary' : 'text-white'}`}>Welcome! How can we help you sign in?</h2>
                  <p className={`text-sm ${isLightMode ? 'light-mode-text-secondary' : 'text-white/70'}`}>Pick the option that matches your status to continue.</p>
                </div>
                <div className="grid gap-3">
                  <button
                    type="button"
                    className={`rounded-2xl px-4 sm:px-5 py-3 font-semibold transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${
                      isLightMode
                        ? 'light-mode-button-primary hover:shadow-emerald-500/30'
                        : 'bg-gradient-to-br from-sky-400 to-emerald-400 text-slate-900 hover:shadow-emerald-400/30'
                    }`}
                    onClick={handleLaunchSignup}
                  >
                    I&apos;m new — create my member account
                  </button>
                  <button
                    type="button"
                    className={`rounded-2xl px-4 sm:px-5 py-3 font-semibold transition ${
                      isLightMode
                        ? 'light-mode-button-secondary'
                        : 'border border-white/20 text-white hover:border-indigo-400 hover:bg-indigo-500/20'
                    }`}
                    onClick={handleReturningUser}
                  >
                    I already have an account
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <header className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                  <div className="space-y-1 flex-1">
                    <h2 className={`text-xl sm:text-2xl font-semibold ${isLightMode ? 'light-mode-text-primary' : 'text-white'}`}>Create your member account</h2>
                    <p className={`text-xs sm:text-sm ${isLightMode ? 'light-mode-text-secondary' : 'text-white/70'}`}>Set up a username and password to start using the workspace.</p>
                  </div>
                  <button
                    type="button"
                    className={`rounded-lg sm:rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition flex-shrink-0 ${
                      isLightMode
                        ? 'border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
                        : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                    }`}
                    onClick={() => setEntryStep('choice')}
                  >
                    Back
                  </button>
                </header>
                <SignupForm
                  heading="Member signup"
                  description="Create your secure login details below."
                  layout="modal"
                  showExistingAccountHint={false}
                  onSuccess={handleSignupSuccess}
                />
                <p className={`text-xs ${isLightMode ? 'light-mode-text-secondary' : 'text-white/60'}`}>
                  Already registered?{' '}
                  <button
                    type="button"
                    className={`font-semibold transition ${
                      isLightMode
                        ? 'text-emerald-600 hover:text-emerald-700'
                        : 'text-sky-300 hover:text-sky-200'
                    }`}
                    onClick={handleReturningUser}
                  >
                    Jump to sign in.
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[repeat(2,minmax(320px,1fr))] xl:grid-cols-[minmax(320px,1fr)_minmax(280px,0.9fr)]">
        <LoginForm
          role="user"
          heading="Member sign in"
          description="Use your workspace account to start collaborating instantly."
          onShowSignup={handleLaunchSignup}
          successMessage={signupBanner}
        />
        {isUserAuthenticated ? (
          <aside className={`${getCardShellClasses(!isLightMode)} space-y-4 lg:col-span-2 xl:col-auto`} aria-live="polite">
            <h3 className={`text-lg font-semibold ${isLightMode ? 'light-mode-text-primary' : 'text-white'}`}>Current session</h3>
            <p className={`text-sm ${isLightMode ? 'light-mode-text-secondary' : 'text-white/70'}`}>You are signed in as {session?.username}.</p>
            <button className={getSubtleButtonClasses(!isLightMode)} type="button" onClick={logout}>
              Sign out
            </button>
          </aside>
        ) : (
          <aside className={`${getCardShellClasses(!isLightMode)} space-y-4 lg:col-span-2 xl:col-auto`}>
            <h3 className={`text-lg font-semibold ${isLightMode ? 'light-mode-text-primary' : 'text-white'}`}>Why stay online?</h3>
            <p className={`text-sm ${isLightMode ? 'light-mode-text-secondary' : 'text-white/70'}`}>
              Keeping your session active lets admins see you instantly, ensuring support when you need it.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
