'use client';

import { useEffect, useState, useCallback } from 'react';

interface PWAUpdateState {
  updateAvailable: boolean;
  updateApp: () => void;
}

export function usePWAUpdate(): PWAUpdateState {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const updateApp = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let refreshing = false;

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });
      } catch (err) {
        console.error('PWA update check failed:', err);
      }
    };

    checkForUpdates();

    window.addEventListener('online', checkForUpdates);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkForUpdates);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return { updateAvailable, updateApp };
}
