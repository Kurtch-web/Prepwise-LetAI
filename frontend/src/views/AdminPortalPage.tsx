import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { PresenceRoster } from '../components/PresenceRoster';
import { useAuth } from '../providers/AuthProvider';
import { api, AdminStats, PresenceEvent, UserInfo } from '../services/api';
import { StatsSummary } from '../components/StatsSummary';
import { UsersModal } from '../components/UsersModal';
import { MembersModal } from '../components/MembersModal';
import { requestChat } from '../services/chatLauncher';
import { FlashcardsTab } from '../components/FlashcardsTab';
import { ReportedPostsTab } from '../components/ReportedPostsTab';

const cardShellClasses =
  'rounded-3xl border border-blue-500/20 bg-[#002459]/80 p-7 shadow-[0_18px_40px_rgba(0,36,89,0.45)] backdrop-blur-xl';
const accentButtonClasses =
  'rounded-2xl border border-blue-500/30 px-5 py-3 font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/30';
const quietButtonClasses =
  'rounded-2xl border border-blue-500/20 px-5 py-3 font-semibold text-white/80 transition hover:border-rose-400 hover:bg-rose-500/20';

export function AdminPortalPage() {
  const { session, logout, refreshOnlineUsers, refreshPresenceOverview, presenceOverview } = useAuth();
  const isAdminAuthenticated = session?.role === 'admin';
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [events, setEvents] = useState<PresenceEvent[]>([]);
  const [allUsers, setAllUsers] = useState<UserInfo[] | null>(null);
  const [showUsersModal, setShowUsersModal] = useState<null | 'all' | 'admin' | 'user'>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'presence' | 'flashcards' | 'reported-posts'>('presence');
  const [selectedEvent, setSelectedEvent] = useState<PresenceEvent | null>(null);
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set());

  const adminEntries = presenceOverview?.admins ?? [];
  const memberEntries = presenceOverview?.users ?? [];

  const audienceSummary = useMemo(() => {
    const onlineAdminCount = adminEntries.filter(user => user.online).length;
    const onlineMemberCount = memberEntries.filter(user => user.online).length;
    if (!onlineAdminCount && !onlineMemberCount) {
      return 'Nobody is connected right now.';
    }
    return `${onlineMemberCount} member${onlineMemberCount === 1 ? '' : 's'} and ${onlineAdminCount} admin${onlineAdminCount === 1 ? '' : 's'} online.`;
  }, [adminEntries, memberEntries]);

  const refreshStatsAndEvents = useCallback(async () => {
    if (!session || session.role !== 'admin') return;
    try {
      const s = await api.fetchStats(session.token);
      setStats(s);
    } catch {
      setStats(prev => prev ?? { totalUsers: 0, activeAdmins: 0, activeMembers: 0 });
    }

    try {
      const e = await api.fetchPresenceEvents(session.token);
      const sorted = [...e.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEvents(sorted);
    } catch {
      setEvents(prev => (prev.length ? prev : []));
    }

    try {
      const u = await api.fetchAllUsers(session.token);
      setAllUsers(u.users);

      const verified = new Set<string>();
      for (const user of u.users) {
        try {
          const { profile } = await api.fetchUserProfile(session.token, user.username);
          if (profile.emailVerifiedAt) {
            verified.add(user.username);
          }
        } catch {
          // Skip if profile fetch fails
        }
      }
      setVerifiedUsers(verified);
    } catch {
      setAllUsers(prev => prev ?? []);
    }
  }, [session]);

  useEffect(() => {
    let timer: number | null = null;
    if (isAdminAuthenticated) {
      refreshStatsAndEvents();
      refreshPresenceOverview().catch(() => {});
      timer = window.setInterval(() => {
        refreshStatsAndEvents().catch(() => {});
        refreshPresenceOverview().catch(() => {});
      }, 5000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isAdminAuthenticated, refreshPresenceOverview, refreshStatsAndEvents]);

  const latestEvent = events[0];

  const describeEvent = useCallback((event: PresenceEvent) => {
    switch (event.type) {
      case 'signup':
        return `New signup • ${event.username} (${event.role})`;
      case 'login':
        return `Login • ${event.username} (${event.role})`;
      case 'logout':
      default:
        return `Logout • ${event.username} (${event.role})`;
    }
  }, []);
  const filteredAdmins = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adminEntries.filter(user => (!q ? true : user.username.toLowerCase().includes(q)));
  }, [adminEntries, query]);
  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memberEntries.filter(user => (!q ? true : user.username.toLowerCase().includes(q)));
  }, [memberEntries, query]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid max-w-[880px] gap-3">
        <h1 className="text-4xl font-extrabold text-white md:text-5xl">Admin command center</h1>
        <p className="max-w-2xl text-lg text-white/70">
          View who is online, manage live sessions, and ensure your members receive support instantly.
        </p>
      </div>
      {isAdminAuthenticated ? (
        <>
          <div className="flex gap-2 border-b border-blue-500/20">
            <button
              onClick={() => setActiveTab('presence')}
              className={`px-4 py-3 font-semibold transition ${
                activeTab === 'presence'
                  ? 'border-b-2 border-indigo-400 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Presence
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-4 py-3 font-semibold transition ${
                activeTab === 'flashcards'
                  ? 'border-b-2 border-indigo-400 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Flashcards
            </button>
            <button
              onClick={() => setActiveTab('reported-posts')}
              className={`px-4 py-3 font-semibold transition ${
                activeTab === 'reported-posts'
                  ? 'border-b-2 border-indigo-400 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Reported Posts
            </button>
          </div>

          {activeTab === 'presence' && (
            <section className={`${cardShellClasses} space-y-6`}>
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-white">Live presence feed</h3>
              <p className="text-sm text-white/70">{audienceSummary}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="w-56 rounded-2xl border border-blue-500/30 bg-[#001a4d]/60 px-3 py-2 text-sm text-white"
                placeholder="Search users"
                value={query}
                onInput={e => setQuery((e.target as HTMLInputElement).value)}
              />
              <button
                className={accentButtonClasses}
                type="button"
                onClick={async () => {
                  try {
                    await Promise.all([refreshOnlineUsers(), refreshStatsAndEvents()]);
                  } catch {}
                }}
              >
                Refresh
              </button>
              <button
                className={accentButtonClasses}
                type="button"
                onClick={() => setShowUsersModal('all')}
              >
                See all
              </button>
              <button className={quietButtonClasses} type="button" onClick={logout}>
                Sign out
              </button>
            </div>
          </header>

          {stats && (
            <div className="cursor-pointer" onClick={() => setShowUsersModal('all')}>
              <StatsSummary
                totalUsers={stats.totalUsers}
                activeAdmins={stats.activeAdmins}
                activeMembers={stats.activeMembers}
              />
            </div>
          )}

          {latestEvent && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-300">
              {describeEvent(latestEvent)} at {new Date(latestEvent.timestamp).toLocaleTimeString()}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white/80">Presence roster</h4>
              <p className="text-xs text-white/60">Select anyone to open a chat</p>
            </div>
            <PresenceRoster
              admins={filteredAdmins}
              members={filteredMembers}
              verifiedUsers={verifiedUsers}
              onUserSelect={user => {
                requestChat({ username: user.username, role: user.role });
              }}
              onMembersClick={() => setShowMembersModal(true)}
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white/80">Recent activity</h4>
            <ul className="scrollbar-custom max-h-[400px] overflow-y-auto rounded-2xl border border-blue-500/20 bg-blue-500/10 p-2 space-y-2">
              {events.length ? (
                events.map(ev => (
                  <li
                    key={ev.id}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-blue-500/20 bg-[#001a4d]/60 px-4 py-3 text-sm transition hover:border-blue-400/50 hover:bg-blue-500/20"
                    onClick={() => setSelectedEvent(ev)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="text-white/90">{describeEvent(ev)}</span>
                    <span className="text-white/60 text-xs">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-dashed border-blue-500/30 bg-blue-500/10 px-4 py-6 text-center text-sm text-white/70">
                  No activity recorded yet
                </li>
              )}
            </ul>
          </div>

          {showUsersModal && allUsers && (
            <UsersModal
              users={allUsers}
              initialFilter={showUsersModal === 'all' ? 'all' : showUsersModal}
              onClose={() => setShowUsersModal(null)}
            />
          )}

          {showMembersModal && (
            <MembersModal
              members={memberEntries}
              verifiedUsers={verifiedUsers}
              onClose={() => setShowMembersModal(false)}
            />
          )}

          {selectedEvent && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-3xl border border-blue-500/20 bg-[#002459]/90 p-8 shadow-[0_18px_40px_rgba(0,36,89,0.55)] backdrop-blur-xl space-y-6">
                <header className="space-y-2">
                  <h3 className="text-2xl font-semibold text-white">Activity Details</h3>
                  <p className="text-sm text-white/70">Event log entry information</p>
                </header>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Event Type</p>
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                      <p className="text-white font-medium capitalize">{selectedEvent.type}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Username</p>
                      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                        <p className="text-white font-medium">{selectedEvent.username}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Role</p>
                      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                        <p className={`font-medium capitalize ${selectedEvent.role === 'admin' ? 'text-indigo-300' : 'text-sky-300'}`}>
                          {selectedEvent.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Timestamp</p>
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                      <p className="text-white font-medium">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                      <p className="text-xs text-white/60 mt-1">
                        {new Date(selectedEvent.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Event ID</p>
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                      <p className="text-white/90 font-mono text-xs break-all">{selectedEvent.id}</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className={accentButtonClasses}
                >
                  Close
                </button>
              </div>
            </div>
          )}
            </section>
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsTab token={session?.token || ''} isAdmin={true} />
          )}

          {activeTab === 'reported-posts' && (
            <ReportedPostsTab token={session?.token || ''} />
          )}
        </>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(340px,1fr)_minmax(320px,1fr)]">
          <LoginForm
            role="admin"
            heading="Admin access"
            description="Enter your admin credentials to monitor live presence across the workspace."
          />
          <aside className={`${cardShellClasses} space-y-4`}>
            <h3 className="text-lg font-semibold text-white">Admin Dashboard</h3>
            <p className="text-xl text-white/70">
              Monitor and manage all learning activities across your platform. Track user engagement, oversee educational progress in both general and professional development tracks, and ensure seamless collaboration. Get real-time insights into participant activity, manage community interactions, and support your learners every step of their journey toward success.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
