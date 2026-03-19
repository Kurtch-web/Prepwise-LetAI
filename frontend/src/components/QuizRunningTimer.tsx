import { useState, useEffect } from 'react';

interface QuizRunningTimerProps {
  expiresAt?: string;
  isLightMode: boolean;
}

function formatTimeRemaining(expiresAt: string): { timeString: string; isExpired: boolean } {
  const expireTime = new Date(expiresAt);
  const now = new Date();
  const diffMs = expireTime.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { timeString: 'Expired', isExpired: true };
  }

  const totalSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  // Format: "Expires in 2h 45m" or "Expires in 5m 30s"
  if (hours > 0) {
    return { timeString: `Expires in ${hours}h ${minutes}m`, isExpired: false };
  }

  return { timeString: `Expires in ${minutes}m ${seconds}s`, isExpired: false };
}

export function QuizRunningTimer({ expiresAt, isLightMode }: QuizRunningTimerProps) {
  const [displayText, setDisplayText] = useState<string>(() => {
    if (!expiresAt) return 'No expiration set';
    return formatTimeRemaining(expiresAt).timeString;
  });
  const [isExpired, setIsExpired] = useState<boolean>(() => {
    if (!expiresAt) return false;
    return formatTimeRemaining(expiresAt).isExpired;
  });

  useEffect(() => {
    if (!expiresAt) return;

    // Update time remaining every second for better accuracy
    const interval = setInterval(() => {
      const { timeString, isExpired: expired } = formatTimeRemaining(expiresAt);
      setDisplayText(timeString);
      setIsExpired(expired);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) {
    return null;
  }

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${
      isExpired
        ? isLightMode
          ? 'bg-red-100 text-red-700'
          : 'bg-red-900/30 text-red-300'
        : isLightMode
        ? 'bg-blue-100 text-blue-700'
        : 'bg-blue-900/30 text-blue-300'
    }`}>
      ⏰ {displayText}
    </span>
  );
}
