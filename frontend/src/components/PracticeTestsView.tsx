import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { fetchPracticeTestSessions, PracticeTestSession, QuizResult } from '../services/progressService';

interface PracticeTestsViewProps {
  onSelectQuiz?: (quizId: string, quizTitle: string, testType: string, quizResult?: QuizResult) => void;
  onBack: () => void;
}

interface PracticeQuestion {
  id: string;
  subject: 'math' | 'filipino';
  question: string;
  topic: string;
  options: string[];
  correctAnswer: number;
}

export function PracticeTestsView({ onSelectQuiz, onBack }: PracticeTestsViewProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [sessions, setSessions] = useState<Record<string, PracticeTestSession>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTestType, setSelectedTestType] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'test-taken' | 'materials'>('test-taken');
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const testTypeInfo: Record<string, { emoji: string; label: string }> = {
    'diagnostic-test': { emoji: '🔍', label: 'Diagnostic Test' },
    'drills': { emoji: '⚙️', label: 'Drills' },
    'short-quiz': { emoji: '⏱️', label: 'Short Quiz' },
    'preboard': { emoji: '🏆', label: 'Pre-Board' },
    'practice-quiz': { emoji: '📚', label: 'Practice Quiz' }
  };

  const practiceQuestions: PracticeQuestion[] = [
    {
      id: 'math-1',
      subject: 'math',
      topic: 'Algebra',
      question: 'If x + 5 = 12, what is the value of x?',
      options: ['5', '7', '12', '17'],
      correctAnswer: 1
    },
    {
      id: 'math-2',
      subject: 'math',
      topic: 'Geometry',
      question: 'What is the area of a circle with radius 5?',
      options: ['15.7', '31.4', '78.5', '157'],
      correctAnswer: 2
    },
    {
      id: 'filipino-1',
      subject: 'filipino',
      topic: 'Pang-uri',
      question: 'Alin ang pang-uri sa sumusunod na pangungusap: "Ang maliit na bahay ay maroon."',
      options: ['maliit', 'bahay', 'maroon', 'ang'],
      correctAnswer: 0
    }
  ];

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const data = await fetchPracticeTestSessions();
        setSessions(data);
      } catch (error) {
        console.error('Error loading practice test sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Group sessions by test type
  const groupedByTestType: Record<string, PracticeTestSession[]> = {};
  Object.values(sessions).forEach(session => {
    const testType = session.testType || 'diagnostic-test';
    if (!groupedByTestType[testType]) {
      groupedByTestType[testType] = [];
    }
    groupedByTestType[testType].push(session);
  });

  const testTypeOrder = ['diagnostic-test', 'drills', 'short-quiz', 'preboard', 'practice-quiz'];
  const sortedTestTypes = testTypeOrder.filter(type => groupedByTestType[type]);

  if (loading) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${
        isLightMode
          ? 'border-slate-200 bg-white shadow-lg'
          : 'border-slate-700 bg-slate-800/50 shadow-lg'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
        <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
          Loading practice tests...
        </p>
      </div>
    );
  }

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex
    });
  };

  const getMathScore = () => {
    const mathQuestions = practiceQuestions.filter(q => q.subject === 'math');
    const correct = mathQuestions.filter(q => answers[q.id] === q.correctAnswer).length;
    return mathQuestions.length > 0 ? Math.round((correct / mathQuestions.length) * 100) : 0;
  };

  const getFilipinoScore = () => {
    const filipinoQuestions = practiceQuestions.filter(q => q.subject === 'filipino');
    const correct = filipinoQuestions.filter(q => answers[q.id] === q.correctAnswer).length;
    return filipinoQuestions.length > 0 ? Math.round((correct / filipinoQuestions.length) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
          📝 Practice Tests
        </h2>
        <button
          onClick={onBack}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          ← Back
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b" style={{
        borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'
      }}>
        <button
          onClick={() => setActiveTab('test-taken')}
          className={`px-6 py-3 font-semibold text-lg transition-all ${
            activeTab === 'test-taken'
              ? isLightMode
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-emerald-400 border-b-2 border-emerald-400'
              : isLightMode
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tests Taken
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-6 py-3 font-semibold text-lg transition-all ${
            activeTab === 'materials'
              ? isLightMode
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-emerald-400 border-b-2 border-emerald-400'
              : isLightMode
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Materials
        </button>
      </div>

      {/* Tests Taken Tab Content */}
      {activeTab === 'test-taken' && (
        <>
          <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Retake your completed tests for practice. Only you can see your practice attempts.
          </p>

          {sortedTestTypes.length === 0 ? (
            <div className={`rounded-2xl border p-12 text-center ${
              isLightMode
                ? 'border-slate-200 bg-white shadow-lg'
                : 'border-slate-700 bg-slate-800/50 shadow-lg'
            }`}>
              <div className="mb-6 text-6xl">📝</div>
              <h2 className={`text-3xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                No completed tests yet
              </h2>
              <p className={`text-lg max-w-2xl mx-auto mb-6 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Take a test to see it here as a practice test for retakes.
              </p>
              <button
                onClick={() => setActiveTab('materials')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                Try Practice Materials →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedTestTypes.map((testType) => {
              const info = testTypeInfo[testType] || { emoji: '📝', label: testType };
              const testsOfType = groupedByTestType[testType] || [];
              const totalTests = testsOfType.length;
              const totalAttempts = testsOfType.reduce((sum, t) => sum + t.attempts, 0);
              const avgScore = testsOfType.length > 0
                ? testsOfType.reduce((sum, t) => sum + (t.bestScore || 0), 0) / testsOfType.length
                : 0;

              return (
                <button
                  key={testType}
                  onClick={() => {
                    setSelectedTestType(testType);
                    setShowModal(true);
                  }}
                  className={`rounded-2xl border-2 p-6 transition-all hover:shadow-lg text-left ${
                    isLightMode
                      ? 'bg-white border-slate-200 hover:border-emerald-400'
                      : 'bg-slate-800/50 border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  <div className="text-5xl mb-3">{info.emoji}</div>
                  <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {info.label}
                  </h3>
                  <div className="space-y-1">
                    <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      {totalTests} test{totalTests !== 1 ? 's' : ''} available
                    </p>
                    {totalAttempts > 0 && (
                      <>
                        <p className={`text-sm font-semibold ${
                          avgScore >= 80 ? 'text-green-600' :
                          avgScore >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          Best: {avgScore.toFixed(0)}%
                        </p>
                        <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          Ready to practice
                        </p>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          )}
          {showModal && selectedTestType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className={`rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto ${
                isLightMode ? 'bg-white' : 'bg-slate-800'
              }`}>
                <div className={`sticky top-0 border-b p-6 flex items-center justify-between ${
                  isLightMode
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-800 border-slate-700'
                }`}>
                  <h3 className={`text-2xl font-bold flex items-center gap-2 ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    <span className="text-3xl">{testTypeInfo[selectedTestType]?.emoji}</span>
                    {testTypeInfo[selectedTestType]?.label}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className={`text-2xl font-bold ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-3">
                  {(groupedByTestType[selectedTestType] || []).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        // Pass the first (original) session with all its data
                        const originalSession = session.sessions[0];
                        onSelectQuiz?.(session.originalQuizId, session.quizTitle, selectedTestType, originalSession);
                        setShowModal(false);
                      }}
                      className={`w-full rounded-lg border p-4 text-left transition-all ${
                        isLightMode
                          ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-emerald-400'
                          : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className={`font-bold text-lg ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            {session.quizTitle}
                          </p>
                          <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                            {session.attempts === 0
                              ? 'Ready to practice'
                              : `${session.attempts} attempt${session.attempts !== 1 ? 's' : ''} • Best: ${session.bestScore.toFixed(0)}%`}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-semibold transition ${
                          isLightMode
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          Practice →
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Materials Tab Content */}
      {activeTab === 'materials' && (
        <>
          <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Practice with sample questions. Answer them to test your knowledge in different subjects.
          </p>

          {/* Practice Questions */}
          <div className="space-y-6">
            {practiceQuestions.map((question) => (
              <div
                key={question.id}
                className={`rounded-2xl border p-6 ${
                  isLightMode
                    ? 'bg-white border-slate-200 shadow-md'
                    : 'bg-slate-800/50 border-slate-700 shadow-md'
                }`}
              >
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      question.subject === 'math'
                        ? isLightMode
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-blue-500/20 text-blue-300'
                        : isLightMode
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {question.subject === 'math' ? '🔢 Mathematics' : '🇵🇭 Filipino'}
                    </span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      isLightMode
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {question.topic}
                    </span>
                  </div>
                  <h3 className={`text-lg font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {question.question}
                  </h3>
                </div>

                {/* Answer Options */}
                <div className="space-y-2 mb-4">
                  {question.options.map((option, idx) => {
                    const isSelected = answers[question.id] === idx;
                    const isCorrect = idx === question.correctAnswer;
                    const hasAnswered = answers[question.id] !== undefined;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(question.id, idx)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition ${
                          isSelected
                            ? hasAnswered
                              ? isCorrect
                                ? isLightMode
                                  ? 'bg-green-50 border-green-400 text-green-900'
                                  : 'bg-green-500/20 border-green-400 text-green-300'
                                : isLightMode
                                ? 'bg-red-50 border-red-400 text-red-900'
                                : 'bg-red-500/20 border-red-400 text-red-300'
                              : isLightMode
                              ? 'bg-blue-50 border-blue-400 text-blue-900'
                              : 'bg-blue-500/20 border-blue-400 text-blue-300'
                            : isLightMode
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            : 'bg-slate-700/20 border-slate-600 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center font-semibold ${
                            isSelected
                              ? hasAnswered
                                ? isCorrect
                                  ? isLightMode
                                    ? 'bg-green-400 border-green-400 text-white'
                                    : 'bg-green-500 border-green-500 text-white'
                                  : isLightMode
                                  ? 'bg-red-400 border-red-400 text-white'
                                  : 'bg-red-500 border-red-500 text-white'
                                : isLightMode
                                ? 'bg-blue-400 border-blue-400 text-white'
                                : 'bg-blue-500 border-blue-500 text-white'
                              : isLightMode
                              ? 'border-slate-400'
                              : 'border-slate-500'
                          }`}>
                            {isSelected && hasAnswered && isCorrect ? '✓' : String.fromCharCode(65 + idx)}
                          </span>
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {answers[question.id] !== undefined && (
                  <div className={`p-3 rounded-lg text-sm font-semibold ${
                    answers[question.id] === question.correctAnswer
                      ? isLightMode
                        ? 'bg-green-100 text-green-700'
                        : 'bg-green-500/20 text-green-300'
                      : isLightMode
                      ? 'bg-red-100 text-red-700'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {answers[question.id] === question.correctAnswer
                      ? '✓ Correct!'
                      : `✗ Incorrect. The correct answer is: ${question.options[question.correctAnswer]}`}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Score Summary */}
          {Object.keys(answers).length === practiceQuestions.length && (
            <div className={`rounded-2xl border p-6 ${
              isLightMode
                ? 'bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200'
                : 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-700'
            }`}>
              <h3 className={`text-xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                📊 Your Score Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${
                  isLightMode
                    ? 'bg-blue-100'
                    : 'bg-blue-500/20'
                }`}>
                  <p className={`text-sm font-semibold mb-1 ${
                    isLightMode ? 'text-blue-700' : 'text-blue-300'
                  }`}>
                    🔢 Mathematics
                  </p>
                  <p className={`text-3xl font-bold ${
                    getMathScore() >= 80 ? isLightMode ? 'text-green-600' : 'text-green-400' :
                    getMathScore() >= 60 ? isLightMode ? 'text-yellow-600' : 'text-yellow-400' :
                    isLightMode ? 'text-red-600' : 'text-red-400'
                  }`}>
                    {getMathScore()}%
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${
                  isLightMode
                    ? 'bg-purple-100'
                    : 'bg-purple-500/20'
                }`}>
                  <p className={`text-sm font-semibold mb-1 ${
                    isLightMode ? 'text-purple-700' : 'text-purple-300'
                  }`}>
                    🇵🇭 Filipino
                  </p>
                  <p className={`text-3xl font-bold ${
                    getFilipinoScore() >= 80 ? isLightMode ? 'text-green-600' : 'text-green-400' :
                    getFilipinoScore() >= 60 ? isLightMode ? 'text-yellow-600' : 'text-yellow-400' :
                    isLightMode ? 'text-red-600' : 'text-red-400'
                  }`}>
                    {getFilipinoScore()}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
