import { FormEvent, useState } from 'react';
import { setCookie } from '../services/cookies';

export function WelcomeModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      setCookie('user_name', trimmed, 365);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f3d2f]/90 p-7 shadow-[0_18px_40px_rgba(15,61,47,0.55)] backdrop-blur-xl">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-extrabold text-white">WELCOME TO LET AI</h2>
          <p className="text-sm text-white/70">My name is J. What is your name to get started?</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-white/20 bg-[#1a2d25]/60 px-4 py-3 text-sm text-slate-100 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            placeholder="Enter your name"
            value={name}
            onInput={e => setName((e.target as HTMLInputElement).value)}
            required
            minLength={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/80 transition hover:border-rose-400 hover:bg-rose-500/20"
              onClick={onClose}
            >
              Not now
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 px-5 py-3 font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
