import { useState, useEffect } from 'react';
import { FlashcardsTab } from '../components/FlashcardsTab';
import { QuestionsBank } from '../components/QuestionsBank';
import { UserProfileCard } from '../components/UserProfileCard';
import VideoUploadForm from '../components/VideoUploadForm';
import VideoList from '../components/VideoList';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { AssessmentSurvey } from '../components/AssessmentSurvey';
import { AssessmentTemplatesList } from '../components/AssessmentTemplatesList';
import { AddQuestionFromBankModal } from '../components/AddQuestionFromBankModal';
import { api, type UserProfile } from '../services/api';
import quizService from '../services/quizService';
import { useTheme } from '../providers/ThemeProvider';
import { formatRelativeTime } from '../utils/dateFormatter';

const darkCardShell =
  'rounded-3xl border border-emerald-500/20 bg-[#064e3b]/80 p-7 shadow-[0_18px_40px_rgba(6,78,59,0.45)] backdrop-blur-xl';
const lightCardShell =
  'rounded-3xl border border-emerald-200 bg-white/95 p-7 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl';

export function AdminPortalPage() {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const cardShellClasses = isLightMode ? lightCardShell : darkCardShell;

  const [activeTab, setActiveTab] = useState<'users' | 'learning-materials' | 'assessment'>('users');
  const [materialsTab, setMaterialsTab] = useState<'videos' | 'upload' | 'diagnostic-test' | 'drills' | 'short-quiz' | 'preboard' | 'flashcards' | 'questions-bank' | 'archive'>('questions-bank');
  const [quizType, setQuizType] = useState<'diagnostic-test' | 'drills' | 'short-quiz' | 'preboard'>('diagnostic-test');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideoUploadForm, setShowVideoUploadForm] = useState(false);
  const [videoListKey, setVideoListKey] = useState(0);

  // Quiz creation state
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Array<{ question_text: string; choices: string[]; correct_answer: string }>>([
    { question_text: '', choices: ['', '', '', ''], correct_answer: 'A' }
  ]);
  const [adminQuizzes, setAdminQuizzes] = useState<any[]>([]);
  const [archivedQuizzes, setArchivedQuizzes] = useState<any[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [selectedQuizForLeaderboard, setSelectedQuizForLeaderboard] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [showAssessmentSurvey, setShowAssessmentSurvey] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [assessmentInsights, setAssessmentInsights] = useState<any>(null);
  const [assessmentTemplatesListKey, setAssessmentTemplatesListKey] = useState(0);
  const [selectedAssessmentTemplate, setSelectedAssessmentTemplate] = useState<any>(null);
  const [assessmentTemplatesSummary, setAssessmentTemplatesSummary] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  // Fetch users with profiles
  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await api.fetchUsersWithProfiles();
      setUsers(response.users);
      if (response.users.length > 0 && !selectedUser) {
        setSelectedUser(response.users[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Refresh users every 5 seconds for real-time updates
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAdminQuizzes = async (testType?: string) => {
    setQuizLoading(true);
    try {
      const typeToLoad = testType || (
        materialsTab === 'diagnostic-test' ? 'diagnostic-test' :
        materialsTab === 'drills' ? 'drills' :
        materialsTab === 'short-quiz' ? 'short-quiz' :
        materialsTab === 'preboard' ? 'preboard' : 'diagnostic-test'
      );
      const response = await quizService.listMyQuizzes(typeToLoad);
      setAdminQuizzes((response as any).quizzes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setQuizLoading(false);
    }
  };

  const loadArchivedQuizzes = async () => {
    setQuizLoading(true);
    try {
      const response = await quizService.listArchivedQuizzes();
      setArchivedQuizzes((response as any).quizzes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load archived quizzes');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleArchiveQuiz = async (quizId: string) => {
    try {
      await quizService.archiveQuiz(quizId);
      await loadAdminQuizzes(
        materialsTab === 'diagnostic-test' ? 'diagnostic-test' :
        materialsTab === 'drills' ? 'drills' :
        materialsTab === 'short-quiz' ? 'short-quiz' :
        'preboard'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive quiz');
    }
  };

  const handleRestoreQuiz = async (quizId: string) => {
    try {
      await quizService.restoreQuiz(quizId);
      await loadArchivedQuizzes();
      await loadAdminQuizzes(
        materialsTab === 'diagnostic-test' ? 'diagnostic-test' :
        materialsTab === 'drills' ? 'drills' :
        materialsTab === 'short-quiz' ? 'short-quiz' :
        'preboard'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore quiz');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this quiz? This action cannot be undone.')) {
      return;
    }
    try {
      await quizService.deleteQuiz(quizId);
      await loadAdminQuizzes(
        materialsTab === 'diagnostic-test' ? 'diagnostic-test' :
        materialsTab === 'drills' ? 'drills' :
        materialsTab === 'short-quiz' ? 'short-quiz' :
        'preboard'
      );
      await loadArchivedQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quiz');
    }
  };

  useEffect(() => {
    if (materialsTab === 'diagnostic-test' || materialsTab === 'drills' || materialsTab === 'short-quiz' || materialsTab === 'preboard') {
      loadAdminQuizzes(
        materialsTab === 'diagnostic-test' ? 'diagnostic-test' :
        materialsTab === 'drills' ? 'drills' :
        materialsTab === 'short-quiz' ? 'short-quiz' :
        'preboard'
      );
    } else if (materialsTab === 'archive') {
      loadArchivedQuizzes();
    }
  }, [materialsTab]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!quizTitle.trim()) {
        throw new Error('Quiz title is required');
      }

      const validQuestions = questions.filter(q => q.question_text.trim());
      if (validQuestions.length === 0) {
        throw new Error('At least one question is required');
      }

      const questionsToSubmit = validQuestions.map(q => ({
        question_text: q.question_text,
        choices: q.choices.filter(c => c.trim()),
        correct_answer: q.correct_answer
      }));

      await quizService.createQuiz(
        quizTitle,
        quizDescription || null,
        questionsToSubmit,
        timeLimitMinutes,
        materialsTab
      );

      // Reset form
      setQuizTitle('');
      setQuizDescription('');
      setTimeLimitMinutes(null);
      setQuestions([{ question_text: '', choices: ['', '', '', ''], correct_answer: 'A' }]);

      // Refresh quiz list with correct test type
      await loadAdminQuizzes(materialsTab);

      // Close form after quiz is created and list is refreshed
      setShowQuizForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { question_text: '', choices: ['', '', '', ''], correct_answer: 'A' }]);
  };

  const handleAddQuestionsFromBank = (bankedQuestions: Array<{ question_text: string; choices: string[]; correct_answer: string }>) => {
    setQuestions([...questions, ...bankedQuestions]);
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

  const loadLeaderboard = async (quiz: any) => {
    setSelectedQuizForLeaderboard(quiz);
    setLeaderboardModalOpen(true);
    setLeaderboardLoading(true);
    try {
      const response = await quizService.getQuizLeaderboard(quiz.id);
      setLeaderboard(((response as any).leaderboard) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid max-w-[880px] gap-3">
        <h1 className={`text-4xl font-extrabold md:text-5xl ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Admin Dashboard</h1>
        <p className={`max-w-2xl text-lg ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
          Monitor users, manage learning materials, and view student assessments.
        </p>
      </div>

      <div className={`flex gap-2 border-b ${isLightMode ? 'border-slate-200' : 'border-emerald-500/20'}`}>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-semibold transition ${
            activeTab === 'users'
              ? isLightMode
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'border-b-2 border-emerald-400 text-white'
              : isLightMode
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-white/60 hover:text-white'
          }`}
        >
          👥 Users & Profiles
        </button>
        <button
          onClick={() => setActiveTab('assessment')}
          className={`px-4 py-3 font-semibold transition ${
            activeTab === 'assessment'
              ? isLightMode
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'border-b-2 border-emerald-400 text-white'
              : isLightMode
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-white/60 hover:text-white'
          }`}
        >
          📋 Assessment Survey
        </button>
        <button
          onClick={() => setActiveTab('learning-materials')}
          className={`px-4 py-3 font-semibold transition ${
            activeTab === 'learning-materials'
              ? isLightMode
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'border-b-2 border-emerald-400 text-white'
              : isLightMode
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-white/60 hover:text-white'
          }`}
        >
          📚 Learning Materials
        </button>
      </div>

      {activeTab === 'users' && (
        <section className="grid gap-6 lg:grid-cols-4">
          {/* Users List */}
          <div className={`${cardShellClasses} lg:col-span-1`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Users</h3>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                isLightMode
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {users.length}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Loading...</p>
              </div>
            ) : error ? (
              <div className={`rounded-2xl border p-3 text-sm ${
                isLightMode
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-red-500/20 bg-red-500/10 text-red-300'
              }`}>
                {error}
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full rounded-2xl border transition-all px-3 py-2 text-left ${
                      selectedUser?.id === user.id
                        ? isLightMode
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-emerald-400 bg-emerald-500/20'
                        : isLightMode
                        ? 'border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50'
                        : 'border-white/10 bg-white/5 hover:border-emerald-400/50 hover:bg-white/10'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{user.username}</p>
                    <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </p>
                    {user.assessment && (
                      <p className={`text-xs ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>✓ Assessment</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected User Profile */}
          <div className="lg:col-span-3">
            {selectedUser ? (
              <UserProfileCard user={selectedUser} />
            ) : (
              <div className={cardShellClasses}>
                <div className="flex items-center justify-center py-12 text-center">
                  <p className={isLightMode ? 'text-slate-600' : 'text-white/60'}>Select a user to view their profile</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'assessment' && (
        <section className="grid gap-6">
          <div className={cardShellClasses}>
            <h2 className={`mb-6 text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Assessment Survey Management</h2>
            <p className={`mb-6 ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
              Create and manage LET Preparation Assessment surveys to understand student learning needs and provide personalized recommendations.
            </p>

            <div className="grid gap-4 lg:grid-cols-2 mb-8">
              <div className={`rounded-2xl border p-6 ${
                isLightMode
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-white/10 bg-white/5'
              }`}>
                <div className="text-4xl mb-3">📋</div>
                <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Assessment Survey
                </h3>
                <p className={`mb-4 text-sm ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                  Create custom assessment questions and manage surveys for your students.
                </p>
                <button
                  onClick={() => setShowAssessmentSurvey(true)}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                    isLightMode
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  Create Assessment
                </button>
              </div>

              <div className={`rounded-2xl border p-6 ${
                isLightMode
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-white/10 bg-white/5'
              }`}>
                <div className="text-4xl mb-3">📊</div>
                <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Insights
                </h3>
                <p className={`mb-4 text-sm ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                  View student responses and answer statistics for each assessment.
                </p>
                <button
                  onClick={async () => {
                    try {
                      setInsightsLoading(true);
                      const data = await api.fetchAssessmentTemplatesSummary();
                      setAssessmentTemplatesSummary(data.templates);
                      setSelectedAssessmentTemplate(null);
                      setShowInsightsModal(true);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
                    } finally {
                      setInsightsLoading(false);
                    }
                  }}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                    isLightMode
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  View Insights
                </button>
              </div>
            </div>

            <div>
              <h3 className={`mb-4 text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Your Assessment Surveys
              </h3>
              <div key={assessmentTemplatesListKey}>
                <AssessmentTemplatesList
                  onTemplateDeleted={() => {
                    // Optionally refresh the list
                    setAssessmentTemplatesListKey(prev => prev + 1);
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'learning-materials' && (
        <section className="flex flex-col gap-6">
          <div className={cardShellClasses}>
            <h2 className={`mb-6 text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Learning Materials Management</h2>

            {/* Test Management Section */}
            <div className="mb-8">
              <h3 className={`mb-3 text-lg font-bold ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>📝 Test Management</h3>
              <div className={`flex flex-wrap gap-2 pb-4 ${isLightMode ? 'border-b border-slate-200' : 'border-b border-white/10'}`}>
                <button
                  onClick={() => setMaterialsTab('diagnostic-test')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    materialsTab === 'diagnostic-test'
                      ? isLightMode
                        ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-600'
                        : 'bg-purple-500/30 text-purple-300 border-b-2 border-purple-400'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🔍</span>
                  <span>Diagnostic Test</span>
                </button>
                <button
                  onClick={() => setMaterialsTab('drills')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    materialsTab === 'drills'
                      ? isLightMode
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                        : 'bg-blue-500/30 text-blue-300 border-b-2 border-blue-400'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>⚙️</span>
                  <span>Drills</span>
                </button>
                <button
                  onClick={() => setMaterialsTab('short-quiz')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    materialsTab === 'short-quiz'
                      ? isLightMode
                        ? 'bg-amber-100 text-amber-700 border-b-2 border-amber-600'
                        : 'bg-amber-500/30 text-amber-300 border-b-2 border-amber-400'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>⏱️</span>
                  <span>Short Quiz</span>
                </button>
                <button
                  onClick={() => setMaterialsTab('preboard')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    materialsTab === 'preboard'
                      ? isLightMode
                        ? 'bg-cyan-100 text-cyan-700 border-b-2 border-cyan-600'
                        : 'bg-cyan-500/30 text-cyan-300 border-b-2 border-cyan-400'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🏆</span>
                  <span>Pre-Board</span>
                </button>
              </div>
            </div>

            {/* Learning Materials Section */}
            <div>
              <h3 className={`mb-3 text-lg font-bold ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>📚 Learning Materials</h3>
              <div className={`flex flex-wrap gap-2 border-b pb-4 ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                <button
                  onClick={() => setMaterialsTab('videos')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    materialsTab === 'videos'
                      ? isLightMode
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                        : 'bg-blue-500/30 text-blue-300 border-b-2 border-blue-400'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🎥</span>
                  <span>Videos</span>
                </button>
                <button
                  onClick={() => setMaterialsTab('upload')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    materialsTab === 'upload'
                      ? isLightMode
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                        : 'bg-blue-500/30 text-blue-300 border-b-2 border-blue-400'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>⬆️</span>
                  <span>Upload</span>
                </button>
                <button
                  onClick={() => setMaterialsTab('flashcards')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    materialsTab === 'flashcards'
                      ? isLightMode
                        ? 'bg-emerald-100 text-emerald-700 border-b-2 border-emerald-600'
                        : 'bg-emerald-500/30 text-emerald-300 border-b-2 border-emerald-400'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🎴</span>
                  <span>Flashcards</span>
                </button>
                <button
                  onClick={() => setMaterialsTab('questions-bank')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    materialsTab === 'questions-bank'
                      ? isLightMode
                        ? 'bg-amber-100 text-amber-700 border-b-2 border-amber-600'
                        : 'bg-amber-500/30 text-amber-300 border-b-2 border-amber-400'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>📚</span>
                  <span>Questions Bank</span>
                </button>
                <button
                  onClick={() => setMaterialsTab('archive')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    materialsTab === 'archive'
                      ? isLightMode
                        ? 'bg-slate-300 text-slate-700 border-b-2 border-slate-600'
                        : 'bg-slate-600/30 text-slate-300 border-b-2 border-slate-400'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>📦</span>
                  <span>Archive</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {materialsTab === 'videos' && (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setVideoListKey((prev) => prev + 1)}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-600 px-6 py-2 font-semibold text-white transition hover:bg-slate-700"
                    >
                      <span>🔄</span>
                      <span>Refresh Videos</span>
                    </button>
                  </div>
                  <div key={videoListKey}>
                    <VideoList />
                  </div>
                </div>
              )}

              {materialsTab === 'upload' && (
                <div className="flex flex-col gap-6">
                  <VideoUploadForm
                    onSuccess={() => {
                      setVideoListKey((prev) => prev + 1);
                      setMaterialsTab('videos');
                    }}
                    onCancel={() => setMaterialsTab('videos')}
                  />
                </div>
              )}

              {(materialsTab === 'diagnostic-test' || materialsTab === 'drills' || materialsTab === 'short-quiz' || materialsTab === 'preboard') && (
                <div className="flex flex-col gap-6">
                  {!showQuizForm ? (
                    <>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowQuizForm(true)}
                          className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-6 py-2 font-semibold text-white transition hover:bg-purple-600"
                        >
                          <span>+</span>
                          <span>Create {materialsTab === 'diagnostic-test' ? '🔍 Diagnostic' : materialsTab === 'drills' ? '⚙️ Drill' : materialsTab === 'short-quiz' ? '⏱️ Quiz' : '🏆 Pre-Board'}</span>
                        </button>
                      </div>

                      <div>
                        <h3 className={`mb-4 text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          My {materialsTab === 'diagnostic-test' ? '🔍 Diagnostic Tests' : materialsTab === 'drills' ? '⚙️ Drills' : materialsTab === 'short-quiz' ? '⏱️ Short Quizzes' : '🏆 Pre-Board Tests'}
                        </h3>

                        {quizLoading ? (
                          <div className={`rounded-2xl border p-8 text-center ${
                            isLightMode
                              ? 'bg-white border-slate-200'
                              : 'bg-slate-800/40 border-slate-700'
                          }`}>
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4" />
                            <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                              Loading tests...
                            </p>
                          </div>
                        ) : adminQuizzes.length === 0 ? (
                          <div className={`rounded-2xl border p-12 text-center ${
                            isLightMode
                              ? 'bg-white border-slate-200'
                              : 'bg-slate-800/40 border-slate-700'
                          }`}>
                            <p className={`text-lg mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                              📚 No {materialsTab === 'diagnostic-test' ? 'diagnostic tests' : materialsTab === 'drills' ? 'drills' : materialsTab === 'short-quiz' ? 'short quizzes' : 'pre-board tests'} yet
                            </p>
                            <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                              Create your first {materialsTab === 'diagnostic-test' ? 'diagnostic test' : materialsTab === 'drills' ? 'drill' : materialsTab === 'short-quiz' ? 'short quiz' : 'pre-board test'} to get started
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {adminQuizzes.map((quiz) => (
                              <div
                                key={quiz.id}
                                className={`rounded-2xl border p-6 ${
                                  isLightMode
                                    ? 'bg-white border-slate-200'
                                    : 'bg-slate-800/40 border-slate-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                      {quiz.title}
                                    </h4>
                                    {quiz.description && (
                                      <p className={`text-sm mb-3 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {quiz.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <span className={`text-xs px-3 py-1 rounded-full ${
                                        isLightMode
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-purple-900/30 text-purple-300'
                                      }`}>
                                        📝 {quiz.total_questions} questions
                                      </span>
                                      <span className={`text-xs px-3 py-1 rounded-full ${
                                        isLightMode
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-green-900/30 text-green-300'
                                      }`}>
                                        👥 {quiz.total_participants} participants
                                      </span>
                                      {quiz.time_limit_minutes && (
                                        <span className={`text-xs px-3 py-1 rounded-full ${
                                          isLightMode
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-amber-900/30 text-amber-300'
                                        }`}>
                                          ⏱️ {quiz.time_limit_minutes} min
                                        </span>
                                      )}
                                    </div>
                                    <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                      Created {formatRelativeTime(quiz.created_at)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-2xl font-bold mb-2 font-mono ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`}>
                                      {quiz.access_code}
                                    </div>
                                    <div className="space-y-2">
                                      <button
                                        onClick={() => loadLeaderboard(quiz)}
                                        className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                          isLightMode
                                            ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                                            : 'bg-slate-700 text-white hover:bg-slate-600'
                                        }`}
                                      >
                                        📊 Leaderboard
                                      </button>
                                      <div className="grid grid-cols-2 gap-2">
                                        <button
                                          onClick={() => handleArchiveQuiz(quiz.id)}
                                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                            isLightMode
                                              ? 'bg-orange-600 text-white hover:bg-orange-700'
                                              : 'bg-orange-600 text-white hover:bg-orange-700'
                                          }`}
                                        >
                                          📦 Archive
                                        </button>
                                        <button
                                          onClick={() => handleDeleteQuiz(quiz.id)}
                                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                            isLightMode
                                              ? 'bg-red-600 text-white hover:bg-red-700'
                                              : 'bg-red-600 text-white hover:bg-red-700'
                                          }`}
                                        >
                                          🗑️ Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </>
                  ) : (
                    <div className={`rounded-2xl border p-6 space-y-6 ${
                      isLightMode
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-800/40 border-slate-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setShowQuizForm(false)}
                          className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${
                            isLightMode
                              ? 'text-purple-600 hover:text-purple-700'
                              : 'text-purple-400 hover:text-purple-300'
                          }`}
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setShowAddQuestionModal(true)}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600 text-sm"
                        >
                          <span>📚</span>
                          <span>Add from Bank</span>
                        </button>
                      </div>

                      <h4 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        ✏️ Create {materialsTab === 'diagnostic-test' ? '🔍 Diagnostic Test' : materialsTab === 'drills' ? '⚙️ Drill' : materialsTab === 'short-quiz' ? '⏱️ Short Quiz' : '🏆 Pre-Board Test'}
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

                      <form onSubmit={handleCreateQuiz} className="space-y-6">
                        <div className={`rounded-2xl border p-6 space-y-4 ${
                          isLightMode
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-slate-900/20 border-slate-700'
                        }`}>
                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                              Test Title *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., LET Review 2024"
                              value={quizTitle}
                              onChange={(e) => setQuizTitle(e.target.value)}
                              className={`w-full px-4 py-2 rounded-lg border transition ${
                                isLightMode
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-purple-500 focus:bg-white'
                                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-purple-500 focus:bg-slate-900/40'
                              } focus:outline-none`}
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                              Description
                            </label>
                            <textarea
                              placeholder="Optional description for your test"
                              value={quizDescription}
                              onChange={(e) => setQuizDescription(e.target.value)}
                              className={`w-full px-4 py-2 rounded-lg border transition ${
                                isLightMode
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-purple-500 focus:bg-white'
                                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-purple-500 focus:bg-slate-900/40'
                              } focus:outline-none`}
                              rows={3}
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                              Time Limit (minutes)
                            </label>
                            <input
                              type="number"
                              min="1"
                              placeholder="e.g., 30"
                              value={timeLimitMinutes || ''}
                              onChange={(e) => setTimeLimitMinutes(e.target.value ? parseInt(e.target.value) : null)}
                              className={`w-full px-4 py-2 rounded-lg border transition ${
                                isLightMode
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-purple-500 focus:bg-white'
                                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-purple-500 focus:bg-slate-900/40'
                              } focus:outline-none`}
                            />
                          </div>
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
                                className={`w-full px-4 py-2 rounded-lg border transition ${
                                  isLightMode
                                    ? 'bg-white border-slate-300 text-slate-900 focus:border-purple-500 focus:bg-white'
                                    : 'bg-slate-900/20 border-slate-600 text-white focus:border-purple-500 focus:bg-slate-900/40'
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
                                    className={`flex-1 px-4 py-2 rounded-lg border transition ${
                                      isLightMode
                                        ? 'bg-white border-slate-300 text-slate-900 focus:border-purple-500 focus:bg-white'
                                        : 'bg-slate-900/20 border-slate-600 text-white focus:border-purple-500 focus:bg-slate-900/40'
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
                            disabled={loading}
                            className={`w-full px-6 py-3 rounded-xl font-semibold transition ${
                              isLightMode
                                ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {loading ? 'Creating...' : '✓ Create Quiz'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {materialsTab === 'flashcards' && (
                <div>
                  <FlashcardsTab isAdmin={false} />
                </div>
              )}

              {materialsTab === 'questions-bank' && (
                <div>
                  <QuestionsBank />
                </div>
              )}


              {materialsTab === 'archive' && (
                <div className="flex flex-col gap-6">
                  <h3 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    Archived Tests
                  </h3>

                  {quizLoading ? (
                    <div className={`rounded-2xl border p-8 text-center ${
                      isLightMode
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-800/40 border-slate-700'
                    }`}>
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-500 mx-auto mb-4" />
                      <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                        Loading archived tests...
                      </p>
                    </div>
                  ) : archivedQuizzes.length === 0 ? (
                    <div className={`rounded-2xl border p-12 text-center ${
                      isLightMode
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-800/40 border-slate-700'
                    }`}>
                      <p className={`text-lg mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        📦 No archived tests
                      </p>
                      <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                        Archive a test to view it here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {archivedQuizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className={`rounded-2xl border p-6 ${
                            isLightMode
                              ? 'bg-white border-slate-200'
                              : 'bg-slate-800/40 border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                {quiz.title}
                              </h4>
                              {quiz.description && (
                                <p className={`text-sm mb-3 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                  {quiz.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className={`text-xs px-3 py-1 rounded-full ${
                                  isLightMode
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-purple-900/30 text-purple-300'
                                }`}>
                                  📝 {quiz.total_questions} questions
                                </span>
                                <span className={`text-xs px-3 py-1 rounded-full ${
                                  isLightMode
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-green-900/30 text-green-300'
                                }`}>
                                  👥 {quiz.total_participants} participants
                                </span>
                                {quiz.time_limit_minutes && (
                                  <span className={`text-xs px-3 py-1 rounded-full ${
                                    isLightMode
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-amber-900/30 text-amber-300'
                                  }`}>
                                    ⏱️ {quiz.time_limit_minutes} min
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                Archived {formatRelativeTime(quiz.updated_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold mb-2 font-mono ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                {quiz.access_code}
                              </div>
                              <div className="space-y-2">
                                <button
                                  onClick={() => loadLeaderboard(quiz)}
                                  className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                    isLightMode
                                      ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                                      : 'bg-slate-700 text-white hover:bg-slate-600'
                                  }`}
                                >
                                  📊 Leaderboard
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => handleRestoreQuiz(quiz.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                      isLightMode
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                                  >
                                    ↩️ Restore
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuiz(quiz.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                      isLightMode
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <LeaderboardModal
        isOpen={leaderboardModalOpen}
        onClose={() => setLeaderboardModalOpen(false)}
        quizTitle={selectedQuizForLeaderboard?.title || 'Quiz'}
        leaderboard={leaderboard}
        loading={leaderboardLoading}
      />

      <AddQuestionFromBankModal
        isOpen={showAddQuestionModal}
        onClose={() => setShowAddQuestionModal(false)}
        onAddQuestions={handleAddQuestionsFromBank}
      />

      {showAssessmentSurvey && (
        <AssessmentSurvey
          onClose={() => setShowAssessmentSurvey(false)}
          onSuccess={() => {
            setShowAssessmentSurvey(false);
            setAssessmentTemplatesListKey(prev => prev + 1);
          }}
        />
      )}

      {showInsightsModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
          isLightMode ? 'bg-black/30' : 'bg-black/60'
        }`}>
          <div className={`rounded-3xl border w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 ${
            isLightMode
              ? 'border-emerald-200 bg-white'
              : 'border-emerald-500/20 bg-[#064e3b]'
          }`}>
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    📊 Assessment Response Insights
                  </h1>
                  {selectedAssessmentTemplate ? (
                    <p className={`${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                      {selectedAssessmentTemplate.totalResponses} student{selectedAssessmentTemplate.totalResponses !== 1 ? 's' : ''} responded to {selectedAssessmentTemplate.name}
                    </p>
                  ) : (
                    <p className={`${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                      View responses for each assessment
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowInsightsModal(false)}
                  className={`flex-shrink-0 text-2xl transition ${
                    isLightMode
                      ? 'text-slate-400 hover:text-slate-600'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  ✕
                </button>
              </div>

              {/* Templates List View */}
              {!selectedAssessmentTemplate ? (
                insightsLoading ? (
                  <div className={`rounded-2xl border p-12 text-center ${
                    isLightMode
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-white/10 bg-white/5'
                  }`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
                    <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      Loading assessments...
                    </p>
                  </div>
                ) : assessmentTemplatesSummary.length === 0 ? (
                  <div className={`rounded-2xl border p-12 text-center ${
                    isLightMode
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-white/10 bg-white/5'
                  }`}>
                    <p className={`${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                      No assessment templates yet. Create your first assessment to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assessmentTemplatesSummary.map((template) => (
                      <button
                        key={template.id}
                        onClick={async () => {
                          try {
                            setInsightsLoading(true);
                            const data = await api.fetchAssessmentInsights(template.id);
                            setSelectedAssessmentTemplate({ ...template, ...data });
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to fetch template insights');
                          } finally {
                            setInsightsLoading(false);
                          }
                        }}
                        className={`w-full text-left rounded-2xl border p-4 transition ${
                          isLightMode
                            ? 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer'
                            : 'bg-white/5 border-white/10 hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className={`text-lg font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                              {template.name}
                            </h3>
                            {template.description && (
                              <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                                {template.description}
                              </p>
                            )}
                          </div>
                          <span className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${
                            template.totalResponses > 0
                              ? isLightMode
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-emerald-500/20 text-emerald-300'
                              : isLightMode
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {template.totalResponses} response{template.totalResponses !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className={`text-xs mt-2 ${isLightMode ? 'text-slate-500' : 'text-white/50'}`}>
                          {template.questions.length} question{template.questions.length !== 1 ? 's' : ''} • Click to view details
                        </p>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <>
                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedAssessmentTemplate(null)}
                    className={`inline-flex items-center gap-2 text-sm font-semibold transition ${
                      isLightMode
                        ? 'text-emerald-600 hover:text-emerald-700'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    ← Back to Assessments
                  </button>

                  {/* Questions & Responses */}
                  {selectedAssessmentTemplate.questions.length === 0 ? (
                    <div className={`rounded-2xl border p-12 text-center ${
                      isLightMode
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-white/10 bg-white/5'
                    }`}>
                      <p className={`${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                        No responses yet. Students will see their responses here once they complete this assessment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedAssessmentTemplate.questions.map((question: any, idx: number) => {
                        const totalResponses = question.totalResponses || 0;

                        return (
                          <div
                            key={question.id}
                            className={`rounded-2xl border p-6 space-y-4 ${
                              isLightMode
                                ? 'border-slate-200 bg-slate-50'
                                : 'border-white/10 bg-white/5'
                            }`}
                          >
                            <div>
                              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                Q{idx + 1}. {question.id}
                              </h3>
                              <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                                Majority Answer: <span className={`font-semibold ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>{question.majority}</span>
                              </p>
                            </div>

                            <div className="space-y-3">
                              {Object.entries(question.responses)
                                .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                                .map(([choice, count]: [string, any]) => {
                                  const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
                                  const isMajority = choice === question.majority;

                                  return (
                                    <div key={choice} className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className={`text-sm font-medium ${
                                          isMajority
                                            ? isLightMode
                                              ? 'text-emerald-700'
                                              : 'text-emerald-300'
                                            : isLightMode
                                            ? 'text-slate-700'
                                            : 'text-white'
                                        }`}>
                                          {choice}
                                        </span>
                                        <span className={`text-sm font-semibold ${
                                          isMajority
                                            ? isLightMode
                                              ? 'text-emerald-700'
                                              : 'text-emerald-300'
                                            : isLightMode
                                            ? 'text-slate-600'
                                            : 'text-white/70'
                                        }`}>
                                          {count} ({percentage}%)
                                        </span>
                                      </div>
                                      <div className={`w-full h-2 rounded-full overflow-hidden ${
                                        isLightMode ? 'bg-slate-200' : 'bg-slate-700'
                                      }`}>
                                        <div
                                          className={`h-full transition-all duration-300 ${
                                            isMajority
                                              ? 'bg-emerald-500'
                                              : 'bg-slate-400'
                                          }`}
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-6 border-t" style={{
                borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'
              }}>
                <button
                  onClick={() => setShowInsightsModal(false)}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    isLightMode
                      ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
