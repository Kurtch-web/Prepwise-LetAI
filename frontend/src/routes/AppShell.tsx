import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { UserLoginPage } from '../views/UserLoginPage';
import { AdminPortalPage } from '../views/AdminPortalPage';
import { UserDashboardPage } from '../views/UserDashboardPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { SessionRoute } from '../components/SessionRoute';
import { NotificationsPage } from '../views/NotificationsPage';
import { CommunityPage } from '../views/CommunityPage';
import { UserProfilePage } from '../views/UserProfilePage';
import { ProfilePage } from '../views/ProfilePage';
import { SettingsPage } from '../views/SettingsPage';
import { ChatWidget } from '../components/ChatWidget';
import { api, UserProfile } from '../services/api';

interface NavItem {
  label: string;
  path: string;
  badge?: number;
}

function EmailVerificationBanner() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }

    const dismissKey = `email-warning-dismissed:${session.username}`;
    const isDismissed = window.localStorage.getItem(dismissKey) === 'true';
    setDismissed(isDismissed);

    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await api.getProfile(session.token);
        setProfile(res);
      } catch (e) {
        console.error('Failed to load profile for email verification banner', e);
      }
      setLoading(false);
    };

    loadProfile();
    const interval = window.setInterval(loadProfile, 30000);
    return () => window.clearInterval(interval);
  }, [session]);

  if (!session || loading || !profile || profile.emailVerifiedAt || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    const dismissKey = `email-warning-dismissed:${session.username}`;
    window.localStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-400/30 px-4 py-3 sm:px-8 lg:px-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-100">
            Verify your email address
          </p>
          <p className="text-xs text-amber-200/80">
            Unverified emails may result in account access restrictions or account loss.{' '}
            <NavLink to="/settings" className="underline hover:no-underline font-medium">
              Verify now
            </NavLink>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 text-amber-300 hover:text-amber-100 transition"
        title="Dismiss"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function HeaderBanner() {
  const { session, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const activePath = location.pathname;
  const [unreadPresence, setUnreadPresence] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLightMode = theme === 'light';
  const isUserRole = session?.role === 'user';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'rounded-full px-4 py-2 text-sm font-semibold transition duration-200',
      isActive
        ? 'bg-gradient-to-br from-indigo-500 to-sky-400 text-slate-900 shadow-lg shadow-indigo-500/20'
        : 'text-white/70 hover:text-white'
    ].join(' ');

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'block w-full text-left px-4 py-3 rounded-lg font-semibold transition duration-200',
      isActive
        ? 'bg-gradient-to-r from-indigo-500 to-sky-400 text-slate-900'
        : 'text-white/70 hover:text-white hover:bg-white/5'
    ].join(' ');

  const homePath = session ? (session.role === 'admin' ? '/admin/console' : '/user') : '/';

  useEffect(() => {
    if (!session || session.role !== 'admin') {
      setUnreadPresence(0);
      return;
    }
    const storageKey = `presence_read:${session.username}`;
    const load = async () => {
      try {
        const res = await api.fetchPresenceEvents(session.token);
        const readMapRaw = window.localStorage.getItem(storageKey);
        const readMap: Record<string, boolean> = readMapRaw ? JSON.parse(readMapRaw) : {};
        const count = res.events.reduce((acc, e) => (readMap[e.id] ? acc : acc + 1), 0);
        setUnreadPresence(count);
      } catch {
        setUnreadPresence(0);
      }
    };
    load();
    const t = window.setInterval(load, 4000);
    return () => window.clearInterval(t);
  }, [session]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems: NavItem[] = session
    ? [
        { label: 'Home', path: homePath },
        { label: 'Notifications', path: '/notifications', badge: unreadPresence },
        { label: 'Community', path: '/community' },
        { label: 'Profile', path: '/profile' },
        { label: 'Settings', path: '/settings' }
      ]
    : [
        { label: 'User Login', path: '/' },
        { label: 'Admin Console', path: '/admin' }
      ];

  return (
    <>
      <header className={`sticky top-0 z-40 rounded-b-[40px] px-6 py-5 backdrop-blur-2xl sm:px-8 lg:px-16 transition-colors duration-200 ${
        isLightMode
          ? 'light-mode-header'
          : 'border-b border-white/10 bg-[#0a0d0fcc] shadow-[0_25px_60px_rgba(6,12,20,0.55)]'
      }`}>
        <div className="flex items-center justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden inline-flex flex-col gap-1.5 p-2 rounded-lg transition duration-200 ${
                isLightMode
                  ? 'hover:bg-emerald-100 text-slate-900'
                  : 'hover:bg-white/10 text-white'
              }`}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span
                className={`h-0.5 w-6 transition-all duration-300 ${
                  mobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                } ${isLightMode ? 'bg-slate-900' : 'bg-white'}`}
              />
              <span
                className={`h-0.5 w-6 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''} ${
                  isLightMode ? 'bg-slate-900' : 'bg-white'
                }`}
              />
              <span
                className={`h-0.5 w-6 transition-all duration-300 ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                } ${isLightMode ? 'bg-slate-900' : 'bg-white'}`}
              />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">💡</span>
                <p className={`text-lg sm:text-2xl font-bold truncate ${isLightMode ? 'light-mode-text-primary' : 'text-white'}`}>LET AI Control Hub</p>
              </div>
              <p className={`hidden sm:block text-xs sm:text-sm ${isLightMode ? 'light-mode-text-secondary' : 'text-white/70'}`}>Monitor and guide every live workspace</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className={`hidden lg:flex items-center gap-3 rounded-full p-1.5 ${
            isLightMode
              ? 'border border-emerald-200 bg-emerald-50/50'
              : 'border border-white/10 bg-white/10'
          }`} aria-label="Primary">
            {navItems.map((item) => {
              const isActive = activePath === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={() =>
                    isLightMode
                      ? isActive
                        ? 'light-mode-nav-item-active rounded-full px-4 py-2 text-sm font-semibold transition duration-200 shadow-lg shadow-emerald-500/20'
                        : 'light-mode-nav-item rounded-full px-4 py-2 text-sm font-semibold transition duration-200'
                      : navLinkClass({ isActive })
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                    ) : null}
                  </span>
                </NavLink>
              );
            })}
            {isUserRole && (
              <div className="hidden lg:flex items-center gap-1 pl-1.5 border-l border-white/10">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition duration-200 ${
                    isLightMode
                      ? 'bg-gradient-to-br from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  {isLightMode ? '☀️' : '🌙'}
                </button>
              </div>
            )}
          </nav>

          {/* Session Info */}
          {session ? (
            <div className={`hidden lg:flex items-center gap-2 text-sm flex-shrink-0 ${
              isLightMode ? 'light-mode-text-primary' : 'text-white/90'
            }`} role="status">
              <span className={`h-2.5 w-2.5 rounded-full ${
                isLightMode ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(95,248,164,0.8)]'
              }`} />
              <span className="font-medium">{session.role === 'admin' ? 'Admin' : 'Member'}: {session.username}</span>
            </div>
          ) : (
            <span className={`hidden lg:block text-xs font-semibold uppercase tracking-wide ${
              isLightMode ? 'text-emerald-600' : 'text-white/60'
            }`}>
              {activePath === '/admin' ? 'Admin' : 'User'} area
            </span>
          )}
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <div
          className={`fixed inset-0 top-[72px] z-30 lg:hidden backdrop-blur-sm ${
            isLightMode ? 'bg-slate-900/10' : 'bg-[#04070f]/40'
          }`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <nav
        className={`fixed left-0 top-[72px] bottom-0 z-30 w-64 transform transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isLightMode
            ? 'light-mode-sidebar border-r'
            : 'bg-[#0a0d0f] border-r border-white/10'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col h-full p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={() =>
                  isLightMode
                    ? isActive
                      ? 'light-mode-nav-item-active block w-full text-left px-4 py-3 rounded-lg font-semibold transition duration-200'
                      : 'light-mode-nav-item block w-full text-left px-4 py-3 rounded-lg font-semibold transition duration-200 hover:bg-emerald-50'
                    : mobileNavLinkClass({ isActive })
                }
              >
                <span className="flex items-center justify-between w-full">
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  ) : null}
                </span>
              </NavLink>
            );
          })}

          {session && (
            <>
              <div className={`border-t ${isLightMode ? 'border-emerald-200' : 'border-white/10'} my-4`} />
              <div className="px-4 py-3">
                <p className={`text-xs uppercase tracking-widest mb-2 ${
                  isLightMode ? 'text-emerald-600' : 'text-white/60'
                }`}>Session</p>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    isLightMode
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : 'bg-emerald-400 shadow-[0_0_8px_rgba(95,248,164,0.8)]'
                  }`} />
                  <span className={`text-sm font-medium ${isLightMode ? 'light-mode-text-primary' : 'text-white'}`}>
                    {session.role === 'admin' ? 'Admin' : 'Member'}: {session.username}
                  </span>
                </div>
                {isUserRole && (
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition mb-3 flex items-center justify-between ${
                      isLightMode
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span>{isLightMode ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isLightMode
                      ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

export function AppShell() {
  const { theme } = useTheme();
  const { session } = useAuth();
  const isAdmin = session?.role === 'admin';
  const isLightMode = !isAdmin && theme === 'light';

  useEffect(() => {
    const html = document.documentElement;
    if (isAdmin) {
      html.classList.remove('light');
      html.classList.add('dark');
    }
  }, [isAdmin]);

  return (
    <div className={`flex min-h-screen flex-col transition-colors duration-200 ${
      isLightMode ? 'bg-gradient-to-b from-green-50 to-emerald-50' : 'bg-[#050709]'
    }`}>
      <HeaderBanner />
      {session && <EmailVerificationBanner />}
      <main className={`flex-1 px-4 py-6 sm:px-8 lg:px-16 lg:py-12 ${isLightMode ? '' : ''}`}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<UserLoginPage />} />
          <Route path="/admin" element={<AdminPortalPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin/console" element={<AdminPortalPage />} />
          </Route>
          <Route element={<ProtectedRoute role="user" />}>
            <Route path="/user" element={<UserDashboardPage />} />
          </Route>
          <Route element={<SessionRoute />}>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/user/:username" element={<UserProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ChatWidget />
    </div>
  );
}
