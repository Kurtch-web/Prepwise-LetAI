import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import questionsService, { QuestionData } from '../services/questionsService';

export function QuestionsDisplay() {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    loadQuestions();
    loadCategories();
  }, [selectedCategory]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await questionsService.listQuestions(
        selectedCategory !== 'all' ? selectedCategory : undefined
      );
      setQuestions(response.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await questionsService.getCategories();
      setCategories(response.categories);
    } catch (err) {
      // Fallback to defaults
      setCategories(['General Education', 'Professional Education']);
    }
  };

  const handleDownload = async () => {
    setDownloadLoading(true);
    setError(null);
    try {
      const response = await questionsService.downloadQuestions(
        selectedCategory !== 'all' ? selectedCategory : undefined
      );

      // Create JSON file
      const jsonString = JSON.stringify(response.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `questions-${selectedCategory}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download questions');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="space-y-4">
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📚 Questions Bank
          </h2>
          <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Browse and download questions for studying
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Filter by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-4 py-2 rounded-lg border transition ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white'
                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-blue-500 focus:bg-slate-900/40'
              } focus:outline-none`}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloadLoading || questions.length === 0}
            className={`px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
              isLightMode
                ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {downloadLoading ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Downloading...
              </>
            ) : (
              <>
                📥 Download Questions
              </>
            )}
          </button>
        </div>
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
      <div className="space-y-6">
        {loading ? (
          <div className={`rounded-2xl border p-12 ${
            isLightMode ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-900/40'
          }`}>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className={`rounded-2xl border p-12 text-center ${
            isLightMode ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-900/40'
          }`}>
            <p className={`text-lg mb-2 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              📭 No questions available
            </p>
            <p className={isLightMode ? 'text-slate-500' : 'text-slate-500'}>
              Try selecting a different category
            </p>
          </div>
        ) : (
          Object.entries(
            questions.reduce((acc, q) => {
              const folder = q.batch_name || 'General Batch';
              if (!acc[folder]) acc[folder] = [];
              acc[folder].push(q);
              return acc;
            }, {} as Record<string, QuestionData[]>)
          ).map(([folder, folderQuestions]) => (
            <div
              key={folder}
              className={`rounded-2xl border overflow-hidden ${
                isLightMode ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-900/40'
              }`}
            >
              <div className={`p-4 border-b flex items-center justify-between ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <h3 className={`text-xl font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  📁 {folder}
                </h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  isLightMode ? 'bg-slate-200 text-slate-600' : 'bg-slate-700 text-slate-400'
                }`}>
                  {folderQuestions.length} Questions
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid gap-4">
                  {folderQuestions.map((question, idx) => (
                    <div
                      key={question.id}
                      className={`rounded-lg p-4 border ${
                        isLightMode
                          ? 'border-slate-200 bg-slate-50'
                          : 'border-slate-700 bg-slate-800/30'
                      }`}
                    >
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            question.source === 'pdf' || question.source === 'pdf_import'
                              ? isLightMode
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-blue-900/30 text-blue-300'
                              : isLightMode
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-emerald-900/30 text-emerald-300'
                          }`}>
                            {question.source === 'pdf' || question.source === 'pdf_import' ? '📄' : '✏️'} {question.source === 'pdf' || question.source === 'pdf_import' ? 'PDF' : 'Manual'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isLightMode
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {question.category}
                          </span>
                        </div>
                        <h4 className={`font-semibold text-lg mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          {idx + 1}. {question.question_text}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {question.choices.map((choice, choiceIdx) => {
                          const letter = String.fromCharCode(65 + choiceIdx);
                          const isCorrect = letter === question.correct_answer;
                          const cleanChoice = choice.replace(/^[A-D][\.\)]\s*/, '');
                          const explanation = question.choice_explanations?.[letter];
                          return (
                            <div
                              key={choiceIdx}
                              className={`rounded-lg border transition overflow-hidden ${
                                isCorrect
                                  ? isLightMode
                                    ? 'border-green-400 bg-green-50'
                                    : 'border-green-500/40 bg-green-900/20'
                                  : isLightMode
                                  ? 'border-slate-300 bg-slate-50'
                                  : 'border-slate-600 bg-slate-800/20'
                              }`}
                            >
                              {/* Answer Text */}
                              <div className={`p-3 ${
                                isCorrect
                                  ? isLightMode
                                    ? 'bg-green-100'
                                    : 'bg-green-900/30'
                                  : isLightMode
                                  ? 'bg-slate-100'
                                  : 'bg-slate-800/30'
                              }`}>
                                <div className="flex items-start gap-2">
                                  <span className={`font-bold text-base leading-none mt-0.5 ${
                                    isCorrect
                                      ? isLightMode
                                        ? 'text-green-700'
                                        : 'text-green-400'
                                      : isLightMode
                                      ? 'text-slate-600'
                                      : 'text-slate-400'
                                  }`}>
                                    {letter}.
                                  </span>
                                  <div className="flex-1">
                                    <p className={`text-sm font-semibold leading-snug ${
                                      isCorrect
                                        ? isLightMode
                                          ? 'text-green-900'
                                          : 'text-green-100'
                                        : isLightMode
                                        ? 'text-slate-900'
                                        : 'text-slate-200'
                                    }`}>
                                      {cleanChoice}
                                    </p>
                                    {isCorrect && (
                                      <span className={`text-xs font-semibold inline-block mt-1 px-2 py-0.5 rounded ${
                                        isLightMode
                                          ? 'bg-green-200 text-green-700'
                                          : 'bg-green-600 text-green-100'
                                      }`}>
                                        ✓ Correct Answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Explanation */}
                              {explanation && (
                                <div className={`px-3 py-2 border-t ${
                                  isCorrect
                                    ? isLightMode
                                      ? 'border-green-300'
                                      : 'border-green-500/30'
                                    : isLightMode
                                    ? 'border-slate-300'
                                    : 'border-slate-600'
                                } ${
                                  isCorrect
                                    ? isLightMode
                                      ? 'text-green-700'
                                      : 'text-green-300'
                                    : isLightMode
                                    ? 'text-slate-700'
                                    : 'text-slate-300'
                                }`}>
                                  <p className="text-sm leading-relaxed">
                                    {!isCorrect && <span className="font-semibold block mb-1">❌ Why this is wrong:</span>}
                                    {isCorrect && <span className="font-semibold block mb-1">✓ Why this is correct:</span>}
                                    {explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
