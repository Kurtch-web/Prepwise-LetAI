import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import { Post, postsService } from '../services/postsService';
import { supabase } from '../config/supabaseClient';
import { formatRelativeTime } from '../utils/dateFormatter';
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
import { OfflineOverlay } from '../components/OfflineOverlay';

function NotificationsButton() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLightMode = theme === 'light';

  const [isOpen, setIsOpen] = useState(false);
  const [announcementPosts, setAnnouncementPosts] = useState<Post[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [ring, setRing] = useState(false);

  const storageKey = user?.id ? `announcement_read_ids_${user.id}` : 'announcement_read_ids';

  const loadReadIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((x) => typeof x === 'string'));
    } catch {
      return new Set();
    }
  };

  const saveReadIds = (ids: Set<string>) => {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(ids)));
  };

  const refresh = async (triggerRing: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      const res = await postsService.fetchAnnouncementPosts(20);
      const posts = res.posts || [];
      setAnnouncementPosts(posts);

      const readIds = loadReadIds();
      const unread = posts.filter((p) => !readIds.has(p.id));

      setUnreadCount((prev) => {
        if (triggerRing && unread.length > prev) {
          setRing(true);
          window.setTimeout(() => setRing(false), 1200);
        }
        return unread.length;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    refresh(false);
    let refreshTimeout: number | undefined;

    const scheduleRefresh = (triggerRing: boolean) => {
      if (refreshTimeout) window.clearTimeout(refreshTimeout);
      refreshTimeout = window.setTimeout(() => refresh(triggerRing), 350);
    };

    const channel = supabase
      .channel(`announcements_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: 'category=eq.admin' },
        (payload: any) => scheduleRefresh(payload.eventType === 'INSERT'),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: 'category=eq.news' },
        (payload: any) => scheduleRefresh(payload.eventType === 'INSERT'),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: 'category=eq.important' },
        (payload: any) => scheduleRefresh(payload.eventType === 'INSERT'),
      )
      .subscribe();

    return () => {
      if (refreshTimeout) window.clearTimeout(refreshTimeout);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markRead = (postId: string) => {
    const readIds = loadReadIds();
    readIds.add(postId);

    const knownIds = new Set(announcementPosts.map((p) => p.id));
    const pruned = new Set(Array.from(readIds).filter((id) => knownIds.has(id)));
    saveReadIds(pruned);

    setUnreadCount(announcementPosts.filter((p) => !pruned.has(p.id)).length);
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setSelectedPost(null);
          refresh(false);
        }}
        className={`relative px-3 py-2 rounded-lg font-semibold transition-all ${
          isLightMode
            ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            : 'bg-slate-800 text-white hover:bg-slate-700'
        } ${ring ? 'animate-bounce' : ''}`}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500" />
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-start justify-center z-[1000] px-4 pt-24 pb-6 overflow-y-auto"
            onClick={() => {
              setIsOpen(false);
              setSelectedPost(null);
            }}
          >
            <div
              className={`rounded-2xl border w-full max-w-2xl max-h-[75vh] overflow-hidden flex flex-col ${
                isLightMode
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-800 border-slate-700'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`border-b p-5 flex items-center justify-between ${
                isLightMode ? 'border-slate-200' : 'border-slate-700'
              }`}>
                <div>
                  <h3 className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    Notifications
                  </h3>
                  <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                    🛡️ Admin, 📰 News, ⚠️ Important
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedPost(null);
                  }}
                  className={`text-2xl font-bold ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  ✕
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1">
                {loading ? (
                  <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                    Loading...
                  </p>
                ) : selectedPost ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          selectedPost.category === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : selectedPost.category === 'news'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {selectedPost.category === 'admin' && '🛡️ Admin'}
                          {selectedPost.category === 'news' && '📰 News'}
                          {selectedPost.category === 'important' && '⚠️ Important'}
                        </span>
                        <span className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                          {formatRelativeTime(selectedPost.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedPost(null)}
                        className={`text-sm font-semibold ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}
                      >
                        Back
                      </button>
                    </div>

                    <p className={`text-base leading-relaxed ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {selectedPost.content}
                    </p>

                    {selectedPost.attachments && selectedPost.attachments.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedPost.attachments.map((a) => (
                          <div
                            key={a.id}
                            className={`rounded-lg overflow-hidden ${isLightMode ? 'bg-slate-100' : 'bg-slate-700/50'}`}
                          >
                            {a.file_type?.startsWith('image') ? (
                              <img
                                src={a.file_url}
                                alt={a.original_filename || 'Attachment'}
                                className="w-full h-40 object-cover"
                              />
                            ) : (
                              <div className={`w-full h-40 flex items-center justify-center ${
                                isLightMode ? 'bg-slate-200' : 'bg-slate-700'
                              }`}>
                                <span className="text-3xl">📎</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : announcementPosts.length === 0 ? (
                  <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                    No notifications yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const readIds = loadReadIds();
                      return announcementPosts.map((p) => {
                        const isUnread = !readIds.has(p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              markRead(p.id);
                              setSelectedPost(p);
                            }}
                            className={`w-full text-left rounded-xl border p-4 transition-all ${
                              isLightMode
                                ? isUnread
                                  ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                                : isUnread
                                ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
                                : 'bg-slate-800 border-slate-700 hover:bg-slate-700/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    p.category === 'admin'
                                      ? 'bg-red-100 text-red-700'
                                      : p.category === 'news'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {p.category === 'admin' && '🛡️ Admin'}
                                    {p.category === 'news' && '📰 News'}
                                    {p.category === 'important' && '⚠️ Important'}
                                  </span>
                                  {isUnread && <span className="h-2 w-2 rounded-full bg-red-500" />}
                                </div>
                                <p className={`text-sm font-semibold line-clamp-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                  {p.content}
                                </p>
                                <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                                  {formatRelativeTime(p.created_at)}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

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
      <header className={`sticky top-0 z-40 px-4 sm:px-6 py-4 sm:py-5 backdrop-blur-xl sm:px-8 lg:px-16 transition-colors duration-200 ${
        isLightMode
          ? 'bg-white border-b border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.08)]'
          : 'border-b border-emerald-500/20 bg-[#064e3bcc] shadow-[0_25px_60px_rgba(6,78,59,0.55)]'
      }`}>
        <div className="flex items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
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
              <div className="flex items-center gap-1 sm:gap-2">
                <p className={`text-base sm:text-2xl font-bold truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>💡 LET AI Control Hub</p>
              </div>
              <p className={`hidden sm:block text-xs sm:text-sm ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>Flashcards & Quiz Management</p>
            </div>
          </div>

          {/* Mobile User Info */}
          <div className="lg:hidden flex items-center gap-2">
            {user && (
              <span className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full ${
                user.role === 'admin'
                  ? isLightMode
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-purple-500/20 text-purple-300'
                  : isLightMode
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {user.role === 'admin' ? '👑 Admin' : '👤'}
              </span>
            )}
            <NotificationsButton />
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
            <NotificationsButton />
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
        <div className={`flex gap-1.5 sm:gap-2 border-t pt-3 sm:pt-4 overflow-x-auto ${
          isLightMode ? 'border-slate-200' : 'border-emerald-500/20'
        }`}>
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 flex-shrink-0 whitespace-nowrap ${
                currentTab.id === tab.id
                  ? isLightMode
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/40'
                  : isLightMode
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <span className="text-sm sm:text-lg">{tab.label.split(' ')[0]}</span>
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
        >
          {/* Mobile Menu Panel */}
          <div
            className={`absolute top-0 left-0 right-0 px-4 py-4 border-b ${
              isLightMode
                ? 'bg-gradient-to-br from-white to-slate-50 border-slate-200'
                : 'bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/20'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3 max-w-xs">
              {user && (
                <>
                  <div className={`px-4 py-3 rounded-xl border ${
                    isLightMode
                      ? 'bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200'
                      : 'bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/30'
                  }`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      Logged in as
                    </p>
                    <p className={`text-base font-bold mt-1.5 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {user.username}
                    </p>
                    <span className={`inline-block mt-2.5 text-xs font-bold px-3 py-1 rounded-full ${
                      user.role === 'admin'
                        ? isLightMode
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-purple-500/30 text-purple-200'
                        : isLightMode
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-500/30 text-emerald-200'
                    }`}>
                      {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                      isLightMode
                        ? 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95'
                        : 'bg-slate-700/50 text-white hover:bg-slate-700 active:scale-95'
                    }`}
                  >
                    {isLightMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                      isLightMode
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 active:scale-95 border border-red-200'
                        : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 active:scale-95 border border-red-500/30'
                    }`}
                  >
                    🚪 Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
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

  if (isLanding) {
    return (
      <>
        <OfflineOverlay />
        <LandingPage />
      </>
    );
  }
  if (isAuthPage || location.pathname === '/reset-password') {
    return (
      <>
        <OfflineOverlay />
        <div className={`min-h-screen`}>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </div>
      </>
    );
  }

  return (
    <>
      <OfflineOverlay />
      <MainLayout />
    </>
  );
}
