import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { fetchAllQuizResults, QuizResult, fetchAnalytics, AnalyticsData, fetchQuizResultDetails } from '../services/progressService';
import { PracticesTab } from '../components/PracticesTab';

type Tab = 'users' | 'progress' | 'practices' | 'analytics';

export function ProgressTrackerPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const isLightMode = theme === 'light';

  return (
    <div className={`transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
        : 'bg-[#051b15]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-black mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📊 Progress Tracker
          </h1>
          <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Track your learning progress and performance metrics
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={`rounded-t-2xl border-b overflow-x-auto ${
          isLightMode
            ? 'bg-white/95 border-slate-200 shadow-md'
            : 'bg-slate-800/50 border-slate-700 shadow-lg'
        }`}>
          <div className="flex gap-1 p-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'users'
                  ? isLightMode
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-emerald-600 text-white shadow-lg'
                  : isLightMode
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-700/40'
              }`}
            >
              👤 Account
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'progress'
                  ? isLightMode
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-emerald-600 text-white shadow-lg'
                  : isLightMode
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-700/40'
              }`}
            >
              📈 Progress
            </button>
            <button
              onClick={() => setActiveTab('practices')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'practices'
                  ? isLightMode
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-emerald-600 text-white shadow-lg'
                  : isLightMode
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-700/40'
              }`}
            >
              📚 Practices
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? isLightMode
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-emerald-600 text-white shadow-lg'
                  : isLightMode
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-700/40'
              }`}
            >
              📊 Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className={`rounded-b-2xl border-t-0 p-8 backdrop-blur-xl ${
          isLightMode
            ? 'bg-white/95 border-slate-200 shadow-md'
            : 'bg-slate-800/50 border-slate-700 shadow-lg'
        }`}>
          {activeTab === 'users' && <UsersTab isLightMode={isLightMode} />}
          {activeTab === 'progress' && <ProgressTab isLightMode={isLightMode} />}
          {activeTab === 'practices' && <PracticesTab isLightMode={isLightMode} />}
          {activeTab === 'analytics' && <AnalyticsTab isLightMode={isLightMode} />}
        </div>
      </div>
    </div>
  );
}

function UsersTab({ isLightMode }: { isLightMode: boolean }) {
  const { user } = useAuth();
  const [loginHistory, setLoginHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoginData = async () => {
      try {
        // Use the fetch API with proper authentication
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/auth/login-history', {
          credentials: 'include',
          headers
        });

        if (response.ok) {
          const data = await response.json();
          setLoginHistory(data);
        }
      } catch (error) {
        console.error('Error fetching login data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoginData();
  }, []);

  if (loading) {
    return <div className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
        Account Information
      </h2>

      {/* Account Overview */}
      <div className={`rounded-lg p-6 border ${
        isLightMode
          ? 'bg-slate-50 border-slate-200'
          : 'bg-slate-700/30 border-slate-600'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Username
            </p>
            <p className={`text-lg font-bold mt-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {user?.username}
            </p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Email
            </p>
            <p className={`text-lg font-bold mt-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {user?.email || 'Not provided'}
            </p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Last Login
            </p>
            <p className={`text-lg font-bold mt-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {loginHistory?.last_login ? new Date(loginHistory.last_login).toLocaleString() : 'Never'}
            </p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Total Logins
            </p>
            <p className={`text-lg font-bold mt-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {loginHistory?.total_logins || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Login History */}
      <div className={`rounded-lg p-6 border ${
        isLightMode
          ? 'bg-slate-50 border-slate-200'
          : 'bg-slate-700/30 border-slate-600'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
          📋 Login Activity
        </h3>

        {loginHistory?.login_events && loginHistory.login_events.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {loginHistory.login_events.map((event: any, idx: number) => (
              <div key={idx} className={`p-3 rounded-lg flex items-center justify-between ${
                isLightMode
                  ? 'bg-white border border-slate-200'
                  : 'bg-slate-800/30 border border-slate-600'
              }`}>
                <span className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {event.event_type === 'login' ? '🔓 Logged In' : '🔒 Logged Out'}
                </span>
                <span className={`text-sm font-medium ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
            No login activity recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressTab({ isLightMode }: { isLightMode: boolean }) {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [selectedTestType, setSelectedTestType] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizResult | null>(null);
  const [quizDetailsModalOpen, setQuizDetailsModalOpen] = useState(false);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const results = await fetchAllQuizResults();
        setQuizResults(results);
      } catch (error) {
        console.error('Error fetching quiz data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, []);

  const handleExpandSession = async (sessionId: string, type: 'quiz' | 'practice-quiz') => {
    // If already expanded, collapse it
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }

    // Check if questions already loaded
    const result = quizResults.find(r => r.sessionId === sessionId);
    if (result && result.questions.length > 0) {
      setExpandedSession(sessionId);
      return;
    }

    // Load questions details
    setLoadingDetails(sessionId);
    try {
      const details = await fetchQuizResultDetails(sessionId, type);
      if (details) {
        setQuizResults(prev =>
          prev.map(q => q.sessionId === sessionId ? details : q)
        );
      }
    } catch (error) {
      console.error('Error loading quiz details:', error);
    } finally {
      setLoadingDetails(null);
      setExpandedSession(sessionId);
    }
  };

  if (loading) {
    return <div className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>Loading...</div>;
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTestTypeInfo = (testType?: string) => {
    const typeMap: Record<string, { emoji: string; label: string }> = {
      'diagnostic-test': { emoji: '🔍', label: 'Diagnostic Test' },
      'drills': { emoji: '⚙️', label: 'Drills' },
      'short-quiz': { emoji: '⏱️', label: 'Short Quiz' },
      'preboard': { emoji: '🏆', label: 'Pre-Board' }
    };
    return typeMap[testType || 'diagnostic-test'] || { emoji: '📝', label: 'Quiz' };
  };

  // Group quizzes by test type
  const groupedQuizzes = quizResults.reduce((acc, quiz) => {
    const testType = quiz.testType || 'diagnostic-test';
    if (!acc[testType]) {
      acc[testType] = [];
    }
    acc[testType].push(quiz);
    return acc;
  }, {} as Record<string, QuizResult[]>);

  const testTypeOrder = ['diagnostic-test', 'drills', 'short-quiz', 'preboard'];
  const sortedTestTypes = testTypeOrder.filter(type => groupedQuizzes[type]);

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
        Quiz & Test Results
      </h2>

      {quizResults.length === 0 ? (
        <div className={`rounded-lg p-12 text-center border ${
          isLightMode
            ? 'bg-slate-50 border-slate-200'
            : 'bg-slate-700/30 border-slate-600'
        }`}>
          <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            No quiz results yet. Start taking quizzes to see your progress!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedTestTypes.map((testType) => {
            const typeInfo = getTestTypeInfo(testType);
            const quizzesOfType = groupedQuizzes[testType] || [];
            const completedCount = quizzesOfType.filter(q => q.completedAt).length;
            const avgScore = quizzesOfType.length > 0
              ? quizzesOfType.filter(q => q.completedAt).reduce((sum, q) => sum + (q.percentage || 0), 0) / Math.max(completedCount, 1)
              : 0;

            return (
              <button
                key={testType}
                onClick={() => {
                  setSelectedTestType(testType);
                  setModalOpen(true);
                }}
                className={`rounded-2xl border-2 p-6 transition-all hover:shadow-lg text-left ${
                  isLightMode
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-5xl mb-3">{typeInfo.emoji}</div>
                <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {typeInfo.label}
                </h3>
                <div className="space-y-1">
                  <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {completedCount} completed
                  </p>
                  {completedCount > 0 && (
                    <p className={`text-sm font-semibold ${
                      avgScore >= 80 ? 'text-green-600' :
                      avgScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      Avg: {avgScore.toFixed(0)}%
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal for displaying quizzes of selected test type */}
      {modalOpen && selectedTestType && (
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
                <span className="text-3xl">{getTestTypeInfo(selectedTestType).emoji}</span>
                {getTestTypeInfo(selectedTestType).label}
              </h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedTestType(null);
                  setExpandedSession(null);
                }}
                className={`text-2xl font-bold ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              {(groupedQuizzes[selectedTestType] || []).map((quiz) => (
                <button
                  key={quiz.sessionId}
                  onClick={async () => {
                    // Load quiz details if not already loaded
                    if (quiz.questions.length === 0) {
                      setLoadingDetails(quiz.sessionId);
                      try {
                        const details = await fetchQuizResultDetails(quiz.sessionId, quiz.type);
                        if (details) {
                          setSelectedQuiz(details);
                        }
                      } catch (error) {
                        console.error('Error loading quiz details:', error);
                        setSelectedQuiz(quiz);
                      } finally {
                        setLoadingDetails(null);
                      }
                    } else {
                      setSelectedQuiz(quiz);
                    }
                    setQuizDetailsModalOpen(true);
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`font-bold text-lg ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {quiz.quizTitle}
                      </p>
                      {quiz.category && (
                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                          📁 {quiz.category}
                        </p>
                      )}
                      <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        {new Date(quiz.completedAt || quiz.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      {quiz.completedAt ? (
                        <div className={`text-3xl font-bold ${getScoreColor(quiz.percentage || 0)}`}>
                          {quiz.percentage?.toFixed(0) || 0}%
                        </div>
                      ) : (
                        <div className={`font-semibold ${isLightMode ? 'text-amber-600' : 'text-amber-400'}`}>
                          In Progress
                        </div>
                      )}
                      <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        {quiz.correct}/{quiz.total}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Details Modal */}
      {quizDetailsModalOpen && selectedQuiz && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className={`rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto ${
            isLightMode ? 'bg-white' : 'bg-slate-800'
          }`}>
            <div className={`sticky top-0 border-b p-6 flex items-center justify-between ${
              isLightMode
                ? 'bg-white border-slate-200'
                : 'bg-slate-800 border-slate-700'
            }`}>
              <div>
                <h3 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {selectedQuiz.quizTitle}
                </h3>
                <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {new Date(selectedQuiz.completedAt || selectedQuiz.startedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setQuizDetailsModalOpen(false);
                  setSelectedQuiz(null);
                }}
                className={`text-2xl font-bold ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Score Summary */}
              <div className={`rounded-lg p-6 ${
                isLightMode
                  ? 'bg-slate-50 border border-slate-200'
                  : 'bg-slate-700/30 border border-slate-600'
              }`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      Score
                    </p>
                    <p className={`text-3xl font-bold mt-2 ${getScoreColor(selectedQuiz.percentage || 0)}`}>
                      {selectedQuiz.percentage?.toFixed(0) || 0}%
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      Correct
                    </p>
                    <p className={`text-3xl font-bold mt-2 text-green-600`}>
                      {selectedQuiz.correct}/{selectedQuiz.total}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      Status
                    </p>
                    <p className={`text-lg font-bold mt-2 ${
                      selectedQuiz.completedAt
                        ? isLightMode ? 'text-green-600' : 'text-green-400'
                        : isLightMode ? 'text-amber-600' : 'text-amber-400'
                    }`}>
                      {selectedQuiz.completedAt ? '✓ Completed' : '⏳ In Progress'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Questions and Answers */}
              {loadingDetails === selectedQuiz.sessionId ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                  <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                    Loading question details...
                  </p>
                </div>
              ) : selectedQuiz.questions.length > 0 ? (
                <div className="space-y-4">
                  <h4 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    Questions & Answers
                  </h4>
                  {selectedQuiz.questions.map((q, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      q.isCorrect
                        ? isLightMode
                          ? 'bg-green-50 border-green-200'
                          : 'bg-green-900/20 border-green-700/30'
                        : isLightMode
                        ? 'bg-red-50 border-red-200'
                        : 'bg-red-900/20 border-red-700/30'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`text-xl font-bold mt-1 ${
                          q.isCorrect
                            ? isLightMode ? 'text-green-600' : 'text-green-400'
                            : isLightMode ? 'text-red-600' : 'text-red-400'
                        }`}>
                          {q.isCorrect ? '✓' : '✗'}
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold text-lg mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            {idx + 1}. {q.questionText}
                          </p>
                          <div className="space-y-3 text-sm">
                            {/* Answer Choices */}
                            {q.choices && q.choices.length > 0 && (
                              <div>
                                <p className={`font-semibold mb-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                                  Choices:
                                </p>
                                <div className="space-y-1 ml-2">
                                  {q.choices.map((choice, choiceIdx) => {
                                    const choiceLetter = String.fromCharCode(65 + choiceIdx);
                                    const isUserChoice = q.userAnswer === choice;
                                    const isCorrectChoice = q.correctAnswer === choice;

                                    return (
                                      <div key={choiceIdx} className={`p-2 rounded flex items-start gap-2 ${
                                        isCorrectChoice && !q.isCorrect
                                          ? isLightMode
                                            ? 'bg-green-100'
                                            : 'bg-green-900/30'
                                          : isUserChoice && !q.isCorrect
                                          ? isLightMode
                                            ? 'bg-red-100'
                                            : 'bg-red-900/30'
                                          : isLightMode
                                          ? 'bg-slate-100'
                                          : 'bg-slate-700/30'
                                      }`}>
                                        <span className={`font-semibold min-w-fit ${
                                          isCorrectChoice && !q.isCorrect
                                            ? isLightMode ? 'text-green-700' : 'text-green-300'
                                            : isUserChoice && !q.isCorrect
                                            ? isLightMode ? 'text-red-700' : 'text-red-300'
                                            : isLightMode ? 'text-slate-600' : 'text-slate-400'
                                        }`}>
                                          {choiceLetter}.
                                        </span>
                                        <span className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                                          {choice}
                                        </span>
                                        {isCorrectChoice && !q.isCorrect && (
                                          <span className="ml-auto text-green-600">✓</span>
                                        )}
                                        {isUserChoice && !q.isCorrect && (
                                          <span className="ml-auto text-red-600">✗</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* User and Correct Answer Summary */}
                            <div className="pt-2 border-t space-y-2" style={{
                              borderColor: isLightMode
                                ? 'rgba(0, 0, 0, 0.1)'
                                : 'rgba(255, 255, 255, 0.1)'
                            }}>
                              <div>
                                <p className={`font-semibold ${q.isCorrect ? (isLightMode ? 'text-green-600' : 'text-green-400') : (isLightMode ? 'text-red-600' : 'text-red-400')}`}>
                                  Your answer:
                                </p>
                                <p className={isLightMode ? 'text-slate-700 ml-2' : 'text-slate-300 ml-2'}>
                                  {q.userAnswer || 'No answer'}
                                </p>
                              </div>
                              <div>
                                <p className={`font-semibold ${isLightMode ? 'text-green-600' : 'text-green-400'}`}>
                                  Correct answer:
                                </p>
                                <p className={isLightMode ? 'text-slate-700 ml-2' : 'text-slate-300 ml-2'}>
                                  {q.correctAnswer}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-lg p-8 text-center ${
                  isLightMode
                    ? 'bg-slate-50 border border-slate-200'
                    : 'bg-slate-700/30 border border-slate-600'
                }`}>
                  <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                    No question details available.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ isLightMode }: { isLightMode: boolean }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await fetchAnalytics();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return <div className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>Loading...</div>;
  }

  const watchTimeHours = Math.floor(analyticsData?.totalWatchTimeSeconds || 0 / 3600);
  const watchTimeMinutes = Math.floor(((analyticsData?.totalWatchTimeSeconds || 0) % 3600) / 60);

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
        Learning Analytics
      </h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-lg p-6 border ${
          isLightMode
            ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'
            : 'bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/30'
        }`}>
          <p className={`text-sm font-semibold ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>
            Videos Watched
          </p>
          <p className={`text-3xl font-bold mt-2 ${isLightMode ? 'text-blue-900' : 'text-blue-200'}`}>
            {analyticsData?.videosWatched || 0}
          </p>
        </div>

        <div className={`rounded-lg p-6 border ${
          isLightMode
            ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'
            : 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/30'
        }`}>
          <p className={`text-sm font-semibold ${isLightMode ? 'text-green-600' : 'text-green-400'}`}>
            Watch Time
          </p>
          <p className={`text-3xl font-bold mt-2 ${isLightMode ? 'text-green-900' : 'text-green-200'}`}>
            {watchTimeHours}h {watchTimeMinutes}m
          </p>
        </div>

        <div className={`rounded-lg p-6 border ${
          isLightMode
            ? 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200'
            : 'bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/30'
        }`}>
          <p className={`text-sm font-semibold ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`}>
            Avg Quiz Score
          </p>
          <p className={`text-3xl font-bold mt-2 ${isLightMode ? 'text-purple-900' : 'text-purple-200'}`}>
            {analyticsData?.averageQuizScore || 0}%
          </p>
        </div>

        <div className={`rounded-lg p-6 border ${
          isLightMode
            ? 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200'
            : 'bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-700/30'
        }`}>
          <p className={`text-sm font-semibold ${isLightMode ? 'text-orange-600' : 'text-orange-400'}`}>
            Quizzes Completed
          </p>
          <p className={`text-3xl font-bold mt-2 ${isLightMode ? 'text-orange-900' : 'text-orange-200'}`}>
            {analyticsData?.totalQuizzesCompleted || 0}
          </p>
        </div>
      </div>

      {/* Videos Watched */}
      {analyticsData && analyticsData.videos.length > 0 && (
        <div className={`rounded-lg p-6 border ${
          isLightMode
            ? 'bg-slate-50 border-slate-200'
            : 'bg-slate-700/30 border-slate-600'
        }`}>
          <h3 className={`text-xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📺 Videos Watched
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analyticsData.videos.slice(0, 10).map((video, idx) => (
              <div key={idx} className={`p-3 rounded-lg flex justify-between items-start ${
                isLightMode
                  ? 'bg-white border border-slate-200'
                  : 'bg-slate-800/30 border border-slate-600'
              }`}>
                <div className="flex-1">
                  <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {video.videoTitle}
                  </p>
                  <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {video.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {Math.floor(video.watchedSeconds / 60)}m
                  </p>
                  {video.isCompleted && (
                    <p className={`text-xs ${isLightMode ? 'text-green-600' : 'text-green-400'}`}>
                      ✓ Completed
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Performance by Category */}
      {analyticsData && Object.keys(analyticsData.quizzesByCategory).length > 0 && (
        <div className={`rounded-lg p-6 border ${
          isLightMode
            ? 'bg-slate-50 border-slate-200'
            : 'bg-slate-700/30 border-slate-600'
        }`}>
          <h3 className={`text-xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📊 Quiz Performance by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.quizzesByCategory).map(([category, stats]) => (
              <div key={category} className={`p-4 rounded-lg ${
                isLightMode
                  ? 'bg-white border border-slate-200'
                  : 'bg-slate-800/30 border border-slate-600'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {category}
                  </p>
                  <p className={`font-bold text-lg ${
                    stats.averageScore >= 80 ? (isLightMode ? 'text-green-600' : 'text-green-400') :
                    stats.averageScore >= 60 ? (isLightMode ? 'text-yellow-600' : 'text-yellow-400') :
                    (isLightMode ? 'text-red-600' : 'text-red-400')
                  }`}>
                    {stats.averageScore.toFixed(0)}%
                  </p>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${
                  isLightMode ? 'bg-slate-200' : 'bg-slate-600'
                }`}>
                  <div
                    className={`h-full transition-all ${
                      stats.averageScore >= 80 ? 'bg-green-500' :
                      stats.averageScore >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(stats.averageScore, 100)}%` }}
                  />
                </div>
                <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {stats.count} {stats.count === 1 ? 'quiz' : 'quizzes'} completed
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!analyticsData || (
        analyticsData.videosWatched === 0 &&
        analyticsData.totalQuizzesCompleted === 0
      )) && (
        <div className={`rounded-lg p-8 text-center border ${
          isLightMode
            ? 'bg-slate-50 border-slate-200'
            : 'bg-slate-700/30 border-slate-600'
        }`}>
          <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Start watching videos and taking quizzes to see your analytics...
          </p>
        </div>
      )}
    </div>
  );
}
