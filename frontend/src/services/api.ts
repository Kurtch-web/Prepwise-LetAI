export type UserRole = 'user' | 'admin';

export interface OnlineUser {
  username: string;
  lastSeen: string;
  role: UserRole;
}

export interface PresenceEvent {
    id: string;
    username: string;
    role: UserRole;
    type: 'login' | 'logout' | 'signup' | 'flashcard_upload';
    timestamp: string;
}

export interface AdminStats {
  totalUsers: number;
  activeAdmins: number;
  activeMembers: number;
}

export interface UserInfo {
  username: string;
  role: UserRole;
  online: boolean;
  lastSeen?: string | null;
}

export interface PresenceOverview {
  admins: UserInfo[];
  users: UserInfo[];
}

export interface NotificationItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
  readAt?: string | null;
}

export interface FlashcardItem {
  id: string;
  filename: string;
  category: string;
  uploader: string;
  createdAt: string;
  url?: string | null;
  totalQuestions?: number;
}

import { API_BASE } from '../config/backends';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
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
}

async function requestForm<T>(path: string, form: FormData, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'POST',
    credentials: 'include',
    body: form,
    headers: {
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = (errorBody as { detail?: string; message?: string }).detail ??
      (errorBody as { message?: string }).message ??
      response.statusText;
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

export const api = {
  // Flashcards API
  uploadFlashcard: (category: string, file: File) => {
    const form = new FormData();
    form.append('category', category);
    form.append('file', file);
    return requestForm<{ id: string; filename: string; category: string; message: string }>('/flashcards/upload', form, {
      method: 'POST'
    });
  },
  fetchFlashcards: () =>
    request<{ flashcards: FlashcardItem[] }>('/flashcards', {
      method: 'GET'
    }),
  deleteFlashcard: (flashcardId: string) =>
    request<{ message: string }>(`/flashcards/${flashcardId}`, {
      method: 'DELETE'
    }),
  getFlashcardQuestions: (flashcardId: string) =>
    request<{
      id: string;
      filename: string;
      category: string;
      uploader: string;
      createdAt: string;
      url?: string | null;
      parsedData: {
        total_questions: number;
        questions_with_answers: number;
        questions_without_answers: number;
        missing_numbers: number[];
        questions: Array<{
          number: number;
          question: string;
          choices: string[];
          correct_answer: string;
        }>;
      };
    }>(`/flashcards/${flashcardId}`, {
      method: 'GET'
    }),

  // Presence API
  fetchOnlineUsers: () =>
    request<{ users: OnlineUser[] }>('/admin/online-users', {
      method: 'GET'
    }),
  fetchPresenceEvents: () =>
    request<{ events: PresenceEvent[] }>('/admin/presence-events', {
      method: 'GET'
    }),
  fetchPresenceOverview: () =>
    request<PresenceOverview>('/presence/overview', {
      method: 'GET'
    }),
  fetchStats: () =>
    request<AdminStats>('/admin/stats', {
      method: 'GET'
    }),
  fetchAllUsers: () =>
    request<{ users: UserInfo[] }>('/admin/users', {
      method: 'GET'
    }),

  // Notifications API
  fetchNotifications: () =>
    request<{ notifications: NotificationItem[] }>(`/notifications`, {
      method: 'GET'
    }),
  markNotificationRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, {
      method: 'POST'
    })
};

export default api;
