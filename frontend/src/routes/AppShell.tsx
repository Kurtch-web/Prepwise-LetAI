import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';
import { AdminPortalPage } from '../views/AdminPortalPage';
import { UserDashboardPage } from '../views/UserDashboardPage';

function HeaderBanner() {
  const { theme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLightMode = theme === 'light';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <header className={`sticky top-0 z-40 rounded-b-[40px] px-6 py-5 backdrop-blur-2xl sm:px-8 lg:px-16 transition-colors duration-200 ${
        isLightMode
          ? 'light-mode-header'
          : 'border-b border-blue-500/20 bg-[#002459cc] shadow-[0_25px_60px_rgba(0,36,89,0.55)]'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden inline-flex flex-col gap-1.5 p-2 rounded-lg transition duration-200 ${
                isLightMode
                  ? 'hover:bg-emerald-100 text-slate-900'
                  : 'hover:bg-blue-500/20 text-white'
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
                <p className={`text-lg sm:text-2xl font-bold truncate ${isLightMode ? 'light-mode-text-primary' : 'text-white'}`}>💡 LET AI Control Hub</p>
              </div>
              <p className={`hidden sm:block text-xs sm:text-sm ${isLightMode ? 'light-mode-text-secondary' : 'text-white/70'}`}>Flashcards & Quiz Management</p>
            </div>
          </div>

          <div className={`hidden lg:flex items-center gap-4 flex-shrink-0 text-sm ${
            isLightMode ? 'light-mode-text-primary' : 'text-white/90'
          }`}>
            <span className={`font-medium ${isAdmin ? 'text-blue-400' : 'text-emerald-400'}`}>
              {isAdmin ? 'Admin Console' : 'Flashcards'}
            </span>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className={`fixed inset-0 top-[72px] z-30 lg:hidden backdrop-blur-sm ${
          isLightMode ? 'bg-slate-900/10' : 'bg-[#001233]/40'
        }`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

export function AppShell() {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  return (
    <div className={`flex min-h-screen flex-col transition-colors duration-200 ${
      isLightMode ? 'bg-gradient-to-b from-green-50 to-emerald-50' : 'bg-[#001233]'
    }`}>
      <HeaderBanner />
      <main className={`flex-1 px-4 py-6 sm:px-8 lg:px-16 lg:py-12`}>
        <Routes>
          <Route path="/" element={<UserDashboardPage />} />
          <Route path="/admin" element={<AdminPortalPage />} />
          <Route path="/admin/console" element={<AdminPortalPage />} />
          <Route path="*" element={<UserDashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}
