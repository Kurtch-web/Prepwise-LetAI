import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { chatApi, ConversationId, ConversationSummary, Message } from '../services/chatApi';
import type { UserRole } from '../services/api';
import { subscribeToChatRequests } from '../services/chatLauncher';

const panelShell = 'rounded-3xl border border-white/10 bg-[#0b111a]/90 shadow-[0_18px_40px_rgba(4,10,20,0.45)] backdrop-blur-xl';
const inputBase = 'w-full rounded-2xl border border-white/10 bg-[#080c14]/70 px-3 py-2 text-sm text-white placeholder:text-white/40';
const quietButton = 'rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-rose-400 hover:bg-rose-500/20';
const accentButton = 'rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-400 hover:bg-indigo-500/20';

type ParticipantOption = {
  username: string;
  role: UserRole;
  online: boolean;
  lastSeen: string | null;
};

function formatPresenceLabel(isOnline: boolean, lastSeen?: string | null): string {
  if (isOnline) {
    return 'Online now';
  }
  if (!lastSeen) {
    return 'Offline';
  }
  try {
    return `Last seen ${new Date(lastSeen).toLocaleTimeString()}`;
  } catch {
    return 'Last seen recently';
  }
}

function AdminStartChat({ onStartConversation }: { onStartConversation: (target: { username: string; role: UserRole }) => Promise<void> }) {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [busy, setBusy] = useState(false);

  if (!session) return null;

  const start = async () => {
    const target = name.trim();
    if (!target) return;
    setBusy(true);
    try {
      await onStartConversation({ username: target, role });
    } finally {
      setBusy(false);
      setName('');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        className="w-full rounded-2xl border border-white/10 bg-[#080c14]/70 px-3 py-2 text-sm text-white placeholder:text-white/40"
        placeholder="Start chat with..."
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <select
        className="rounded-2xl border border-white/10 bg-[#080c14]/70 px-2 py-2 text-sm text-white"
        value={role}
        onChange={e => setRole(e.target.value as UserRole)}
      >
        <option value="admin">admin</option>
        <option value="user">user</option>
      </select>
      <button className={accentButton} disabled={busy} onClick={start} type="button">
        Start
      </button>
    </div>
  );
}

export function ChatWidget() {
  const { session, presenceOverview } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<ConversationId | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [participantQuery, setParticipantQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [conversationQuery, setConversationQuery] = useState('');
  const [sending, setSending] = useState(false);
  const conversationsLoadingRef = useRef(false);
  const messagesLoadingRef = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const unreadTotal = useMemo(() => conversations.reduce((n, c) => n + c.unreadCount, 0), [conversations]);
  const dedupedConversations = useMemo(() => {
    const map = new Map<string, ConversationSummary>();
    conversations.forEach(c => map.set(c.id, c));
    return Array.from(map.values());
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase();
    if (!query) return dedupedConversations;
    return dedupedConversations.filter(c =>
      c.participants.some(p => p.username.toLowerCase().includes(query))
    );
  }, [dedupedConversations, conversationQuery]);

  const selected = useMemo(() => dedupedConversations.find(c => c.id === selectedId) || null, [dedupedConversations, selectedId]);

  const presenceEntries = useMemo(
    () => (presenceOverview ? [...presenceOverview.admins, ...presenceOverview.users] : []),
    [presenceOverview]
  );

  const presenceIndex = useMemo(() => {
    const entries = new Map<string, { online: boolean; lastSeen: string | null }>();
    presenceEntries.forEach(entry => {
      entries.set(entry.username, { online: entry.online, lastSeen: entry.lastSeen ?? null });
    });
    return entries;
  }, [presenceEntries]);

  const participantOptions = useMemo<ParticipantOption[]>(() => {
    if (!session) return [];
    const collection = new Map<string, ParticipantOption>();
    presenceEntries.forEach(entry => {
      if (entry.username === session.username) return;
      collection.set(entry.username, {
        username: entry.username,
        role: entry.role,
        online: entry.online,
        lastSeen: entry.lastSeen ?? null
      });
    });
    return Array.from(collection.values()).sort((a, b) => {
      if (a.online !== b.online) {
        return a.online ? -1 : 1;
      }
      const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
      const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
      return bTime - aTime;
    });
  }, [session, presenceEntries]);

  const filteredParticipantOptions = useMemo(() => {
    const query = participantQuery.trim().toLowerCase();
    if (!query) return participantOptions;
    return participantOptions.filter(option => option.username.toLowerCase().includes(query));
  }, [participantOptions, participantQuery]);

  const onlineParticipantOptions = useMemo(
    () => filteredParticipantOptions.filter(option => option.online),
    [filteredParticipantOptions]
  );

  const offlineParticipantOptions = useMemo(
    () => filteredParticipantOptions.filter(option => !option.online),
    [filteredParticipantOptions]
  );

  const loadConversations = useCallback(
    async (preferredId?: ConversationId | null) => {
      if (!session || conversationsLoadingRef.current) return;
      conversationsLoadingRef.current = true;
      try {
        const response = await chatApi.listConversations(session.token);
        const map = new Map<string, ConversationSummary>();
        response.conversations.forEach(c => map.set(c.id, c));
        setConversations(Array.from(map.values()));
        const candidateId = preferredId ?? selectedId;
        if (!candidateId && response.conversations.length) {
          setSelectedId(response.conversations[0].id);
          return;
        }
        if (candidateId && !response.conversations.some(entry => entry.id === candidateId) && response.conversations.length) {
          setSelectedId(response.conversations[0].id);
        }
      } catch {
        /* silent */
      } finally {
        conversationsLoadingRef.current = false;
      }
    },
    [session, selectedId]
  );

  const loadMessages = useCallback(
    async (id: ConversationId | null) => {
      if (!session || !id || messagesLoadingRef.current) return;
      messagesLoadingRef.current = true;
      try {
        const response = await chatApi.listMessages(session.token, id);
        const map = new Map<string, Message>();
        response.messages.forEach(m => map.set(m.id, m));
        const unique = Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(unique);
        setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 0);
      } catch {
        /* silent */
      } finally {
        messagesLoadingRef.current = false;
      }
    },
    [session]
  );

  useEffect(() => {
    if (!session) return;
    loadConversations(selectedId);
    const timer = window.setInterval(() => {
      if (!conversationsLoadingRef.current) {
        loadConversations(selectedId);
      }
      if (open && selectedId && !messagesLoadingRef.current) {
        loadMessages(selectedId);
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [session, open, selectedId, loadConversations, loadMessages]);

  useEffect(() => {
    if (!open) return;
    loadMessages(selectedId);
  }, [open, selectedId, loadMessages]);

  const openConversationWithParticipants = useCallback(
    async (targets: { username: string; role: UserRole }[]) => {
      if (!session) return;
      const unique = new Map<string, { username: string; role: UserRole }>();
      targets.forEach(participant => {
        if (!participant.username || participant.username === session.username) return;
        unique.set(participant.username, { username: participant.username, role: participant.role });
      });
      if (!unique.size) return;
      setLoading(true);
      try {
        const response = await chatApi.openConversation(session.token, [
          { username: session.username, role: session.role },
          ...Array.from(unique.values())
        ]);
        setOpen(true);
        setSelectedId(response.conversation.id);
        await loadConversations(response.conversation.id);
      } finally {
        setLoading(false);
      }
    },
    [session, loadConversations]
  );

  const beginChatWithTarget = useCallback(
    async (targetUsername: string, targetRole: UserRole) => {
      await openConversationWithParticipants([{ username: targetUsername, role: targetRole }]);
    },
    [openConversationWithParticipants]
  );

  const startChatWithAdmins = useCallback(async () => {
    const adminCandidate = participantOptions.find(option => option.role === 'admin');
    if (adminCandidate) {
      await openConversationWithParticipants([{ username: adminCandidate.username, role: adminCandidate.role }]);
      return;
    }
    await openConversationWithParticipants([{ username: 'admin', role: 'admin' }]);
  }, [participantOptions, openConversationWithParticipants]);

  const toggleParticipant = useCallback((username: string) => {
    setSelectedParticipants(prev => (prev.includes(username) ? prev.filter(entry => entry !== username) : [...prev, username]));
  }, []);

  const startSelectedConversation = useCallback(async () => {
    if (!selectedParticipants.length) return;
    const targets = selectedParticipants
      .map(name => participantOptions.find(option => option.username === name))
      .filter((option): option is ParticipantOption => Boolean(option))
      .map(option => ({ username: option.username, role: option.role }));
    try {
      if (selectedId && selected) {
        // Adding participants to existing group
        await addParticipantsToGroup(targets);
      } else {
        // Creating new conversation
        await openConversationWithParticipants(targets);
      }
      setSelectedParticipants([]);
      setParticipantQuery('');
      setComposerOpen(false);
    } catch {}
  }, [selectedParticipants, participantOptions, openConversationWithParticipants, selectedId, selected]);

  const getConversationLabel = useCallback(
    (conversation: ConversationSummary) => {
      const others = session
        ? conversation.participants.filter(participant => participant.username !== session.username)
        : conversation.participants;
      const names = others.length ? others.map(participant => participant.username) : conversation.participants.map(participant => participant.username);
      if (names.length <= 2) {
        return names.join(', ');
      }
      return `${names[0]}, ${names[1]} + ${names.length - 2} more`;
    },
    [session]
  );

  useEffect(() => {
    if (!session) return;
    const unsubscribe = subscribeToChatRequests(request => {
      if (request.participants && request.participants.length) {
        openConversationWithParticipants(request.participants).catch(() => {});
      } else {
        beginChatWithTarget(request.username, request.role).catch(() => {});
      }
    });
    return () => {
      unsubscribe();
    };
  }, [session, beginChatWithTarget, openConversationWithParticipants]);

  const messagesForRender = useMemo(() => {
    const map = new Map<string, Message>();
    messages.forEach(m => map.set(m.id, m));
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  const send = async () => {
    if (!session || !selectedId || !text.trim() || sending) return;
    const body = text.trim();
    setText('');
    setSending(true);
    try {
      const res = await chatApi.sendMessage(session.token, selectedId, body);
      setMessages(prev => {
        const map = new Map<string, Message>();
        prev.forEach(m => map.set(m.id, m));
        map.set(res.message.id, res.message);
        return Array.from(map.values());
      });
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 0);
    } catch {
      /* silent */
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (conversationId: ConversationId) => {
    if (!session) return;
    try {
      await chatApi.deleteConversation(session.token, conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (selectedId === conversationId) {
        setSelectedId(null);
        setMessages([]);
      }
    } catch {
      /* silent */
    }
  };

  const createEmptyGroup = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const response = await chatApi.openConversation(session.token, [
        { username: session.username, role: session.role }
      ]);
      setOpen(true);
      setSelectedId(response.conversation.id);
      setConversations(prev => {
        const exists = prev.some(c => c.id === response.conversation.id);
        return exists ? prev : [response.conversation, ...prev];
      });
    } finally {
      setLoading(false);
    }
  };

  const addParticipantsToGroup = async (targets: { username: string; role: UserRole }[]) => {
    if (!session || !selectedId) return;
    try {
      const response = await chatApi.addParticipants(session.token, selectedId, targets);
      setConversations(prev =>
        prev.map(c => (c.id === selectedId ? response.conversation : c))
      );
    } catch {
      /* silent */
    }
  };

  if (!session) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        className="relative rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 px-5 py-3 font-semibold text-slate-900 shadow-xl shadow-indigo-500/30"
        onClick={() => {
          setOpen(v => !v);
          if (!open) {
            loadConversations(selectedId);
            if (selectedId) loadMessages(selectedId);
          }
        }}
        data-chat-widget="true"
      >
        Chat
        {unreadTotal ? (
          <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white shadow" aria-label="Unread messages">
            {unreadTotal}
          </span>
        ) : null}
      </button>

      {open && (
        <div className={`${panelShell} mt-3 w-[95vw] max-w-[1040px] p-4 sm:w-[880px] h-[70vh] min-h-[560px]`}>
          <div className="grid h-full min-h-0 gap-3 sm:grid-cols-[260px_1fr] sm:gap-4">
            <aside className="flex min-h-0 flex-col space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white/80">Conversations</p>
                <button className={quietButton} type="button" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                <button className={accentButton} disabled={loading} onClick={startChatWithAdmins} type="button">
                  Contact admin
                </button>
                <button className={accentButton} disabled={loading} onClick={createEmptyGroup} type="button">
                  New group conversation
                </button>
                <button
                  className={accentButton}
                  type="button"
                  onClick={() => setComposerOpen(value => !value)}
                >
                  {isComposerOpen ? 'Hide new chat' : 'New conversation'}
                </button>
                {isComposerOpen && (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <input
                      className={inputBase}
                      placeholder="Search participants"
                      value={participantQuery}
                      onChange={e => setParticipantQuery(e.target.value)}
                    />
                    <div className="space-y-3">
                      {onlineParticipantOptions.length ? (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/80">Online</p>
                          <ul className="mt-2 space-y-2">
                            {onlineParticipantOptions.map(option => {
                              const selectedParticipant = selectedParticipants.includes(option.username);
                              return (
                                <li key={`online-${option.username}`}>
                                  <button
                                    type="button"
                                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                                      selectedParticipant ? 'border-indigo-400/40 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                                    }`}
                                    onClick={() => toggleParticipant(option.username)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(95,248,164,0.8)]" />
                                      <div className="text-left">
                                        <p className="text-sm font-semibold text-white">{option.username}</p>
                                        <p className="text-xs text-white/60">{formatPresenceLabel(option.online, option.lastSeen)}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
                                        {option.role === 'admin' ? 'Admin' : 'Member'}
                                      </span>
                                      {selectedParticipant && <span className="text-xs font-semibold text-indigo-200">Added</span>}
                                    </div>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}
                      {offlineParticipantOptions.length ? (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Offline</p>
                          <ul className="mt-2 space-y-2">
                            {offlineParticipantOptions.map(option => {
                              const selectedParticipant = selectedParticipants.includes(option.username);
                              return (
                                <li key={`offline-${option.username}`}>
                                  <button
                                    type="button"
                                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                                      selectedParticipant ? 'border-indigo-400/40 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                                    }`}
                                    onClick={() => toggleParticipant(option.username)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                                      <div className="text-left">
                                        <p className="text-sm font-semibold text-white">{option.username}</p>
                                        <p className="text-xs text-white/60">{formatPresenceLabel(option.online, option.lastSeen)}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
                                        {option.role === 'admin' ? 'Admin' : 'Member'}
                                      </span>
                                      {selectedParticipant && <span className="text-xs font-semibold text-indigo-200">Added</span>}
                                    </div>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}
                      {!onlineParticipantOptions.length && !offlineParticipantOptions.length ? (
                        <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-xs text-white/60">
                          No participants match your search.
                        </p>
                      ) : null}
                    </div>
                    <p className="text-xs text-white/60">
                      {selectedParticipants.length
                        ? `Selected: ${selectedParticipants.join(', ')}`
                        : 'Select at least one participant to start a chat.'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        className={accentButton}
                        type="button"
                        disabled={!selectedParticipants.length || loading}
                        onClick={startSelectedConversation}
                      >
                        {selectedId && selected ? 'Add to group' : 'Start chat'}
                      </button>
                      <button
                        className={quietButton}
                        type="button"
                        onClick={() => {
                          setSelectedParticipants([]);
                          setParticipantQuery('');
                          setComposerOpen(false);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {session.role === 'admin' && (
                  <AdminStartChat
                    onStartConversation={async ({ username, role }) => {
                      await beginChatWithTarget(username, role);
                    }}
                  />
                )}
                <div className="h-px w-full bg-white/10" />
                {dedupedConversations.length ? (
                  <>
                    <input
                      className={inputBase}
                      placeholder="Search conversations"
                      value={conversationQuery}
                      onChange={e => setConversationQuery(e.target.value)}
                    />
                    {filteredConversations.map(c => (
                    <div
                      key={c.id}
                      className={`${panelShell} group w-full rounded-2xl p-3 transition hover:bg-white/10 ${
                        selectedId === c.id ? 'border-indigo-400/40 bg-indigo-500/10' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex-1 text-left"
                          onClick={() => setSelectedId(c.id)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-white/90">{getConversationLabel(c)}</p>
                            {c.unreadCount ? (
                              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{c.unreadCount}</span>
                            ) : null}
                          </div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                            {c.participants.length > 2 ? `${c.participants.length} participants` : 'Direct chat'}
                          </p>
                          <p className="truncate text-xs text-white/60">{c.lastMessagePreview ?? 'No messages yet'}</p>
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteConversation(c.id);
                          }}
                          className="flex-shrink-0 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-rose-500/20 transition opacity-0 group-hover:opacity-100"
                          title="Delete conversation"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                    {!filteredConversations.length && conversationQuery && (
                      <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-xs text-white/60">
                        No conversations match your search.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-xs text-white/60">
                    No conversations yet. Start one to begin chatting.
                  </p>
                )}
              </div>
            </aside>

            <section className="flex min-h-0 flex-1 flex-col">
              {selected ? (
                <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Participants</p>
                    <button
                      type="button"
                      onClick={() => {
                        setParticipantQuery('');
                        setSelectedParticipants([]);
                        setComposerOpen(true);
                      }}
                      className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition"
                      title="Add participants to group"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {selected.participants.map(participant => {
                      const presence = presenceIndex.get(participant.username);
                      const isSelf = participant.username === session.username;
                      const online = presence?.online ?? isSelf;
                      const label = formatPresenceLabel(online, presence?.lastSeen ?? null);
                      return (
                        <span
                          key={`${participant.username}-${participant.role}`}
                          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                            online ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/10 text-white/80'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-400 shadow-[0_0_6px_rgba(95,248,164,0.8)]' : 'bg-white/30'}`} />
                          <span>{isSelf ? 'You' : participant.username}</span>
                          <span className="text-[10px] font-normal text-white/60">{label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-auto rounded-2xl border border-white/10 bg-white/5 p-3">
                {selected ? (
                  messagesForRender.map(m => {
                    const mine = m.sender.username === session.username;
                    const others = selected.participants.filter(p => p.username !== session.username).map(p => p.username);
                    const isReadByOthers = mine ? others.every(u => (m.readBy ?? []).includes(u)) : false;
                    const status = mine ? (isReadByOthers ? 'Read' : 'Delivered') : '';
                    return (
                      <div
                        key={m.id}
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          mine ? 'ml-auto border border-indigo-400/30 bg-indigo-500/10 text-white' : 'mr-auto border border-white/10 bg-white/10 text-white/90'
                        }`}
                      >
                        <p className="text-xs text-white/60">{mine ? 'You' : m.sender.username}</p>
                        <p>{m.body}</p>
                        <p className="text-[10px] text-white/50">
                          {new Date(m.createdAt).toLocaleTimeString()}
                          {mine ? ` • ${status}` : ''}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-white/70">Select or start a conversation.</p>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  className={`${inputBase} ${!selected ? 'cursor-not-allowed opacity-60' : ''}`}
                  placeholder={selected ? 'Type a message' : 'Select a conversation to chat'}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onFocus={async () => {
                    if (session && selectedId) {
                      try {
                        await chatApi.markRead(session.token, selectedId);
                        setConversations(prev => prev.map(c => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)));
                      } catch {}
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !sending) send();
                  }}
                  disabled={!selected}
                />
                <button className={accentButton} type="button" onClick={send} disabled={!selected || !text.trim() || sending}>
                  Send
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
