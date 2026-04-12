import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { WelcomeModal } from '../components/WelcomeModal';
import { PostFeed } from '../components/PostFeed';


export function UserDashboardPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [platformInfoModal, setPlatformInfoModal] = useState<null | {
    title: string;
    description: string;
    primaryActionLabel: string;
    primaryAction: () => void;
  }>(null);

  const displayName = user?.username?.split('@')[0] || 'User';
  const reviewType = user?.reviewType || 'GenEd';
  const targetExamDate = user?.targetExamDate;

  const missionPoints = [
    {
      icon: '🎓',
      title: 'Quality Education Access',
      description: 'We believe every aspiring teacher deserves access to quality preparation resources'
    },
    {
      icon: '🤝',
      title: 'Community Support',
      description: 'Connect with peers, share experiences, and learn together in a supportive environment'
    },
    {
      icon: '📈',
      title: 'Evidence-Based Learning',
      description: 'Comprehensive content aligned with PRC standards and modern teaching practices'
    },
    {
      icon: '✨',
      title: 'Continuous Improvement',
      description: 'We improve our platform based on your feedback and real outcomes'
    }
  ];

  const institutionalValues = [
    {
      title: 'Empowerment',
      description: 'Equipping educators with tools to achieve their full potential and make meaningful contributions'
    },
    {
      title: 'Excellence',
      description: 'Maintaining the highest standards in educational content and platform quality'
    },
    {
      title: 'Collaboration',
      description: 'Fostering a community where educators support each other\'s growth and success'
    }
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="grid gap-2 sm:gap-3 px-4 sm:px-0">
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold ${
            isLightMode ? 'text-slate-900' : 'text-white'
          }`}>
            Welcome, {displayName}
          </h1>
          <p className={`text-base sm:text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Your journey to becoming an excellent educator starts here
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`text-xs sm:text-sm px-3 py-1 rounded-full font-medium ${
              isLightMode
                ? 'bg-blue-100 text-blue-700'
                : 'bg-blue-900/20 text-blue-300'
            }`}>
              📚 {reviewType}
            </span>
            {targetExamDate && (
              <span className={`text-xs sm:text-sm px-3 py-1 rounded-full font-medium ${
                isLightMode
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-900/20 text-emerald-300'
              }`}>
                📅 Target: {new Date(targetExamDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Our Mission Section */}
      <div className={`rounded-2xl p-8 sm:p-10 border ${
        isLightMode
          ? 'bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200'
          : 'bg-gradient-to-br from-blue-900/20 to-slate-900/20 border-blue-800/30'
      }`}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              Our Mission
            </h2>
            <p className={`text-base sm:text-lg leading-relaxed ${
              isLightMode ? 'text-slate-700' : 'text-slate-300'
            }`}>
              We are dedicated to empowering aspiring teachers by providing accessible, comprehensive preparation resources that remove barriers to success and foster a supportive community of educators committed to excellence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {institutionalValues.map((value, idx) => (
              <div key={idx}>
                <h3 className={`font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {value.title}
                </h3>
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why We Built This Section */}
      <div className={`rounded-2xl p-8 border ${
        isLightMode
          ? 'bg-white border-slate-200'
          : 'bg-slate-800/40 border-slate-700'
      }`}>
        <h2 className={`text-2xl sm:text-3xl font-bold mb-6 ${
          isLightMode ? 'text-slate-900' : 'text-white'
        }`}>
          Why We Built This Platform
        </h2>
        <p className={`text-base sm:text-lg leading-relaxed mb-6 ${
          isLightMode ? 'text-slate-700' : 'text-slate-300'
        }`}>
          Thousands of aspiring teachers struggle with fragmented resources and lack of structured guidance. We recognized that many deserving educators face barriers not due to lack of ability, but due to lack of access to quality preparation and community support.
        </p>
        <p className={`text-base sm:text-lg leading-relaxed ${
          isLightMode ? 'text-slate-700' : 'text-slate-300'
        }`}>
          This platform exists to democratize teacher preparation—ensuring every aspiring educator has access to expert-aligned resources and a supportive community needed to succeed.
        </p>
      </div>

      {/* Mission Pillars */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {missionPoints.map((point, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-6 border transition-all hover:-translate-y-1 ${
              isLightMode
                ? 'bg-white border-slate-200 hover:shadow-lg'
                : 'bg-slate-800/40 border-slate-700 hover:shadow-lg hover:shadow-slate-900/40'
            }`}
          >
            <div className="text-4xl mb-4">{point.icon}</div>
            <h3 className={`font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {point.title}
            </h3>
            <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              {point.description}
            </p>
          </div>
        ))}
      </div>

      {/* Community Posts Feed */}
      <div>
        <PostFeed />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-2xl p-6 ${
          isLightMode
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-blue-900/10 border border-blue-800/30'
        }`}>
          <div className="text-2xl mb-2">📚</div>
          <p className={`text-sm ${isLightMode ? 'text-blue-600' : 'text-blue-300'}`}>Quality Content</p>
          <p className={`text-2xl font-bold ${isLightMode ? 'text-blue-900' : 'text-blue-100'}`}>Expert-Curated</p>
        </div>
        <div className={`rounded-2xl p-6 ${
          isLightMode
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-emerald-900/10 border border-emerald-800/30'
        }`}>
          <div className="text-2xl mb-2">🤝</div>
          <p className={`text-sm ${isLightMode ? 'text-emerald-600' : 'text-emerald-300'}`}>Community-Driven</p>
          <p className={`text-2xl font-bold ${isLightMode ? 'text-emerald-900' : 'text-emerald-100'}`}>Support Always</p>
        </div>
        <div className={`rounded-2xl p-6 ${
          isLightMode
            ? 'bg-purple-50 border border-purple-200'
            : 'bg-purple-900/10 border border-purple-800/30'
        }`}>
          <div className="text-2xl mb-2">🎯</div>
          <p className={`text-sm ${isLightMode ? 'text-purple-600' : 'text-purple-300'}`}>Your Success</p>
          <p className={`text-2xl font-bold ${isLightMode ? 'text-purple-900' : 'text-purple-100'}`}>Our Goal</p>
        </div>
      </div>

      <footer className={`${isLightMode ? 'bg-emerald-50/70 text-slate-900 border border-emerald-100/80' : 'bg-gradient-to-r from-slate-900 to-slate-800 text-white'} py-10 rounded-2xl relative overflow-hidden`}>
        <div className={`absolute inset-0 ${isLightMode ? 'opacity-40' : 'opacity-20'}`}>
          <div className={`absolute top-10 left-10 w-40 h-40 rounded-full blur-3xl animate-float ${isLightMode ? 'bg-emerald-100' : 'bg-white/10'}`}></div>
          <div className={`absolute bottom-10 right-20 w-32 h-32 rounded-full blur-2xl animate-float ${isLightMode ? 'bg-emerald-200/60' : 'bg-emerald-500/15'}`} style={{animationDelay: '1s'}}></div>
        </div>
        <div className="relative px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <span className="text-2xl font-display font-bold">E</span>
                </div>
                <span className="text-2xl font-display font-bold">PrepWise</span>
              </div>
              <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'} leading-relaxed mb-6 max-w-md`}>
                PRC-aligned LET preparation platform. Built to support aspiring educators with structured practice.
              </p>
            </div>

            <div>
              <h4 className="font-display text-xl font-bold mb-6">Platform</h4>
              <ul className={`space-y-3 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <li>
                  <button
                    type="button"
                    className="hover:text-emerald-500 transition-colors"
                    onClick={() =>
                      setPlatformInfoModal({
                        title: 'Practice Quizzes',
                        description:
                          'Use practice quizzes to build familiarity with LET-style questions, improve accuracy, and strengthen topic recall through repeated practice.',
                        primaryActionLabel: 'Go to Quizzes',
                        primaryAction: () => navigate('/quiz'),
                      })
                    }
                  >
                    Practice Quizzes
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-emerald-500 transition-colors"
                    onClick={() =>
                      setPlatformInfoModal({
                        title: 'Diagnostic Tests',
                        description:
                          'Start with a diagnostic test to assess your current level and identify weak areas, so you can focus your review on what matters most.',
                        primaryActionLabel: 'Go to Quizzes',
                        primaryAction: () => navigate('/quiz'),
                      })
                    }
                  >
                    Diagnostic Tests
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-emerald-500 transition-colors"
                    onClick={() =>
                      setPlatformInfoModal({
                        title: 'Flashcards',
                        description:
                          'Flashcards help you memorize key concepts and definitions using quick review sessions and spaced repetition for better long-term retention.',
                        primaryActionLabel: 'Go to Flashcards',
                        primaryAction: () => navigate('/materials/flashcards'),
                      })
                    }
                  >
                    Flashcards
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-display text-xl font-bold mb-6">Study Quote</h4>
              <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white/60 border-emerald-200/70' : 'bg-slate-800/40 border-slate-700/60'}`}>
                <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'} text-lg leading-relaxed`}>
                  “Live as if you were to die tomorrow. Learn as if you were to live forever.”
                </p>
                <p className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} mt-4 font-semibold`}>
                  — Mahatma Gandhi
                </p>
              </div>
            </div>
          </div>
          <div className={`border-t ${isLightMode ? 'border-emerald-200/60 text-slate-500' : 'border-slate-800 text-slate-500'} pt-6 text-center text-sm`}>
            2026 PrepWise. Empowering future educators. All rights reserved.
          </div>
        </div>
      </footer>

      {platformInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPlatformInfoModal(null)}>
          <div className={`rounded-2xl w-full max-w-xl overflow-hidden ${isLightMode ? 'bg-white' : 'bg-slate-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-6 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-700'}`}>
              <h2 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{platformInfoModal.title}</h2>
              <button onClick={() => setPlatformInfoModal(null)} className={`text-3xl leading-none ${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>×</button>
            </div>
            <div className="p-6">
              <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'} leading-relaxed`}>{platformInfoModal.description}</p>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  className={`flex-1 px-5 py-3 rounded-xl font-bold transition-all ${isLightMode ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                  onClick={() => setPlatformInfoModal(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="flex-1 px-5 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 transition-all"
                  onClick={() => {
                    const action = platformInfoModal.primaryAction;
                    setPlatformInfoModal(null);
                    action();
                  }}
                >
                  {platformInfoModal.primaryActionLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
    </div>
  );
}
