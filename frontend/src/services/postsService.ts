import { API_BASE } from '../config/backends';
import { authService } from './authService';

const REQUEST_TIMEOUT = 10000;

export interface PostAttachment {
  id: string;
  file_url: string;
  file_type: 'image' | 'video' | 'pdf' | 'file';
  original_filename: string;
}

export interface PostComment {
  id: string;
  user_id: number;
  content: string;
  username: string;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: number;
  author_username: string;
  content: string;
  category: 'user' | 'admin' | 'news' | 'important';
  attachments: PostAttachment[];
  like_count: number;
  comment_count: number;
  user_liked: boolean;
  view_count: number;
  is_flagged: boolean;
  flag_reason?: string;
  has_appeal: boolean;
  appeal_text?: string;
  created_at: string;
  updated_at: string;
}

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

async function requestForm<T>(path: string, form: FormData, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT + 30000);

  try {
    const headers = new Headers();

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

export const postsService = {
  // Create a new post with optional attachments
  createPost: (content: string, files: File[] = [], category: string = 'user') => {
    const form = new FormData();
    form.append('content', content);
    form.append('category', category);
    files.forEach((file, index) => {
      form.append('files', file);
    });
    return requestForm<{ id: string; message: string; attachments: PostAttachment[] }>('/posts', form, {
      method: 'POST'
    });
  },

  // Fetch all posts (no caching - always fresh)
  fetchPosts: (skip: number = 0, limit: number = 20) =>
    request<{ posts: Post[] }>(`/posts?skip=${skip}&limit=${limit}&_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store'
    }),

  // Fetch a single post (no caching - always fresh)
  fetchPost: (postId: string) =>
    request<Post>(`/posts/${postId}?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store'
    }),

  // Like a post
  likePost: (postId: string) =>
    request<{ message: string }>(`/posts/${postId}/likes`, {
      method: 'POST'
    }),

  // Unlike a post
  unlikePost: (postId: string) =>
    request<{ message: string }>(`/posts/${postId}/likes`, {
      method: 'DELETE'
    }),

  // Add a comment to a post
  createComment: (postId: string, content: string) => {
    const form = new FormData();
    form.append('content', content);
    return requestForm<PostComment>(`/posts/${postId}/comments`, form, {
      method: 'POST'
    });
  },

  // Fetch comments for a post (no caching - always fresh)
  fetchComments: (postId: string, skip: number = 0, limit: number = 50) =>
    request<{ comments: PostComment[] }>(`/posts/${postId}/comments?skip=${skip}&limit=${limit}&_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store'
    }),

  // Delete a comment
  deleteComment: (postId: string, commentId: string) =>
    request<{ message: string }>(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE'
    }),

  // Delete a post (admin only)
  deletePost: (postId: string) =>
    request<{ message: string }>(`/posts/${postId}`, {
      method: 'DELETE'
    }),

  // Flag a post (admin only)
  flagPost: (postId: string, reason: string) => {
    const form = new FormData();
    form.append('reason', reason);
    return requestForm<{ message: string }>(`/posts/${postId}/flag`, form, {
      method: 'POST'
    });
  },

  // Unflag a post (admin only)
  unflagPost: (postId: string) =>
    request<{ message: string }>(`/posts/${postId}/flag`, {
      method: 'DELETE'
    }),

  // Submit appeal for flagged post
  submitAppeal: (postId: string, appealText: string) => {
    const form = new FormData();
    form.append('appeal_text', appealText);
    return requestForm<{ message: string }>(`/posts/${postId}/appeal`, form, {
      method: 'POST'
    });
  },

  // Deny appeal and delete post (admin only)
  denyAppeal: (postId: string) =>
    request<{ message: string }>(`/posts/${postId}/appeal/deny`, {
      method: 'POST'
    }),

  // Get all posts for admin moderation (with flag status)
  fetchAllPostsForModeration: (skip: number = 0, limit: number = 50) =>
    request<{ posts: Post[] }>(`/posts/admin/moderation?skip=${skip}&limit=${limit}&_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store'
    })
};

export default postsService;
