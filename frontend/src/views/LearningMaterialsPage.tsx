import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import PracticeQuizList from '../components/PracticeQuizList';
import PracticeQuizTaker from '../components/PracticeQuizTaker';
import { TakeAssessmentModal } from '../components/TakeAssessmentModal';
import { PracticeTestsView } from '../components/PracticeTestsView';
import { PracticeRetakeQuiz } from '../components/PracticeRetakeQuiz';
import api from '../services/api';
import { formatRelativeTime } from '../utils/dateFormatter';

interface AssessmentTemplate {
  id: string;
  name: string;
  description?: string;
  questions: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_id: number;
}

export function LearningMaterialsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLightMode = theme === 'light';
  const [activeTab, setActiveTab] = useState<'materials' | 'assessment'>('materials');
  const [showPracticeQuizzes, setShowPracticeQuizzes] = useState(false);
  const [showPracticeTests, setShowPracticeTests] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [retakingTestId, setRetakingTestId] = useState<string | null>(null);
  const [retakingTestTitle, setRetakingTestTitle] = useState<string | null>(null);
  const [retakingTestType, setRetakingTestType] = useState<string | null>(null);
  const [retakingTestData, setRetakingTestData] = useState<any>(null);
  const [assessmentTemplates, setAssessmentTemplates] = useState<AssessmentTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentTemplate | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      console.log('Fetching assessment templates...');
      const response = await api.fetchAssessmentTemplates();
      console.log('Assessment templates fetched:', response.templates);
      setAssessmentTemplates(response.templates || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch assessment templates:', errorMessage);
      // In offline mode, just show empty list instead of error
      setAssessmentTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'assessment') {
      fetchTemplates();
    }
  }, [activeTab]);

  const materials = [
    {
      id: 'flashcards',
      icon: '🎴',
      title: 'Flashcards',
      description: 'Interactive flashcards to master key concepts and definitions',
      path: '/materials/flashcards'
    },
    {
      id: 'study-guides',
      icon: '📖',
      title: 'Study Guides',
      description: 'Comprehensive guides covering all exam topics and subtopics',
      path: '/materials/study-guides'
    },
    {
      id: 'practice-tests',
      icon: '📝',
      title: 'Practice Tests',
      description: 'Retake completed tests for practice and learn from your mistakes',
      onClick: () => setShowPracticeTests(true)
    },
    {
      id: 'video-lessons',
      icon: '🎥',
      title: 'Video Lessons',
      description: 'Expert-led video lessons explaining complex concepts step-by-step',
      path: '/materials/video-lessons'
    },
    {
      id: 'question-bank',
      icon: '🔍',
      title: 'Question Bank',
      description: 'Thousands of practice questions organized by topic and difficulty',
      path: '/materials/question-bank'
    },
    {
      id: 'progress-tracker',
      icon: '📊',
      title: 'Progress Tracker',
      description: 'Track your learning progress and get personalized recommendations',
      path: '/materials/progress-tracker'
    }
  ];

  // Show practice retake quiz
  if (retakingTestId && retakingTestTitle && retakingTestType) {
    return (
      <div className={`transition-colors duration-200 ${
        isLightMode
          ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
          : 'bg-[#051b15]'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <PracticeRetakeQuiz
            quizId={retakingTestId}
            quizTitle={retakingTestTitle}
            testType={retakingTestType}
            originalQuizData={retakingTestData}
            onBack={() => {
              setRetakingTestId(null);
              setRetakingTestTitle(null);
              setRetakingTestType(null);
              setRetakingTestData(null);
              setShowPracticeTests(true);
            }}
            onComplete={() => {
              setRetakingTestId(null);
              setRetakingTestTitle(null);
              setRetakingTestType(null);
              setRetakingTestData(null);
              setShowPracticeTests(true);
            }}
          />
        </div>
      </div>
    );
  }

  if (selectedQuizId) {
    return (
      <PracticeQuizTaker
        quizId={selectedQuizId}
        onBack={() => {
          setSelectedQuizId(null);
          setShowPracticeQuizzes(true);
        }}
        onComplete={() => {
          setSelectedQuizId(null);
          setShowPracticeQuizzes(true);
        }}
      />
    );
  }

  if (showPracticeTests) {
    return (
      <div className={`transition-colors duration-200 ${
        isLightMode
          ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
          : 'bg-[#051b15]'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <PracticeTestsView
            onSelectQuiz={(quizId, quizTitle, testType, quizResult) => {
              setRetakingTestId(quizId);
              setRetakingTestTitle(quizTitle);
              setRetakingTestType(testType);
              setRetakingTestData(quizResult);
            }}
            onBack={() => {
              setShowPracticeTests(false);
              setRetakingTestId(null);
              setRetakingTestTitle(null);
              setRetakingTestType(null);
              setRetakingTestData(null);
            }}
          />
        </div>
      </div>
    );
  }

  if (showPracticeQuizzes) {
    return (
      <div className={`transition-colors duration-200 ${
        isLightMode
          ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
          : 'bg-[#051b15]'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <button
            onClick={() => setShowPracticeQuizzes(false)}
            className={`mb-6 px-4 py-2 rounded-lg font-semibold transition ${
              isLightMode
                ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            ← Back to Materials
          </button>
          <PracticeQuizList onSelectQuiz={(quiz) => setSelectedQuizId(quiz.id)} />
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
        {/* Header and Tabs */}
        <div className="mb-8">
          <h1 className={`text-4xl font-black mb-6 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📚 Learning Center
          </h1>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b" style={{
            borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'
          }}>
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
              📚 Learning Materials
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-6 py-3 font-semibold text-lg transition-all ${
                activeTab === 'assessment'
                  ? isLightMode
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-emerald-400 border-b-2 border-emerald-400'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📝 Study Assessment
            </button>
          </div>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === 'materials' ? (
          <>
            <div className="mb-8">
              <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Access all study resources tailored to your {user?.reviewType} exam preparation
              </p>
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <div
                  key={material.id}
                  onClick={() => (material as any).onClick ? (material as any).onClick() : navigate((material as any).path)}
                  className={`rounded-2xl p-6 backdrop-blur-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                    isLightMode
                      ? 'bg-white/95 border-slate-200 shadow-md'
                      : 'bg-slate-800/50 border-slate-700 shadow-lg'
                  }`}
                >
                  <div className="text-4xl mb-4">{material.icon}</div>
                  <h3 className={`text-xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {material.title}
                  </h3>
                  <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {material.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Info Section */}
            <div className={`mt-12 rounded-2xl p-8 backdrop-blur-xl border ${
              isLightMode
                ? 'bg-white/95 border-slate-200 shadow-lg'
                : 'bg-slate-800/50 border-slate-700 shadow-lg'
            }`}>
              <h2 className={`text-2xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                ✨ Curated for Your Success
              </h2>
              <p className={`text-base leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                All learning materials are carefully curated and aligned with the latest PRC standards for the LET {user?.reviewType} exam. Each resource is designed to maximize your learning efficiency and boost your confidence before the exam.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-8">
              <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Practice and evaluate your knowledge with comprehensive assessments
              </p>
            </div>

            {/* Assessment Content */}
            {loadingTemplates ? (
              <div className={`rounded-2xl border p-12 text-center ${
                isLightMode
                  ? 'border-slate-200 bg-white shadow-lg'
                  : 'border-slate-700 bg-slate-800/50 shadow-lg'
              }`}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
                <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Loading assessments...
                </p>
              </div>
            ) : assessmentTemplates.length === 0 ? (
              <div className={`rounded-2xl border p-12 text-center ${
                isLightMode
                  ? 'border-slate-200 bg-white shadow-lg'
                  : 'border-slate-700 bg-slate-800/50 shadow-lg'
              }`}>
                <div className="mb-6 text-6xl">📝</div>
                <h2 className={`text-3xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  No assessments available yet
                </h2>
                <p className={`text-lg max-w-2xl mx-auto ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Check back soon for comprehensive study assessments from your instructor.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`rounded-2xl border p-6 ${
                  isLightMode
                    ? 'border-slate-200 bg-white shadow-lg'
                    : 'border-slate-700 bg-slate-800/50 shadow-lg'
                }`}>
                  <h2 className={`text-2xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    📝 Study Assessments Available
                  </h2>
                  <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {assessmentTemplates.length} assessment{assessmentTemplates.length !== 1 ? 's' : ''} available for you to practice
                  </p>
                </div>

                <div className="grid gap-4">
                  {assessmentTemplates.map((assessment) => (
                    <button
                      key={assessment.id}
                      onClick={() => setSelectedAssessment(assessment)}
                      className={`rounded-2xl border p-6 text-left transition ${
                        isLightMode
                          ? 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg cursor-pointer'
                          : 'border-slate-700 bg-slate-800/50 hover:border-emerald-400 hover:shadow-lg cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            {assessment.name}
                          </h3>
                          {assessment.description && (
                            <p className={`text-sm mb-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                              {assessment.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-xs px-3 py-1 rounded-full ${
                              isLightMode
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              📝 {assessment.questions.length} question{assessment.questions.length !== 1 ? 's' : ''}
                            </span>
                            <span className={`text-xs px-3 py-1 rounded-full ${
                              isLightMode
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              Created {formatRelativeTime(assessment.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition ${
                          isLightMode
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          Take Assessment →
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Take Assessment Modal */}
        {selectedAssessment && (
          <TakeAssessmentModal
            assessment={selectedAssessment}
            onClose={() => setSelectedAssessment(null)}
            onSuccess={() => {
              setSelectedAssessment(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
