import { useMemo, useState } from 'react';
import type { UserInfo } from '../services/api';

const emailBadgeClasses = (verified: boolean) =>
  `inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
    verified
      ? 'bg-emerald-500/20 text-emerald-300'
      : 'bg-amber-500/20 text-amber-300'
  }`;

export function MembersModal({
  members,
  verifiedUsers = new Set(),
  onClose
}: {
  members: UserInfo[];
  verifiedUsers?: Set<string>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter(member => {
        if (filter === 'verified') {
          return verifiedUsers.has(member.username);
        }
        if (filter === 'unverified') {
          return !verifiedUsers.has(member.username);
        }
        return true;
      })
      .filter(member => (q ? member.username.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (a.online !== b.online) {
          return a.online ? -1 : 1;
        }
        const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        return bTime - aTime;
      });
  }, [members, verifiedUsers, query, filter]);

  const verifiedCount = useMemo(() => {
    return members.filter(m => verifiedUsers.has(m.username)).length;
  }, [members, verifiedUsers]);

  const unverifiedCount = useMemo(() => {
    return members.length - verifiedCount;
  }, [members, verifiedCount]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0b111a]/90 p-7 shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Members</h2>
            <p className="mt-1 text-sm text-white/60">
              {members.length} total • {verifiedCount} verified • {unverifiedCount} unverified
            </p>
          </div>
          <div className="flex gap-2">
            <select
              className="rounded-2xl border border-white/20 bg-[#080c14]/60 px-3 py-2 text-sm text-white"
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
            >
              <option value="all">All users</option>
              <option value="verified">Verified only</option>
              <option value="unverified">Unverified only</option>
            </select>
            <input
              className="w-56 rounded-2xl border border-white/20 bg-[#080c14]/60 px-3 py-2 text-sm text-white placeholder-white/50"
              placeholder="Search members"
              value={query}
              onInput={e => setQuery((e.target as HTMLInputElement).value)}
            />
          </div>
        </header>

        <ul className="mt-5 max-h-[60vh] overflow-auto rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
          {filtered.length ? (
            filtered.map(member => {
              const isVerified = verifiedUsers.has(member.username);
              return (
                <li
                  key={`member-${member.username}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[#060c14]/80 px-4 py-3 transition hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${member.online ? 'bg-emerald-400 shadow-[0_0_8px_rgba(95,248,164,0.8)]' : 'bg-white/30'}`}
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{member.username}</p>
                      <p className="text-xs text-white/60">
                        {member.online
                          ? 'Online now'
                          : member.lastSeen
                            ? `Last active ${new Date(member.lastSeen).toLocaleString()}`
                            : 'No activity recorded yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={emailBadgeClasses(isVerified)}>
                      <div className={`h-1.5 w-1.5 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-6 text-center text-sm text-white/70">
              No members found
            </li>
          )}
        </ul>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/80 transition hover:border-rose-400 hover:bg-rose-500/20"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
