import { useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';

interface SurveyQuestion {
  id: string;
  question: string;
  options: string[];
  type: 'single' | 'multiple';
}

interface SurveyResponse {
  [key: string]: string | string[];
}

interface QuickAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (responses: SurveyResponse) => Promise<void>;
  isLoading?: boolean;
  allowSkip?: boolean;
}

export function QuickAssessment({ isOpen, onClose, onSubmit, isLoading = false, allowSkip = false }: QuickAssessmentProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse>({});
  const [surveyComplete, setSurveyComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const surveyQuestions: SurveyQuestion[] = [
    {
      id: 'q1',
      question: 'Which LET subject area are you most concerned about?',
      type: 'single',
      options: [
        'General Education (Eng, Math, Science, Social Studies)',
        'Professional Education (Pedagogy, Psychology, Curriculum)',
        'Filipino and Philippine Government',
        'All subjects equally'
      ]
    },
    {
      id: 'q2',
      question: 'How much time do you have to study before the LET?',
      type: 'single',
      options: [
        'Less than 1 month',
        '1-3 months',
        '3-6 months',
        'More than 6 months'
      ]
    },
    {
      id: 'q3',
      question: 'Which learning methods work best for you? (Select all that apply)',
      type: 'multiple',
      options: [
        'Video lessons',
        'Reading textbooks and guides',
        'Practice problems and quizzes',
        'Study groups and discussions',
        'Flashcards and mnemonics',
        'Interactive simulations'
      ]
    },
    {
      id: 'q4',
      question: 'What is your current study situation?',
      type: 'single',
      options: [
        'Currently teaching',
        'Working in a non-teaching job',
        'Recent education graduate',
        'Career changer'
      ]
    },
    {
      id: 'q5',
      question: 'What challenges do you face in LET preparation? (Select all that apply)',
      type: 'multiple',
      options: [
        'Limited time for studying',
        'Difficulty understanding complex topics',
        'Test anxiety',
        'Poor retention of information',
        'Lack of quality study materials',
        'Difficulty accessing resources'
      ]
    },
    {
      id: 'q6',
      question: 'How often do you plan to study?',
      type: 'single',
      options: [
        'Daily (1-2 hours)',
        'Daily (3+ hours)',
        'Weekends only',
        'Flexible/as time permits'
      ]
    },
    {
      id: 'q7',
      question: 'What is your primary goal with the LET?',
      type: 'single',
      options: [
        'Just pass the exam',
        'Score above average',
        'Get a high rating (high distinction)',
        'Use results for job opportunities'
      ]
    }
  ];

  const handleSurveyChange = (questionId: string, answer: string | string[]) => {
    setSurveyResponses({
      ...surveyResponses,
      [questionId]: answer
    });
  };

  const handleSurveySubmit = async () => {
    try {
      setError(null);
      await onSubmit(surveyResponses);
      setSurveyComplete(true);
      setTimeout(() => {
        onClose();
        setSurveyComplete(false);
        setSurveyResponses({});
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    }
  };

  const isSurveyComplete = surveyQuestions.every(q => surveyResponses[q.id]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
      isLightMode ? 'bg-black/50' : 'bg-black/70'
    }`}>
      <div className={`rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
        isLightMode ? 'bg-white' : 'bg-slate-900'
      }`}>
        {surveyComplete ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">✅</div>
            <h2 className={`text-2xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Assessment Complete!
            </h2>
            <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Thank you for helping us personalize your learning experience. We'll use your responses to recommend the best study guides for you.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                📋 LET Preparation Assessment
              </h2>
              <button
                onClick={onClose}
                disabled={isLoading}
                className={`text-2xl leading-none ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'} disabled:opacity-50`}
              >
                ✕
              </button>
            </div>

            <p className={`text-sm mb-6 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Help us understand your learning needs. This quick assessment will help us recommend the most relevant study guides for you.
            </p>

            {error && (
              <div className={`mb-6 p-4 rounded-lg ${isLightMode ? 'bg-red-50 text-red-800' : 'bg-red-900/30 text-red-300'}`}>
                {error}
              </div>
            )}

            <div className="space-y-8">
              {surveyQuestions.map((question) => (
                <div key={question.id}>
                  <h3 className={`font-semibold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.type === 'single' ? (
                      <>
                        {question.options.map((option) => (
                          <label key={option} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name={question.id}
                              value={option}
                              checked={surveyResponses[question.id] === option}
                              onChange={(e) => handleSurveyChange(question.id, e.target.value)}
                              disabled={isLoading}
                              className="w-4 h-4 disabled:opacity-50"
                            />
                            <span className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                              {option}
                            </span>
                          </label>
                        ))}
                      </>
                    ) : (
                      <>
                        {question.options.map((option) => (
                          <label key={option} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Array.isArray(surveyResponses[question.id]) && 
                                       (surveyResponses[question.id] as string[]).includes(option)}
                              onChange={(e) => {
                                const current = Array.isArray(surveyResponses[question.id]) 
                                  ? surveyResponses[question.id] as string[]
                                  : [];
                                if (e.target.checked) {
                                  handleSurveyChange(question.id, [...current, option]);
                                } else {
                                  handleSurveyChange(question.id, current.filter(item => item !== option));
                                }
                              }}
                              disabled={isLoading}
                              className="w-4 h-4 disabled:opacity-50"
                            />
                            <span className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                              {option}
                            </span>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isLightMode
                    ? 'border border-slate-300 text-slate-900 hover:bg-slate-100 disabled:opacity-50'
                    : 'border border-slate-700 text-white hover:bg-slate-800 disabled:opacity-50'
                }`}
              >
                {allowSkip ? 'Skip for now' : 'Cancel'}
              </button>
              <button
                onClick={handleSurveySubmit}
                disabled={!isSurveyComplete || isLoading}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 ${
                  isLightMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 disabled:cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Submitting...' : 'Submit Assessment'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
