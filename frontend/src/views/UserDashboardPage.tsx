import { useState } from 'react';
import { WelcomeModal } from '../components/WelcomeModal';
import { FlashcardsTab } from '../components/FlashcardsTab';


export function UserDashboardPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const displayName = 'User';

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="grid gap-2 sm:gap-3 px-4 sm:px-0">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">Welcome, {displayName}</h1>
        <p className="text-base sm:text-lg text-white/70">
          Study flashcards and take quizzes to test your knowledge.
        </p>
      </div>

      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      <FlashcardsTab isAdmin={false} />
    </div>
  );
}
