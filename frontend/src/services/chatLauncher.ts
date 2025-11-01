import type { UserRole } from './api';

export type ChatRequest = {
  username: string;
  role: UserRole;
  participants?: { username: string; role: UserRole }[];
};

const CHAT_EVENT_KEY = 'app:start-chat';

type ChatRequestListener = (payload: ChatRequest) => void;

export function requestChat(payload: ChatRequest) {
  window.dispatchEvent(new CustomEvent<ChatRequest>(CHAT_EVENT_KEY, { detail: payload }));
}

export function subscribeToChatRequests(listener: ChatRequestListener): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ChatRequest>;
    if (customEvent.detail) {
      listener(customEvent.detail);
    }
  };

  window.addEventListener(CHAT_EVENT_KEY, handler);
  return () => window.removeEventListener(CHAT_EVENT_KEY, handler);
}
