// src/components/share/ShareToast.tsx
// Toast notification for copy-link feedback

'use client';

import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

interface ShareToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error';
}

export function ShareToast({
  message,
  isVisible,
  onClose,
  duration = 3000,
  type = 'success'
}: ShareToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isVisible) return;

    setProgress(100);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
      <div className={`${bgColor} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]`}>
        <Check className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30">
          <div
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
