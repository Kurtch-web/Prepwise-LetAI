import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { FlashcardsTab } from '../components/FlashcardsTab';

export function FlashcardsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  return (
    <div className={`transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
        : 'bg-[#051b15]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className={`text-4xl font-black mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            🎴 Flashcards
          </h1>
          <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Study with interactive flashcards to master key concepts and definitions for your {user?.reviewType} exam
          </p>
        </div>

        {/* Flashcards Component */}
        <FlashcardsTab isAdmin={user?.role === 'admin'} />
      </div>
    </div>
  );
}
