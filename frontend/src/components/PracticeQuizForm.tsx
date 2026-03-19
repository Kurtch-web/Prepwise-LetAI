import { useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';

interface Question {
  question_text: string;
  choices: string[];
  correct_answer: string;
}

interface PracticeQuizFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORY_OPTIONS = [
  'General Education',
  'Professional Education',
  'Science',
  'Mathematics',
  'English',
  'History',
  'Social Studies',
  'Arts',
  'Technology',
  'Health',
  'Other'
];

export default function PracticeQuizForm({ onSuccess, onCancel }: PracticeQuizFormProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General Education');
  const [customCategory, setCustomCategory] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    { question_text: '', choices: ['', '', '', ''], correct_answer: 'A' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Quiz title is required');
      return;
    }

    let finalCategory = category;
    if (category === 'Other') {
      if (!customCategory.trim()) {
        setError('Please enter a custom category');
        return;
      }
      finalCategory = customCategory.trim();
    }

    const validQuestions = questions.filter(q => q.question_text.trim());
    if (validQuestions.length === 0) {
      setError('At least one question is required');
      return;
    }

    const questionsToSubmit = validQuestions.map(q => ({
      question_text: q.question_text,
      choices: q.choices.filter(c => c.trim()),
      correct_answer: q.correct_answer
    }));

    setIsLoading(true);

    try {
      const response = await fetch('/api/practice-quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category: finalCategory,
          time_limit_minutes: timeLimit,
          questions: questionsToSubmit
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create quiz');
      }

      setTitle('');
      setDescription('');
      setCategory('General Education');
      setCustomCategory('');
      setTimeLimit(null);
      setQuestions([{ question_text: '', choices: ['', '', '', ''], correct_answer: 'A' }]);

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-6 space-y-6 ${
      isLightMode
        ? 'bg-white border-slate-200'
        : 'bg-slate-800/40 border-slate-700'
    }`}>
      <button
        onClick={onCancel}
        className={`mb-4 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${
          isLightMode
            ? 'text-rose-600 hover:text-rose-700'
            : 'text-rose-400 hover:text-rose-300'
        }`}
      >
        ← Back
      </button>

      <h4 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
        ✏️ Create Practice Quiz
      </h4>

      {error && (
        <div className={`rounded-2xl border p-4 ${
          isLightMode
            ? 'border-red-300 bg-red-50 text-red-700'
            : 'border-red-500/30 bg-red-900/20 text-red-300'
        }`}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="e.g., Biology Chapter 5 Practice Test"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-2 rounded-lg border transition ${
                isLightMode
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500 focus:bg-white'
                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-rose-500 focus:bg-slate-900/40'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Description
            </label>
            <textarea
              placeholder="Optional description for your practice quiz"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-2 rounded-lg border transition ${
                isLightMode
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500 focus:bg-white'
                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-rose-500 focus:bg-slate-900/40'
              } focus:outline-none`}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== 'Other') {
                    setCustomCategory('');
                  }
                }}
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500 focus:bg-white'
                    : 'bg-slate-900/20 border-slate-600 text-white focus:border-rose-500 focus:bg-slate-900/40'
                } focus:outline-none`}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Time Limit (minutes)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g., 30"
                value={timeLimit || ''}
                onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500 focus:bg-white'
                    : 'bg-slate-900/20 border-slate-600 text-white focus:border-rose-500 focus:bg-slate-900/40'
                } focus:outline-none`}
              />
            </div>
          </div>

          {category === 'Other' && (
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Custom Category *
              </label>
              <input
                type="text"
                placeholder="Enter your custom category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500 focus:bg-white'
                    : 'bg-slate-900/20 border-slate-600 text-white focus:border-rose-500 focus:bg-slate-900/40'
                } focus:outline-none`}
              />
            </div>
          )}
        </div>

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
                  disabled={isLoading}
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
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500 focus:bg-white'
                    : 'bg-slate-900/20 border-slate-600 text-white focus:border-rose-500 focus:bg-slate-900/40'
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
                    disabled={isLoading}
                    className={`flex-1 px-4 py-2 rounded-lg border transition ${
                      isLightMode
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500 focus:bg-white'
                        : 'bg-slate-900/20 border-slate-600 text-white focus:border-rose-500 focus:bg-slate-900/40'
                    } focus:outline-none`}
                  />
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
                    question.correct_answer === String.fromCharCode(65 + cIdx)
                      ? isLightMode
                        ? 'bg-green-100'
                        : 'bg-green-900/30'
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
                      disabled={isLoading}
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

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleAddQuestion}
            disabled={isLoading}
            className={`w-full px-6 py-3 rounded-xl font-semibold transition ${
              isLightMode
                ? 'bg-slate-300 text-slate-900 hover:bg-slate-400'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            ➕ Add Question
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-6 py-3 rounded-xl font-semibold transition ${
              isLightMode
                ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Creating...' : '✓ Create Practice Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
}
