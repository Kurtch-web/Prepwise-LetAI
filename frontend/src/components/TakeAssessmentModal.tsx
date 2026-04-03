import { useState } from 'react';
import { api, type AssessmentItem } from '../services/api';
import { useTheme } from '../providers/ThemeProvider';

interface AssessmentQuestion {
  title: string;
  description: string;
  choices: string[];
}

interface AssessmentTemplate {
  id: string;
  name: string;
  description?: string;
  questions: AssessmentQuestion[];
}

interface TakeAssessmentModalProps {
  assessment: AssessmentTemplate;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TakeAssessmentModal({ assessment, onClose, onSuccess }: TakeAssessmentModalProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAssessment, setSubmittedAssessment] = useState<AssessmentItem | null>(null);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setResponses({
      ...responses,
      [`q${questionIndex}`]: answer
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if all questions are answered
    const answeredQuestions = Object.keys(responses).length;
    if (answeredQuestions !== assessment.questions.length) {
      setError(`Please answer all questions before submitting (${answeredQuestions}/${assessment.questions.length} answered)`);
      return;
    }

    try {
      setLoading(true);
      const result = await api.createAssessment(assessment.id, responses);
      setSubmittedAssessment(result);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
      console.error('Failed to submit assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
        isLightMode ? 'bg-black/30' : 'bg-black/60'
      }`}>
        <div className={`rounded-3xl border max-w-md mx-4 p-8 ${
          isLightMode
            ? 'border-emerald-200 bg-white'
            : 'border-emerald-500/20 bg-[#064e3b]'
        }`}>
          <div className="mb-6 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className={`text-2xl font-bold ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>
              Assessment Submitted!
            </h2>
          </div>

          <p className={`mb-6 text-center ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
            Your responses have been recorded successfully.
          </p>

          {submittedAssessment && (
            <div className={`rounded-2xl border p-4 mb-6 ${
              isLightMode
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-emerald-500/20 bg-emerald-900/10'
            }`}>
              <p className={`text-xs uppercase tracking-wide mb-2 ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>
                Primary Learning Method
              </p>
              <p className={`text-lg font-semibold ${isLightMode ? 'text-emerald-900' : 'text-emerald-100'}`}>
                {submittedAssessment.recommendations.primary_method}
              </p>
            </div>
          )}

          <div className={`rounded-2xl border p-4 mb-6 ${
            isLightMode
              ? 'border-blue-200 bg-blue-50'
              : 'border-blue-500/20 bg-blue-900/20'
          }`}>
            <p className={`text-sm ${isLightMode ? 'text-blue-700' : 'text-blue-300'}`}>
              💡 You can view your submitted answers and retake this assessment at any time.
            </p>
          </div>

          <button
            onClick={() => {
              onSuccess?.();
              onClose();
            }}
            className={`w-full px-6 py-3 rounded-xl font-semibold transition ${
              isLightMode
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const isAllAnswered = Object.keys(responses).length === assessment.questions.length;

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
                {assessment.name}
              </h1>
              {assessment.description && (
                <p className={`${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                  {assessment.description}
                </p>
              )}
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

          {/* Progress */}
          <div className={`rounded-2xl border p-4 ${
            isLightMode
              ? 'border-slate-200 bg-slate-50'
              : 'border-white/10 bg-white/5'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Progress
              </p>
              <p className={`text-sm font-semibold ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
                {Object.keys(responses).length} of {assessment.questions.length} answered
              </p>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${
              isLightMode ? 'bg-slate-200' : 'bg-slate-700'
            }`}>
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(Object.keys(responses).length / assessment.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <h2 className={`text-xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Questions ({assessment.questions.length})
            </h2>
            <div className="space-y-6">
              {assessment.questions.map((question, qIdx) => (
                <div
                  key={qIdx}
                  className={`rounded-2xl border p-6 ${
                    isLightMode
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="mb-4">
                    <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      Q{qIdx + 1}: {question.title}
                    </h3>
                    {question.description && (
                      <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        {question.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {question.choices.map((choice, cIdx) => {
                      const questionKey = `q${qIdx}`;
                      const choiceIndex = String.fromCharCode(65 + cIdx);
                      const isSelected = responses[questionKey] === choiceIndex;

                      return (
                        <label
                          key={cIdx}
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? isLightMode
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-emerald-500 bg-emerald-500/20'
                              : isLightMode
                              ? 'border-slate-300 bg-white hover:border-emerald-400'
                              : 'border-slate-600 bg-slate-900/20 hover:border-emerald-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${qIdx}`}
                            value={choiceIndex}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(qIdx, choiceIndex)}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <div>
                            <span className={`font-semibold ${
                              isLightMode ? 'text-slate-900' : 'text-white'
                            }`}>
                              {choiceIndex}.
                            </span>
                            {' '}
                            <span className={`${
                              isLightMode ? 'text-slate-700' : 'text-white/80'
                            }`}>
                              {choice}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {!responses[`q${qIdx}`] && (
                    <p className={`mt-3 text-sm ${isLightMode ? 'text-amber-700' : 'text-amber-400'}`}>
                      ⚠️ This question requires an answer
                    </p>
                  )}
                </div>
              ))}
            </div>
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
              disabled={loading || !isAllAnswered}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                isAllAnswered && !loading
                  ? isLightMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : isLightMode
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Submitting...' : '✓ Submit Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
