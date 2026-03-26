import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import quizService, { QuizDetails, QuizSession, SessionResults } from '../services/quizService';
import { formatRelativeTime } from '../utils/dateFormatter';

interface Question {
  question_text: string;
  choices: string[];
  correct_answer: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  access_code: string;
  time_limit_minutes?: number;
  total_questions: number;
  total_participants: number;
  created_at: string;
}

interface QuizAnswers {
  [questionId: string]: string;
}

export function QuizPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLightMode = theme === 'light';
  const isAdmin = user?.role === 'admin';

  const [view, setView] = useState<'main' | 'join' | 'taking' | 'results'>('main');
  const [testType, setTestType] = useState<'diagnostic' | 'drills' | 'short' | 'preboard'>('diagnostic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz taking state
  const [joinCode, setJoinCode] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState<QuizDetails | null>(null);
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  // Map frontend test type names to backend format
  const mapTestTypeToBackend = (type: 'diagnostic' | 'drills' | 'short' | 'preboard'): string => {
    const mapping: Record<string, string> = {
      'diagnostic': 'diagnostic-test',
      'drills': 'drills',
      'short': 'short-quiz',
      'preboard': 'preboard'
    };
    return mapping[type] || type;
  };

  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!joinCode.trim()) {
        throw new Error('Quiz code is required');
      }

      const backendTestType = mapTestTypeToBackend(testType);
      const quizData = await quizService.joinQuizByCode(joinCode.toUpperCase(), backendTestType);
      setCurrentQuiz(quizData);

      const session = await quizService.startSession(quizData.id);
      setCurrentSession(session);
      setQuizAnswers({});
      setCurrentQuestionIndex(0);

      // Set timer if quiz has time limit
      if (quizData.time_limit_minutes) {
        setTimeRemaining(quizData.time_limit_minutes * 60);
      }

      setView('taking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join quiz');
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (view !== 'taking' || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      // Time's up - auto submit
      if (currentSession) {
        handleSubmitQuiz();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null) return null;
        const newTime = prev - 1;
        return newTime <= 0 ? 0 : newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, view, currentSession]);

  const handleSelectAnswer = async (questionId: string, answer: string) => {
    // Update local state immediately for UI responsiveness
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: answer
    });

    // Submit answer to backend
    if (currentSession) {
      try {
        await quizService.submitAnswer(currentSession.session_id, questionId, answer);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit answer');
      }
    }
  };

  const handleSubmitQuiz = async () => {
    if (!currentSession) return;

    // Close the test tab immediately without waiting for backend
    setView('main');

    // Submit quiz in the background (don't wait for response)
    quizService.submitQuiz(currentSession.session_id).catch(err => {
      console.error('Failed to submit quiz:', err);
    });
  };

  const loadLeaderboard = async (quizId: string) => {
    setLoading(true);
    try {
      const response = await quizService.getQuizLeaderboard(quizId);
      setLeaderboard(response.leaderboard || []);
      setSelectedQuizId(quizId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const resetAndGoHome = () => {
    setJoinCode('');
    setCurrentQuiz(null);
    setCurrentSession(null);
    setSessionResults(null);
    setQuizAnswers({});
    setCurrentQuestionIndex(0);
    setError(null);
    setView('main');
  };

  // Main view - Join Quiz
  if (view === 'main') {
    const isQuizAlreadyTaken = error?.includes('already taken');

    const testTypes = [
      { id: 'diagnostic' as const, label: '🔍 Diagnostic Test', description: 'Assess your current knowledge level' },
      { id: 'drills' as const, label: '⚙️ Drills', description: 'Practice specific topics in depth' },
      { id: 'short' as const, label: '⏱️ Short Quiz', description: 'Quick 10-15 minute assessments' },
      { id: 'preboard' as const, label: '🏆 Pre-Board', description: 'Full-length practice exam' }
    ];

    return (
      <div className={`min-h-screen py-8 ${
        isLightMode
          ? 'bg-gradient-to-b from-blue-50 via-white to-slate-50'
          : 'bg-[#051b15]'
      }`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className={`text-4xl font-black mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              📝 Test Center
            </h1>
            <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Choose your test type and get started
            </p>
          </div>

          {/* Test Type Tabs */}
          <div className="mb-8">
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${
              isLightMode ? '' : ''
            }`}>
              {testTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setTestType(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    testType === type.id
                      ? isLightMode
                        ? 'bg-blue-50 border-blue-600 shadow-lg shadow-blue-200'
                        : 'bg-blue-900/30 border-blue-400 shadow-lg shadow-blue-900/30'
                      : isLightMode
                      ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                      : 'bg-slate-800/20 border-slate-700 hover:border-blue-500/50 hover:shadow-md'
                  }`}
                >
                  <div className={`text-xl font-bold mb-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {type.label}
                  </div>
                  <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Test Type Description */}
          <div className={`rounded-2xl border p-6 mb-8 ${
            isLightMode
              ? 'bg-blue-50 border-blue-200'
              : 'bg-blue-900/20 border-blue-500/30'
          }`}>
            <div className={`text-sm leading-relaxed ${isLightMode ? 'text-blue-900' : 'text-blue-200'}`}>
              {testType === 'diagnostic' && (
                <>
                  <p className="font-semibold mb-1">🔍 Diagnostic Test</p>
                  <p>Start here to assess your current knowledge level across all topics and get personalized recommendations.</p>
                </>
              )}
              {testType === 'drills' && (
                <>
                  <p className="font-semibold mb-1">⚙️ Drills</p>
                  <p>Practice specific topics in depth with targeted questions to master challenging concepts.</p>
                </>
              )}
              {testType === 'short' && (
                <>
                  <p className="font-semibold mb-1">⏱️ Short Quiz</p>
                  <p>Quick 10-15 minute assessments to reinforce learning and test your understanding.</p>
                </>
              )}
              {testType === 'preboard' && (
                <>
                  <p className="font-semibold mb-1">🏆 Pre-Board</p>
                  <p>Full-length practice exam that simulates the actual board exam experience.</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className={`rounded-2xl border p-4 mb-8 ${
              isQuizAlreadyTaken
                ? isLightMode
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-amber-500/30 bg-amber-900/20 text-amber-300'
                : isLightMode
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-red-500/30 bg-red-900/20 text-red-300'
            }`}>
              <p className="font-semibold mb-2">
                {isQuizAlreadyTaken ? '⚠️ Quiz Already Taken' : '❌ Error'}
              </p>
              <p className="mb-3">{error}</p>
              {isQuizAlreadyTaken && (
                <button
                  onClick={() => setError(null)}
                  className={`text-sm font-semibold underline hover:no-underline ${
                    isLightMode ? 'text-amber-700' : 'text-amber-300'
                  }`}
                >
                  Clear this message
                </button>
              )}
            </div>
          )}

          <div className="max-w-md mx-auto">
            <form onSubmit={handleJoinQuiz} className="space-y-6">
              <div className={`rounded-2xl border p-8 space-y-4 ${
                isLightMode
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-800/40 border-slate-700'
              }`}>
                <label className={`block text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Enter Quiz Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., AB12CD34"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className={`w-full px-4 py-3 rounded-lg border font-mono text-lg tracking-widest text-center transition ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white'
                      : 'bg-slate-900/20 border-slate-600 text-white focus:border-blue-500 focus:bg-slate-900/40'
                  } focus:outline-none`}
                  maxLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !joinCode.trim()}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition ${
                  isLightMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {loading ? 'Joining...' : '🔓 Join Quiz'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }


  // Taking quiz view
  if (view === 'taking' && currentQuiz && currentSession) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const answeredCount = Object.keys(quizAnswers).length;

    return (
      <div className={`min-h-screen py-8 ${
        isLightMode
          ? 'bg-gradient-to-b from-blue-50 via-white to-slate-50'
          : 'bg-[#051b15]'
      }`}>
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                🎯 {currentQuiz.title}
              </h2>
              <div className="flex gap-3 items-center">
                {timeRemaining !== null && (
                  <div className={`text-sm font-semibold px-4 py-2 rounded-full ${
                    timeRemaining <= 60
                      ? isLightMode
                        ? 'bg-red-100 text-red-700'
                        : 'bg-red-900/30 text-red-300'
                      : isLightMode
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-blue-900/30 text-blue-300'
                  }`}>
                    ⏱️ {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                  </div>
                )}
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  isLightMode
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-blue-900/30 text-blue-300'
                }`}>
                  Question {currentQuestionIndex + 1} / {currentQuiz.total_questions}
                </span>
              </div>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${
              isLightMode ? 'bg-slate-200' : 'bg-slate-800'
            }`}>
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.total_questions) * 100}%` }}
              />
            </div>
          </div>

          <div className={`rounded-2xl border p-8 space-y-6 ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-800/40 border-slate-700'
          }`}>
            <h3 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {currentQuestion.question_text}
            </h3>

            <div className="space-y-3">
              {currentQuestion.choices.map((choice, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = quizAnswers[currentQuestion.id] === letter;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(currentQuestion.id, letter).catch(err => console.error(err))}
                    className={`w-full rounded-lg p-4 text-left font-semibold transition border-2 ${
                      isSelected
                        ? isLightMode
                          ? 'bg-blue-100 border-blue-600 text-blue-900'
                          : 'bg-blue-900/30 border-blue-400 text-blue-300'
                        : isLightMode
                        ? 'bg-slate-100 border-slate-300 text-slate-900 hover:border-blue-400'
                        : 'bg-slate-900/20 border-slate-600 text-white hover:border-blue-400'
                    }`}
                  >
                    <span className="font-bold mr-3">{letter}.</span>
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              ← Previous
            </button>

            {currentQuestionIndex === currentQuiz.total_questions - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={answeredCount !== currentQuiz.total_questions || loading}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                  isLightMode
                    ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {loading ? 'Submitting...' : '✓ Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(currentQuiz.total_questions - 1, currentQuestionIndex + 1))}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                  isLightMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next →
              </button>
            )}
          </div>

          <div className={`rounded-lg p-4 ${
            isLightMode
              ? 'bg-slate-100'
              : 'bg-slate-800/30'
          }`}>
            <p className={`text-sm font-semibold mb-3 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
              Answered: {answeredCount} / {currentQuiz.total_questions}
            </p>
            <div className="flex flex-wrap gap-2">
              {currentQuiz.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg font-semibold text-sm transition ${
                    idx === currentQuestionIndex
                      ? isLightMode
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : quizAnswers[q.id]
                      ? isLightMode
                        ? 'bg-green-200 text-green-900 hover:bg-green-300'
                        : 'bg-green-900/30 text-green-300 hover:bg-green-900/50'
                      : isLightMode
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results view
  if (view === 'results' && sessionResults) {
    const passed = sessionResults.percentage >= 70;

    return (
      <div className={`min-h-screen py-8 flex items-center justify-center ${
        isLightMode
          ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
          : 'bg-[#051b15]'
      }`}>
        <div className="max-w-2xl w-full mx-4 space-y-6">
          <div className={`rounded-2xl border p-4 ${
            isLightMode
              ? 'bg-green-50 border-green-200'
              : 'bg-green-900/20 border-green-500/30'
          }`}>
            <p className={`text-sm font-semibold ${isLightMode ? 'text-green-700' : 'text-green-300'}`}>
              ✓ Quiz completed successfully
            </p>
            <p className={`text-xs mt-1 ${isLightMode ? 'text-green-600' : 'text-green-400'}`}>
              Your answers and score have been saved.
            </p>
          </div>

          <div className={`rounded-3xl border p-8 sm:p-12 text-center space-y-6 ${
            isLightMode
              ? 'bg-white border-emerald-200'
              : 'bg-slate-900 border-emerald-500/20'
          }`}>
            <div className="text-6xl">
              {passed ? '🎉' : '💪'}
            </div>

            <div>
              <h2 className={`text-3xl font-bold mb-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                {passed ? 'Great Job!' : 'Keep Practicing!'}
              </h2>
              <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                You scored {sessionResults.score} out of {sessionResults.total_questions}
              </p>
            </div>

            <div className={`rounded-2xl p-6 ${
              isLightMode
                ? 'bg-slate-100'
                : 'bg-slate-800/40'
            }`}>
              <div className="text-4xl font-bold mb-2" style={{
                color: passed ? '#10b981' : '#f59e0b'
              }}>
                {sessionResults.percentage.toFixed(1)}%
              </div>
              <div className="w-full bg-slate-300 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    passed ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${sessionResults.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {sessionResults.answers.length > 0 && (
            <div className={`rounded-2xl border p-6 space-y-4 ${
              isLightMode
                ? 'bg-white border-slate-200'
                : 'bg-slate-800/40 border-slate-700'
            }`}>
              <h3 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                📝 Your Answers
              </h3>
              <div className="space-y-3">
                {sessionResults.answers.map((answer, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-4 border ${
                      answer.is_correct
                        ? isLightMode
                          ? 'bg-green-50 border-green-200'
                          : 'bg-green-900/20 border-green-500/30'
                        : isLightMode
                        ? 'bg-red-50 border-red-200'
                        : 'bg-red-900/20 border-red-500/30'
                    }`}
                  >
                    <p className={`font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {idx + 1}. {answer.question_text}
                    </p>
                    <p className={`text-sm mb-1 ${answer.is_correct
                      ? isLightMode ? 'text-green-700' : 'text-green-400'
                      : isLightMode ? 'text-red-700' : 'text-red-400'
                    }`}>
                      {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </p>
                    <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      Your answer: {answer.user_answer || 'No answer'} | Correct: {answer.correct_answer}
                    </p>
                    <p className={`text-xs mt-2 ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      Answered {formatRelativeTime(answer.answered_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={resetAndGoHome}
              className={`w-full px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              🔄 Take Another Quiz
            </button>
            <button
              onClick={() => window.history.back()}
              className={`w-full px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
