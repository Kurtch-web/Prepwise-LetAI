import { useState, useEffect } from 'react';
import quizService from '../services/quizService';
import { useTheme } from '../providers/ThemeProvider';

interface EditQuizModalProps {
  isOpen: boolean;
  quizId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Question {
  question_text: string;
  choices: string[];
  correct_answer: string;
}

export function EditQuizModal({ isOpen, quizId, onClose, onSuccess }: EditQuizModalProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (isOpen && quizId) {
      loadQuizDetails();
    }
  }, [isOpen, quizId]);

  const loadQuizDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await quizService.getQuizDetails(quizId);
      setQuizTitle(response.title);
      setQuizDescription(response.description || '');
      setTimeLimitMinutes(response.time_limit_minutes || null);

      // Format questions for editing
      const formattedQuestions = response.questions.map((q: any) => ({
        question_text: q.question_text,
        choices: q.choices,
        correct_answer: q.correct_answer || 'A' // Use correct_answer from API or default to 'A'
      }));
      setQuestions(formattedQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!quizTitle.trim()) {
        throw new Error('Quiz title is required');
      }

      const validQuestions = questions.filter(q => q.question_text.trim());
      if (validQuestions.length === 0) {
        throw new Error('At least one question is required');
      }

      const questionsToSubmit = validQuestions.map(q => ({
        question_text: q.question_text,
        choices: q.choices.filter(c => c.trim()),
        correct_answer: q.correct_answer
      }));

      await quizService.updateQuiz(
        quizId,
        quizTitle,
        quizDescription || null,
        questionsToSubmit,
        timeLimitMinutes
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { question_text: '', choices: ['', '', '', ''], correct_answer: 'A' }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== idx));
    }
  };

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    const updated = [...questions];
    if (field.startsWith('choice-')) {
      const choiceIdx = parseInt(field.split('-')[1]);
      updated[idx].choices[choiceIdx] = value;
    } else if (field === 'question_text') {
      updated[idx].question_text = value;
    } else if (field === 'correct_answer') {
      updated[idx].correct_answer = value;
    }
    setQuestions(updated);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
      isLightMode ? 'bg-black/30' : 'bg-black/60'
    }`}>
      <div className={`rounded-3xl border w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 ${
        isLightMode
          ? 'border-emerald-200 bg-white'
          : 'border-emerald-500/20 bg-[#064e3b]'
      }`}>
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                ✏️ Edit Quiz
              </h1>
              <p className={`mt-2 ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                View and edit your quiz questions and settings
              </p>
            </div>
            <button
              onClick={onClose}
              className={`flex-shrink-0 text-2xl transition ${
                isLightMode
                  ? 'text-slate-400 hover:text-slate-600'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className={`rounded-2xl border p-12 text-center ${
              isLightMode
                ? 'border-slate-200 bg-slate-50'
                : 'border-white/10 bg-white/5'
            }`}>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
              <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                Loading quiz details...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className={`rounded-2xl border p-4 ${
                  isLightMode
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-red-500/30 bg-red-900/20 text-red-300'
                }`}>
                  ❌ {error}
                </div>
              )}

              <form onSubmit={handleSaveQuiz} className="space-y-6">
                {/* Quiz Settings */}
                <div className={`rounded-2xl border p-6 space-y-4 ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-900/20 border-slate-700'
                }`}>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      Quiz Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., LET Review 2024"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border transition ${
                        isLightMode
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                          : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-900/40'
                      } focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      Description
                    </label>
                    <textarea
                      placeholder="Optional description for your quiz"
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border transition ${
                        isLightMode
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                          : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-900/40'
                      } focus:outline-none`}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g., 30"
                      value={timeLimitMinutes || ''}
                      onChange={(e) => setTimeLimitMinutes(e.target.value ? parseInt(e.target.value) : null)}
                      className={`w-full px-4 py-2 rounded-lg border transition ${
                        isLightMode
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                          : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-900/40'
                      } focus:outline-none`}
                    />
                  </div>
                </div>

                {/* Questions */}
                {questions.map((question, qIdx) => (
                  <div
                    key={qIdx}
                    className={`rounded-2xl border p-6 space-y-4 ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-900/20 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        Question {qIdx + 1}
                      </h5>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                            isLightMode
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                          }`}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <textarea
                        placeholder="Enter your question"
                        value={question.question_text}
                        onChange={(e) => handleQuestionChange(qIdx, 'question_text', e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border transition ${
                          isLightMode
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                            : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-900/40'
                        } focus:outline-none`}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        Choices
                      </label>
                      {question.choices.map((choice, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Choice ${String.fromCharCode(65 + cIdx)}`}
                            value={choice}
                            onChange={(e) => handleQuestionChange(qIdx, `choice-${cIdx}`, e.target.value)}
                            className={`flex-1 px-4 py-2 rounded-lg border transition ${
                              isLightMode
                                ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                                : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-900/40'
                            } focus:outline-none`}
                          />
                          <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
                            question.correct_answer === String.fromCharCode(65 + cIdx)
                              ? isLightMode
                                ? 'bg-emerald-100'
                                : 'bg-emerald-900/30'
                              : isLightMode
                              ? 'hover:bg-slate-200'
                              : 'hover:bg-slate-900/30'
                          }`}>
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              value={String.fromCharCode(65 + cIdx)}
                              checked={question.correct_answer === String.fromCharCode(65 + cIdx)}
                              onChange={(e) => handleQuestionChange(qIdx, 'correct_answer', e.target.value)}
                              className="w-4 h-4"
                            />
                            <span className={`text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                              Correct
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t" style={{
                  borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'
                }}>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition ${
                      isLightMode
                        ? 'bg-slate-300 text-slate-900 hover:bg-slate-400'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    ➕ Add Question
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`px-6 py-3 rounded-xl font-semibold transition ${
                        isLightMode
                          ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className={`px-6 py-3 rounded-xl font-semibold transition ${
                        isLightMode
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {saving ? 'Saving...' : '✓ Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
