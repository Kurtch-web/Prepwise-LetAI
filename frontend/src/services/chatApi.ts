import { UserRole } from './api';

export type ConversationId = string;

export interface ConversationSummary {
  id: ConversationId;
  participants: { username: string; role: UserRole }[];
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: ConversationId;
  sender: { username: string; role: UserRole };
  body: string;
  createdAt: string;
  readBy: string[];
}

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {})
    }
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { detail?: string; message?: string }).detail ?? (body as { message?: string }).message ?? res.statusText;
    throw new Error(msg);
  }
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}

export const chatApi = {
  openConversation: (token: string, participants: { username: string; role: UserRole }[]) =>
    request<{ conversation: ConversationSummary }>('/chat/conversations/open', token, {
      method: 'POST',
      body: JSON.stringify({ participants })
    }),
  listConversations: (token: string) =>
    request<{ conversations: ConversationSummary[] }>('/chat/conversations', token),
  listMessages: (token: string, conversationId: ConversationId) =>
    request<{ messages: Message[] }>(`/chat/conversations/${conversationId}/messages`, token),
  sendMessage: (token: string, conversationId: ConversationId, body: string) =>
    request<{ message: Message }>(`/chat/conversations/${conversationId}/messages`, token, {
      method: 'POST',
      body: JSON.stringify({ body })
    }),
  markRead: (token: string, conversationId: ConversationId) =>
    request<void>(`/chat/conversations/${conversationId}/read`, token, { method: 'POST' }),
  deleteConversation: (token: string, conversationId: ConversationId) =>
    request<void>(`/chat/conversations/${conversationId}`, token, { method: 'DELETE' }),
  addParticipants: (token: string, conversationId: ConversationId, participants: { username: string; role: UserRole }[]) =>
    request<{ conversation: ConversationSummary }>(`/chat/conversations/${conversationId}/participants`, token, {
      method: 'POST',
      body: JSON.stringify({ participants })
    })
};
