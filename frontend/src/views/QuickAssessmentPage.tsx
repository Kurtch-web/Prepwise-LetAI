import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useNavigate } from 'react-router-dom';

interface AssessmentQuestion {
  id: string;
  title: string;
  description?: string;
  choices: string[];
}

interface Assessment {
  id: string;
  name: string;
  description?: string;
  questions: AssessmentQuestion[];
}

export function QuickAssessmentPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLightMode = theme === 'light';

  const [assessments, setAssessments] = useState<Assessment[]>([
    {
      id: '1',
      name: 'General Education Fundamentals',
      description: 'Test your knowledge on basic general education concepts',
      questions: [
        {
          id: 'q1',
          title: 'What is the primary function of mitochondria?',
          choices: ['Energy production', 'Protein synthesis', 'Cell division', 'Waste storage']
        },
        {
          id: 'q2',
          title: 'Which of the following is a renewable resource?',
          choices: ['Coal', 'Solar energy', 'Natural gas', 'Oil']
        }
      ]
    }
  ]);

  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelectAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setCurrentQuestion(0);
    setAnswers({});
    setSubmitted(false);
  };

  const handleAnswerSelect = (questionId: string, choice: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: choice }));
  };

  const handleNext = () => {
    if (selectedAssessment && currentQuestion < selectedAssessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (selectedAssessment) {
      // TODO: Submit answers to backend
      setSubmitted(true);
    }
  };

  const handleBack = () => {
    setSelectedAssessment(null);
    setAnswers({});
    setCurrentQuestion(0);
  };

  if (selectedAssessment && selectedAssessment.questions.length > 0) {
    const question = selectedAssessment.questions[currentQuestion];
    const progress = Math.round(((currentQuestion + 1) / selectedAssessment.questions.length) * 100);
    const allAnswered = selectedAssessment.questions.every(q => answers[q.id]);

    if (submitted) {
      return (
        <div className={`transition-colors duration-200 ${
          isLightMode
            ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
            : 'bg-[#051b15]'
        }`}>
          <div className="max-w-2xl mx-auto px-4 py-12">
            <button
              onClick={handleBack}
              className={`mb-8 px-4 py-2 rounded-lg font-semibold transition ${
                isLightMode
                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              ← Back to Assessments
            </button>

            <div className={`rounded-3xl border p-12 text-center ${
              isLightMode
                ? 'border-emerald-200 bg-white shadow-lg'
                : 'border-emerald-500/20 bg-slate-800/50 shadow-lg'
            }`}>
              <div className="mb-6 text-7xl">✓</div>
              <h2 className={`mb-3 text-3xl font-bold ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>
                Assessment Complete!
              </h2>
              <p className={`mb-8 text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Thank you for completing "{selectedAssessment.name}"
              </p>
              <div className={`mb-8 inline-block rounded-2xl border-2 p-8 ${
                isLightMode
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-emerald-400 bg-emerald-900/20'
              }`}>
                <p className={`text-sm ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>You answered</p>
                <p className={`text-5xl font-bold ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>
                  {Object.keys(answers).length}/{selectedAssessment.questions.length}
                </p>
                <p className={`text-sm ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>questions</p>
              </div>
              <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Your responses have been recorded and will help us personalize your learning experience.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`transition-colors duration-200 ${
        isLightMode
          ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
          : 'bg-[#051b15]'
      }`}>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button
            onClick={handleBack}
            className={`mb-8 px-4 py-2 rounded-lg font-semibold transition ${
              isLightMode
                ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            ← Back to Assessments
          </button>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {selectedAssessment.name}
              </h2>
              <span className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {currentQuestion + 1} of {selectedAssessment.questions.length}
              </span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${
              isLightMode ? 'bg-slate-200' : 'bg-slate-700'
            }`}>
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className={`rounded-3xl border p-8 mb-8 ${
            isLightMode
              ? 'border-slate-200 bg-white shadow-lg'
              : 'border-slate-700 bg-slate-800/50 shadow-lg'
          }`}>
            <h3 className={`text-2xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {question.title}
            </h3>

            {question.description && (
              <p className={`mb-6 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {question.description}
              </p>
            )}

            {/* Answer Options */}
            <div className="space-y-3">
              {question.choices.map((choice, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                    answers[question.id] === choice
                      ? isLightMode
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-emerald-400 bg-emerald-900/20'
                      : isLightMode
                      ? 'border-slate-200 bg-slate-50 hover:border-emerald-300'
                      : 'border-slate-700 bg-slate-900/30 hover:border-emerald-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={choice}
                    checked={answers[question.id] === choice}
                    onChange={() => handleAnswerSelect(question.id, choice)}
                    className="w-5 h-5"
                  />
                  <span className={`text-lg ${
                    answers[question.id] === choice
                      ? isLightMode
                        ? 'font-semibold text-emerald-700'
                        : 'font-semibold text-emerald-300'
                      : isLightMode
                      ? 'text-slate-900'
                      : 'text-white'
                  }`}>
                    {choice}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                currentQuestion === 0
                  ? isLightMode
                    ? 'bg-slate-200 text-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                  : isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              ← Previous
            </button>

            {currentQuestion === selectedAssessment.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                  isLightMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {allAnswered ? '✓ Submit Assessment' : 'Answer all questions'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                  isLightMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
        : 'bg-[#051b15]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate('/materials')}
          className={`mb-8 px-4 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          ← Back to Materials
        </button>

        {/* Header */}
        <div className="mb-12">
          <h1 className={`text-4xl font-black mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📋 Quick Assessments
          </h1>
          <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Take quick assessments to evaluate your knowledge on specific topics
          </p>
        </div>

        {/* Assessments List */}
        {assessments.length === 0 ? (
          <div className={`rounded-2xl border p-12 text-center ${
            isLightMode
              ? 'border-slate-200 bg-white'
              : 'border-slate-700 bg-slate-800/50'
          }`}>
            <p className={`text-lg mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              📋 No assessments available yet
            </p>
            <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Check back soon for new assessments from your instructor
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                className={`rounded-2xl p-6 backdrop-blur-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  isLightMode
                    ? 'bg-white/95 border-slate-200 shadow-md'
                    : 'bg-slate-800/50 border-slate-700 shadow-lg'
                }`}
              >
                <div className="mb-4">
                  <div className="text-3xl mb-3">📋</div>
                  <h3 className={`text-xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {assessment.name}
                  </h3>
                  {assessment.description && (
                    <p className={`text-sm mb-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      {assessment.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {assessment.questions.length} questions
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    isLightMode
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-emerald-900/30 text-emerald-300'
                  }`}>
                    ~5-10 min
                  </span>
                </div>

                <button
                  onClick={() => handleSelectAssessment(assessment)}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                    isLightMode
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  Start Assessment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
