import { API_BASE } from '../config/backends';
import { authService } from './authService';

const REQUEST_TIMEOUT = 10000;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    if (options.headers instanceof Headers) {
      for (const [key, value] of options.headers) {
        headers.set(key, value);
      }
    } else if (typeof options.headers === 'object' && options.headers !== null) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers.set(key, String(value));
      }
    }

    const token = authService.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      signal: controller.signal,
      headers
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = (errorBody as { detail?: string; message?: string }).detail ??
        (errorBody as { message?: string }).message ??
        response.statusText;
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface Question {
  id: string;
  question_text: string;
  choices: string[];
  order: number;
}

export interface QuizDetails {
  id: string;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  total_questions: number;
  questions: Question[];
}

export interface QuizSession {
  session_id: string;
  quiz_id: string;
  started_at: string;
  time_limit_minutes?: number;
}

export interface QuizResult {
  session_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

export interface QuizAnswerDetail {
  question_id: string;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  answered_at?: string;
}

export interface QuizLeaderboardEntry {
  user_id: number;
  username: string;
  full_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
  time_taken_seconds: number;
  performance_category: 'Best' | 'Fair' | 'Need Attention';
  answers: QuizAnswerDetail[];
}

export interface AnswerDetail {
  question_id: string;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  answered_at: string;
}

export interface SessionResults {
  session_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  started_at: string;
  completed_at: string;
  answers: AnswerDetail[];
}

const quizService = {
  async createQuiz(title: string, description: string | null, questions: Array<{
    question_text: string;
    choices: string[];
    correct_answer: string;
  }>, timeLimitMinutes: number | null, testType: string = 'diagnostic-test') {
    return request('/api/quizzes/create', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        questions,
        time_limit_minutes: timeLimitMinutes,
        test_type: testType,
      })
    });
  },

  async listMyQuizzes(testType?: string) {
    const url = testType
      ? `/api/quizzes/list?test_type=${testType}`
      : '/api/quizzes/list';
    return request(url, {
      method: 'GET'
    });
  },

  async joinQuizByCode(accessCode: string, testType?: string): Promise<QuizDetails> {
    const url = testType
      ? `/api/quizzes/join/${accessCode}?test_type=${testType}`
      : `/api/quizzes/join/${accessCode}`;
    return request(url, {
      method: 'GET'
    });
  },

  async startSession(quizId: string): Promise<QuizSession> {
    return request(`/api/quizzes/start-session/${quizId}`, {
      method: 'POST'
    });
  },

  async submitAnswer(sessionId: string, questionId: string, selectedAnswer: string) {
    return request('/api/quizzes/submit-answer', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        question_id: questionId,
        selected_answer: selectedAnswer,
      })
    });
  },

  async submitQuiz(sessionId: string): Promise<QuizResult> {
    return request(`/api/quizzes/submit-quiz/${sessionId}`, {
      method: 'POST'
    });
  },

  async getSessionResults(sessionId: string): Promise<SessionResults> {
    return request(`/api/quizzes/results/${sessionId}`, {
      method: 'GET'
    });
  },

  async getQuizLeaderboard(quizId: string) {
    return request(`/api/quizzes/quiz/${quizId}/leaderboard`, {
      method: 'GET'
    });
  },

  async archiveQuiz(quizId: string) {
    return request(`/api/quizzes/archive/${quizId}`, {
      method: 'POST'
    });
  },

  async restoreQuiz(quizId: string) {
    return request(`/api/quizzes/restore/${quizId}`, {
      method: 'POST'
    });
  },

  async listArchivedQuizzes() {
    return request('/api/quizzes/list-archived', {
      method: 'GET'
    });
  },

  async deleteQuiz(quizId: string) {
    return request(`/api/quizzes/delete/${quizId}`, {
      method: 'DELETE'
    });
  },
};

export default quizService;
