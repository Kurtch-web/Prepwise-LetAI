import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useIsOnline } from '../hooks/useOnlineStatus';
import { getFlashcardDataWithOfflineSupport } from '../services/apiOffline';

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

export function FlashcardView({ flashcardId, token, onBack }: FlashcardViewProps) {
  const [flashcard, setFlashcard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();

  useEffect(() => {
    loadFlashcard();
  }, [flashcardId, token]);

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

  const questions: Question[] = flashcard.parsedData?.questions || [];
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

  return (
    <section className={`${cardShellClasses} space-y-4 sm:space-y-6 mx-4 sm:mx-0`}>
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
        <button
          onClick={onBack}
          className="rounded-2xl border border-white/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white/80 hover:bg-white/5 flex-shrink-0"
        >
          Back
        </button>
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

      <div className="space-y-3 sm:space-y-4">
        <div>
          <span className="text-xs font-semibold text-indigo-300">Question {currentQuestion.number}</span>
          <p className="text-xs sm:text-sm text-white mt-2 leading-relaxed">{currentQuestion.question}</p>
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
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            if (currentQuestionIndex > 0) {
              setCurrentQuestionIndex(currentQuestionIndex - 1);
              setShowAnswers(false);
            }
          }}
          disabled={currentQuestionIndex === 0}
          className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {showAnswers ? (
          <>
            <button
              onClick={() => {
                setShowAnswers(false);
                setSelectedAnswers({});
                setCurrentQuestionIndex(0);
              }}
              className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5"
            >
              Restart
            </button>
            <button
              onClick={() => {
                if (currentQuestionIndex < questions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setShowAnswers(false);
                }
              }}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowAnswers(true)}
              disabled={!selectedAnswer}
              className="flex-1 rounded-2xl border border-indigo-400/50 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedAnswer ? 'Show Answer' : 'Select an answer'}
            </button>
            <button
              onClick={() => {
                if (currentQuestionIndex < questions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setSelectedAnswers({});
                }
              }}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </>
        )}
      </div>

      {showAnswers && (
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
      )}
    </section>
  );
}
