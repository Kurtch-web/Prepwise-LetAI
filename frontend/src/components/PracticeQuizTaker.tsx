import { useState, useEffect } from 'react';
import practiceQuizzesService from '../services/practiceQuizzesService';

interface Question {
  id: string;
  question_text: string;
  choices: string[];
  order: number;
}

interface QuizDetails {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  time_limit_minutes?: number;
  total_questions: number;
  questions: Question[];
}

interface PracticeQuizTakerProps {
  quizId: string;
  onBack: () => void;
  onComplete?: () => void;
}

export default function PracticeQuizTaker({ quizId, onBack, onComplete }: PracticeQuizTakerProps) {
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);


  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    setIsLoading(true);
    try {
      const data = await practiceQuizzesService.getPracticeQuiz(quizId);
      setQuiz(data);

      // Start session
      const sessionData = await practiceQuizzesService.startSession(quizId);
      setSessionId(sessionData.session_id);

      if (data.time_limit_minutes) {
        setTimeRemaining(data.time_limit_minutes * 60);
      }

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0 || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev && prev <= 1) {
          submitQuiz();
          return 0;
        }
        return (prev || 0) - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = async (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });

    if (sessionId) {
      try {
        await practiceQuizzesService.submitAnswer(sessionId, questionId, answer);
      } catch (err) {
        console.error('Failed to save answer:', err);
      }
    }
  };

  const submitQuiz = async () => {
    if (!sessionId || isSubmitting) return;

    // Close the test tab immediately without waiting for backend
    onBack();

    // Submit quiz in the background (don't wait for response)
    practiceQuizzesService.submitQuiz(sessionId).catch(err => {
      console.error('Failed to submit quiz:', err);
    });
  };

  if (isLoading) {
    return (
      <div className="quiz-taker-container">
        <p className="loading-text">Loading quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-taker-container">
        <p className="error-message">{error || 'Failed to load quiz'}</p>
        <button onClick={onBack} className="btn-back">
          ← Back
        </button>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="quiz-results-container">
        <div className="results-card">
          <h2 className="results-title">Quiz Complete! 🎉</h2>

          <div className="score-display">
            <div className="score-circle">
              <div className="score-value">{results.score}%</div>
              <div className="score-label">Your Score</div>
            </div>

            <div className="score-details">
              <p className="detail-item">Correct: {results.correct} / {results.total}</p>
              <p className="detail-item">Started: {new Date(results.started_at).toLocaleTimeString()}</p>
              <p className="detail-item">Completed: {new Date(results.completed_at).toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="questions-review">
            <h3 className="review-title">Review Your Answers</h3>
            {results.questions.map((q: any) => (
              <div key={q.question_id} className={`review-item ${q.is_correct ? 'correct' : 'incorrect'}`}>
                <div className="review-header">
                  <span className="review-status">{q.is_correct ? '✓' : '✗'}</span>
                  <span className="review-question">{q.question_text}</span>
                </div>
                <div className="review-choices">
                  {q.choices.map((choice: string, idx: number) => {
                    const answerKey = String.fromCharCode(65 + idx);
                    const isYourAnswer = q.your_answer === answerKey;
                    const isCorrectAnswer = q.correct_answer === answerKey;

                    return (
                      <div
                        key={idx}
                        className={`choice-item ${
                          isYourAnswer && isCorrectAnswer ? 'selected-correct' :
                          isYourAnswer && !isCorrectAnswer ? 'selected-incorrect' :
                          isCorrectAnswer ? 'correct-only' : ''
                        }`}
                      >
                        <span className="choice-letter">{answerKey}.</span>
                        <span className="choice-text">{choice}</span>
                        {isYourAnswer && <span className="choice-mark">← Your answer</span>}
                        {isCorrectAnswer && !isYourAnswer && <span className="choice-mark">✓ Correct</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="review-answer-summary">
                  <p>Your answer: <strong>{q.your_answer || 'No answer'}</strong></p>
                  <p>Correct answer: <strong>{q.correct_answer}</strong></p>
                </div>
              </div>
            ))}
          </div>

          <div className="results-actions">
            <button onClick={onComplete} className="btn btn-primary">
              Done
            </button>
            <button onClick={onBack} className="btn btn-secondary">
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="quiz-taker-container">
      <div className="quiz-header">
        <div className="quiz-info">
          <h2 className="quiz-title">{quiz.title}</h2>
          <p className="quiz-meta">{quiz.category} • {quiz.difficulty}</p>
        </div>

        <div className="quiz-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.total_questions) * 100}%` }}
            />
          </div>
          <p className="progress-text">
            Question {currentQuestionIndex + 1} of {quiz.total_questions}
          </p>
        </div>

        {timeRemaining !== null && (
          <div className={`timer ${timeRemaining < 60 ? 'warning' : ''}`}>
            ⏱ {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="question-container">
        <div className="question-card">
          <h3 className="question-text">{currentQuestion.question_text}</h3>

          <div className="choices-grid">
            {currentQuestion.choices.map((choice, idx) => {
              const answerKey = String.fromCharCode(65 + idx);
              const isSelected = answers[currentQuestion.id] === answerKey;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(currentQuestion.id, answerKey)}
                  className={`choice-button ${isSelected ? 'selected' : ''}`}
                >
                  <span className="choice-letter">{answerKey}</span>
                  <span className="choice-text">{choice}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="quiz-navigation">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="btn btn-nav"
        >
          ← Previous
        </button>

        {isLastQuestion ? (
          <button onClick={submitQuiz} disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className="btn btn-nav"
          >
            Next →
          </button>
        )}
      </div>

      <style>{`
        .quiz-taker-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
        }

        .loading-text {
          text-align: center;
          color: #666;
          padding: 40px;
        }

        .error-message {
          padding: 12px;
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 6px;
          color: #c33;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .quiz-header {
          margin-bottom: 24px;
        }

        .quiz-info {
          margin-bottom: 16px;
        }

        .quiz-title {
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: 700;
          color: #333;
        }

        .quiz-meta {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        .quiz-progress {
          margin-bottom: 12px;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background-color: #eee;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background-color: #4f46e5;
          transition: width 0.3s ease;
        }

        .progress-text {
          margin: 0;
          font-size: 12px;
          color: #666;
        }

        .timer {
          display: inline-block;
          padding: 8px 12px;
          background-color: #f0f0f0;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .timer.warning {
          background-color: #fee;
          color: #c33;
        }

        .question-container {
          margin-bottom: 24px;
        }

        .question-card {
          background: white;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 24px;
        }

        .question-text {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .choices-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .choice-button {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .choice-button:hover {
          border-color: #4f46e5;
          background-color: #f9f9f9;
        }

        .choice-button.selected {
          border-color: #4f46e5;
          background-color: #f0f9ff;
        }

        .choice-letter {
          min-width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background-color: #f0f0f0;
          font-weight: 600;
          color: #666;
        }

        .choice-button.selected .choice-letter {
          background-color: #4f46e5;
          color: white;
        }

        .choice-text {
          flex: 1;
          font-size: 14px;
          color: #333;
        }

        .quiz-navigation {
          display: flex;
          gap: 12px;
          justify-content: space-between;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-nav {
          background-color: #e5e7eb;
          color: #333;
          flex: 1;
        }

        .btn-nav:hover:not(:disabled) {
          background-color: #d1d5db;
        }

        .btn-nav:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #4f46e5;
          color: white;
          flex: 1;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #4338ca;
        }

        .btn-primary:disabled {
          background-color: #d1d5db;
          cursor: not-allowed;
        }

        .btn-back {
          padding: 10px 16px;
          background-color: #e5e7eb;
          color: #333;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-back:hover {
          background-color: #d1d5db;
        }

        .quiz-results-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
        }

        .results-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .results-title {
          text-align: center;
          margin: 0 0 24px 0;
          font-size: 28px;
          font-weight: 700;
          color: #333;
        }

        .score-display {
          text-align: center;
          margin-bottom: 32px;
          padding: 24px;
          background-color: #f9f9f9;
          border-radius: 8px;
        }

        .score-circle {
          display: inline-block;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 16px;
        }

        .score-value {
          font-size: 48px;
          font-weight: 700;
        }

        .score-label {
          font-size: 12px;
          opacity: 0.9;
        }

        .score-details {
          font-size: 14px;
          color: #666;
        }

        .detail-item {
          margin: 6px 0;
        }

        .questions-review {
          margin: 32px 0;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .review-title {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .review-item {
          margin-bottom: 12px;
          padding: 12px;
          border: 1px solid #eee;
          border-radius: 6px;
        }

        .review-item.correct {
          border-color: #dcfce7;
          background-color: #f0fdf4;
        }

        .review-item.incorrect {
          border-color: #fee;
          background-color: #fef2f2;
        }

        .review-header {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
        }

        .review-status {
          font-weight: 700;
          font-size: 16px;
          min-width: 24px;
        }

        .review-item.correct .review-status {
          color: #16a34a;
        }

        .review-item.incorrect .review-status {
          color: #dc2626;
        }

        .review-question {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .review-answers {
          margin-top: 8px;
          font-size: 13px;
        }

        .answer-item {
          margin: 4px 0;
        }

        .your-answer {
          color: #666;
        }

        .correct-answer {
          color: #16a34a;
          font-weight: 500;
        }

        .results-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .results-actions .btn {
          flex: 1;
        }

        .btn-secondary {
          background-color: #e5e7eb;
          color: #333;
        }

        .btn-secondary:hover {
          background-color: #d1d5db;
        }
      `}</style>
    </div>
  );
}
