import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import { AdminPortalPage } from '../views/AdminPortalPage';
import { UserDashboardPage } from '../views/UserDashboardPage';
import { LandingPage } from '../views/LandingPage';
import { AuthPage } from '../views/AuthPage';
import { ResetPasswordPage } from '../views/ResetPasswordPage';
import { SettingsPage } from '../views/SettingsPage';
import { LearningMaterialsPage } from '../views/LearningMaterialsPage';
import { FlashcardsPage } from '../views/FlashcardsPage';
import { StudyGuidesPage } from '../views/StudyGuidesPage';
import { QuizPage } from '../views/QuizPage';
import { QuestionBankPage } from '../views/QuestionBankPage';
import VideoLessonsPage from '../views/VideoLessonsPage';
import { ProgressTrackerPage } from '../views/ProgressTrackerPage';

function HeaderBanner() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLightMode = theme === 'light';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = location.pathname.startsWith('/admin');
  const isLanding = location.pathname === '/';

  // Don't show header on landing, login, or signup pages
  if (isLanding || location.pathname === '/login' || location.pathname === '/signup') return null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navTabs = [
    { id: 'home', label: '🏠 Home', path: '/dashboard' },
    { id: 'materials', label: '📚 Learning Materials', path: '/materials' },
    { id: 'quiz', label: '📝 Test', path: '/quiz' },
    { id: 'settings', label: '⚙️ Settings', path: '/settings' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: '👑 Admin Dashboard', path: '/admin' }] : [])
  ];

  const currentTab = navTabs.find(tab => location.pathname.startsWith(tab.path)) || navTabs[0];

  return (
    <>
      <header className={`sticky top-0 z-40 px-6 py-5 backdrop-blur-xl sm:px-8 lg:px-16 transition-colors duration-200 ${
        isLightMode
          ? 'bg-white border-b border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.08)]'
          : 'border-b border-emerald-500/20 bg-[#064e3bcc] shadow-[0_25px_60px_rgba(6,78,59,0.55)]'
      }`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden inline-flex flex-col gap-1.5 p-2 rounded-lg transition duration-200 ${
                isLightMode
                  ? 'hover:bg-slate-100 text-slate-900'
                  : 'hover:bg-emerald-500/20 text-white'
              }`}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span
                className={`h-0.5 w-6 transition-all duration-300 ${
                  mobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                } ${isLightMode ? 'bg-slate-700' : 'bg-white'}`}
              />
              <span
                className={`h-0.5 w-6 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''} ${
                  isLightMode ? 'bg-slate-700' : 'bg-white'
                }`}
              />
              <span
                className={`h-0.5 w-6 transition-all duration-300 ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                } ${isLightMode ? 'bg-slate-700' : 'bg-white'}`}
              />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-lg sm:text-2xl font-bold truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>💡 LET AI Control Hub</p>
              </div>
              <p className={`hidden sm:block text-xs sm:text-sm ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>Flashcards & Quiz Management</p>
            </div>
          </div>

          <div className={`hidden lg:flex items-center gap-3 flex-shrink-0 text-sm ${
            isLightMode ? 'text-slate-900' : 'text-white/90'
          }`}>
            <button
              onClick={toggleTheme}
              className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                isLightMode
                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              {isLightMode ? '🌙' : '☀️'}
            </button>
            {user && (
              <>
                <span className={`font-medium px-3 py-1 rounded-full ${
                  isAdmin
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-600 hover:bg-red-500/30 font-semibold transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex gap-2 border-t pt-4 ${
          isLightMode ? 'border-slate-200' : 'border-emerald-500/20'
        }`}>
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                currentTab.id === tab.id
                  ? isLightMode
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/40'
                  : isLightMode
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <span className="text-lg">{tab.label.split(' ')[0]}</span>
              <span className="hidden sm:inline">{tab.label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className={`fixed inset-0 top-[140px] z-30 lg:hidden backdrop-blur-sm ${
          isLightMode ? 'bg-slate-900/5' : 'bg-[#051b15]/40'
        }`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else if (requireAdmin && user?.role !== 'admin') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, user, navigate, requireAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (requireAdmin && user?.role !== 'admin') return null;

  return <>{children}</>;
}

function MainLayout() {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  return (
    <div className={`flex min-h-screen flex-col transition-colors duration-200 ${
      isLightMode ? 'bg-gradient-to-b from-green-50 via-white to-slate-50' : 'bg-[#051b15]'
    }`}>
      <HeaderBanner />
      <main className={`flex-1 px-4 py-6 sm:px-8 lg:px-16 lg:py-12`}>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><LearningMaterialsPage /></ProtectedRoute>} />
          <Route path="/materials/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
          <Route path="/materials/study-guides" element={<ProtectedRoute><StudyGuidesPage /></ProtectedRoute>} />
          <Route path="/materials/question-bank" element={<ProtectedRoute><QuestionBankPage /></ProtectedRoute>} />
          <Route path="/materials/video-lessons" element={<ProtectedRoute><VideoLessonsPage /></ProtectedRoute>} />
          <Route path="/materials/progress-tracker" element={<ProtectedRoute><ProgressTrackerPage /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminPortalPage /></ProtectedRoute>} />
          <Route path="/admin/console" element={<ProtectedRoute requireAdmin={true}><AdminPortalPage /></ProtectedRoute>} />
          <Route path="*" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isLanding) return <LandingPage />;
  if (isAuthPage || location.pathname === '/reset-password') {
    return (
      <div className={`min-h-screen`}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </div>
    );
  }

  return <MainLayout />;
}
