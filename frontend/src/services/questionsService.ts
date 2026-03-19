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

export interface QuestionData {
  id: string;
  question_text: string;
  choices: string[];
  correct_answer: string;
  category: string;
  source: 'manual' | 'pdf';
  batch_name?: string;
  creator_username: string;
  created_at: string;
}

const questionsService = {
  async createQuestion(
    questionText: string,
    choices: string[],
    correctAnswer: string,
    category: string,
    source: 'manual' | 'pdf',
    batchName?: string
  ) {
    return request('/api/questions/create', {
      method: 'POST',
      body: JSON.stringify({
        question_text: questionText,
        choices,
        correct_answer: correctAnswer,
        category,
        source,
        batch_name: batchName
      })
    });
  },

  async listQuestions(category?: string) {
    const url = category 
      ? `/api/questions/list?category=${encodeURIComponent(category)}`
      : '/api/questions/list';
    
    return request<{ questions: QuestionData[] }>(url, {
      method: 'GET'
    });
  },

  async getCategories() {
    return request<{ categories: string[] }>('/api/questions/categories', {
      method: 'GET'
    });
  },

  async deleteQuestion(questionId: string) {
    return request(`/api/questions/${questionId}`, {
      method: 'DELETE'
    });
  },

  async downloadQuestions(category?: string) {
    const url = category 
      ? `/api/questions/download?category=${encodeURIComponent(category)}`
      : '/api/questions/download';
    
    return request<{ 
      data: Array<{
        id: string;
        question: string;
        choices: string[];
        correct_answer: string;
        category: string;
        source: string;
        created_by: string;
        created_at: string;
      }>;
      total: number;
      category_filter: string;
    }>(url, {
      method: 'GET'
    });
  }
};

export default questionsService;
