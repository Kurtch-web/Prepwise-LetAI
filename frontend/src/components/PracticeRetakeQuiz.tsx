import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import quizService, { QuizSession, SessionResults } from '../services/quizService';
import { QuizResult, fetchQuizResultDetails } from '../services/progressService';

interface PracticeRetakeQuizProps {
  quizId: string;
  quizTitle: string;
  testType: string;
  originalQuizData?: QuizResult; // Quiz data from previous attempt
  onBack: () => void;
  onComplete?: () => void;
}

export function PracticeRetakeQuiz({
  quizId,
  quizTitle,
  testType,
  originalQuizData,
  onBack,
  onComplete
}: PracticeRetakeQuizProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (originalQuizData) {
      loadQuiz();
    }
  }, [quizId, originalQuizData]);

  const loadQuiz = async () => {
    setIsLoading(true);
    try {
      if (!originalQuizData) {
        throw new Error('Quiz data not available');
      }

      // Fetch full quiz result details to get complete question data
      const fullDetails = await fetchQuizResultDetails(originalQuizData.sessionId, originalQuizData.type);

      if (!fullDetails || !fullDetails.questions.length) {
        throw new Error('Could not load quiz questions');
      }

      setQuiz(fullDetails);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
      console.error('Quiz load error:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const submitQuiz = async () => {
    if (!quiz || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Calculate score based on correct answers
      let correctCount = 0;
      quiz.questions.forEach((q) => {
        if (answers[q.questionId] === q.correctAnswer) {
          correctCount++;
        }
      });

      const percentage = (correctCount / quiz.total) * 100;
      setScore(percentage);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${
        isLightMode
          ? 'border-slate-200 bg-white shadow-lg'
          : 'border-slate-700 bg-slate-800/50 shadow-lg'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
          Loading quiz...
        </p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className={`rounded-2xl border p-8 text-center ${
        isLightMode
          ? 'border-red-200 bg-red-50'
          : 'border-red-500/30 bg-red-900/20'
      }`}>
        <p className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-red-700' : 'text-red-400'}`}>
          ❌ {error || 'Failed to load quiz'}
        </p>
        <button
          onClick={onBack}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          ← Back
        </button>
      </div>
    );
  }

  if (showResults && quiz) {
    const passed = score >= 70;
    const correctCount = quiz.questions.filter(q => answers[q.questionId] === q.correctAnswer).length;

    return (
      <div className="space-y-6">
        <div className={`rounded-2xl border p-8 text-center space-y-6 ${
          isLightMode
            ? 'bg-white border-emerald-200'
            : 'bg-slate-800/50 border-emerald-500/20'
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
              You scored {correctCount} out of {quiz.total}
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
              {score.toFixed(1)}%
            </div>
            <div className="w-full bg-slate-300 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  passed ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {quiz.questions.length > 0 && (
          <div className={`rounded-2xl border p-6 space-y-4 ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-800/50 border-slate-700'
          }`}>
            <h3 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              📝 Your Answers
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {quiz.questions.map((q, idx) => {
                const isCorrect = answers[q.questionId] === q.correctAnswer;
                return (
                  <div
                    key={q.questionId}
                    className={`rounded-lg p-4 border ${
                      isCorrect
                        ? isLightMode
                          ? 'bg-green-50 border-green-200'
                          : 'bg-green-900/20 border-green-500/30'
                        : isLightMode
                        ? 'bg-red-50 border-red-200'
                        : 'bg-red-900/20 border-red-500/30'
                    }`}
                  >
                    <p className={`font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {idx + 1}. {q.questionText}
                    </p>
                    <p className={`text-sm mb-1 ${isCorrect
                      ? isLightMode ? 'text-green-700' : 'text-green-400'
                      : isLightMode ? 'text-red-700' : 'text-red-400'
                    }`}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </p>
                    <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      Your answer: <strong>{answers[q.questionId] || 'No answer'}</strong> | Correct: <strong>{q.correctAnswer}</strong>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              onComplete?.();
            }}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
              isLightMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            ✓ Done
          </button>
          <button
            onClick={onBack}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
              isLightMode
                ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  // Use full choices if available from the original quiz data
  // Fallback to previous behavior (user answer + correct answer) if full choices missing
  const choicesToDisplay = currentQuestion.choices && currentQuestion.choices.length > 0
    ? currentQuestion.choices
    : Array.from(new Set([currentQuestion.userAnswer, currentQuestion.correctAnswer]));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📚 {quizTitle}
          </h2>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            isLightMode
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-emerald-900/30 text-emerald-300'
          }`}>
            Practice Attempt
          </span>
        </div>
        <div className={`w-full h-2 rounded-full overflow-hidden ${
          isLightMode ? 'bg-slate-200' : 'bg-slate-800'
        }`}>
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.total) * 100}%` }}
          />
        </div>
        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
          Question {currentQuestionIndex + 1} of {quiz.total}
        </p>
      </div>

      {error && (
        <div className={`rounded-lg p-4 border ${
          isLightMode
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-red-900/20 border-red-500/30 text-red-400'
        }`}>
          {error}
        </div>
      )}

      <div className={`rounded-2xl border p-8 space-y-6 ${
        isLightMode
          ? 'bg-white border-slate-200'
          : 'bg-slate-800/50 border-slate-700'
      }`}>
        <h3 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
          {currentQuestion.questionText}
        </h3>

        <div className="space-y-3">
          {choicesToDisplay.map((choice, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = answers[currentQuestion.questionId] === letter;

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(currentQuestion.questionId, letter)}
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

      <div className="flex gap-3">
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

        {isLastQuestion ? (
          <button
            onClick={submitQuiz}
            disabled={isSubmitting}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
              isLightMode
                ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
            }`}
          >
            {isSubmitting ? 'Submitting...' : '✓ Submit Practice'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
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
          Answered: {answeredCount} / {quiz.total}
        </p>
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((q, idx) => (
            <button
              key={q.questionId}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-8 h-8 rounded-lg font-semibold text-sm transition ${
                idx === currentQuestionIndex
                  ? isLightMode
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : answers[q.questionId]
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
  );
}
