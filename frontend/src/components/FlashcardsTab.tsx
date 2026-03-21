import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { fetchPracticeTestSessions, PracticeTestSession } from '../services/progressService';
import { authService } from '../services/authService';

interface PracticeQuiz {
  id: string;
  sessionId?: string; // Session ID to use for fetching results
  title: string;
  description?: string;
  category: string;
  total_questions: number;
  total_attempts?: number;
  average_score?: number;
  creator?: { id: number; username: string };
  quizType?: 'quiz' | 'practice-quiz'; // Track which type of quiz this is
}

interface Question {
  id: string;
  question_text: string;
  choices: string[];
  order: number;
  correct_answer?: string;
}

const darkCardShell =
  'rounded-3xl border border-emerald-500/20 bg-[#064e3b]/80 p-7 shadow-[0_18px_40px_rgba(6,78,59,0.45)] backdrop-blur-xl';
const lightCardShell =
  'rounded-3xl border border-emerald-200 bg-white/95 p-7 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl';
const darkAccentButton =
  'rounded-xl border border-emerald-400 px-4 py-2 font-semibold text-white transition bg-emerald-600/80 hover:bg-emerald-600 hover:border-emerald-300';
const lightAccentButton =
  'rounded-xl border border-emerald-600 px-4 py-2 font-semibold text-white transition bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-700';

interface FlashcardsTabProps {
  isAdmin: boolean;
}

