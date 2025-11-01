import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { api, PresenceEvent, NotificationItem } from '../services/api';
import { chatApi, ConversationSummary } from '../services/chatApi';

const cardShellClasses =
  'rounded-3xl border border-white/10 bg-[#0b111a]/80 p-7 shadow-[0_18px_40px_rgba(4,10,20,0.45)] backdrop-blur-xl';

function describeEvent(event: PresenceEvent) {
  const timestamp = new Date(event.timestamp).toLocaleTimeString();
  if (event.type === 'signup') {
    return { label: `New member account • ${event.username}`, timestamp };
  }
  if (event.type === 'login') {
    return { label: `Login • ${event.username} (${event.role})`, timestamp };
  }
  if (event.type === 'community_post') {
    return { label: `${event.username} added a post on the community`, timestamp };
  }
  return { label: `Logout • ${event.username} (${event.role})`, timestamp };
}

export function NotificationsPage() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [presenceEvents, setPresenceEvents] = useState<PresenceEvent[]>([]);
  const [readMap, setReadMap] = useState<Record<string, boolean>>({});
  const [dbNotifications, setDbNotifications] = useState<NotificationItem[]>([]);

  const storageKey = session ? `presence_read:${session.username}` : undefined;

  useEffect(() => {
    if (!session) {
      setConversations([]);
      setDbNotifications([]);
      return;
    }
    const loadChats = async () => {
      try {
        const res = await chatApi.listConversations(session.token);
        setConversations(res.conversations);
      } catch {}
    };
    const loadNotifs = async () => {
      try {
        const res = await api.fetchNotifications(session.token);
        setDbNotifications(res.notifications);
      } catch {}
    };
    loadChats();
    loadNotifs();
    const t1 = window.setInterval(loadChats, 3000);
    const t2 = window.setInterval(loadNotifs, 5000);
    return () => { window.clearInterval(t1); window.clearInterval(t2); };
  }, [session]);

  useEffect(() => {
    if (!session || session.role !== 'admin') {
      setPresenceEvents([]);
      setReadMap({});
      return;
    }
    // Load read state
    try {
      const raw = storageKey ? window.localStorage.getItem(storageKey) : null;
      setReadMap(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
      setReadMap({});
    }

    const loadEvents = async () => {
      try {
        const res = await api.fetchPresenceEvents(session.token);
        const sorted = [...res.events].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setPresenceEvents(sorted.slice(0, 20));
      } catch {}
    };
    loadEvents();
    const timer = window.setInterval(loadEvents, 4000);
    return () => window.clearInterval(timer);
  }, [session, storageKey]);

  const unread = useMemo(() => conversations.filter(c => c.unreadCount > 0), [conversations]);

  const hasPresenceAlerts = session?.role === 'admin' && presenceEvents.length > 0;

  const toggleRead = (id: string, next: boolean) => {
    setReadMap(prev => {
      const updated = { ...prev, [id]: next };
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const markAllRead = () => {
    const updated: Record<string, boolean> = {};
    for (const e of presenceEvents) updated[e.id] = true;
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
    }
    setReadMap(updated);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid max-w-[880px] gap-3">
        <h1 className="text-4xl font-extrabold text-white md:text-5xl">Notifications</h1>
        <p className="max-w-2xl text-lg text-white/70">Recent system messages and presence updates.</p>
      </div>
      <section className={`${cardShellClasses} space-y-6`}>
        {session?.role === 'admin' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Presence alerts</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300">
                  Admin
                </span>
                {hasPresenceAlerts ? (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/20"
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>
            </div>
            {hasPresenceAlerts ? (
              <ul className="grid gap-2">
                {presenceEvents.map(event => {
                  const { label, timestamp } = describeEvent(event);
                  const isRead = !!readMap[event.id];
                  return (
                    <li
                      key={event.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {!isRead ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                        )}
                        <span className="text-white/90">{label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/60">{timestamp}</span>
                        <button
                          type="button"
                          onClick={() => toggleRead(event.id, !isRead)}
                          className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/80 hover:bg-white/20"
                        >
                          {isRead ? 'Mark unread' : 'Mark read'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-white/70">No presence alerts yet.</p>
            )}
          </div>
        ) : null}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Community alerts</h2>
          {dbNotifications.length === 0 ? (
            <p className="text-sm text-white/70">No community notifications yet.</p>
          ) : (
            <ul className="grid gap-2">
              {dbNotifications.map(n => (
                <li key={n.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-white/90">
                      {n.type === 'community_post_reported' ? 'Post reported' : n.type === 'community_post_edited' ? 'Post edited' : n.type === 'community_post_deleted' ? 'Post deleted' : n.type}
                    </p>
                    <p className="text-white/60">{n.data && (n.data as any).author ? `Author: ${(n.data as any).author}` : ''}</p>
                  </div>
                  <span className="text-white/60">{new Date(n.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Messages</h2>
          {unread.length === 0 ? (
            <p className="text-sm text-white/70">No message notifications yet.</p>
          ) : (
            <ul className="grid gap-2">
              {unread.map(c => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-white/90">{c.participants.map(p => p.username).join(', ')}</p>
                    <p className="text-white/60">{c.lastMessagePreview}</p>
                  </div>
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{c.unreadCount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
