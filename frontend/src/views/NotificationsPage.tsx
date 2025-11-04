import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { api, PresenceEvent, NotificationItem } from '../services/api';
import { chatApi, ConversationSummary } from '../services/chatApi';

const cardShellClasses =
  'rounded-3xl border border-white/10 bg-[#0b111a]/80 p-7 shadow-[0_18px_40px_rgba(4,10,20,0.45)] backdrop-blur-xl';

interface ReportedPost {
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
}

type NotificationTab = 'reported-posts' | 'presence' | 'community' | 'messages';

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

function ReportedPostModal({
  report,
  onClose,
  onDelete
}: {
  report: ReportedPost;
  onClose: () => void;
  onDelete: (reportId: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      setDeleting(true);
      try {
        await onDelete(report.id);
        onClose();
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`${cardShellClasses} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Report Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-2">Report Information</h3>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60 mb-1">Reported By</p>
                <p className="text-white font-semibold">{report.reportedBy}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60 mb-1">Category</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-sm font-semibold">
                    {report.category}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60 mb-1">Reason</p>
                <p className="text-white">{report.reason || 'No reason provided'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60 mb-1">Reported At</p>
                <p className="text-white">{new Date(report.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-2">Reported Post</h3>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div>
                <p className="text-xs text-white/60 mb-1">Author</p>
                <p className="text-white font-semibold">{report.postAuthor}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Posted At</p>
                <p className="text-white">{new Date(report.postCreatedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Content</p>
                <p className="text-white/90 whitespace-pre-wrap">{report.postBody}</p>
              </div>
              {report.attachments.length > 0 && (
                <div>
                  <p className="text-xs text-white/60 mb-2">Attachments</p>
                  <div className="grid grid-cols-2 gap-2">
                    {report.attachments.map(att => (
                      <div key={att.id} className="rounded-lg overflow-hidden border border-white/10">
                        {att.contentType.startsWith('image/') && att.url ? (
                          <img src={att.url} alt={att.filename} className="w-full h-40 object-cover" />
                        ) : (
                          <div className="w-full h-40 bg-white/5 flex items-center justify-center">
                            <svg className="h-8 w-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                        <p className="text-xs text-white/60 px-2 py-1 truncate">{att.filename}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Post'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [presenceEvents, setPresenceEvents] = useState<PresenceEvent[]>([]);
  const [readMap, setReadMap] = useState<Record<string, boolean>>({});
  const [dbNotifications, setDbNotifications] = useState<NotificationItem[]>([]);
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<NotificationTab>('presence');
  const [selectedReport, setSelectedReport] = useState<ReportedPost | null>(null);

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
      setReportedPosts([]);
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
    
    const loadReports = async () => {
      try {
        const res = await api.fetchReportedPosts(session.token);
        setReportedPosts(res.reports);
      } catch {}
    };

    loadEvents();
    loadReports();
    const timer1 = window.setInterval(loadEvents, 4000);
    const timer2 = window.setInterval(loadReports, 5000);
    return () => { 
      window.clearInterval(timer1);
      window.clearInterval(timer2);
    };
  }, [session, storageKey]);

  const unread = useMemo(() => conversations.filter(c => c.unreadCount > 0), [conversations]);

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reportedPosts;
    const query = searchQuery.toLowerCase();
    return reportedPosts.filter(r =>
      r.postAuthor.toLowerCase().includes(query) ||
      r.reportedBy.toLowerCase().includes(query) ||
      r.postBody.toLowerCase().includes(query)
    );
  }, [reportedPosts, searchQuery]);

  const filteredCommunityNotifications = useMemo(() => {
    if (!searchQuery.trim()) return dbNotifications;
    const query = searchQuery.toLowerCase();
    return dbNotifications.filter(n =>
      n.type.toLowerCase().includes(query) ||
      JSON.stringify(n.data).toLowerCase().includes(query)
    );
  }, [dbNotifications, searchQuery]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return unread;
    const query = searchQuery.toLowerCase();
    return unread.filter(c =>
      c.participants.some(p => p.username.toLowerCase().includes(query)) ||
      c.lastMessagePreview?.toLowerCase().includes(query)
    );
  }, [unread, searchQuery]);

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

  const deleteReportedPost = async (reportId: string) => {
    if (!session) return;
    try {
      await api.deleteReportedPost(session.token, reportId);
      setReportedPosts(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete post. Please try again.');
    }
  };

  const tabs: Array<{ id: NotificationTab; label: string; count?: number; adminOnly?: boolean }> = [
    ...(session?.role === 'admin' ? [{ id: 'reported-posts' as const, label: 'Reported Posts', count: reportedPosts.length }] : []),
    ...(session?.role === 'admin' ? [{ id: 'presence' as const, label: 'Presence Alerts', count: presenceEvents.length }] : []),
    { id: 'community' as const, label: 'Community Alerts', count: dbNotifications.length },
    { id: 'messages' as const, label: 'Messages', count: unread.length },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid max-w-[880px] gap-3">
        <h1 className="text-4xl font-extrabold text-white md:text-5xl">Notifications</h1>
        <p className="max-w-2xl text-lg text-white/70">Recent system messages and presence updates.</p>
      </div>

      <section className={cardShellClasses}>
        <div className="space-y-6">
          {/* Search Box */}
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/20"
          />

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-200'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {tab.label}
                {tab.count ? <span className="ml-2 text-xs">({tab.count})</span> : null}
              </button>
            ))}
          </div>

          {/* Reported Posts Tab */}
          {activeTab === 'reported-posts' && (
            <div className="space-y-3">
              {filteredReports.length > 0 ? (
                <ul className="grid gap-2">
                  {filteredReports.map(report => (
                    <li
                      key={report.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 transition cursor-pointer"
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white/90">{report.postAuthor}</p>
                        <p className="text-xs text-white/60 truncate">{report.postBody}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            report.category === 'spam' ? 'bg-red-500/20 text-red-300' :
                            report.category === 'harassment' ? 'bg-orange-500/20 text-orange-300' :
                            report.category === 'misinformation' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {report.category}
                          </span>
                          <span className="text-xs text-white/50">Reported by {report.reportedBy}</span>
                        </div>
                      </div>
                      <span className="text-xs text-white/60 ml-2">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/70 text-center py-8">No reported posts yet.</p>
              )}
            </div>
          )}

          {/* Presence Alerts Tab */}
          {activeTab === 'presence' && (
            <div className="space-y-3">
              {presenceEvents.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/80">Presence Alerts</h3>
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/20"
                    >
                      Mark all read
                    </button>
                  </div>
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
                </>
              ) : (
                <p className="text-sm text-white/70 text-center py-8">No presence alerts yet.</p>
              )}
            </div>
          )}

          {/* Community Alerts Tab */}
          {activeTab === 'community' && (
            <div className="space-y-3">
              {filteredCommunityNotifications.length > 0 ? (
                <ul className="grid gap-2">
                  {filteredCommunityNotifications.map(n => (
                    <li key={n.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                      <div>
                        <p className="font-semibold text-white/90">
                          {n.type === 'community_post_reported' ? 'Post reported' : n.type === 'community_post_edited' ? 'Post edited' : n.type === 'community_post_deleted' ? 'Post deleted' : n.type}
                        </p>
                        <p className="text-white/60 text-xs">{n.data && (n.data as any).author ? `Author: ${(n.data as any).author}` : ''}</p>
                      </div>
                      <span className="text-white/60 text-xs">{new Date(n.createdAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/70 text-center py-8">No community alerts yet.</p>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-3">
              {filteredConversations.length > 0 ? (
                <ul className="grid gap-2">
                  {filteredConversations.map(c => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-white/90">{c.participants.map(p => p.username).join(', ')}</p>
                        <p className="text-white/60 text-xs truncate">{c.lastMessagePreview}</p>
                      </div>
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{c.unreadCount}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/70 text-center py-8">No message notifications yet.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Reported Post Modal */}
      {selectedReport && (
        <ReportedPostModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onDelete={deleteReportedPost}
        />
      )}
    </div>
  );
}
