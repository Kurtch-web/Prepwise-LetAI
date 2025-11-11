import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useIsOnline } from '../hooks/useOnlineStatus';
import { getFlashcardDataWithOfflineSupport } from '../services/apiOffline';
import { offlineStorage } from '../services/offlineStorage';

const cardShellClasses =
  'rounded-3xl border border-white/10 bg-[#0b111a]/80 p-7 shadow-[0_18px_40px_rgba(4,10,20,0.45)] backdrop-blur-xl';

interface Question {
  number: number;
  question: string;
  choices: string[];
  correct_answer: string;
}

interface FlashcardViewProps {
  flashcardId: string;
  token: string;
  onBack: () => void;
}

type StudyMode = 'flashcard' | 'quiz';
type QuizDifficulty = 'hard' | 'medium' | 'easy' | 'practice';

export function FlashcardView({ flashcardId, token, onBack }: FlashcardViewProps) {
  const [flashcard, setFlashcard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [studyMode, setStudyMode] = useState<StudyMode>('flashcard');
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizTimer, setQuizTimer] = useState(10);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizAborted, setQuizAborted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [easyModeTime, setEasyModeTime] = useState(30);
  const [selectedTimerPerQuestion, setSelectedTimerPerQuestion] = useState(10);
  const [quizDifficulty, setQuizDifficulty] = useState<QuizDifficulty | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const [offlineSince, setOfflineSince] = useState<number | null>(null);
  const [cheatingDetected, setCheatingDetected] = useState(false);
  const [offlineTimeoutWarning, setOfflineTimeoutWarning] = useState(false);
  const [offlineElapsedSeconds, setOfflineElapsedSeconds] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('flashcard-sound-enabled');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });
  const [aiEnabled, setAiEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('flashcard-ai-enabled');
      return stored === null ? false : stored === 'true';
    } catch {
      return false;
    }
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const isOnline = useIsOnline();

  useEffect(() => {
    loadFlashcard();
  }, [flashcardId, token]);

  // Persist sound preference
  useEffect(() => {
    try {
      localStorage.setItem('flashcard-sound-enabled', String(soundEnabled));
    } catch (e) {
      console.warn('Failed to save sound preference:', e);
    }
  }, [soundEnabled]);

  // Persist AI preference
  useEffect(() => {
    try {
      localStorage.setItem('flashcard-ai-enabled', String(aiEnabled));
    } catch (e) {
      console.warn('Failed to save AI preference:', e);
    }
  }, [aiEnabled]);

  // Play flip sound effect
  const playFlipSound = () => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;

      // Create oscillator for click sound
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      // Quick beep: 800Hz for 50ms
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  };

  // Auto-save quiz state when in quiz mode
  useEffect(() => {
    if (studyMode !== 'quiz' || !quizStarted || quizFinished || quizAborted) return;

    const sessionData = {
      flashcardId,
      currentQuestionIndex,
      selectedAnswers,
      studyMode,
      quizTimer,
      selectedTimerPerQuestion,
      quizStarted: true,
      timestamp: Date.now(),
      cheatingDetected,
      offlineSince
    };

    offlineStorage.setQuizSession(flashcardId, sessionData);
  }, [flashcardId, currentQuestionIndex, selectedAnswers, quizTimer, selectedTimerPerQuestion, studyMode, quizStarted, quizFinished, quizAborted, cheatingDetected, offlineSince]);

  // Handle connection loss/restoration
  useEffect(() => {
    if (studyMode !== 'quiz' || !quizStarted || quizFinished || quizAborted) return;

    if (!isOnline && !connectionLost) {
      console.log('[Quiz] Connection lost - pausing quiz');
      setConnectionLost(true);
      setOfflineSince(Date.now());
    } else if (isOnline && connectionLost) {
      console.log('[Quiz] Connection restored');
      setConnectionLost(false);

      // Auto-submit if user was flagged for cheating while offline
      if (cheatingDetected) {
        console.log('[Quiz] Cheating detected - auto-submitting quiz on reconnection');
        setTimeout(() => {
          setQuizFinished(true);
        }, 500);
      }
    }
  }, [isOnline, studyMode, quizStarted, quizFinished, quizAborted, connectionLost, cheatingDetected]);

  // Monitor offline timeout (5 minutes) and update display
  useEffect(() => {
    if (!connectionLost || !offlineSince || quizFinished || quizAborted) return;

    const timeout = setInterval(() => {
      const offlineSeconds = Math.floor((Date.now() - offlineSince) / 1000);
      setOfflineElapsedSeconds(offlineSeconds);

      const OFFLINE_TIMEOUT = 5 * 60; // 5 minutes
      const WARNING_THRESHOLD = 4 * 60; // Show warning at 4 minutes

      if (offlineSeconds >= WARNING_THRESHOLD && !offlineTimeoutWarning) {
        console.log('[Quiz] Offline timeout warning - 1 minute remaining');
        setOfflineTimeoutWarning(true);
      }

      if (offlineSeconds >= OFFLINE_TIMEOUT) {
        console.log('[Quiz] Offline timeout exceeded - auto-submitting quiz');
        setQuizFinished(true);
        clearInterval(timeout);
      }
    }, 1000);

    return () => clearInterval(timeout);
  }, [connectionLost, offlineSince, quizFinished, quizAborted, offlineTimeoutWarning]);

  // Detect navigation/tab switching while offline (cheating detection)
  useEffect(() => {
    if (studyMode !== 'quiz' || !quizStarted || quizFinished || quizAborted || !connectionLost) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Quiz] User left quiz while offline - cheating detected');
        setCheatingDetected(true);
      }
    };

    const handleNavClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const navLink = target.closest('nav a, nav button');

      if (navLink && !navLink.getAttribute('href')?.includes(window.location.pathname)) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Quiz] User attempted navigation while offline - cheating detected');
        setCheatingDetected(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleNavClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleNavClick, true);
    };
  }, [studyMode, quizStarted, quizFinished, quizAborted, connectionLost]);

  // Quiz timer effect (paused while offline, skipped for practice mode)
  useEffect(() => {
    if (studyMode !== 'quiz' || !quizStarted || quizFinished || quizAborted || loading || connectionLost || quizDifficulty === 'practice') return;

    const timer = setInterval(() => {
      setQuizTimer(prev => {
        if (prev <= 1) {
          moveToNextQuestion();
          return selectedTimerPerQuestion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [studyMode, currentQuestionIndex, quizFinished, quizAborted, loading, quizStarted, selectedTimerPerQuestion, connectionLost]);

  // Navigation interception for quiz mode
  useEffect(() => {
    if (studyMode !== 'quiz' || !quizStarted || quizFinished || quizAborted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setQuizFinished(true);
      }
    };

    const handleNavClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const navLink = target.closest('nav a, nav button');

      // Check if the click is on a navigation item that would change route
      if (navLink && !navLink.getAttribute('href')?.includes(window.location.pathname)) {
        e.preventDefault();
        e.stopPropagation();
        setQuizAborted(true);
      }
    };

    const handleChatClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-chat-widget]')) {
        e.preventDefault();
        e.stopPropagation();
        setQuizAborted(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleNavClick, true);
    document.addEventListener('click', handleChatClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleNavClick, true);
      document.removeEventListener('click', handleChatClick, true);
    };
  }, [studyMode, quizFinished, quizAborted, quizStarted]);

  const shuffleArray = (array: Question[]): Question[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const detectLanguage = (text: string): 'english' | 'tagalog' => {
    // Tagalog/Filipino keywords
    const filipinoKeywords = ['ano', 'ang', 'sa', 'ng', 'mga', 'ba', 'kung', 'ay', 'ito', 'yung', 'kang', 'mo', 'ko', 'nyo', 'natin', 'kami'];
    const lowerText = text.toLowerCase();

    const filipinoMatches = filipinoKeywords.filter(word =>
      new RegExp(`\\b${word}\\b`).test(lowerText)
    ).length;

    return filipinoMatches >= 2 ? 'tagalog' : 'english';
  };

  const buildExplanationPrompt = (language: 'english' | 'tagalog') => {
    if (language === 'tagalog') {
      return 'Magbigay ng detalyadong paliwanag para sa bawat pagpipilian - kung bakit tama ang tamang sagot at kung bakit mali ang bawat isa sa mga maling sumagot.';
    } else {
      return 'Provide detailed explanations for each choice - why the correct answer is right and why each wrong answer is incorrect.';
    }
  };

  const fetchAIExplanation = async () => {
    if (aiLoading || aiExplanation) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const detectedLanguage = detectLanguage(currentQuestion.question);
      const explanationPrompt = buildExplanationPrompt(detectedLanguage);

      const response = await fetch('https://cheiken021-letai.hf.space/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion.question,
          choices: currentQuestion.choices,
          correct_answer: currentQuestion.correct_answer,
          max_new_tokens: 600,
          temperature: 0.7,
          language: detectedLanguage,
          explanation_instruction: explanationPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setAiExplanation(data.explanation);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate explanation';
      setAiError(errorMsg);
      console.error('AI explanation error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const moveToNextQuestion = () => {
    const questions = shuffledQuestions.length > 0 ? shuffledQuestions : (flashcard?.parsedData?.questions || []);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswers(false);
      setAiExplanation(null);
      setAiError(null);
      if (quizDifficulty !== 'practice') {
        setQuizTimer(selectedTimerPerQuestion);
      }
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = () => {
    // Clear saved quiz session when quiz is submitted
    offlineStorage.deleteQuizSession(flashcardId);
    setQuizFinished(true);
  };

  const startQuizWithDifficulty = (difficulty: QuizDifficulty, customTime?: number) => {
    const questionsToShuffle = flashcard?.parsedData?.questions || [];
    const shuffled: Question[] = shuffleArray(questionsToShuffle as Question[]);
    setShuffledQuestions(shuffled);
    setQuizDifficulty(difficulty);

    let timePerQuestion = 10;
    if (difficulty === 'hard') {
      timePerQuestion = 10;
    } else if (difficulty === 'medium') {
      timePerQuestion = 20;
    } else if (difficulty === 'easy' && customTime && customTime >= 30) {
      timePerQuestion = customTime;
    } else if (difficulty === 'practice') {
      timePerQuestion = 0;
    }
    setSelectedTimerPerQuestion(timePerQuestion);
    setQuizTimer(timePerQuestion);
    setQuizStarted(true);
  };

  const loadFlashcard = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getFlashcardDataWithOfflineSupport(token, flashcardId, api);
      setFlashcard(result.data);
      setIsOffline(result.isOffline);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flashcard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className={`${cardShellClasses} space-y-4`}>
        <p className="text-white/60">Loading flashcard questions...</p>
      </section>
    );
  }

  if (error || !flashcard) {
    return (
      <section className={`${cardShellClasses} space-y-4`}>
        <p className="text-red-300">{error || 'Failed to load flashcard'}</p>
        <button
          onClick={onBack}
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5"
        >
          Back to Flashcards
        </button>
      </section>
    );
  }

  const questions: Question[] = shuffledQuestions.length > 0 ? shuffledQuestions : (flashcard.parsedData?.questions || []);
  const currentQuestion = questions[currentQuestionIndex];

  if (questions.length === 0) {
    return (
      <section className={`${cardShellClasses} space-y-4`}>
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">{flashcard.filename}</h3>
          <p className="text-sm text-white/60">No questions found in this flashcard.</p>
        </div>
        <button
          onClick={onBack}
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5"
        >
          Back to Flashcards
        </button>
      </section>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const selectedAnswer = selectedAnswers[currentQuestion.number];
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;

  // Calculate quiz score
  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.number] === q.correct_answer) {
        correctCount++;
      }
    });
    return {
      correct: correctCount,
      total: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100)
    };
  };

  // Quiz results screen
  if ((quizFinished || quizAborted) && studyMode === 'quiz') {
    const score = calculateScore();
    const performanceLevel =
      score.percentage >= 80 ? 'Excellent' :
      score.percentage >= 60 ? 'Good' :
      score.percentage >= 40 ? 'Average' :
      'Needs Improvement';

    const performanceColor =
      score.percentage >= 80 ? 'text-emerald-300' :
      score.percentage >= 60 ? 'text-sky-300' :
      score.percentage >= 40 ? 'text-yellow-300' :
      'text-red-300';

    const performanceBg =
      score.percentage >= 80 ? 'bg-emerald-500/10 border-emerald-400/20' :
      score.percentage >= 60 ? 'bg-sky-500/10 border-sky-400/20' :
      score.percentage >= 40 ? 'bg-yellow-500/10 border-yellow-400/20' :
      'bg-red-500/10 border-red-400/20';

    return (
      <div className="w-full flex justify-center items-start p-4 sm:p-6 md:p-8">
        <section className={`${cardShellClasses} space-y-6 w-full max-w-3xl`}>
          {cheatingDetected && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 sm:px-6 py-3 sm:py-4 text-sm text-red-300">
              <p className="font-semibold mb-1">⚠️ Quiz Auto-Submitted</p>
              <p className="text-xs sm:text-sm">Cheating attempt detected. Your quiz was auto-submitted when connection was restored. Your answers have been saved.</p>
            </div>
          )}
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-semibold text-white">Quiz Complete!</h3>
            <p className="text-xs sm:text-sm text-white/60 truncate">{flashcard.filename}</p>
          </div>

          <div className={`rounded-2xl border px-4 sm:px-6 py-6 sm:py-8 text-center space-y-3 sm:space-y-4 ${performanceBg}`}>
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">{score.percentage}%</div>
            <div className={`text-xl sm:text-2xl font-semibold ${performanceColor}`}>{performanceLevel}</div>
            <div className="text-sm sm:text-base text-white/80">
              You got <span className="font-semibold text-white">{score.correct}</span> out of <span className="font-semibold text-white">{score.total}</span> questions correct
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold text-white/80">Answer Analysis:</h4>
            <div className="space-y-2 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {questions.map((q, idx) => {
                const userAnswer = selectedAnswers[q.number];
                const isAnswerCorrect = userAnswer === q.correct_answer;
                const userAnswerText = userAnswer ? q.choices.find(c => c.charAt(0) === userAnswer) : 'Not answered';
                const correctAnswerText = q.choices.find(c => c.charAt(0) === q.correct_answer);

                return (
                  <div key={idx} className={`rounded-xl p-2 sm:p-3 border text-xs sm:text-sm ${isAnswerCorrect ? 'bg-emerald-500/10 border-emerald-400/20' : 'bg-red-500/10 border-red-400/20'}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`font-semibold flex-shrink-0 ${isAnswerCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                        {isAnswerCorrect ? '✓' : '✗'} Q{q.number}
                      </span>
                      <p className="text-white/70 leading-snug">{q.question}</p>
                    </div>
                    <div className="space-y-1 ml-6 text-xs">
                      <p className={isAnswerCorrect ? 'text-emerald-300' : 'text-red-300'}>
                        Your answer: {userAnswerText || 'Not answered'}
                      </p>
                      {!isAnswerCorrect && (
                        <p className="text-emerald-300">
                          Correct answer: {correctAnswerText}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => {
              setStudyMode('flashcard');
              setQuizFinished(false);
              setQuizAborted(false);
              setCurrentQuestionIndex(0);
              setSelectedAnswers({});
              setShowAnswers(false);
              setQuizStarted(false);
              setQuizTimer(selectedTimerPerQuestion);
              setShuffledQuestions([]);
              setQuizDifficulty(null);
            }}
            className="w-full rounded-2xl border border-indigo-400/50 bg-indigo-500/20 px-4 py-2 sm:py-3 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/30 transition"
          >
            Back to Flashcards
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 mx-4 sm:mx-0 w-full">
      {/* Mode Sidebar */}
      <div className="flex flex-row md:flex-col gap-2 md:w-48 md:space-y-2 w-full md:w-48">
        <button
          onClick={() => {
            if (studyMode === 'quiz' && quizStarted && !quizFinished && !quizAborted) {
              submitQuiz();
              return;
            }
            setStudyMode('flashcard');
            setIsFlipped(false);
            setCurrentQuestionIndex(0);
            setQuizStarted(false);
            setShuffledQuestions([]);
            setQuizDifficulty(null);
          }}
          className={`flex-1 md:flex-initial text-left rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold transition ${
            studyMode === 'flashcard'
              ? 'bg-indigo-500/20 border border-indigo-400/50 text-indigo-300'
              : 'border border-white/10 text-white/80 hover:bg-white/5'
          }`}
        >
          Flashcard
        </button>
        <button
          onClick={() => {
            setStudyMode('quiz');
            setShowAnswers(false);
            setCurrentQuestionIndex(0);
            setQuizStarted(false);
            setQuizFinished(false);
            setQuizAborted(false);
            setEasyModeTime(30);
            setShuffledQuestions([]);
            setQuizDifficulty(null);
          }}
          className={`flex-1 md:flex-initial text-left rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold transition ${
            studyMode === 'quiz'
              ? 'bg-indigo-500/20 border border-indigo-400/50 text-indigo-300'
              : 'border border-white/10 text-white/80 hover:bg-white/5'
          }`}
        >
          Quiz
        </button>
      </div>

      {/* Main Content */}
      <section className={`${cardShellClasses} space-y-4 sm:space-y-6 flex-1 overflow-y-auto max-h-[calc(100vh-150px)]`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg sm:text-xl font-semibold text-white truncate">{flashcard.filename}</h3>
              {fromCache && (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 whitespace-nowrap flex-shrink-0">
                  {isOffline ? '📴 Offline' : '💾 Cached'}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-xs text-white/60 truncate">
              {flashcard.category} • {flashcard.parsedData.total_questions} questions
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {studyMode === 'flashcard' && (
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Sound on' : 'Sound off'}
                className="rounded-2xl border border-white/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white/80 hover:bg-white/5 flex items-center gap-2"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
            )}
            <button
              onClick={() => {
                if (studyMode === 'quiz' && quizStarted && !quizFinished && !quizAborted) {
                  submitQuiz();
                } else {
                  onBack();
                }
              }}
              className={`rounded-2xl border px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold flex-shrink-0 ${
                studyMode === 'quiz' && quizStarted && !quizFinished && !quizAborted
                  ? 'border-red-400/50 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                  : 'border-white/10 text-white/80 hover:bg-white/5'
              }`}
            >
              {studyMode === 'quiz' && quizStarted && !quizFinished && !quizAborted ? 'Submit Quiz' : 'Back'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="truncate">
              Q{currentQuestionIndex + 1}/{questions.length}
            </span>
            <span className="flex-shrink-0">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {studyMode === 'flashcard' ? (
          // Flashcard Mode
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-center items-center min-h-96">
              <style>{`
                @keyframes cardFlip {
                  0% {
                    transform: rotateY(0deg);
                  }
                  100% {
                    transform: rotateY(180deg);
                  }
                }
                .flip-card-container {
                  perspective: 1000px;
                  cursor: pointer;
                }
                .flip-card-inner {
                  position: relative;
                  width: 100%;
                  height: 100%;
                  transition: transform 0.6s;
                  transform-style: preserve-3d;
                }
                .flip-card-inner.is-flipped {
                  transform: rotateY(180deg);
                }
                .flip-card-front,
                .flip-card-back {
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  backface-visibility: hidden;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 2rem;
                  text-align: center;
                  border-radius: 1.5rem;
                  border: 1px solid rgba(255,255,255,0.2);
                  background: rgba(11,17,26,0.8);
                }
                .flip-card-back {
                  transform: rotateY(180deg);
                  border-color: rgba(79,172,254,0.3);
                  background: rgba(30,58,138,0.6);
                }
              `}</style>
              <div className="w-full max-w-2xl flip-card-container h-96" onClick={() => {
                playFlipSound();
                setIsFlipped(!isFlipped);
              }}>
                <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                  <div className="flip-card-front">
                    <div className="w-full text-left">
                      <p className="text-xs font-semibold text-indigo-300 mb-3">Question {currentQuestion.number}</p>
                      <p className="text-base sm:text-lg text-white leading-relaxed mb-4">{currentQuestion.question}</p>
                      <div className="space-y-2">
                        {currentQuestion.choices.map((choice, idx) => (
                          <div key={idx} className="text-sm text-white/80 bg-white/5 rounded-lg p-2 border border-white/10">
                            {choice}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-white/50 mt-4">Click to reveal answer</p>
                    </div>
                  </div>
                  <div className="flip-card-back">
                    <div>
                      <p className="text-xs font-semibold text-emerald-300 mb-4">Answer</p>
                      <p className="text-base sm:text-lg text-white leading-relaxed">
                        {currentQuestion.choices.find(choice => choice.charAt(0) === currentQuestion.correct_answer) || currentQuestion.correct_answer}
                      </p>
                      <p className="text-xs text-white/50 mt-6">Click to see question</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isFlipped && (
              <div className="space-y-3">
                {!aiExplanation && !aiError && (
                  <button
                    onClick={fetchAIExplanation}
                    disabled={aiLoading}
                    className="w-full rounded-2xl border border-sky-400/50 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {aiLoading ? 'Generating Explanation...' : '✨ Get AI Explanation'}
                  </button>
                )}

                {aiLoading && (
                  <div className="flex items-center justify-center gap-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-6">
                    <div className="flex gap-1">
                      <div className="h-3 w-3 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="h-3 w-3 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-3 w-3 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-sm font-semibold text-sky-300">Generating explanation...</span>
                  </div>
                )}

                {aiExplanation && (
                  <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-4 space-y-3">
                    <p className="text-xs font-semibold text-sky-300">📚 AI Explanation</p>
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{aiExplanation}</p>
                    <button
                      onClick={() => setAiExplanation(null)}
                      className="text-xs font-semibold text-sky-300 hover:text-sky-200 transition"
                    >
                      Clear Explanation
                    </button>
                  </div>
                )}

                {aiError && (
                  <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-3">
                    <p className="text-xs font-semibold text-orange-300 mb-1">��️ Generation Failed</p>
                    <p className="text-xs text-orange-200/80">{aiError}</p>
                    <button
                      onClick={() => {
                        setAiError(null);
                        setAiExplanation(null);
                      }}
                      className="mt-2 text-xs font-semibold text-orange-300 hover:text-orange-200 transition"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    setCurrentQuestionIndex(currentQuestionIndex - 1);
                    setIsFlipped(false);
                    setAiExplanation(null);
                    setAiError(null);
                  }
                }}
                disabled={currentQuestionIndex === 0}
                className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setSelectedAnswers({});
                  setCurrentQuestionIndex(0);
                  setAiExplanation(null);
                  setAiError(null);
                }}
                className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5"
              >
                Restart
              </button>
              <button
                onClick={() => {
                  if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                    setIsFlipped(false);
                    setAiExplanation(null);
                    setAiError(null);
                  }
                }}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        ) : studyMode === 'quiz' && !quizStarted ? (
          // Timer Selection Screen
          <div className="space-y-6 sm:space-y-8 flex flex-col items-center justify-start py-8 overflow-y-auto">
            <div className="text-center space-y-2 w-full">
              <h3 className="text-2xl sm:text-3xl font-semibold text-white">Choose Your Mode</h3>
              <p className="text-sm text-white/60">Select a difficulty level or practice mode</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
              <button
                onClick={() => startQuizWithDifficulty('hard')}
                className="group rounded-2xl border border-red-400/30 bg-red-500/10 p-6 hover:bg-red-500/20 transition space-y-4 text-center"
              >
                <div className="text-4xl">🔥</div>
                <div>
                  <h4 className="text-lg font-semibold text-red-300">Hard</h4>
                  <p className="text-xs text-white/60 mt-1">10 seconds per question</p>
                  <p className="text-xs text-red-300/60 mt-2">No AI assistance</p>
                </div>
                <div className="text-sm font-semibold text-white group-hover:text-red-300 transition">
                  Start Quiz
                </div>
              </button>

              <button
                onClick={() => startQuizWithDifficulty('medium')}
                className="group rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-6 hover:bg-yellow-500/20 transition space-y-4 text-center"
              >
                <div className="text-4xl">⚡</div>
                <div>
                  <h4 className="text-lg font-semibold text-yellow-300">Medium</h4>
                  <p className="text-xs text-white/60 mt-1">20 seconds per question</p>
                  <p className="text-xs text-yellow-300/60 mt-2">No AI assistance</p>
                </div>
                <div className="text-sm font-semibold text-white group-hover:text-yellow-300 transition">
                  Start Quiz
                </div>
              </button>

              <button
                onClick={() => startQuizWithDifficulty('easy', easyModeTime)}
                className="group rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 hover:bg-emerald-500/20 transition space-y-4 text-center"
              >
                <div className="text-4xl">🌿</div>
                <div>
                  <h4 className="text-lg font-semibold text-emerald-300">Easy</h4>
                  <p className="text-xs text-white/60 mt-1">Custom time per question</p>
                  <p className="text-xs text-emerald-300/60 mt-2">No AI assistance</p>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2 justify-center">
                    <input
                      type="number"
                      min="30"
                      value={easyModeTime}
                      onChange={e => setEasyModeTime(Math.max(30, parseInt(e.target.value) || 30))}
                      className="w-16 rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-center text-sm font-semibold text-white"
                    />
                    <span className="text-xs text-white/60">seconds</span>
                  </div>
                  <div className="text-sm font-semibold text-white group-hover:text-emerald-300 transition">
                    Start Quiz
                  </div>
                </div>
              </button>

              <button
                onClick={() => startQuizWithDifficulty('practice')}
                className="group rounded-2xl border border-sky-400/30 bg-sky-500/10 p-6 hover:bg-sky-500/20 transition space-y-4 text-center"
              >
                <div className="text-4xl">📚</div>
                <div>
                  <h4 className="text-lg font-semibold text-sky-300">Practice</h4>
                  <p className="text-xs text-white/60 mt-1">No time limit</p>
                  <p className="text-xs text-sky-300/60 mt-2">AI explanations included</p>
                </div>
                <div className="text-sm font-semibold text-white group-hover:text-sky-300 transition">
                  Start Practice
                </div>
              </button>
            </div>
          </div>
        ) : (
          // Quiz Mode
          <div className="space-y-3 sm:space-y-4">
            {connectionLost && (
              <div className={`rounded-2xl border px-4 py-3 text-sm ${
                offlineTimeoutWarning
                  ? 'border-red-400/20 bg-red-500/10 text-red-300'
                  : 'border-orange-400/20 bg-orange-500/10 text-orange-300'
              }`}>
                <p className="font-semibold mb-2">
                  {offlineTimeoutWarning ? '⏰ Reconnect Soon' : '�� Offline Mode'}
                </p>
                <div className="space-y-1 text-xs">
                  <p>
                    {offlineTimeoutWarning
                      ? '1 minute remaining to reconnect before quiz auto-submits'
                      : 'You have 5 minutes to reconnect. Quiz will auto-submit if still offline.'}
                  </p>
                  <p className="text-xs opacity-80">
                    Time offline: {offlineElapsedSeconds}s
                  </p>
                  <p className="text-xs opacity-80">⚠️ Do not navigate away while offline or your quiz will auto-submit when you reconnect.</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-indigo-300">Question {currentQuestion.number}</span>
              {quizDifficulty !== 'practice' && (
                <div className={`text-sm font-semibold px-3 py-1 rounded-full ${quizTimer <= 3 ? 'bg-red-500/20 text-red-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                  ⏱ {quizTimer}s
                </div>
              )}
              {quizDifficulty === 'practice' && (
                <span className="text-xs font-semibold text-sky-300 px-3 py-1 rounded-full bg-sky-500/20">
                  📚 Practice Mode
                </span>
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white leading-relaxed">{currentQuestion.question}</p>
            </div>

            <div className="space-y-2 sm:space-y-2">
              {currentQuestion.choices.map((choice, idx) => {
                const choiceLetter = choice.charAt(0);
                const isSelected = selectedAnswer === choiceLetter;
                const isCorrectChoice = choiceLetter === currentQuestion.correct_answer;

                let bgColor = 'bg-white/5 border-white/20';
                let textColor = 'text-white';

                if (showAnswers) {
                  if (isCorrectChoice) {
                    bgColor = 'bg-emerald-500/20 border-emerald-400/50';
                    textColor = 'text-emerald-300';
                  } else if (isSelected && !isCorrect) {
                    bgColor = 'bg-red-500/20 border-red-400/50';
                    textColor = 'text-red-300';
                  }
                } else if (isSelected) {
                  bgColor = 'bg-indigo-500/20 border-indigo-400/50';
                  textColor = 'text-indigo-300';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!showAnswers) {
                        setSelectedAnswers({ ...selectedAnswers, [currentQuestion.number]: choiceLetter });
                      }
                    }}
                    className={`w-full text-left rounded-2xl border px-4 py-3 transition ${bgColor} ${textColor} ${
                      !showAnswers ? 'cursor-pointer hover:border-indigo-400' : ''
                    }`}
                  >
                    <span className="text-sm font-medium">{choice}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              {showAnswers ? (
                <button
                  onClick={() => {
                    if (currentQuestionIndex < questions.length - 1) {
                      setCurrentQuestionIndex(currentQuestionIndex + 1);
                      setShowAnswers(false);
                      if (quizDifficulty !== 'practice') {
                        setQuizTimer(selectedTimerPerQuestion);
                      }
                    } else {
                      submitQuiz();
                    }
                  }}
                  disabled={aiLoading}
                  className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? 'Generating...' : currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
                </button>
              ) : (
                <button
                  onClick={() => setShowAnswers(true)}
                  disabled={!selectedAnswer}
                  className="flex-1 rounded-2xl border border-indigo-400/50 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Show Answer
                </button>
              )}
            </div>

            {showAnswers && (
              <>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    isCorrect
                      ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                      : 'border border-red-400/20 bg-red-500/10 text-red-300'
                  }`}
                >
                  <p className="font-semibold mb-1">
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <p className="text-xs">
                    The correct answer is <span className="font-semibold">{currentQuestion.correct_answer}</span>
                  </p>
                </div>

                {quizDifficulty === 'practice' && (
                  <>
                    {!aiExplanation && !aiError && (
                      <button
                        onClick={fetchAIExplanation}
                        disabled={aiLoading}
                        className="w-full rounded-2xl border border-sky-400/50 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {aiLoading ? 'Generating Explanation...' : '✨ Get AI Explanation'}
                      </button>
                    )}

                    {aiLoading && (
                      <div className="flex items-center justify-center gap-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-6">
                        <div className="flex gap-1">
                          <div className="h-3 w-3 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
                          <div className="h-3 w-3 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="h-3 w-3 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="text-sm font-semibold text-sky-300">Generating explanation...</span>
                      </div>
                    )}

                    {aiExplanation && (
                      <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-4 space-y-3">
                        <p className="text-xs font-semibold text-sky-300">📚 AI Explanation</p>
                        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{aiExplanation}</p>
                        <button
                          onClick={() => setAiExplanation(null)}
                          className="text-xs font-semibold text-sky-300 hover:text-sky-200 transition"
                        >
                          Clear Explanation
                        </button>
                      </div>
                    )}

                    {aiError && (
                      <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-3">
                        <p className="text-xs font-semibold text-orange-300 mb-1">⚠️ Generation Failed</p>
                        <p className="text-xs text-orange-200/80">{aiError}</p>
                        <button
                          onClick={() => {
                            setAiError(null);
                            setAiExplanation(null);
                          }}
                          className="mt-2 text-xs font-semibold text-orange-300 hover:text-orange-200 transition"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
