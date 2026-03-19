import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { fetchPracticeTestSessions, PracticeTestSession, QuizResult } from '../services/progressService';

interface PracticeTestsViewProps {
  onSelectQuiz?: (quizId: string, quizTitle: string, testType: string, quizResult?: QuizResult) => void;
  onBack: () => void;
}

export function PracticeTestsView({ onSelectQuiz, onBack }: PracticeTestsViewProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [sessions, setSessions] = useState<Record<string, PracticeTestSession>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTestType, setSelectedTestType] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const testTypeInfo: Record<string, { emoji: string; label: string }> = {
    'diagnostic-test': { emoji: '🔍', label: 'Diagnostic Test' },
    'drills': { emoji: '⚙️', label: 'Drills' },
    'short-quiz': { emoji: '⏱️', label: 'Short Quiz' },
    'preboard': { emoji: '🏆', label: 'Pre-Board' },
    'practice-quiz': { emoji: '📚', label: 'Practice Quiz' }
  };

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const data = await fetchPracticeTestSessions();
        setSessions(data);
      } catch (error) {
        console.error('Error loading practice test sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Group sessions by test type
  const groupedByTestType: Record<string, PracticeTestSession[]> = {};
  Object.values(sessions).forEach(session => {
    const testType = session.testType || 'diagnostic-test';
    if (!groupedByTestType[testType]) {
      groupedByTestType[testType] = [];
    }
    groupedByTestType[testType].push(session);
  });

  const testTypeOrder = ['diagnostic-test', 'drills', 'short-quiz', 'preboard', 'practice-quiz'];
  const sortedTestTypes = testTypeOrder.filter(type => groupedByTestType[type]);

  if (loading) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${
        isLightMode
          ? 'border-slate-200 bg-white shadow-lg'
          : 'border-slate-700 bg-slate-800/50 shadow-lg'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
        <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
          Loading practice tests...
        </p>
      </div>
    );
  }

  if (sortedTestTypes.length === 0) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${
        isLightMode
          ? 'border-slate-200 bg-white shadow-lg'
          : 'border-slate-700 bg-slate-800/50 shadow-lg'
      }`}>
        <div className="mb-6 text-6xl">📝</div>
        <h2 className={`text-3xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
          No completed tests yet
        </h2>
        <p className={`text-lg max-w-2xl mx-auto mb-6 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
          Take a test to see it here as a practice test for retakes.
        </p>
        <button
          onClick={onBack}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
          📝 Practice Tests
        </h2>
        <button
          onClick={onBack}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          ← Back
        </button>
      </div>

      <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
        Retake your completed tests for practice. Only you can see your practice attempts.
      </p>

      {/* Test Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedTestTypes.map((testType) => {
          const info = testTypeInfo[testType] || { emoji: '📝', label: testType };
          const testsOfType = groupedByTestType[testType] || [];
          const totalTests = testsOfType.length;
          const totalAttempts = testsOfType.reduce((sum, t) => sum + t.attempts, 0);
          const avgScore = testsOfType.length > 0
            ? testsOfType.reduce((sum, t) => sum + (t.bestScore || 0), 0) / testsOfType.length
            : 0;

          return (
            <button
              key={testType}
              onClick={() => {
                setSelectedTestType(testType);
                setShowModal(true);
              }}
              className={`rounded-2xl border-2 p-6 transition-all hover:shadow-lg text-left ${
                isLightMode
                  ? 'bg-white border-slate-200 hover:border-emerald-400'
                  : 'bg-slate-800/50 border-slate-700 hover:border-emerald-400'
              }`}
            >
              <div className="text-5xl mb-3">{info.emoji}</div>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {info.label}
              </h3>
              <div className="space-y-1">
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {totalTests} test{totalTests !== 1 ? 's' : ''} available
                </p>
                {totalAttempts > 0 && (
                  <>
                    <p className={`text-sm font-semibold ${
                      avgScore >= 80 ? 'text-green-600' :
                      avgScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      Best: {avgScore.toFixed(0)}%
                    </p>
                    <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      Ready to practice
                    </p>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal for selecting which test to retake */}
      {showModal && selectedTestType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto ${
            isLightMode ? 'bg-white' : 'bg-slate-800'
          }`}>
            <div className={`sticky top-0 border-b p-6 flex items-center justify-between ${
              isLightMode
                ? 'bg-white border-slate-200'
                : 'bg-slate-800 border-slate-700'
            }`}>
              <h3 className={`text-2xl font-bold flex items-center gap-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                <span className="text-3xl">{testTypeInfo[selectedTestType]?.emoji}</span>
                {testTypeInfo[selectedTestType]?.label}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`text-2xl font-bold ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              {(groupedByTestType[selectedTestType] || []).map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    // Pass the first (original) session with all its data
                    const originalSession = session.sessions[0];
                    onSelectQuiz?.(session.originalQuizId, session.quizTitle, selectedTestType, originalSession);
                    setShowModal(false);
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-emerald-400'
                      : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`font-bold text-lg ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {session.quizTitle}
                      </p>
                      <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        {session.attempts === 0
                          ? 'Ready to practice'
                          : `${session.attempts} attempt${session.attempts !== 1 ? 's' : ''} • Best: ${session.bestScore.toFixed(0)}%`}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-semibold transition ${
                      isLightMode
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      Practice →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
