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

export interface LearningPreference {
  video: number;
  flashcards: number;
  practice_tests: number;
  study_guides: number;
  discussions: number;
}

export interface AssessmentRecommendation {
  primary_method: string;
  secondary_methods: string[];
  suggested_duration: string;
  weak_areas: string[];
  strengths: string[];
  priority_guides: string[];
}

export interface AssessmentItem {
  id: string;
  responses: Record<string, unknown>;
  learning_preferences: LearningPreference;
  recommendations: AssessmentRecommendation;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  reviewType: string | null;
  targetExamDate: string | null;
  instructorId?: number | null;
  createdAt: string;
  assessment: AssessmentItem | null;
}

import { API_BASE } from '../config/backends';
import { authService } from './authService';

const REQUEST_TIMEOUT = 10000; // 10 seconds timeout for slow connections

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    // Add existing headers from options if any
    if (options.headers instanceof Headers) {
      for (const [key, value] of options.headers) {
        headers.set(key, value);
      }
    } else if (typeof options.headers === 'object' && options.headers !== null) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers.set(key, String(value));
      }
    }

    // Add auth token if available
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

async function requestForm<T>(path: string, form: FormData, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT + 10000); // Longer timeout for file uploads

  try {
    const headers = new Headers();

    // Add existing headers from options if any
    if (options.headers instanceof Headers) {
      for (const [key, value] of options.headers) {
        headers.set(key, value);
      }
    } else if (typeof options.headers === 'object' && options.headers !== null) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers.set(key, String(value));
      }
    }

    // Add auth token if available
    const token = authService.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'POST',
      credentials: 'include',
      body: form,
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

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // System API
  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Backend health check failed:', err);
      throw err;
    }
  },

  // Videos API
  initVideoUpload: (data: {
    title: string;
    description?: string | null;
    category: string;
    filename: string;
    content_type?: string;
    is_downloadable?: boolean;
  }) =>
    request<{
      uploadUrl: string;
      storagePath: string;
      videoId: string;
      bucket: string;
      message: string;
    }>('/api/videos/upload/init', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  completeVideoUpload: (data: {
    title: string;
    description?: string | null;
    category: string;
    storage_path: string;
    file_url: string;
    is_downloadable?: boolean;
  }) =>
    request<{
      id: string;
      title: string;
      description?: string | null;
      category: string;
      file_url: string;
      is_downloadable: boolean;
      created_at: string;
      uploader: { id: string; username: string };
    }>('/api/videos/upload/complete', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  addVideoLink: (data: {
    title: string;
    description?: string | null;
    category: string;
    file_url: string;
    is_downloadable?: boolean;
  }) =>
    request<{
      id: string;
      title: string;
      description?: string | null;
      category: string;
      file_url: string;
      is_downloadable: boolean;
      created_at: string;
      uploader: { id: string; username: string };
    }>('/api/videos/link', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

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
    }),

  // Assessments API
  fetchAssessmentTemplates: () =>
    request<{ templates: any[] }>('/assessments/templates', {
      method: 'GET'
    }),
  createAssessment: (templateId: string, responses: Record<string, unknown>) =>
    request<any>('/assessments', {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        responses
      })
    }),

  // Admin API
  fetchUsersWithProfiles: () =>
    request<{ users: UserProfile[] }>('/admin/users-profiles', {
      method: 'GET'
    }),
  fetchAssessmentInsights: (templateId?: string) =>
    request<{
      questions: Array<{
        id: string;
        responses: Record<string, number>;
        majority: string;
        totalResponses: number;
      }>;
      totalResponses: number;
    }>(`/admin/assessment-insights${templateId ? `?template_id=${templateId}` : ''}`, {
      method: 'GET'
    }),
  fetchAssessmentTemplatesSummary: () =>
    request<{
      templates: Array<{
        id: string;
        name: string;
        description?: string;
        questions: Array<{ title: string; description?: string; choices: string[] }>;
        totalResponses: number;
        created_at: string;
        updated_at: string;
      }>;
    }>('/admin/assessment-templates-summary', {
      method: 'GET'
    }),
  createAssessmentTemplate: (name: string, description: string | null, questions: any[]) =>
    request<any>('/admin/assessment-templates', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        questions
      })
    }),
  fetchAdminAssessmentTemplates: () =>
    request<{ templates: any[] }>('/admin/assessment-templates', {
      method: 'GET'
    }),
  deleteAssessmentTemplate: (templateId: string) =>
    request<{ message: string }>(`/admin/assessment-templates/${templateId}`, {
      method: 'DELETE'
    })
};

export default api;
