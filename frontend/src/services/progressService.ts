// Service for fetching user progress data including quiz results and analytics
import { API_BASE } from '../config/backends';
import { authService } from './authService';

export interface QuizResult {
  type: 'quiz' | 'practice-quiz';
  sessionId: string;
  quizId: string;
  quizTitle: string;
  testType?: string;
  category?: string;
  score: number;
  percentage?: number;
  correct?: number;
  total: number;
  startedAt: string;
  completedAt?: string;
  questions: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  choices?: string[];
}

// Helper function to make authenticated API requests
async function authenticatedFetch<T>(path: string): Promise<T> {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  const token = authService.getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchAllQuizResults(): Promise<QuizResult[]> {
  try {
    const [quizzes, practiceQuizzes] = await Promise.all([
      fetchQuizSessions(),
      fetchPracticeQuizSessions()
    ]);

    return [...quizzes, ...practiceQuizzes].sort((a, b) => {
      return new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime();
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return [];
  }
}

async function fetchQuizSessions(): Promise<QuizResult[]> {
  try {
    const data = await authenticatedFetch<any>('/api/quizzes/user/sessions');

    return (data.sessions || []).map((session: any) => ({
      type: 'quiz',
      sessionId: session.session_id,
      quizId: session.quiz_id,
      quizTitle: session.quiz_title || 'Quiz',
      testType: session.test_type || 'diagnostic-test',
      score: session.score || 0,
      percentage: session.percentage || 0,
      total: session.total_questions || 0,
      correct: session.score || 0,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      questions: []
    }));
  } catch (error) {
    console.error('Error fetching quiz sessions:', error);
    return [];
  }
}

async function fetchPracticeQuizSessions(): Promise<QuizResult[]> {
  try {
    const data = await authenticatedFetch<any>('/api/practice-quizzes/user/sessions');

    return (data.sessions || []).map((session: any) => ({
      type: 'practice-quiz',
      sessionId: session.session_id,
      quizId: session.quiz_id,
      quizTitle: session.quiz_title || 'Practice Quiz',
      category: session.category,
      score: session.score || 0,
      percentage: session.score || 0,
      total: session.total_questions || 0,
      correct: session.correct || 0,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      questions: []
    }));
  } catch (error) {
    console.error('Error fetching practice quiz sessions:', error);
    return [];
  }
}

export async function fetchQuizResultDetails(sessionId: string, type: 'quiz' | 'practice-quiz'): Promise<QuizResult | null> {
  try {
    const endpoint = type === 'quiz'
      ? `/api/quizzes/results/${sessionId}`
      : `/api/practice-quizzes/${sessionId}/results`;

    const data = await authenticatedFetch<any>(endpoint);

    // Map both 'questions' and 'answers' fields to handle different API formats
    const questionsArray = data.questions || data.answers || [];

    return {
      type,
      sessionId: data.session_id,
      quizId: data.quiz?.id || data.quiz_id || '',
      quizTitle: data.quiz?.title || data.quiz_title || 'Quiz',
      testType: data.test_type,
      category: data.quiz?.category,
      score: data.score || 0,
      percentage: data.percentage || 0,
      correct: data.score || 0,
      total: data.total_questions || data.total,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      questions: questionsArray.map((q: any) => ({
        questionId: q.question_id,
        questionText: q.question_text,
        userAnswer: q.your_answer || q.user_answer,
        correctAnswer: q.correct_answer,
        isCorrect: q.is_correct,
        choices: q.choices
      }))
    };
  } catch (error) {
    console.error('Error fetching quiz result details:', error);
    return null;
  }
}

export interface AnalyticsData {
  videosWatched: number;
  totalWatchTimeSeconds: number;
  totalWatchTimeHours: number;
  averageQuizScore: number;
  totalQuizzesCompleted: number;
  videos: Array<{
    videoId: string;
    videoTitle: string;
    category: string;
    watchedSeconds: number;
    videoDuration?: number;
    isCompleted: boolean;
  }>;
  quizzesByCategory: Record<string, {
    count: number;
    averageScore: number;
  }>;
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  try {
    const [watchStatsData, quizzesResponse] = await Promise.all([
      authenticatedFetch<any>('/api/videos/user/watch-stats').catch(() => null),
      fetchAllQuizResults()
    ]);

    let watchStats = {
      total_videos_watched: 0,
      total_watch_time_seconds: 0,
      total_watch_time_hours: 0,
      videos: []
    };

    if (watchStatsData) {
      watchStats = {
        total_videos_watched: watchStatsData.total_videos_watched || 0,
        total_watch_time_seconds: watchStatsData.total_watch_time_seconds || 0,
        total_watch_time_hours: watchStatsData.total_watch_time_hours || 0,
        videos: watchStatsData.videos || []
      };
    }

    // Calculate quiz statistics
    const completedQuizzes = quizzesResponse.filter(q => q.completedAt);
    const averageScore = completedQuizzes.length > 0
      ? completedQuizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / completedQuizzes.length
      : 0;

    // Group quizzes by category
    const quizzesByCategory: Record<string, { count: number; averageScore: number }> = {};
    completedQuizzes.forEach(quiz => {
      const category = quiz.category || 'General';
      if (!quizzesByCategory[category]) {
        quizzesByCategory[category] = { count: 0, averageScore: 0 };
      }
      quizzesByCategory[category].count++;
      quizzesByCategory[category].averageScore += quiz.percentage || 0;
    });

    // Calculate averages for each category
    Object.keys(quizzesByCategory).forEach(category => {
      quizzesByCategory[category].averageScore /= quizzesByCategory[category].count;
    });

    return {
      videosWatched: watchStats.total_videos_watched,
      totalWatchTimeSeconds: watchStats.total_watch_time_seconds,
      totalWatchTimeHours: watchStats.total_watch_time_hours,
      averageQuizScore: Math.round(averageScore),
      totalQuizzesCompleted: completedQuizzes.length,
      videos: watchStats.videos.map((v: any) => ({
        videoId: v.video_id,
        videoTitle: v.video_title,
        category: v.category,
        watchedSeconds: v.watched_seconds,
        videoDuration: v.video_duration,
        isCompleted: v.is_completed
      })),
      quizzesByCategory
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      videosWatched: 0,
      totalWatchTimeSeconds: 0,
      totalWatchTimeHours: 0,
      averageQuizScore: 0,
      totalQuizzesCompleted: 0,
      videos: [],
      quizzesByCategory: {}
    };
  }
}

// Practice Tests - Sessions from completed quizzes that can be retaken for practice
export interface PracticeTestSession {
  id: string;
  originalQuizId: string;
  quizTitle: string;
  testType: string;
  attempts: number;
  bestScore: number;
  createdAt: string;
  sessions: QuizResult[];
}

export async function fetchCompletedQuizzesAsGrouped(): Promise<Record<string, QuizResult[]>> {
  try {
    const quizzes = await fetchAllQuizResults();
    const completed = quizzes.filter(q => q.completedAt);

    // Group by quiz ID to allow multiple attempts
    const grouped: Record<string, QuizResult[]> = {};
    completed.forEach(quiz => {
      if (!grouped[quiz.quizId]) {
        grouped[quiz.quizId] = [];
      }
      grouped[quiz.quizId].push(quiz);
    });

    return grouped;
  } catch (error) {
    console.error('Error fetching completed quizzes:', error);
    return {};
  }
}

export async function fetchPracticeTestSessions(): Promise<Record<string, PracticeTestSession>> {
  try {
    const completedQuizzes = await fetchCompletedQuizzesAsGrouped();
    const sessions: Record<string, PracticeTestSession> = {};

    Object.entries(completedQuizzes).forEach(([quizId, attempts]) => {
      if (attempts.length > 0) {
        // Determine the test type based on the first attempt
        // If it's an informal practice quiz (type: 'practice-quiz'), use that
        const testType = attempts[0].type === 'practice-quiz'
          ? 'practice-quiz'
          : (attempts[0].testType || 'diagnostic-test');

        // First attempt is the official test, rest are practice attempts
        const practiceAttempts = Math.max(0, attempts.length - 1);
        const bestScore = Math.max(...attempts.map(a => a.percentage || 0));
        sessions[quizId] = {
          id: quizId,
          originalQuizId: quizId,
          quizTitle: attempts[0].quizTitle,
          testType: testType,
          attempts: practiceAttempts,
          bestScore,
          createdAt: attempts[0].startedAt,
          sessions: attempts
        };
      }
    });

    return sessions;
  } catch (error) {
    console.error('Error fetching practice test sessions:', error);
    return {};
  }
}
