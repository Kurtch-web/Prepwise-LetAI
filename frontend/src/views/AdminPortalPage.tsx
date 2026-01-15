import { useState } from 'react';
import { FlashcardsTab } from '../components/FlashcardsTab';

const cardShellClasses =
  'rounded-3xl border border-blue-500/20 bg-[#002459]/80 p-7 shadow-[0_18px_40px_rgba(0,36,89,0.45)] backdrop-blur-xl';

export function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<'flashcards'>('flashcards');

  return (
    <div className="flex flex-col gap-8">
      <div className="grid max-w-[880px] gap-3">
        <h1 className="text-4xl font-extrabold text-white md:text-5xl">Admin Console</h1>
        <p className="max-w-2xl text-lg text-white/70">
          Manage flashcards and quiz content for your students.
        </p>
      </div>

      <div className="flex gap-2 border-b border-blue-500/20">
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
      </div>

      {activeTab === 'flashcards' && (
        <section className={cardShellClasses}>
          <FlashcardsTab isAdmin={true} />
        </section>
      )}
    </div>
  );
}
