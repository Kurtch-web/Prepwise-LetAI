export type UserRole = 'user' | 'admin';

export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  role: UserRole;
  username: string;
  message: string;
}

export interface OnlineUser {
  username: string;
  lastSeen: string;
  role: UserRole;
}

export interface PresenceEvent {
    id: string;
    username: string;
    role: UserRole;
    type: 'login' | 'logout' | 'signup' | 'community_post';
    timestamp: string;
}

export interface SignupRequest {
    username: string;
    password: string;
}

export interface SignupResponse {
    username: string;
    message: string;
}

export interface AdminStats {
  totalUsers: number;
  activeAdmins: number;
  activeMembers: number;
}

export interface CommunityFeedResponse {
  posts: CommunityPost[];
  nextCursor?: string | null;
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

export interface UserProfile {
  username: string;
  role: UserRole;
  email?: string | null;
  emailVerifiedAt?: string | null;
  phoneE164?: string | null;
  phoneVerifiedAt?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  timezone?: string | null;
  locale?: string | null;
  marketingOptIn: boolean;
  notifyPrefs: Record<string, unknown>;
  updatedAt?: string | null;
}

export interface UpdateProfileRequest {
  email?: string | null;
  phoneE164?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  timezone?: string | null;
  locale?: string | null;
  marketingOptIn?: boolean;
  notifyPrefs?: Record<string, unknown>;
}

// Community types
export interface CommunityAttachment {
  id: string;
  filename: string;
  contentType: string;
  url: string;
}

export interface CommunityComment {
  id: string;
  authorUsername: string;
  body: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorUsername: string;
  body: string;
  createdAt: string;
  updatedAt?: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  attachments: CommunityAttachment[];
  comments: CommunityComment[];
  tags: string[];
  isArchived: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canReport: boolean;
}

import { API_BASE } from '../config/backends';

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
  signup: (body: SignupRequest) =>
    request<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  login: (body: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  logout: (token: string) =>
    request<void>('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchOnlineUsers: (token: string) =>
    request<{ users: OnlineUser[] }>('/admin/online-users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchPresenceEvents: (token: string) =>
    request<{ events: PresenceEvent[] }>('/admin/presence-events', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchPresenceOverview: (token: string) =>
    request<PresenceOverview>('/presence/overview', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchStats: (token: string) =>
    request<AdminStats>('/admin/stats', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchAllUsers: (token: string) =>
    request<{ users: UserInfo[] }>('/admin/users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),

  getProfile: (token: string) =>
    request<UserProfile>('/user/profile', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  updateProfile: (token: string, body: UpdateProfileRequest) =>
    request<UserProfile>('/user/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    }),
  requestEmailCode: (token: string, email: string) =>
    request<void>('/user/request-email-code', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email })
    }),
  verifyEmail: (token: string, code: string) =>
    request<void>('/user/verify-email', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code })
    }),
  requestSmsCode: (token: string, phoneE164: string) =>
    request<void>('/user/request-sms-code', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ phoneE164 })
    }),
  verifyPhone: (token: string, code: string) =>
    request<void>('/user/verify-phone', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code })
    }),

  // Community API
  fetchCommunityPosts: (token: string, opts?: { limit?: number; before?: string | null; q?: string; sort?: 'latest' | 'oldest' | 'most_liked' | 'random' }) => {
    const params = new URLSearchParams();
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.before) params.set('before', opts.before);
    if (opts?.q) params.set('q', opts.q);
    if (opts?.sort) params.set('sort', opts.sort);
    const qs = params.toString();
    return request<CommunityFeedResponse>(`/community/posts${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  fetchMyCommunityPosts: (token: string) =>
    request<{ posts: CommunityPost[] }>('/community/my-posts', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  createCommunityPost: (token: string, bodyText: string, files: File[], tags?: string[]) => {
    const form = new FormData();
    form.append('body', bodyText);
    if (tags && tags.length) {
      for (const t of tags) form.append('tags', t);
    }
    for (const file of files) form.append('files', file);
    return requestForm<{ post: CommunityPost }>('/community/posts', form, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  likePost: (token: string, postId: string) =>
    request<void>(`/community/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }),
  unlikePost: (token: string, postId: string) =>
    request<void>(`/community/posts/${postId}/like`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }),
  addComment: (token: string, postId: string, bodyText: string) =>
    request<{ comment: CommunityComment }>(`/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: bodyText })
    }),
  fetchComments: (token: string, postId: string) =>
    request<{ comments: CommunityComment[] }>(`/community/posts/${postId}/comments`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchLikes: (token: string, postId: string) =>
    request<{ likes: string[] }>(`/community/posts/${postId}/likes`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  updatePost: (token: string, postId: string, bodyText: string, tags?: string[]) =>
    request<{ post: CommunityPost }>(`/community/posts/${postId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: bodyText, tags })
    }),
  archivePost: (token: string, postId: string, archive: boolean) =>
    request<{ post: CommunityPost }>(`/community/posts/${postId}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ archive })
    }),
  deletePost: (token: string, postId: string) =>
    request<void>(`/community/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }),
  addPostAttachments: (token: string, postId: string, files: File[]) => {
    const form = new FormData();
    for (const file of files) form.append('files', file);
    return requestForm<{ post: CommunityPost }>(`/community/posts/${postId}/attachments`, form, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteAttachment: (token: string, postId: string, attachmentId: string) =>
    request<void>(`/community/posts/${postId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }),
  reportPost: (token: string, postId: string, category: 'spam' | 'harassment' | 'misinformation' | 'off_topic' | 'other', reason?: string) =>
    request<void>(`/community/posts/${postId}/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category, reason })
    }),
  fetchNotifications: (token: string) =>
    request<{ notifications: NotificationItem[] }>(`/notifications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  markNotificationRead: (token: string, id: string) =>
    request<void>(`/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchReportedPosts: (token: string) =>
    request<{ reports: Array<{
      id: string;
      postId: string;
      postAuthor: string;
      postAuthorId: number | null;
      postBody: string;
      postCreatedAt: string;
      attachments: Array<{
        id: string;
        filename: string;
        contentType: string;
        url: string | null;
      }>;
      reportedBy: string;
      category: string;
      reason: string;
      createdAt: string;
    }> }>(`/admin/reported-posts`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  deleteReportedPost: (token: string, reportId: string, customReason?: string) =>
    request<void>(`/admin/reported-posts/${reportId}/delete-post`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ customReason: customReason || '' })
    }),

  // Flashcards API
  uploadFlashcard: (token: string, category: string, file: File) => {
    const form = new FormData();
    form.append('category', category);
    form.append('file', file);
    return requestForm<{ id: string; filename: string; category: string; message: string }>('/flashcards/upload', form, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  fetchFlashcards: (token: string) =>
    request<{ flashcards: FlashcardItem[] }>('/flashcards', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  deleteFlashcard: (token: string, flashcardId: string) =>
    request<{ message: string }>(`/flashcards/${flashcardId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }),
  getFlashcardQuestions: (token: string, flashcardId: string) =>
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
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),

  // User search and profile
  searchUsers: (token: string, query?: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    const qs = params.toString();
    return request<{ users: Array<{ username: string; role: string }> }>(`/community/search/users${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  fetchUserProfile: (token: string, username: string) =>
    request<{ profile: UserProfile; posts: CommunityPost[] }>(`/community/users/${username}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
};

export default api;
