import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import PracticeQuizList from '../components/PracticeQuizList';
import PracticeQuizTaker from '../components/PracticeQuizTaker';
import { TakeAssessmentModal } from '../components/TakeAssessmentModal';
import { AssessmentAnswersModal } from '../components/AssessmentAnswersModal';
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
  const [activeTab, setActiveTab] = useState<'materials' | 'assessment' | 'answered'>('materials');
  const [showPracticeQuizzes, setShowPracticeQuizzes] = useState(false);
  const [showPracticeTests, setShowPracticeTests] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [retakingTestId, setRetakingTestId] = useState<string | null>(null);
  const [retakingTestTitle, setRetakingTestTitle] = useState<string | null>(null);
  const [retakingTestType, setRetakingTestType] = useState<string | null>(null);
  const [retakingTestData, setRetakingTestData] = useState<any>(null);
  const [assessmentTemplates, setAssessmentTemplates] = useState<AssessmentTemplate[]>([]);
  const [userAssessments, setUserAssessments] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentTemplate | null>(null);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [selectedAnswerAssessment, setSelectedAnswerAssessment] = useState<any | null>(null);
  const [selectedAnswerTemplate, setSelectedAnswerTemplate] = useState<AssessmentTemplate | null>(null);
  const [previousAnswersForModal, setPreviousAnswersForModal] = useState<Record<string, unknown> | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      console.log('Fetching assessment templates...');
      const [templatesResponse, userAssessmentsResponse] = await Promise.all([
        api.fetchAssessmentTemplates(),
        api.fetchUserAssessments().catch(() => ({ assessments: [] }))
      ]);
      console.log('Assessment templates fetched:', templatesResponse.templates);
      console.log('User assessments fetched:', userAssessmentsResponse.assessments);
      setAssessmentTemplates(templatesResponse.templates || []);
      setUserAssessments(userAssessmentsResponse.assessments || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch assessment templates:', errorMessage);
      // In offline mode, just show empty list instead of error
      setAssessmentTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleViewAnswers = async (assessment: AssessmentTemplate) => {
    try {
      setLoadingTemplates(true);
      const userAssessment = await api.fetchUserAssessmentByTemplate(assessment.id);
      setSelectedAnswerAssessment(userAssessment);
      setSelectedAnswerTemplate(assessment);
      setShowAnswersModal(true);
    } catch (err) {
      console.error('Failed to load assessment answers:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'assessment' || activeTab === 'answered') {
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
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
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
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
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
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header and Tabs */}
        <div className="mb-8">
          <h1 className={`text-3xl sm:text-4xl font-black mb-4 sm:mb-6 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📚 Learning Center
          </h1>

          {/* Tab Navigation */}
          <div className={`flex flex-col sm:flex-row gap-2 border-b ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
            <button
              onClick={() => setActiveTab('materials')}
              className={`w-full sm:w-auto px-4 sm:px-6 py-3 font-semibold text-sm sm:text-lg transition-all ${
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
              className={`w-full sm:w-auto px-4 sm:px-6 py-3 font-semibold text-sm sm:text-lg transition-all ${
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
            <button
              onClick={() => setActiveTab('answered')}
              className={`w-full sm:w-auto px-4 sm:px-6 py-3 font-semibold text-sm sm:text-lg transition-all ${
                activeTab === 'answered'
                  ? isLightMode
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-emerald-400 border-b-2 border-emerald-400'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✓ Answered Assessments
            </button>
          </div>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === 'answered' ? (
          <>
            <div className="mb-8">
              <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                View all assessments you have completed
              </p>
            </div>

            {/* Answered Assessment Content */}
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
            ) : userAssessments.length === 0 ? (
              <div className={`rounded-2xl border p-12 text-center ${
                isLightMode
                  ? 'border-slate-200 bg-white shadow-lg'
                  : 'border-slate-700 bg-slate-800/50 shadow-lg'
              }`}>
                <div className="mb-6 text-6xl">📋</div>
                <h2 className={`text-3xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  No completed assessments yet
                </h2>
                <p className={`text-lg max-w-2xl mx-auto ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Complete an assessment in the Study Assessment tab to see your answers here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`rounded-2xl border p-5 sm:p-6 ${
                  isLightMode
                    ? 'border-slate-200 bg-white shadow-lg'
                    : 'border-slate-700 bg-slate-800/50 shadow-lg'
                }`}>
                  <h2 className={`text-2xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    ✓ Your Completed Assessments
                  </h2>
                  <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {userAssessments.length} assessment{userAssessments.length !== 1 ? 's' : ''} completed
                  </p>
                </div>

                <div className="grid gap-4">
                  {userAssessments.map((userAssessment) => {
                    // Find the template for this user assessment
                    const template = assessmentTemplates.find(t => t.id === userAssessment.template_id);
                    if (!template) return null;

                    return (
                      <div
                        key={userAssessment.id}
                        className={`rounded-2xl border p-6 ${
                          isLightMode
                            ? 'border-emerald-200 bg-emerald-50 shadow-md'
                            : 'border-emerald-500/20 bg-emerald-900/10'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                {template.name}
                              </h3>
                              <span className={`inline-flex text-xs px-3 py-1 rounded-full font-semibold ${
                                isLightMode
                                  ? 'bg-emerald-200 text-emerald-700'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                ✓ Completed
                              </span>
                            </div>
                            {template.description && (
                              <p className={`text-sm mb-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                {template.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <span className={`text-xs px-3 py-1 rounded-full ${
                                isLightMode
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                📝 {template.questions.length} question{template.questions.length !== 1 ? 's' : ''}
                              </span>
                              <span className={`text-xs px-3 py-1 rounded-full ${
                                isLightMode
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                Completed {formatRelativeTime(userAssessment.createdAt)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewAnswers(template)}
                            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition ${
                              isLightMode
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            👁️ View Answers
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'materials' ? (
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
                  className={`rounded-2xl p-5 sm:p-6 backdrop-blur-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                    isLightMode
                      ? 'bg-white/95 border-slate-200 shadow-md'
                      : 'bg-slate-800/50 border-slate-700 shadow-lg'
                  }`}
                >
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{material.icon}</div>
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
            <div className={`mt-10 sm:mt-12 rounded-2xl p-6 sm:p-8 backdrop-blur-xl border ${
              isLightMode
                ? 'bg-white/95 border-slate-200 shadow-lg'
                : 'bg-slate-800/50 border-slate-700 shadow-lg'
            }`}>
              <h2 className={`text-2xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                ✨ Curated for Your Success
              </h2>
              <p className={`text-sm sm:text-base leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
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
                <div className={`rounded-2xl border p-5 sm:p-6 ${
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
                  {assessmentTemplates.map((assessment) => {
                    const userTakes = userAssessments.filter(a => a.template_id === assessment.id);
                    const hasCompleted = userTakes.length > 0;
                    const lastTake = hasCompleted ? userTakes[0] : null;

                    const handleRetakeClick = async () => {
                      try {
                        if (hasCompleted && lastTake) {
                          // Fetch the full previous answers for editing
                          const userAssessment = await api.fetchUserAssessmentByTemplate(assessment.id);
                          setPreviousAnswersForModal(userAssessment.responses);
                        } else {
                          setPreviousAnswersForModal(null);
                        }
                        setSelectedAssessment(assessment);
                      } catch (err) {
                        console.error('Failed to load previous answers:', err);
                        // Still open the modal without previous answers if fetch fails
                        setPreviousAnswersForModal(null);
                        setSelectedAssessment(assessment);
                      }
                    };

                    return (
                      <button
                        key={assessment.id}
                        onClick={handleRetakeClick}
                        className={`rounded-2xl border p-6 text-left transition ${
                          isLightMode
                            ? 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg cursor-pointer'
                            : 'border-slate-700 bg-slate-800/50 hover:border-emerald-400 hover:shadow-lg cursor-pointer'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                {assessment.name}
                              </h3>
                              {hasCompleted && (
                                <span className={`inline-flex text-xs px-3 py-1 rounded-full font-semibold ${
                                  isLightMode
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  ✓ Answered
                                </span>
                              )}
                            </div>
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
                              {hasCompleted && (
                                <span className={`text-xs px-3 py-1 rounded-full ${
                                  isLightMode
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  Last answered {formatRelativeTime(lastTake.createdAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition ${
                            isLightMode
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {hasCompleted ? 'Edit Answer →' : 'Take Assessment →'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Take Assessment Modal */}
        {selectedAssessment && (
          <TakeAssessmentModal
            assessment={selectedAssessment}
            onClose={() => {
              setSelectedAssessment(null);
              setPreviousAnswersForModal(null);
            }}
            onSuccess={() => {
              setSelectedAssessment(null);
              setPreviousAnswersForModal(null);
              fetchTemplates();
            }}
            previousAnswers={previousAnswersForModal}
          />
        )}

        {/* View Assessment Answers Modal */}
        <AssessmentAnswersModal
          isOpen={showAnswersModal}
          onClose={() => {
            setShowAnswersModal(false);
            setSelectedAnswerAssessment(null);
            setSelectedAnswerTemplate(null);
          }}
          assessment={selectedAnswerAssessment}
          template={selectedAnswerTemplate ? {
            name: selectedAnswerTemplate.name,
            description: selectedAnswerTemplate.description,
            questions: selectedAnswerTemplate.questions
          } : null}
        />
      </div>
    </div>
  );
}
