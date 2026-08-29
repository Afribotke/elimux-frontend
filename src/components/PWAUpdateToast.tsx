'use client';

import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { useEffect, useState } from 'react';

export default function PWAUpdateToast() {
  const { updateAvailable, updateApp } = usePWAUpdate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (updateAvailable) setShow(true);
  }, [updateAvailable]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-blue-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
      <div className="flex flex-col">
        <span className="font-semibold text-sm">Update Available</span>
        <span className="text-xs text-blue-100">A new version of ElimuX is ready</span>
      </div>
      <button
        onClick={() => {
          updateApp();
          setShow(false);
        }}
        className="bg-white text-blue-600 px-3 py-1.5 rounded-md font-semibold text-sm hover:bg-blue-50 transition-colors"
      >
        Update Now
      </button>
    </div>
  );
}
