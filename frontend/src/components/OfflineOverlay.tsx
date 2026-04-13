import { useEffect, useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineOverlay() {
  const { theme } = useTheme();
  const { isOnline } = useOnlineStatus();
  const isLightMode = theme === 'light';

  const [secondsOffline, setSecondsOffline] = useState(0);

  useEffect(() => {
    if (isOnline) {
      setSecondsOffline(0);
      return;
    }

    setSecondsOffline(0);
    const id = window.setInterval(() => setSecondsOffline((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
      <div className={`absolute inset-0 ${isLightMode ? 'bg-white/70' : 'bg-black/60'} backdrop-blur-sm`} />

      <div
        className={`relative w-full max-w-md rounded-2xl border p-6 shadow-xl ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
        }`}
        role="dialog"
        aria-live="polite"
      >
        <div className="flex items-start gap-4">
          <div
            className={`mt-1 h-3 w-3 rounded-full ${isLightMode ? 'bg-emerald-600' : 'bg-emerald-400'} animate-pulse`}
          />
          <div className="min-w-0">
            <h3 className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Waiting for connection
            </h3>
            <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
              You’re offline. We’ll automatically continue when your internet is back.
            </p>
            <p className={`text-xs mt-2 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Offline for {secondsOffline}s
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`w-full rounded-xl px-4 py-2 font-semibold transition ${
              isLightMode
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className={`w-full rounded-xl px-4 py-2 font-semibold transition border ${
              isLightMode
                ? 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'
            }`}
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
