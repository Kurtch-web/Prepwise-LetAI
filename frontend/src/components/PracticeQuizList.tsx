import { useEffect, useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';

interface PracticeQuiz {
  id: string;
  title: string;
  description?: string;
  category: string;
  total_questions: number;
  total_attempts?: number;
  average_score?: number;
  creator?: { id: number; username: string };
}

interface PracticeQuizListProps {
  onSelectQuiz?: (quiz: PracticeQuiz) => void;
}

export default function PracticeQuizList({ onSelectQuiz }: PracticeQuizListProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [quizzes, setQuizzes] = useState<PracticeQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchQuizzes();
  }, [selectedCategory]);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/practice-quizzes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch quizzes');

      const data = await response.json();
      setQuizzes(data.quizzes || []);

      // Extract unique categories
      if (!selectedCategory) {
        const uniqueCategories = [...new Set(data.quizzes.map((q: PracticeQuiz) => q.category))];
        setCategories(uniqueCategories as string[]);
      }

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="practice-quiz-list">
        <p className="loading-text">Loading quizzes...</p>
      </div>
    );
  }

  return (
    <div className="practice-quiz-list">
      {categories.length > 0 && (
        <div className="filters-section">
          <div className="filter-group">
            <label>Category:</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">📚 No practice quizzes available</p>
        </div>
      ) : (
        <div className="quizzes-grid">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div>
                <h3 className="quiz-title">{quiz.title}</h3>
              </div>

              {quiz.description && (
                <p className="quiz-description">{quiz.description}</p>
              )}

              <div className="quiz-meta">
                <span className="meta-item">📂 {quiz.category}</span>
                <span className="meta-item">❓ {quiz.total_questions} questions</span>
                {quiz.total_attempts !== undefined && quiz.total_attempts > 0 && (
                  <span className="meta-item">
                    📊 {quiz.total_attempts} attempt{quiz.total_attempts !== 1 ? 's' : ''}
                  </span>
                )}
                {quiz.average_score !== undefined && quiz.average_score !== null && (
                  <span className="meta-item">⭐ Avg: {quiz.average_score}%</span>
                )}
              </div>

              <button
                onClick={() => onSelectQuiz?.(quiz)}
                className="btn-take-quiz"
              >
                Take Quiz →
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .practice-quiz-list {
          width: 100%;
        }

        .filters-section {
          margin-bottom: 24px;
          padding: 16px;
          background-color: ${isLightMode ? '#f9f9f9' : '#1e293b'};
          border-radius: 8px;
          border: 1px solid ${isLightMode ? '#e5e7eb' : '#334155'};
        }

        .filter-group {
          margin-bottom: 16px;
        }

        .filter-group:last-child {
          margin-bottom: 0;
        }

        .filter-group label {
          display: block;
          font-weight: 600;
          font-size: 13px;
          color: ${isLightMode ? '#555' : '#cbd5e1'};
          margin-bottom: 8px;
        }

        .filter-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .filter-btn {
          padding: 6px 12px;
          border: 1px solid ${isLightMode ? '#ddd' : '#475569'};
          border-radius: 20px;
          background-color: ${isLightMode ? 'white' : '#0f172a'};
          color: ${isLightMode ? '#666' : '#94a3b8'};
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          border-color: #4f46e5;
          color: #4f46e5;
        }

        .filter-btn.active {
          background-color: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .error-message {
          padding: 12px;
          background-color: ${isLightMode ? '#fee' : 'rgba(220, 38, 38, 0.1)'};
          border: 1px solid ${isLightMode ? '#fcc' : '#dc2626'};
          border-radius: 6px;
          color: ${isLightMode ? '#c33' : '#fecaca'};
          font-size: 13px;
          margin-bottom: 16px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background-color: ${isLightMode ? '#f9f9f9' : '#1e293b'};
          border-radius: 8px;
          border: 1px solid ${isLightMode ? '#e5e7eb' : '#334155'};
        }

        .empty-text {
          color: ${isLightMode ? '#999' : '#78909c'};
          font-size: 14px;
          margin: 0;
        }

        .loading-text {
          text-align: center;
          color: ${isLightMode ? '#666' : '#94a3b8'};
          padding: 20px;
          margin: 0;
        }

        .quizzes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .quiz-card {
          border: 1px solid ${isLightMode ? '#eee' : '#334155'};
          border-radius: 8px;
          padding: 16px;
          background-color: ${isLightMode ? 'white' : '#1e293b'};
          transition: all 0.2s;
        }

        .quiz-card:hover {
          border-color: #4f46e5;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
        }

        .quiz-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: ${isLightMode ? '#333' : '#e2e8f0'};
          margin-bottom: 8px;
        }

        .quiz-description {
          font-size: 13px;
          color: ${isLightMode ? '#666' : '#cbd5e1'};
          margin: 8px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .quiz-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 12px 0;
          padding: 8px 0;
          border-top: 1px solid ${isLightMode ? '#eee' : '#334155'};
          border-bottom: 1px solid ${isLightMode ? '#eee' : '#334155'};
          font-size: 12px;
          color: ${isLightMode ? '#666' : '#cbd5e1'};
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-take-quiz {
          width: 100%;
          padding: 10px;
          margin-top: 12px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-take-quiz:hover {
          background-color: #4338ca;
        }

        @media (max-width: 768px) {
          .quizzes-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
