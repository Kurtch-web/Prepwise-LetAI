import { useMemo } from 'react';
import type { UserInfo } from '../services/api';

const rosterSectionShell = 'rounded-3xl border border-white/10 bg-[#0b111a]/80 p-5 shadow-[0_18px_40px_rgba(4,10,20,0.45)] backdrop-blur-xl';
const rosterListShell = 'mt-4 space-y-3';
const rosterEntryShell = 'flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#060c14]/80 px-4 py-3 text-left shadow-[0_18px_30px_rgba(3,6,12,0.4)] transition hover:bg-white/5 focus:outline-none focus-visible:border-indigo-400/60 focus-visible:bg-indigo-500/10';

const emailBadgeClasses = (verified: boolean) =>
  `inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
    verified
      ? 'bg-emerald-500/20 text-emerald-300'
      : 'bg-amber-500/20 text-amber-300'
  }`;

function formatLastSeen(lastSeen?: string | null, isOnline?: boolean): string {
  if (isOnline) {
    return 'Online now';
  }
  if (!lastSeen) {
    return 'No activity recorded yet';
  }
  try {
    return `Last active ${new Date(lastSeen).toLocaleString()}`;
  } catch {
    return 'Last active recently';
  }
}

function sortRoster(users: UserInfo[]): UserInfo[] {
  return [...users].sort((a, b) => {
    if (a.online !== b.online) {
      return a.online ? -1 : 1;
    }
    const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
    const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
    return bTime - aTime;
  });
}

export function PresenceRoster({
  admins,
  members,
  onUserSelect,
  onMembersClick,
  verifiedUsers = new Set()
}: {
  admins: UserInfo[];
  members: UserInfo[];
  onUserSelect?: (user: UserInfo) => void;
  onMembersClick?: () => void;
  verifiedUsers?: Set<string>;
}) {
  const sortedAdmins = useMemo(() => sortRoster(admins), [admins]);
  const sortedMembers = useMemo(() => sortRoster(members), [members]);
  const adminSummary = useMemo(() => {
    const total = admins.length;
    const online = admins.filter(entry => entry.online).length;
    return `${online}/${total} online`;
  }, [admins]);
  const memberSummary = useMemo(() => {
    const total = members.length;
    const online = members.filter(entry => entry.online).length;
    return `${online}/${total} online`;
  }, [members]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={rosterSectionShell}>
        <header className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Admins</h3>
            <p className="text-xs text-white/60">People who oversee the workspace</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
            {adminSummary}
          </span>
        </header>
        <ul className={rosterListShell}>
          {sortedAdmins.length ? (
            sortedAdmins.map(admin => {
              const isVerified = verifiedUsers.has(admin.username);
              return (
                <li key={`admin-${admin.username}`}>
                  <button
                    type="button"
                    className={rosterEntryShell}
                    onClick={() => onUserSelect?.(admin)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${admin.online ? 'bg-emerald-400 shadow-[0_0_8px_rgba(95,248,164,0.8)]' : 'bg-white/30'}`}
                      />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">{admin.username}</p>
                        <p className="text-xs text-white/60">{formatLastSeen(admin.lastSeen ?? null, admin.online)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={emailBadgeClasses(isVerified)}>
                        <div className={`h-1.5 w-1.5 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {isVerified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">Admin</span>
                    </div>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-6 text-center text-sm text-white/70">
              No admins found yet.
            </li>
          )}
        </ul>
      </section>

      <section className={rosterSectionShell}>
        <header
          className="flex items-center justify-between gap-3 cursor-pointer transition hover:opacity-80"
          onClick={onMembersClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onMembersClick?.();
            }
          }}
        >
          <div>
            <h3 className="text-lg font-semibold text-white">Members</h3>
            <p className="text-xs text-white/60">Everyone actively using the workspace</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
            {memberSummary}
          </span>
        </header>
        <ul className={rosterListShell}>
          {sortedMembers.length ? (
            sortedMembers.map(member => {
              const isVerified = verifiedUsers.has(member.username);
              return (
                <li key={`member-${member.username}`}>
                  <button
                    type="button"
                    className={rosterEntryShell}
                    onClick={() => onUserSelect?.(member)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${member.online ? 'bg-emerald-400 shadow-[0_0_8px_rgba(95,248,164,0.8)]' : 'bg-white/30'}`}
                      />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">{member.username}</p>
                        <p className="text-xs text-white/60">{formatLastSeen(member.lastSeen ?? null, member.online)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={emailBadgeClasses(isVerified)}>
                        <div className={`h-1.5 w-1.5 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {isVerified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className="rounded-full bg-sky-400/20 px-3 py-1 text-xs font-semibold text-sky-200">Member</span>
                    </div>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-6 text-center text-sm text-white/70">
              No members found yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
