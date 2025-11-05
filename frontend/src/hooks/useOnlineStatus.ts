import { useEffect, useState, useCallback } from 'react';

export interface OnlineStatusInfo {
  isOnline: boolean;
  wasOffline: boolean;
  lastChecked: number;
}

export function useOnlineStatus(): OnlineStatusInfo {
  const [status, setStatus] = useState<OnlineStatusInfo>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastChecked: Date.now()
  });

  const handleOnline = useCallback(() => {
    console.log('[Online Status] Device is now online');
    setStatus(prev => ({
      isOnline: true,
      wasOffline: prev.wasOffline || !prev.isOnline,
      lastChecked: Date.now()
    }));
  }, []);

  const handleOffline = useCallback(() => {
    console.log('[Online Status] Device is now offline');
    setStatus(prev => ({
      isOnline: false,
      wasOffline: true,
      lastChecked: Date.now()
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
}

export function useIsOnline(): boolean {
  const status = useOnlineStatus();
  return status.isOnline;
}
