import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import questionsService, { QuestionData } from '../services/questionsService';

interface AddQuestionFromBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: Array<{ question_text: string; choices: string[]; correct_answer: string }>) => void;
}

export function AddQuestionFromBankModal({ isOpen, onClose, onAddQuestions }: AddQuestionFromBankModalProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [isOpen]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await questionsService.listQuestions();
      setQuestions(response.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleAddQuestions = () => {
    if (selectedQuestions.size === 0) {
      setError('Please select at least one question');
      return;
    }

    const questionsToAdd = questions
      .filter(q => selectedQuestions.has(q.id))
      .map(q => ({
        question_text: q.question_text,
        choices: q.choices,
        correct_answer: q.correct_answer
      }));

    onAddQuestions(questionsToAdd);
    setSelectedQuestions(new Set());
    setSearchTerm('');
  };

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
      isLightMode ? 'bg-black/30' : 'bg-black/60'
    }`}>
      <div className={`rounded-3xl border w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 ${
        isLightMode
          ? 'border-slate-200 bg-white'
          : 'border-slate-700 bg-slate-900/40'
      }`}>
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                📚 Add Questions from Bank
              </h1>
              <p className={`${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                Select questions to add to your quiz. The modal stays open to add multiple questions.
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

          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border transition ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-900/40'
              } focus:outline-none`}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={`rounded-2xl border p-4 ${
              isLightMode
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-red-500/30 bg-red-900/20 text-red-300'
            }`}>
              ❌ {error}
            </div>
          )}

          {/* Questions List */}
          {loading ? (
            <div className={`rounded-2xl border p-12 text-center ${
              isLightMode
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-700 bg-slate-900/20'
            }`}>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
              <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                Loading questions...
              </p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className={`rounded-2xl border p-12 text-center ${
              isLightMode
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-700 bg-slate-900/20'
            }`}>
              <p className={`${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                {questions.length === 0 ? 'No questions in the bank yet' : 'No questions match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`rounded-xl border p-4 cursor-pointer transition ${
                    selectedQuestions.has(question.id)
                      ? isLightMode
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-emerald-500/50 bg-emerald-900/20'
                      : isLightMode
                      ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}
                  onClick={() => toggleQuestionSelection(question.id)}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(question.id)}
                      onChange={() => toggleQuestionSelection(question.id)}
                      className="mt-1 w-5 h-5 accent-emerald-600 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          question.source === 'pdf' || question.source === 'pdf_import'
                            ? isLightMode
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-blue-900/30 text-blue-300'
                            : isLightMode
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-emerald-900/30 text-emerald-300'
                        }`}>
                          {question.source === 'pdf' || question.source === 'pdf_import' ? '📄 PDF' : '✏️ Manual'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isLightMode
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {question.category}
                        </span>
                      </div>
                      <p className={`font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {question.question_text}
                      </p>
                      <div className="space-y-1 text-sm">
                        {question.choices.map((choice, idx) => {
                          const letter = String.fromCharCode(65 + idx);
                          const isCorrect = letter === question.correct_answer;
                          const cleanChoice = choice.replace(/^[A-D][\.\)]\s*/, '');
                          return (
                            <p
                              key={idx}
                              className={isCorrect
                                ? isLightMode
                                  ? 'text-green-700 font-semibold'
                                  : 'text-green-400 font-semibold'
                                : isLightMode
                                ? 'text-slate-600'
                                : 'text-slate-400'
                              }
                            >
                              {isCorrect ? '✓ ' : '  '}{letter}. {cleanChoice}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t" style={{
            borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={handleAddQuestions}
              disabled={selectedQuestions.size === 0 || loading}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              ✓ Add {selectedQuestions.size} Question{selectedQuestions.size !== 1 ? 's' : ''}
            </button>
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
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
