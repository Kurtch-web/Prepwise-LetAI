export function StatsSummary({
  totalUsers,
  activeAdmins,
  activeMembers
}: {
  totalUsers: number;
  activeAdmins: number;
  activeMembers: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
        <p className="text-sm text-white/70">Total users</p>
        <p className="mt-1 text-3xl font-extrabold text-white">{totalUsers}</p>
      </div>
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
        <p className="text-sm text-white/70">Active admins</p>
        <p className="mt-1 text-3xl font-extrabold text-white">{activeAdmins}</p>
      </div>
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
        <p className="text-sm text-white/70">Active members</p>
        <p className="mt-1 text-3xl font-extrabold text-white">{activeMembers}</p>
      </div>
    </div>
  );
}
