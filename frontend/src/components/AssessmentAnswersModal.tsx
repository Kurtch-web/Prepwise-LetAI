import { useTheme } from '../providers/ThemeProvider';
import { AssessmentItem } from '../services/api';

interface AssessmentQuestion {
  title: string;
  description: string;
  choices: string[];
}

interface AssessmentAnswersModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentItem | null;
  template: {
    name: string;
    description?: string;
    questions: AssessmentQuestion[];
  } | null;
}

export function AssessmentAnswersModal({
  isOpen,
  onClose,
  assessment,
  template
}: AssessmentAnswersModalProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  if (!isOpen || !assessment || !template) return null;

  const getAnswerLetter = (choiceIndex: number): string => {
    return String.fromCharCode(65 + choiceIndex);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
      isLightMode ? 'bg-black/30' : 'bg-black/60'
    }`}>
      <div className={`rounded-3xl border w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 ${
        isLightMode
          ? 'border-emerald-200 bg-white'
          : 'border-emerald-500/20 bg-[#064e3b]'
      }`}>
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {template.name}
              </h1>
              {template.description && (
                <p className={`${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                  {template.description}
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

          {/* Info Box */}
          <div className={`rounded-2xl border p-4 ${
            isLightMode
              ? 'border-blue-200 bg-blue-50'
              : 'border-blue-500/20 bg-blue-900/20'
          }`}>
            <p className={`text-sm ${isLightMode ? 'text-blue-700' : 'text-blue-300'}`}>
              📋 Your submitted answers - View only. You cannot edit these answers here. To change your answers, retake the assessment.
            </p>
          </div>

          {/* Submitted Date */}
          <div className={`rounded-2xl border p-4 ${
            isLightMode
              ? 'border-slate-200 bg-slate-50'
              : 'border-white/10 bg-white/5'
          }`}>
            <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              Submitted
            </p>
            <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {new Date(assessment.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Questions with Answers */}
          <div>
            <h2 className={`text-xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Your Answers ({template.questions.length})
            </h2>
            <div className="space-y-6">
              {template.questions.map((question, qIdx) => {
                const questionKey = `q${qIdx}`;
                const userAnswerLetter = assessment.responses[questionKey];
                const userAnswerIndex = userAnswerLetter
                  ? userAnswerLetter.charCodeAt(0) - 65
                  : -1;
                const userAnswer = userAnswerIndex >= 0 && userAnswerIndex < question.choices.length
                  ? question.choices[userAnswerIndex]
                  : null;

                return (
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

                    {/* User's Answer */}
                    {userAnswer ? (
                      <div className={`rounded-xl border-2 p-4 ${
                        isLightMode
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-emerald-500 bg-emerald-500/20'
                      }`}>
                        <p className={`text-sm font-semibold mb-2 ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>
                          Your Answer:
                        </p>
                        <p className={`text-base ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          <span className={`font-semibold ${
                            isLightMode ? 'text-slate-900' : 'text-white'
                          }`}>
                            {userAnswerLetter}.
                          </span>
                          {' '}
                          {userAnswer}
                        </p>
                      </div>
                    ) : (
                      <div className={`rounded-xl border-2 p-4 ${
                        isLightMode
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-amber-500/30 bg-amber-900/20'
                      }`}>
                        <p className={`text-sm ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>
                          ⚠️ Not answered
                        </p>
                      </div>
                    )}

                    {/* All Choices for Reference */}
                    <div className="mt-4 pt-4 border-t" style={{
                      borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'
                    }}>
                      <p className={`text-xs uppercase tracking-wide mb-3 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                        All choices:
                      </p>
                      <div className="space-y-2">
                        {question.choices.map((choice, cIdx) => {
                          const choiceIndex = cIdx;
                          const choiceLetter = getAnswerLetter(choiceIndex);
                          const isUserAnswer = choiceLetter === userAnswerLetter;

                          return (
                            <div
                              key={cIdx}
                              className={`flex items-start gap-3 p-3 rounded-lg ${
                                isUserAnswer
                                  ? isLightMode
                                    ? 'bg-emerald-100'
                                    : 'bg-emerald-500/10'
                                  : isLightMode
                                  ? 'bg-white border border-slate-200'
                                  : 'bg-white/5 border border-slate-700'
                              }`}
                            >
                              <span className={`font-semibold flex-shrink-0 ${
                                isUserAnswer
                                  ? isLightMode
                                    ? 'text-emerald-700'
                                    : 'text-emerald-300'
                                  : isLightMode
                                  ? 'text-slate-600'
                                  : 'text-slate-400'
                              }`}>
                                {choiceLetter}.
                              </span>
                              <span className={`${
                                isUserAnswer
                                  ? isLightMode
                                    ? 'text-emerald-900 font-semibold'
                                    : 'text-emerald-100 font-semibold'
                                  : isLightMode
                                  ? 'text-slate-700'
                                  : 'text-white/80'
                              }`}>
                                {choice}
                              </span>
                              {isUserAnswer && (
                                <span className="ml-auto text-lg">✓</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-6 border-t" style={{
            borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={onClose}
              className={`w-full px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
