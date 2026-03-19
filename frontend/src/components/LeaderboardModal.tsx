import { useState, useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';

interface AnswerDetail {
  question_id: string;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  answered_at?: string;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  full_name?: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds?: number;
  performance_category: 'Best' | 'Fair' | 'Need Attention';
  answers: AnswerDetail[];
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizTitle?: string;
  leaderboard: LeaderboardEntry[];
  loading?: boolean;
}

function formatTimeElapsed(seconds?: number): string {
  if (!seconds || seconds <= 0) return 'N/A';

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${minutes} min ${secs} sec`;
}

function getCategoryIcon(category: 'Best' | 'Fair' | 'Need Attention'): string {
  switch (category) {
    case 'Best':
      return '⭐';
    case 'Fair':
      return '📊';
    case 'Need Attention':
      return '⚠️';
    default:
      return '📈';
  }
}

function getCategoryColor(category: 'Best' | 'Fair' | 'Need Attention', isLight: boolean) {
  switch (category) {
    case 'Best':
      return {
        bg: isLight ? 'bg-emerald-50' : 'bg-emerald-900/20',
        border: isLight ? 'border-emerald-200' : 'border-emerald-500/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        tabBg: isLight ? 'bg-emerald-100' : 'bg-emerald-500/20',
        tabText: isLight ? 'text-emerald-700' : 'text-emerald-300',
      };
    case 'Fair':
      return {
        bg: isLight ? 'bg-amber-50' : 'bg-amber-900/20',
        border: isLight ? 'border-amber-200' : 'border-amber-500/30',
        text: 'text-amber-600 dark:text-amber-400',
        tabBg: isLight ? 'bg-amber-100' : 'bg-amber-500/20',
        tabText: isLight ? 'text-amber-700' : 'text-amber-300',
      };
    case 'Need Attention':
      return {
        bg: isLight ? 'bg-red-50' : 'bg-red-900/20',
        border: isLight ? 'border-red-200' : 'border-red-500/30',
        text: 'text-red-600 dark:text-red-400',
        tabBg: isLight ? 'bg-red-100' : 'bg-red-500/20',
        tabText: isLight ? 'text-red-700' : 'text-red-300',
      };
    default:
      return {
        bg: isLight ? 'bg-slate-50' : 'bg-slate-800',
        border: isLight ? 'border-slate-200' : 'border-slate-700',
        text: 'text-slate-600 dark:text-slate-400',
        tabBg: isLight ? 'bg-slate-100' : 'bg-slate-500/20',
        tabText: isLight ? 'text-slate-700' : 'text-slate-300',
      };
  }
}

function UserAnswersModal({
  isOpen,
  onClose,
  userName,
  answers,
  isLight
}: {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  answers: AnswerDetail[];
  isLight: boolean;
}) {
  if (!isOpen) return null;

  const correctCount = answers.filter(a => a.is_correct).length;
  const totalCount = answers.length;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close dialog"
      />

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl pointer-events-auto ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-slate-900 border-slate-700'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`sticky top-0 border-b p-6 ${
            isLight
              ? 'border-slate-200 bg-slate-50'
              : 'border-slate-700 bg-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  📝 {userName}'s Answers
                </h2>
                <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {correctCount} out of {totalCount} correct
                </p>
              </div>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  isLight
                    ? 'text-slate-600 hover:bg-slate-200'
                    : 'text-slate-400 hover:bg-slate-700'
                }`}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {answers && answers.length > 0 ? (
              answers.map((answer, idx) => (
                <div
                  key={answer.question_id}
                  className={`rounded-lg border p-4 ${
                    answer.is_correct
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-emerald-900/20 border-emerald-500/30'
                      : isLight
                      ? 'bg-red-50 border-red-200'
                      : 'bg-red-900/20 border-red-500/30'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Question and Status */}
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 font-bold text-xl ${
                        answer.is_correct
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {answer.is_correct ? '✓' : '✗'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-base leading-relaxed ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Q{idx + 1}: {answer.question_text}
                        </p>
                      </div>
                    </div>

                    {/* User's Answer */}
                    <div className={`ml-8 p-3 rounded-md border ${
                      isLight
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        Your answer
                      </p>
                      <p className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {answer.user_answer}
                      </p>
                    </div>

                    {/* Correct Answer (only show if wrong) */}
                    {!answer.is_correct && (
                      <div className={`ml-8 p-3 rounded-md border ${
                        isLight
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-emerald-900/30 border-emerald-500/50'
                      }`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                          isLight ? 'text-emerald-700' : 'text-emerald-400'
                        }`}>
                          ✓ Correct answer
                        </p>
                        <p className={`text-sm font-medium ${isLight ? 'text-emerald-900' : 'text-emerald-200'}`}>
                          {answer.correct_answer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  No answers to display
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function LeaderboardModal({
  isOpen,
  onClose,
  quizTitle = 'Quiz',
  leaderboard,
  loading = false
}: LeaderboardModalProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [selectedTab, setSelectedTab] = useState<'Best' | 'Fair' | 'Need Attention'>('Best');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserAnswers, setSelectedUserAnswers] = useState<AnswerDetail[] | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');

  // Group leaderboard by category
  const categorizedLeaderboard = {
    Best: leaderboard.filter(entry => entry.performance_category === 'Best'),
    Fair: leaderboard.filter(entry => entry.performance_category === 'Fair'),
    'Need Attention': leaderboard.filter(entry => entry.performance_category === 'Need Attention')
  };

  // Filter entries based on search query
  const filteredEntries = useMemo(() => {
    const entries = categorizedLeaderboard[selectedTab];
    if (!searchQuery.trim()) return entries;
    
    const query = searchQuery.toLowerCase();
    return entries.filter(entry =>
      (entry.full_name && entry.full_name.toLowerCase().includes(query)) ||
      entry.username.toLowerCase().includes(query)
    );
  }, [selectedTab, searchQuery, categorizedLeaderboard]);

  const openUserAnswers = (entry: LeaderboardEntry) => {
    setSelectedUserName(entry.full_name || entry.username);
    setSelectedUserAnswers(entry.answers);
  };

  const tabs: Array<'Best' | 'Fair' | 'Need Attention'> = ['Best', 'Fair', 'Need Attention'];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`rounded-2xl border max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl pointer-events-auto ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-900 border-slate-700'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`border-b p-6 ${
            isLightMode
              ? 'border-slate-200 bg-slate-50'
              : 'border-slate-700 bg-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                📊 {quizTitle} Leaderboard
              </h2>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg font-semibold transition flex-shrink-0 ${
                  isLightMode
                    ? 'text-slate-600 hover:bg-slate-200'
                    : 'text-slate-400 hover:bg-slate-700'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className={`flex gap-2 border-b pb-4 -mx-6 px-6 mb-4 ${
              isLightMode ? 'border-slate-200' : 'border-slate-700'
            }`}>
              {tabs.map((tab) => {
                const colors = getCategoryColor(tab, isLightMode);
                const count = categorizedLeaderboard[tab].length;
                const isActive = selectedTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setSelectedTab(tab);
                      setSearchQuery('');
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                      isActive
                        ? `${colors.tabBg} ${colors.tabText} border-b-2 ${
                            tab === 'Best'
                              ? 'border-emerald-600 dark:border-emerald-400'
                              : tab === 'Fair'
                              ? 'border-amber-600 dark:border-amber-400'
                              : 'border-red-600 dark:border-red-400'
                          }`
                        : isLightMode
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-lg">{getCategoryIcon(tab)}</span>
                    <span>{tab}</span>
                    <span className={`text-xs font-bold ${
                      isActive
                        ? colors.tabText
                        : isLightMode
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-slate-600 focus:bg-slate-50'
                    : 'bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-slate-500 focus:bg-slate-900/50'
                } focus:outline-none`}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mr-4" />
                <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                  Loading leaderboard...
                </p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🏆</div>
                <p className={`text-lg font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  No Participants Yet
                </p>
                <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                  Share the quiz access code with students to get started
                </p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-lg font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  No results found
                </p>
                <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                  Try adjusting your search query
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry, idx) => {
                  const colors = getCategoryColor(entry.performance_category, isLightMode);
                  
                  return (
                    <div
                      key={entry.user_id}
                      onClick={() => openUserAnswers(entry)}
                      className={`flex items-center justify-between p-4 rounded-lg border transition duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
                        colors.bg
                      } ${colors.border}`}
                      title="Click to view detailed answers"
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                          entry.performance_category === 'Best'
                            ? 'bg-emerald-400 text-emerald-900'
                            : entry.performance_category === 'Fair'
                            ? 'bg-amber-400 text-amber-900'
                            : 'bg-red-400 text-red-900'
                        }`}>
                          {entry.performance_category === 'Best' && idx === 0 ? '🥇' :
                           entry.performance_category === 'Best' && idx === 1 ? '🥈' :
                           entry.performance_category === 'Best' && idx === 2 ? '🥉' :
                           idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate cursor-pointer hover:underline ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            {entry.full_name || entry.username}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {entry.time_taken_seconds !== undefined && (
                              <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                ⏱️ {formatTimeElapsed(entry.time_taken_seconds)}
                              </p>
                            )}
                            {entry.answers && entry.answers.length > 0 && (
                              <p className={`text-xs font-semibold ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>
                                📋 {entry.answers.length} answers
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className={`text-2xl font-bold ${
                          entry.performance_category === 'Best'
                            ? isLightMode ? 'text-emerald-600' : 'text-emerald-400'
                            : entry.performance_category === 'Fair'
                            ? isLightMode ? 'text-amber-600' : 'text-amber-400'
                            : isLightMode ? 'text-red-600' : 'text-red-400'
                        }`}>
                          {entry.score}
                        </div>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                          {entry.percentage.toFixed(1)}%
                        </p>
                        <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          of {entry.total_questions}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Answers Modal */}
      {selectedUserAnswers && (
        <UserAnswersModal
          isOpen={selectedUserAnswers !== null}
          onClose={() => setSelectedUserAnswers(null)}
          userName={selectedUserName}
          answers={selectedUserAnswers}
          isLight={isLightMode}
        />
      )}
    </>
  );
}
