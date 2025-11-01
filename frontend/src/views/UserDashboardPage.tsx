import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { WelcomeModal } from '../components/WelcomeModal';
import { FlashcardsTab } from '../components/FlashcardsTab';


export function UserDashboardPage() {
  const { session } = useAuth();
  const displayName = useMemo(() => session?.username || 'Friend', [session]);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setShowWelcome(false);
  }, []);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="grid gap-2 sm:gap-3 px-4 sm:px-0">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">Welcome, {displayName}</h1>
        <p className="text-base sm:text-lg text-white/70">
          You are signed in and visible to admins for quick assistance.
        </p>
      </div>

      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {session?.token && <FlashcardsTab token={session.token} isAdmin={false} />}
    </div>
  );
}
