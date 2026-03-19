import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { fetchPracticeTestSessions, PracticeTestSession, QuizResult } from '../services/progressService';

export function PracticesTab({ isLightMode }: { isLightMode: boolean }) {
  const [sessions, setSessions] = useState<Record<string, PracticeTestSession>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTestType, setSelectedTestType] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);

  const testTypeInfo: Record<string, { emoji: string; label: string }> = {
    'diagnostic-test': { emoji: '🔍', label: 'Diagnostic Test' },
    'drills': { emoji: '⚙️', label: 'Drills' },
    'short-quiz': { emoji: '⏱️', label: 'Short Quiz' },
    'preboard': { emoji: '🏆', label: 'Pre-Board' }
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

  const testTypeOrder = ['diagnostic-test', 'drills', 'short-quiz', 'preboard'];
  const sortedTestTypes = testTypeOrder.filter(type => groupedByTestType[type]);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return isLightMode ? 'text-green-600' : 'text-green-400';
    if (percentage >= 60) return isLightMode ? 'text-yellow-600' : 'text-yellow-400';
    return isLightMode ? 'text-red-600' : 'text-red-400';
  };

  if (loading) {
    return (
      <div className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
        Loading practice tests...
      </div>
    );
  }

  if (sortedTestTypes.length === 0) {
    return (
      <div className={`rounded-lg p-12 text-center border ${
        isLightMode
          ? 'bg-slate-50 border-slate-200'
          : 'bg-slate-700/30 border-slate-600'
      }`}>
        <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
          No practice tests yet. Complete a test to retake it for practice!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
        📚 Practice Test History
      </h2>

      {/* Test Type Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedTestTypes.map((testType) => {
          const info = testTypeInfo[testType] || { emoji: '📝', label: testType };
          const testsOfType = groupedByTestType[testType] || [];
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
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="text-5xl mb-3">{info.emoji}</div>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {info.label}
              </h3>
              <div className="space-y-1">
                {totalAttempts === 0 ? (
                  <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Ready to practice
                  </p>
                ) : (
                  <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {totalAttempts} practice attempt{totalAttempts !== 1 ? 's' : ''}
                  </p>
                )}
                {totalAttempts > 0 && (
                  <p className={`text-sm font-semibold ${
                    avgScore >= 80 ? 'text-green-600' :
                    avgScore >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    Best: {avgScore.toFixed(0)}%
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal showing practice test attempts */}
      {showModal && selectedTestType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto ${
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
                onClick={() => {
                  setShowModal(false);
                  setSelectedTestType(null);
                  setExpandedQuiz(null);
                }}
                className={`text-2xl font-bold ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              {(groupedByTestType[selectedTestType] || []).map((session) => (
                <div key={session.id} className="space-y-2">
                  <button
                    onClick={() => setExpandedQuiz(expandedQuiz === session.id ? null : session.id)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`font-bold text-lg ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          {session.quizTitle}
                        </p>
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                          {session.attempts} practice attempt{session.attempts !== 1 ? 's' : ''} • Best: {session.bestScore.toFixed(0)}%
                        </p>
                      </div>
                      <div className={`text-2xl transition-transform ${
                        expandedQuiz === session.id ? 'rotate-180' : ''
                      }`}>
                        ▼
                      </div>
                    </div>
                  </button>

                  {/* Expanded attempts list */}
                  {expandedQuiz === session.id && (
                    <div className={`ml-4 space-y-2 p-4 rounded-lg border ${
                      isLightMode
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-800/50 border-slate-600'
                    }`}>
                      <h4 className={`font-semibold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        Practice Attempts
                      </h4>
                      {session.sessions.map((attempt, idx) => (
                        <div
                          key={attempt.sessionId}
                          className={`p-3 rounded-lg border ${
                            isLightMode
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-slate-700/30 border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                Practice Attempt {idx + 1}
                              </p>
                              <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                {new Date(attempt.completedAt || attempt.startedAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              {attempt.completedAt ? (
                                <div className={`text-2xl font-bold ${getScoreColor(attempt.percentage || 0)}`}>
                                  {attempt.percentage?.toFixed(0) || 0}%
                                </div>
                              ) : (
                                <div className={`font-semibold ${isLightMode ? 'text-amber-600' : 'text-amber-400'}`}>
                                  In Progress
                                </div>
                              )}
                              <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                {attempt.correct}/{attempt.total}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
