import { useState } from 'react';
import { api } from '../services/api';
import { useTheme } from '../providers/ThemeProvider';

interface AssessmentQuestion {
  title: string;
  description: string;
  choices: string[];
}

interface AssessmentSurveyProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssessmentSurvey({ onClose, onSuccess }: AssessmentSurveyProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [assessmentName, setAssessmentName] = useState('');
  const [assessmentDescription, setAssessmentDescription] = useState('');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([
    { title: '', description: '', choices: ['', '', '', ''] }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleAddQuestion = () => {
    setQuestions([...questions, { title: '', description: '', choices: ['', '', '', ''] }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== idx));
    }
  };

  const handleQuestionChange = (idx: number, field: 'title' | 'description', value: string) => {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  };

  const handleChoiceChange = (qIdx: number, cIdx: number, value: string) => {
    const updated = [...questions];
    updated[qIdx].choices[cIdx] = value;
    setQuestions(updated);
  };

  const handleAddChoice = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].choices.push('');
    setQuestions(updated);
  };

  const handleRemoveChoice = (qIdx: number, cIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].choices.length > 2) {
      updated[qIdx].choices.splice(cIdx, 1);
      setQuestions(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!assessmentName.trim()) {
      setError('Assessment name is required');
      return;
    }

    const validQuestions = questions.filter(q => q.title.trim());
    if (validQuestions.length === 0) {
      setError('At least one question is required');
      return;
    }

    for (const question of validQuestions) {
      const validChoices = question.choices.filter(c => c.trim());
      if (validChoices.length < 2) {
        setError('Each question must have at least 2 choices');
        return;
      }
    }

    setLoading(true);
    try {
      const questionsForApi = validQuestions.map(q => ({
        title: q.title,
        description: q.description,
        choices: q.choices.filter(c => c.trim())
      }));

      await api.createAssessmentTemplate(
        assessmentName,
        assessmentDescription || null,
        questionsForApi
      );

      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
        isLightMode ? 'bg-black/30' : 'bg-black/60'
      }`}>
        <div className={`rounded-3xl border p-12 text-center max-w-md mx-4 ${
          isLightMode
            ? 'border-emerald-200 bg-white'
            : 'border-emerald-500/20 bg-[#064e3b]'
        }`}>
          <div className="mb-6 text-6xl">✓</div>
          <h2 className={`mb-3 text-2xl font-bold ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>
            Assessment Created!
          </h2>
          <p className={`${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
            Your assessment has been created and is now available for users to take.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
      isLightMode ? 'bg-black/30' : 'bg-black/60'
    }`}>
      <div className={`rounded-3xl border w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 ${
        isLightMode
          ? 'border-emerald-200 bg-white'
          : 'border-emerald-500/20 bg-[#064e3b]'
      }`}>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                📋 Create Assessment
              </h1>
              <p className={`${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                Create custom assessment questions for your students
              </p>
            </div>
            <button
              type="button"
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

          {error && (
            <div className={`rounded-2xl border p-4 text-sm ${
              isLightMode
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-red-500/30 bg-red-900/20 text-red-300'
            }`}>
              {error}
            </div>
          )}

          {/* Assessment Basic Info */}
          <div className={`rounded-2xl border p-6 space-y-4 ${
            isLightMode
              ? 'border-slate-200 bg-slate-50'
              : 'border-white/10 bg-white/5'
          }`}>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Assessment Name *
              </label>
              <input
                type="text"
                placeholder="e.g., General Education Fundamentals"
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500'
                } focus:outline-none`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Description (Optional)
              </label>
              <textarea
                placeholder="Describe what this assessment covers"
                value={assessmentDescription}
                onChange={(e) => setAssessmentDescription(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500'
                } focus:outline-none`}
                rows={3}
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <h2 className={`text-xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Questions</h2>
            <div className="space-y-6">
              {questions.map((question, qIdx) => (
                <div
                  key={qIdx}
                  className={`rounded-2xl border p-6 space-y-4 ${
                    isLightMode
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      Question {qIdx + 1}
                    </h3>
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
                    <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      Question Title *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your question"
                      value={question.title}
                      onChange={(e) => handleQuestionChange(qIdx, 'title', e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border transition ${
                        isLightMode
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                          : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500'
                      } focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      Question Details (Optional)
                    </label>
                    <textarea
                      placeholder="Add additional context or explanation"
                      value={question.description}
                      onChange={(e) => handleQuestionChange(qIdx, 'description', e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border transition ${
                        isLightMode
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                          : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500'
                      } focus:outline-none`}
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      Answer Choices *
                    </label>
                    <div className="space-y-2">
                      {question.choices.map((choice, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Choice ${cIdx + 1}`}
                            value={choice}
                            onChange={(e) => handleChoiceChange(qIdx, cIdx, e.target.value)}
                            className={`flex-1 px-4 py-2 rounded-lg border transition ${
                              isLightMode
                                ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                                : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500'
                            } focus:outline-none`}
                          />
                          {question.choices.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChoice(qIdx, cIdx)}
                              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                                isLightMode
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                              }`}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddChoice(qIdx)}
                      className={`mt-3 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        isLightMode
                          ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      + Add Choice
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className={`mt-4 w-full px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-slate-300 text-slate-900 hover:bg-slate-400'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              ➕ Add Question
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t" style={{
            borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'
          }}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loading ? 'Creating...' : '✓ Create Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
