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

    const url = API_BASE ? `${API_BASE}${path}` : path;
    console.log(`[practiceQuizzesService] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      signal: controller.signal,
      headers
    });

    console.log(`[practiceQuizzesService] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = (errorBody as { detail?: string; message?: string }).detail ??
        (errorBody as { message?: string }).message ??
        response.statusText;
      console.error(`[practiceQuizzesService] Error: ${errorMessage}`);
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

export interface PracticeQuizDetails {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  time_limit_minutes?: number;
  total_questions: number;
  questions: Array<{
    id: string;
    question_text: string;
    choices: string[];
    order: number;
  }>;
}

export interface PracticeQuizSession {
  session_id: string;
  quiz_id: string;
  started_at: string;
  time_limit_minutes?: number;
  total_questions: number;
}

export interface PracticeQuizResults {
  session_id: string;
  quiz: {
    id: string;
    title: string;
    category: string;
  };
  score: number;
  correct: number;
  total: number;
  started_at: string;
  completed_at: string;
  questions: Array<{
    question_id: string;
    question_text: string;
    choices: string[];
    correct_answer: string;
    your_answer: string | null;
    is_correct: boolean;
    order: number;
  }>;
}

const practiceQuizzesService = {
  async getPracticeQuiz(quizId: string): Promise<PracticeQuizDetails> {
    return request(`/api/practice-quizzes/${quizId}`);
  },

  async startSession(quizId: string): Promise<PracticeQuizSession> {
    return request(`/api/practice-quizzes/${quizId}/start-session`, {
      method: 'POST'
    });
  },

  async submitAnswer(sessionId: string, questionId: string, selectedAnswer: string) {
    return request(`/api/practice-quizzes/${sessionId}/submit-answer`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        selected_answer: selectedAnswer
      })
    });
  },

  async submitQuiz(sessionId: string): Promise<any> {
    return request(`/api/practice-quizzes/${sessionId}/submit`, {
      method: 'POST'
    });
  },

  async getResults(sessionId: string): Promise<PracticeQuizResults> {
    return request(`/api/practice-quizzes/${sessionId}/results`);
  },

  async getUserSessions() {
    return request('/api/practice-quizzes/user/sessions');
  }
};

export default practiceQuizzesService;
