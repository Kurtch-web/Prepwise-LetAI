import { useMemo, useState } from 'react';
import { UserInfo, UserRole } from '../services/api';

export function UsersModal({
  users,
  initialFilter,
  onClose
}: {
  users: UserInfo[];
  initialFilter?: 'all' | UserRole;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | UserRole>(initialFilter ?? 'all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter(u => (filter === 'all' ? true : u.role === filter))
      .filter(u => (q ? u.username.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        return bTime - aTime;
      });
  }, [users, query, filter]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0b111a]/90 p-7 shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-extrabold text-white">All users</h2>
          <div className="flex gap-2">
            <select
              className="rounded-2xl border border-white/20 bg-[#080c14]/60 px-3 py-2 text-sm text-white"
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="admin">Admins</option>
              <option value="user">Members</option>
            </select>
            <input
              className="w-56 rounded-2xl border border-white/20 bg-[#080c14]/60 px-3 py-2 text-sm text-white"
              placeholder="Search users"
              value={query}
              onInput={e => setQuery((e.target as HTMLInputElement).value)}
            />
          </div>
        </header>

        <ul className="mt-5 max-h-[60vh] overflow-auto rounded-2xl border border-white/10 bg-white/5 p-3">
          {filtered.map(u => (
            <li key={`${u.role}-${u.username}`} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/5">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${u.online ? 'bg-emerald-400' : 'bg-white/30'}`} />
                <span className="rounded-full bg-sky-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
                  {u.role === 'admin' ? 'Admin' : 'User'}
                </span>
                <span className="text-white">{u.username}</span>
              </div>
              <span className="text-xs text-white/60">
                {u.lastSeen ? new Date(u.lastSeen).toLocaleString() : '—'}
              </span>
            </li>
          ))}
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