export function FlashcardsTab({ isAdmin }: FlashcardsTabProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const cardShellClasses = isLightMode ? lightCardShell : darkCardShell;
  const accentButtonClasses = isLightMode ? lightAccentButton : darkAccentButton;

  const [selectedQuizType, setSelectedQuizType] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<PracticeQuiz[]>([]);
  const [allSessions, setAllSessions] = useState<Record<string, PracticeTestSession>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<PracticeQuiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [timerCount, setTimerCount] = useState(5);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load all practice test sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const data = await fetchPracticeTestSessions();
        setAllSessions(data);
      } catch (err) {
        console.error('Error loading sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Auto-flip timer for flashcards
  useEffect(() => {
    if (!selectedQuiz || quizQuestions.length === 0 || isFlipped || isTimerPaused) return;

    if (timerCount > 0) {
      const timer = setTimeout(() => {
        setTimerCount(timerCount - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timerCount === 0) {
      // Auto-flip when timer reaches 0
      setIsFlipped(true);
      setTimerCount(5); // Reset timer
    }
  }, [timerCount, selectedQuiz, quizQuestions.length, isFlipped, isTimerPaused]);

  // Reset timer when moving to next question
  useEffect(() => {
    if (selectedQuiz && quizQuestions.length > 0) {
      setTimerCount(5);
      setIsFlipped(false);
    }
  }, [currentQuestionIndex]);

  const quizTypeInfo: Record<string, { emoji: string; label: string }> = {
    'diagnostic-test': { emoji: '🔍', label: 'Diagnostic Test' },
    'drills': { emoji: '⚙️', label: 'Drills' },
    'short-quiz': { emoji: '⏱️', label: 'Short Quiz' },
    'preboard': { emoji: '🏆', label: 'Pre-Board' }
  };

  const handleQuizTypeSelect = (quizType: string) => {
    setSelectedQuizType(quizType);
    // Filter sessions by the selected quiz type
    const filteredSessions = Object.values(allSessions).filter(session => session.testType === quizType);

    // Transform to PracticeQuiz format
    const transformedQuizzes: PracticeQuiz[] = filteredSessions.map(session => ({
      id: session.originalQuizId,
      sessionId: session.sessions[0]?.sessionId, // Store the session ID for fetching results
      title: session.quizTitle,
      category: 'General',
      total_questions: session.sessions[0]?.total || 0,
      total_attempts: session.attempts,
      average_score: session.bestScore,
      quizType: session.sessions[0]?.type // Store the quiz type ('quiz' or 'practice-quiz')
    }));

    setQuizzes(transformedQuizzes);
  };

  const handleSelectQuiz = async (quiz: PracticeQuiz) => {
    setSelectedQuiz(quiz);
    setLoading(true);
    try {
      const headers = new Headers({
        'Content-Type': 'application/json'
      });

      const token = authService.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Use the session ID to fetch quiz results with the correct endpoint
      const endpoint = quiz.quizType === 'practice-quiz'
        ? `/api/practice-quizzes/${quiz.sessionId}/results`
        : `/api/quizzes/results/${quiz.sessionId}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = (errorBody as { detail?: string; message?: string }).detail ??
          (errorBody as { message?: string }).message ??
          response.statusText;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Map the response questions to the Question format expected by the component
      const formattedQuestions: Question[] = (data.questions || data.answers || []).map((q: any, idx: number) => ({
        id: q.question_id,
        question_text: q.question_text,
        choices: q.choices || [],
        order: idx + 1,
        correct_answer: q.correct_answer
      }));

      setQuizQuestions(formattedQuestions);
      setCurrentQuestionIndex(0);
      setIsFlipped(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const playFlipSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;

      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  };

  const clearApiCache = async () => {
    try {
      await fetch('https://cheiken021-letai.hf.space/clear-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.warn('Failed to clear API cache:', err);
    }
  };

  const handleAiExplain = async () => {
    setShowAiModal(true);
    setAiLoading(true);
    setIsTimerPaused(true);
    setAiExplanation(null);

    try {
      const currentQuestion = quizQuestions[currentQuestionIndex];

      const payload = {
        question: currentQuestion.question_text,
        choices: currentQuestion.choices,
        correct_answer: currentQuestion.correct_answer
      };

      const response = await fetch('https://cheiken021-letai.hf.space/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      setAiExplanation(data.explanation || data.result || JSON.stringify(data));
    } catch (err) {
      setAiExplanation(`Error loading explanation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Show loading state while fetching flashcard questions
  if (selectedQuiz && loading && quizQuestions.length === 0) {
    return (
      <div className="flex flex-col gap-4 mx-4 sm:mx-0">
        <section className={`${cardShellClasses} space-y-6`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className={`text-lg sm:text-xl font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'} truncate`}>
                {selectedQuiz.title}
              </h3>
              <p className={`text-xs sm:text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'} truncate`}>
                Loading flashcard questions...
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedQuiz(null);
                setQuizQuestions([]);
              }}
              className={`${accentButtonClasses} text-xs`}
            >
              ← Back
            </button>
          </div>

          <div className="flex items-center justify-center min-h-80">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <div className="text-center space-y-1">
                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Preparing your flashcards...
                </p>
                <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-white/50'}`}>
                  This may take a moment
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show quiz flashcard view
  if (selectedQuiz && quizQuestions.length > 0) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
      <div className="flex flex-col gap-4 mx-4 sm:mx-0">
        <section className={`${cardShellClasses} space-y-4 sm:space-y-6`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className={`text-lg sm:text-xl font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'} truncate`}>
                {selectedQuiz.title}
              </h3>
              <p className={`text-xs sm:text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'} truncate`}>
                {selectedQuizType ? quizTypeInfo[selectedQuizType]?.label : 'Practice Quiz'}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedQuiz(null);
                setQuizQuestions([]);
              }}
              className={`${accentButtonClasses} text-xs`}
            >
              ← Back
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Q{currentQuestionIndex + 1}/{quizQuestions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex justify-center items-center min-h-80">
            <div
              className="w-full max-w-2xl flip-card-container h-80"
              onClick={() => {
                playFlipSound();
                setIsFlipped(!isFlipped);
              }}
            >
              <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                <div className="flip-card-front">
                  <div className="w-full text-left">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-indigo-300">Question {currentQuestionIndex + 1}</p>
                      <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                        timerCount <= 1 ? 'bg-red-500/30 text-red-300' : 'bg-indigo-500/30 text-indigo-300'
                      }`}>
                        {timerCount}s
                      </div>
                    </div>
                    <p className="text-base sm:text-lg text-white leading-relaxed mb-4">{currentQuestion.question_text}</p>
                    <div className="space-y-2">
                      {currentQuestion.choices.map((choice, idx) => (
                        <div key={idx} className="text-sm text-white/80 bg-white/5 rounded-lg p-2 border border-white/10">
                          <span className="font-semibold text-emerald-400">{String.fromCharCode(65 + idx)}.</span> {choice}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/50 mt-4">Auto-reveal in {timerCount}s or click to reveal</p>
                  </div>
                </div>
                <div className="flip-card-back">
                  <div>
                    <p className="text-xs font-semibold text-emerald-300 mb-4">Answer</p>
                    <div className="space-y-2">
                      <span className="text-6xl font-bold text-emerald-400">{currentQuestion.correct_answer}</span>
                    </div>
                    <p className="text-xs text-white/50 mt-6">Click to see question</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleAiExplain}
            className={`w-full rounded-xl border border-indigo-400 px-4 py-2 font-semibold text-white transition bg-indigo-600/80 hover:bg-indigo-600 hover:border-indigo-300`}
          >
            ✨ AI EXPLAIN
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                  setIsFlipped(false);
                }
              }}
              disabled={currentQuestionIndex === 0}
              className={`flex-1 ${accentButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Previous
            </button>
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentQuestionIndex(0);
              }}
              className={`flex-1 ${accentButtonClasses}`}
            >
              Restart
            </button>
            <button
              onClick={() => {
                if (currentQuestionIndex < quizQuestions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setIsFlipped(false);
                }
              }}
              disabled={currentQuestionIndex === quizQuestions.length - 1}
              className={`flex-1 ${accentButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Next
            </button>
          </div>

          {/* AI Explanation Modal */}
          {showAiModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <section className={`${cardShellClasses} space-y-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl sm:text-2xl font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    ✨ AI Explanation
                  </h2>
                  <button
                    onClick={async () => {
                      setShowAiModal(false);
                      setIsTimerPaused(false);
                      setAiExplanation(null);
                      setAiLoading(false);
                      await clearApiCache();
                    }}
                    className={`text-2xl ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'}`}
                  >
                    ✕
                  </button>
                </div>

                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="flex gap-2 mb-4">
                      <div className="h-3 w-3 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="h-3 w-3 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-3 w-3 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      AI is generating explanation...
                    </p>
                  </div>
                ) : (
                  <div className={`rounded-2xl p-6 ${isLightMode ? 'bg-indigo-50' : 'bg-indigo-900/20'}`}>
                    <div className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                      {aiExplanation && (
                        <div className="whitespace-pre-wrap break-words">
                          {aiExplanation}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={async () => {
                    setShowAiModal(false);
                    setIsTimerPaused(false);
                    setAiExplanation(null);
                    setAiLoading(false);
                    await clearApiCache();
                  }}
                  className={`w-full rounded-xl border px-4 py-2 font-semibold transition ${
                    isLightMode
                      ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border-indigo-400 bg-indigo-600/80 text-white hover:bg-indigo-600'
                  }`}
                >
                  Close & Resume Timer
                </button>
              </section>
            </div>
          )}
        </section>
      </div>
    );
  }

  // Show quiz list
  if (selectedQuizType && !selectedQuiz) {
    return (
      <section className={`${cardShellClasses} space-y-4 sm:space-y-6 mx-4 sm:mx-0`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg sm:text-xl font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {quizTypeInfo[selectedQuizType]?.emoji} {quizTypeInfo[selectedQuizType]?.label}
            </h3>
            <p className={`text-xs sm:text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              Select a practice quiz to study
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedQuizType(null);
            }}
            className={`${accentButtonClasses} text-xs`}
          >
            ← Change Type
          </button>
        </div>

        {error && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${
            isLightMode
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-red-500/30 bg-red-900/20 text-red-300'
          }`}>
            ❌ {error}
          </div>
        )}

        {loading ? (
          <div className={`text-center py-8 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
            <p>Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-8 text-center ${
            isLightMode
              ? 'border-slate-300 bg-slate-50'
              : 'border-white/20 bg-white/5'
          }`}>
            <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              No practice quizzes available in this category.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {quizzes.map(quiz => (
              <button
                key={quiz.id}
                onClick={() => handleSelectQuiz(quiz)}
                className={`rounded-2xl border p-4 sm:p-5 transition cursor-pointer text-left ${
                  isLightMode
                    ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                    : 'border-emerald-500/20 bg-emerald-900/10 hover:bg-emerald-900/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {quiz.title}
                    </h4>
                    {quiz.description && (
                      <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'} truncate`}>
                        {quiz.description}
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-white/50'}`}>
                      ❓ {quiz.total_questions} questions
                    </p>
                  </div>
                  <div className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                    isLightMode
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-emerald-600/40 text-emerald-300'
                  }`}>
                    Study
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  // Get available quiz types based on sessions
  const availableQuizTypes = Object.keys(quizTypeInfo).filter(key =>
    Object.values(allSessions).some(session => session.testType === key)
  );

  // Main view - Show available quiz types directly
  return (
    <div className="space-y-6 mx-4 sm:mx-0">
      <section className={`${cardShellClasses} space-y-4 sm:space-y-6`}>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className={`text-2xl sm:text-3xl font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              🎴 Flashcards
            </h2>
            <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              Study practice quiz questions as interactive flashcards
            </p>
          </div>
          <button
            onClick={() => setShowSearchModal(true)}
            className={`flex-shrink-0 rounded-xl border px-4 py-2 font-semibold text-sm transition ${
              isLightMode
                ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border-emerald-400 bg-emerald-600/80 text-white hover:bg-emerald-600'
            }`}
          >
            🔍 Search
          </button>
        </div>

        {loading ? (
          <div className={`text-center py-8 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
            <p>Loading study types...</p>
          </div>
        ) : availableQuizTypes.length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-8 text-center ${
            isLightMode
              ? 'border-slate-300 bg-slate-50'
              : 'border-white/20 bg-white/5'
          }`}>
            <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              No study materials available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableQuizTypes.map(key => {
              const info = quizTypeInfo[key];
              return (
                <button
                  key={key}
                  onClick={() => handleQuizTypeSelect(key)}
                  className={`group rounded-2xl border p-6 transition-all hover:shadow-lg ${
                    isLightMode
                      ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                      : 'border-emerald-500/20 bg-emerald-900/10 hover:bg-emerald-900/20'
                  }`}
                >
                  <div className="space-y-3 text-center">
                    <div className="text-4xl">{info.emoji}</div>
                    <h3 className={`text-lg font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {info.label}
                    </h3>
                    <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      Practice and study questions
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <section className={`${cardShellClasses} space-y-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto`}>
            <div className="flex items-center justify-between sticky top-0 -m-7 mb-4 p-7 bg-inherit rounded-t-3xl">
              <h2 className={`text-xl sm:text-2xl font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                🔍 Search Flashcards
              </h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                }}
                className={`text-2xl ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search by quiz title or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition ${
                  isLightMode
                    ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:outline-none'
                    : 'border-white/20 bg-white/5 text-white placeholder-white/50 focus:border-emerald-400 focus:outline-none'
                }`}
              />

              {loading ? (
                <div className={`text-center py-8 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                  <p>Loading available flashcards...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(80vh-200px)] overflow-y-auto">
                  {Object.values(allSessions).length === 0 ? (
                    <div className={`rounded-2xl border border-dashed p-8 text-center ${
                      isLightMode
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-white/20 bg-white/5'
                    }`}>
                      <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                        No flashcards available yet. Complete a quiz to start studying!
                      </p>
                    </div>
                  ) : (
                    Object.values(allSessions)
                      .filter(session => {
                        const query = searchQuery.toLowerCase();
                        return (
                          session.quizTitle.toLowerCase().includes(query) ||
                          session.testType.toLowerCase().includes(query)
                        );
                      })
                      .map(session => {
                        const typeInfo = quizTypeInfo[session.testType] || { emoji: '❓', label: session.testType };
                        return (
                          <button
                            key={session.id}
                            onClick={() => {
                              const quiz: PracticeQuiz = {
                                id: session.originalQuizId,
                                sessionId: session.sessions[0]?.sessionId,
                                title: session.quizTitle,
                                category: 'General',
                                total_questions: session.sessions[0]?.total || 0,
                                total_attempts: session.attempts,
                                average_score: session.bestScore,
                                quizType: session.sessions[0]?.type
                              };
                              handleSelectQuiz(quiz);
                              setShowSearchModal(false);
                              setSearchQuery('');
                            }}
                            className={`w-full rounded-2xl border p-4 text-left transition cursor-pointer ${
                              isLightMode
                                ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                                : 'border-emerald-500/20 bg-emerald-900/10 hover:bg-emerald-900/20'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl">{typeInfo.emoji}</span>
                                  <h4 className={`font-semibold truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                    {session.quizTitle}
                                  </h4>
                                </div>
                                <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                                  {typeInfo.label} • {session.sessions[0]?.total || 0} questions • Best: {Math.round(session.bestScore)}%
                                </p>
                              </div>
                              <div className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                                isLightMode
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-emerald-600/40 text-emerald-300'
                              }`}>
                                Study →
                              </div>
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
