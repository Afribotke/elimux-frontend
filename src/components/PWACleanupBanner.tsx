'use client';

import { useEffect, useState } from 'react';

export default function PWACleanupBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (!isStandalone) return;

    const dismissed = localStorage.getItem('elimux-pwa-cleanup-dismissed');
    if (dismissed) return;

    setShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem('elimux-pwa-cleanup-dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            🧹 Clean Up Old ElimuX Shortcuts
          </span>
          <span className="text-xs text-amber-100">
            If you see duplicate ElimuX icons on your home screen, uninstall the old ones.
            This keeps your app always up to date automatically.
          </span>
        </div>
        <button
          onClick={dismiss}
          className="bg-white text-amber-600 px-3 py-1.5 rounded-md font-semibold text-sm hover:bg-amber-50 transition-colors shrink-0"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
