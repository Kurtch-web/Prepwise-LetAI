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
  solution: string;
  explanation: string;
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
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [materialsSubject, setMaterialsSubject] = useState<'math' | 'filipino'>('math');

  const testTypeInfo: Record<string, { emoji: string; label: string }> = {
    'diagnostic-test': { emoji: '🔍', label: 'Diagnostic Test' },
    'drills': { emoji: '⚙️', label: 'Drills' },
    'short-quiz': { emoji: '⏱️', label: 'Short Quiz' },
    'preboard': { emoji: '🏆', label: 'Pre-Board' },
    'practice-quiz': { emoji: '📚', label: 'Practice Quiz' }
  };

  const mathTopics = [
    'Arithmetic and Number Theory',
    'Basic and Advanced Algebra',
    'Plane Geometry',
    'Circular and Trigonometric Functions',
    'Probability and Statistics',
    'Analytic Geometry',
    'Business Mathematics',
    'Calculus'
  ];

  const practiceQuestions: PracticeQuestion[] = [
    // Arithmetic and Number Theory
    {
      id: 'math-1',
      subject: 'math',
      topic: 'Arithmetic and Number Theory',
      question: 'Find the GCD (Greatest Common Divisor) of 48 and 36.',
      options: ['6', '8', '12', '24'],
      correctAnswer: 2,
      solution: 'Using the Euclidean algorithm:\n48 = 36 × 1 + 12\n36 = 12 × 3 + 0\nSo GCD(48, 36) = 12',
      explanation: 'The GCD is the largest number that divides both numbers. We use the Euclidean algorithm: divide the larger number by the smaller, then repeat with the remainder until we get 0.'
    },
    {
      id: 'math-2',
      subject: 'math',
      topic: 'Arithmetic and Number Theory',
      question: 'What is the prime factorization of 60?',
      options: ['2 × 3 × 5', '2² × 3 × 5', '2 × 3² × 5', '3 × 4 × 5'],
      correctAnswer: 1,
      solution: '60 = 2 × 30\n30 = 2 × 15\n15 = 3 × 5\nTherefore: 60 = 2² × 3 × 5',
      explanation: 'Prime factorization breaks a number into its prime number factors. We divide by the smallest prime repeatedly until we reach 1.'
    },
    // Basic and Advanced Algebra
    {
      id: 'math-3',
      subject: 'math',
      topic: 'Basic and Advanced Algebra',
      question: 'Solve: 2x + 5 = 15. What is x?',
      options: ['5', '10', '20', '4'],
      correctAnswer: 0,
      solution: '2x + 5 = 15\n2x = 15 - 5\n2x = 10\nx = 10 ÷ 2\nx = 5',
      explanation: 'To solve for x, isolate it by moving constants to one side and coefficients to the other using inverse operations.'
    },
    {
      id: 'math-4',
      subject: 'math',
      topic: 'Basic and Advanced Algebra',
      question: 'Solve: x² - 5x + 6 = 0',
      options: ['x = 2, 3', 'x = 1, 6', 'x = -2, -3', 'x = 5, 0'],
      correctAnswer: 0,
      solution: 'x² - 5x + 6 = 0\nFactor: (x - 2)(x - 3) = 0\nSo x = 2 or x = 3',
      explanation: 'This is a quadratic equation. We factor it into two binomials and set each equal to 0 to find the roots.'
    },
    // Plane Geometry
    {
      id: 'math-5',
      subject: 'math',
      topic: 'Plane Geometry',
      question: 'What is the area of a triangle with base 10 and height 6?',
      options: ['30', '60', '16', '40'],
      correctAnswer: 0,
      solution: 'Area = ½ × base × height\nArea = ½ × 10 × 6\nArea = ½ × 60\nArea = 30',
      explanation: 'The area formula for a triangle is one-half the product of the base and height. The height must be perpendicular to the base.'
    },
    {
      id: 'math-6',
      subject: 'math',
      topic: 'Plane Geometry',
      question: 'What is the circumference of a circle with radius 7?',
      options: ['14π', '21π', '49π', '98π'],
      correctAnswer: 0,
      solution: 'Circumference = 2πr\nC = 2π(7)\nC = 14π',
      explanation: 'The circumference formula is C = 2πr, where r is the radius. This represents the distance around the circle.'
    },
    // Circular and Trigonometric Functions
    {
      id: 'math-7',
      subject: 'math',
      topic: 'Circular and Trigonometric Functions',
      question: 'In a right triangle, if sin(θ) = 0.6, what is cos(θ)? (Assume θ is in the first quadrant)',
      options: ['0.8', '0.6', '0.4', '0.2'],
      correctAnswer: 0,
      solution: 'Using the Pythagorean identity: sin²(θ) + cos²(θ) = 1\n(0.6)² + cos²(θ) = 1\n0.36 + cos²(θ) = 1\ncos²(θ) = 0.64\ncos(θ) = 0.8',
      explanation: 'The Pythagorean identity states that sin²(θ) + cos²(θ) = 1. We can use this to find missing trig values.'
    },
    // Probability and Statistics
    {
      id: 'math-8',
      subject: 'math',
      topic: 'Probability and Statistics',
      question: 'Find the mean of: 2, 4, 6, 8, 10',
      options: ['5', '6', '7', '8'],
      correctAnswer: 1,
      solution: 'Mean = (2 + 4 + 6 + 8 + 10) ÷ 5\nMean = 30 ÷ 5\nMean = 6',
      explanation: 'The mean (average) is the sum of all values divided by the number of values.'
    },
    {
      id: 'math-9',
      subject: 'math',
      topic: 'Probability and Statistics',
      question: 'What is the probability of rolling a 3 on a fair six-sided die?',
      options: ['1/6', '1/3', '1/2', '1/4'],
      correctAnswer: 0,
      solution: 'P(rolling a 3) = Number of favorable outcomes / Total outcomes\nP = 1/6',
      explanation: 'Probability = favorable outcomes ÷ total possible outcomes. A fair die has 6 possible outcomes, and only 1 favorable outcome (rolling a 3).'
    },
    // Analytic Geometry
    {
      id: 'math-10',
      subject: 'math',
      topic: 'Analytic Geometry',
      question: 'Find the distance between points (0, 0) and (3, 4).',
      options: ['5', '7', '√7', '√25'],
      correctAnswer: 0,
      solution: 'd = √[(x₂ - x₁)² + (y₂ - y₁)²]\nd = √[(3 - 0)² + (4 - 0)²]\nd = √[9 + 16]\nd = √25\nd = 5',
      explanation: 'The distance formula is derived from the Pythagorean theorem. It calculates the straight-line distance between two points on a coordinate plane.'
    },
    // Business Mathematics
    {
      id: 'math-11',
      subject: 'math',
      topic: 'Business Mathematics',
      question: 'If a product costs ₱800 and is sold with a 25% profit, what is the selling price?',
      options: ['₱1000', '₱1200', '₱900', '₱1100'],
      correctAnswer: 0,
      solution: 'Profit = 25% × ₱800 = 0.25 × ₱800 = ₱200\nSelling Price = Cost + Profit\nSelling Price = ₱800 + ₱200 = ₱1000',
      explanation: 'Profit is calculated as a percentage of the cost. The selling price is the cost plus the profit margin.'
    },
    // Calculus
    {
      id: 'math-12',
      subject: 'math',
      topic: 'Calculus',
      question: 'Find the derivative of f(x) = 3x²',
      options: ['6x', '3x', '9x', '6x²'],
      correctAnswer: 0,
      solution: 'Using the power rule: d/dx(xⁿ) = n·xⁿ⁻¹\nf(x) = 3x²\nf\'(x) = 3 · 2 · x²⁻¹\nf\'(x) = 6x',
      explanation: 'The power rule states that the derivative of xⁿ is n·xⁿ⁻¹. We multiply the coefficient by the power and reduce the exponent by 1.'
    },
    // Filipino will be added later
    {
      id: 'filipino-1',
      subject: 'filipino',
      topic: 'Pang-uri',
      question: 'Alin ang pang-uri sa sumusunod na pangungusap: "Ang maliit na bahay ay maroon."',
      options: ['maliit', 'bahay', 'maroon', 'ang'],
      correctAnswer: 0,
      solution: 'Ang pang-uri ay ang salita na naglalarawan ng katangian ng pangalan. Sa pangungusapang ito, "maliit" ang naglalarawan sa "bahay".',
      explanation: 'Ang pang-uri (adjective) ay nagbibigay ng dagdag na impormasyon tungkol sa noun. Sinasabi nito kung paano, gaano kalaki, anong kulay, o anong uri.'
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

  const toggleSolution = (questionId: string) => {
    setShowSolution({
      ...showSolution,
      [questionId]: !showSolution[questionId]
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

      {/* Main Tab Navigation */}
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
            Practice with sample questions organized by subject. Answer them to test your knowledge.
          </p>

          {/* Subject Tabs */}
          <div className="flex gap-2 border-b" style={{
            borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => setMaterialsSubject('math')}
              className={`px-6 py-3 font-semibold text-lg transition-all ${
                materialsSubject === 'math'
                  ? isLightMode
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-blue-400 border-b-2 border-blue-400'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔢 Mathematics
            </button>
            <button
              onClick={() => setMaterialsSubject('filipino')}
              className={`px-6 py-3 font-semibold text-lg transition-all ${
                materialsSubject === 'filipino'
                  ? isLightMode
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-purple-400 border-b-2 border-purple-400'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇵🇭 Filipino
            </button>
          </div>

          {/* Math Section */}
          {materialsSubject === 'math' && (
            <div className="space-y-8">
              {mathTopics.map((topic) => {
                const topicQuestions = practiceQuestions.filter(q => q.subject === 'math' && q.topic === topic);
                
                if (topicQuestions.length === 0) return null;

                return (
                  <div key={topic} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {topic}
                      </h3>
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        isLightMode
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {topicQuestions.length} question{topicQuestions.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {topicQuestions.map((question) => (
                      <div
                        key={question.id}
                        className={`rounded-2xl border p-6 ${
                          isLightMode
                            ? 'bg-white border-slate-200 shadow-md'
                            : 'bg-slate-800/50 border-slate-700 shadow-md'
                        }`}
                      >
                        {/* Question */}
                        <h4 className={`text-lg font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          {question.question}
                        </h4>

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

                        {/* Feedback and Solution Button */}
                        {answers[question.id] !== undefined && (
                          <div className="space-y-3">
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

                            {/* Solution Toggle */}
                            <button
                              onClick={() => toggleSolution(question.id)}
                              className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                                isLightMode
                                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                  : 'bg-slate-700/50 text-white hover:bg-slate-700'
                              }`}
                            >
                              {showSolution[question.id] ? '▼ Hide Solution' : '▶ Show Solution'}
                            </button>

                            {/* Solution and Explanation */}
                            {showSolution[question.id] && (
                              <div className={`p-4 rounded-lg space-y-3 ${
                                isLightMode
                                  ? 'bg-amber-50 border border-amber-200'
                                  : 'bg-amber-500/10 border border-amber-700'
                              }`}>
                                <div>
                                  <h5 className={`font-bold mb-2 ${
                                    isLightMode ? 'text-amber-900' : 'text-amber-200'
                                  }`}>
                                    📝 Solution:
                                  </h5>
                                  <pre className={`text-sm font-mono whitespace-pre-wrap break-words ${
                                    isLightMode ? 'text-amber-800' : 'text-amber-100'
                                  }`}>
                                    {question.solution}
                                  </pre>
                                </div>
                                <div>
                                  <h5 className={`font-bold mb-2 ${
                                    isLightMode ? 'text-amber-900' : 'text-amber-200'
                                  }`}>
                                    💡 Explanation:
                                  </h5>
                                  <p className={`text-sm leading-relaxed ${
                                    isLightMode ? 'text-amber-800' : 'text-amber-100'
                                  }`}>
                                    {question.explanation}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Filipino Section */}
          {materialsSubject === 'filipino' && (
            <div className="space-y-6">
              {practiceQuestions
                .filter(q => q.subject === 'filipino')
                .map((question) => (
                  <div
                    key={question.id}
                    className={`rounded-2xl border p-6 ${
                      isLightMode
                        ? 'bg-white border-slate-200 shadow-md'
                        : 'bg-slate-800/50 border-slate-700 shadow-md'
                    }`}
                  >
                    <div className="mb-4">
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${
                        isLightMode
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {question.topic}
                      </span>
                    </div>

                    {/* Question */}
                    <h4 className={`text-lg font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {question.question}
                    </h4>

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

                    {/* Feedback and Solution Button */}
                    {answers[question.id] !== undefined && (
                      <div className="space-y-3">
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

                        {/* Solution Toggle */}
                        <button
                          onClick={() => toggleSolution(question.id)}
                          className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                            isLightMode
                              ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                              : 'bg-slate-700/50 text-white hover:bg-slate-700'
                          }`}
                        >
                          {showSolution[question.id] ? '▼ Hide Solution' : '▶ Show Solution'}
                        </button>

                        {/* Solution and Explanation */}
                        {showSolution[question.id] && (
                          <div className={`p-4 rounded-lg space-y-3 ${
                            isLightMode
                              ? 'bg-purple-50 border border-purple-200'
                              : 'bg-purple-500/10 border border-purple-700'
                          }`}>
                            <div>
                              <h5 className={`font-bold mb-2 ${
                                isLightMode ? 'text-purple-900' : 'text-purple-200'
                              }`}>
                                📝 Solution:
                              </h5>
                              <p className={`text-sm ${
                                isLightMode ? 'text-purple-800' : 'text-purple-100'
                              }`}>
                                {question.solution}
                              </p>
                            </div>
                            <div>
                              <h5 className={`font-bold mb-2 ${
                                isLightMode ? 'text-purple-900' : 'text-purple-200'
                              }`}>
                                💡 Explanation:
                              </h5>
                              <p className={`text-sm leading-relaxed ${
                                isLightMode ? 'text-purple-800' : 'text-purple-100'
                              }`}>
                                {question.explanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
