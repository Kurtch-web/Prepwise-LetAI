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

export interface PvpParticipant {
  id: string;
  user_id: number;
  username: string;
  full_name?: string | null;
  joined_at: string;
  current_question_index: number;
  is_finished: boolean;
  finished_at?: string | null;
  score?: number | null;
  correct_count?: number | null;
  total_questions?: number | null;
}

export interface PvpLobby {
  id: string;
  code: string;
  host_user_id: number;
  quiz_id: string;
  status: 'lobby' | 'in_progress' | 'completed' | 'closed';
  max_players: number;
  time_limit_minutes?: number | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  participants: PvpParticipant[];
}

export interface PvpLobbyQuizQuestion {
  id: string;
  question_text: string;
  choices: string[];
  order: number;
}

export interface PvpLobbyQuiz {
  id: string;
  title: string;
  time_limit_minutes?: number | null;
  total_questions: number;
  questions: PvpLobbyQuizQuestion[];
}

export interface PvpMatchHistoryItem {
  lobby_id: string;
  lobby_code: string;
  quiz_id: string;
  quiz_title: string;
  started_at?: string | null;
  completed_at?: string | null;
  time_limit_minutes?: number | null;
  score?: number | null;
  correct_count?: number | null;
  total_questions?: number | null;
  finished_at?: string | null;
  finish_time_seconds?: number | null;
  rank?: number | null;
  player_count: number;
}

export interface PvpHistoryResponse {
  matches: PvpMatchHistoryItem[];
}

export interface CustomQuizQuestionPayload {
  question_text: string;
  choices: string[];
  correct_answer: string;
}

export interface CustomQuizCreatePayload {
  title: string;
  description?: string | null;
  questions: CustomQuizQuestionPayload[];
}

export interface CustomQuizSummary {
  id: string;
  title: string;
  total_questions: number;
  created_at: string;
}

interface CustomQuizListResponse {
  quizzes: CustomQuizSummary[];
}

const pvpService = {
  async createLobby(quizId: string, maxPlayers: number = 4, timeLimitMinutes?: number | null): Promise<PvpLobby> {
    return request<PvpLobby>('/api/pvp/lobbies', {
      method: 'POST',
      body: JSON.stringify({ quiz_id: quizId, max_players: maxPlayers, time_limit_minutes: timeLimitMinutes ?? null })
    });
  },

  async joinLobby(code: string): Promise<PvpLobby> {
    return request<PvpLobby>('/api/pvp/lobbies/join', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  },

  async getLobby(lobbyId: string): Promise<PvpLobby> {
    return request<PvpLobby>(`/api/pvp/lobbies/${lobbyId}`, {
      method: 'GET'
    });
  },

  async leaveLobby(lobbyId: string) {
    return request(`/api/pvp/lobbies/${lobbyId}/leave`, {
      method: 'POST'
    });
  },

  async startLobby(lobbyId: string): Promise<PvpLobby> {
    return request<PvpLobby>(`/api/pvp/lobbies/${lobbyId}/start`, {
      method: 'POST'
    });
  },

  async updateProgress(lobbyId: string, currentQuestionIndex: number) {
    return request(`/api/pvp/lobbies/${lobbyId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ current_question_index: currentQuestionIndex })
    });
  },

  async finishMatch(lobbyId: string, answers: Record<string, string>) {
    return request(`/api/pvp/lobbies/${lobbyId}/finish`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  },

  async getLobbyQuiz(lobbyId: string): Promise<PvpLobbyQuiz> {
    return request<PvpLobbyQuiz>(`/api/pvp/lobbies/${lobbyId}/quiz`, {
      method: 'GET'
    });
  },

  async getHistory(): Promise<PvpMatchHistoryItem[]> {
    const data = await request<PvpHistoryResponse>('/api/pvp/history', {
      method: 'GET'
    });
    return data.matches || [];
  },

  async listCustomQuizzes(): Promise<CustomQuizSummary[]> {
    const data = await request<CustomQuizListResponse>('/api/quizzes/custom', {
      method: 'GET'
    });
    return data.quizzes || [];
  },

  async createCustomQuiz(payload: CustomQuizCreatePayload): Promise<CustomQuizSummary> {
    return request<CustomQuizSummary>('/api/quizzes/custom', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async deleteCustomQuiz(quizId: string) {
    return request(`/api/quizzes/custom/${quizId}`, {
      method: 'DELETE'
    });
  }
};

export default pvpService;
