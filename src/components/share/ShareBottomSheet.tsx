// src/components/share/ShareBottomSheet.tsx
// Animated bottom sheet for mobile fallback sharing

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Link2, Check, MessageCircle, Facebook, Twitter, Linkedin, Send, Mail } from 'lucide-react';
import { ShareData, PLATFORM_CONFIGS, copyToClipboard } from '@/lib/share-utils';

interface ShareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: ShareData;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageCircle: <MessageCircle className="w-6 h-6" />,
  Facebook: <Facebook className="w-6 h-6" />,
  Twitter: <Twitter className="w-6 h-6" />,
  Linkedin: <Linkedin className="w-6 h-6" />,
  Send: <Send className="w-6 h-6" />,
  Mail: <Mail className="w-6 h-6" />,
};

export function ShareBottomSheet({ isOpen, onClose, shareData }: ShareBottomSheetProps) {
  const [copied, setCopied] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareData.url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlatformClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Share options"
    >
      <div
        ref={sheetRef}
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl animate-slide-up"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close share sheet"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Platform grid */}
        <div className="grid grid-cols-4 gap-4 px-5 pb-6">
          {PLATFORM_CONFIGS.map((platform) => (
            <button
              key={platform.name}
              onClick={() => handlePlatformClick(platform.getUrl(shareData))}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-active:scale-95"
                style={{ backgroundColor: platform.color }}
              >
                {ICON_MAP[platform.icon]}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {platform.name}
              </span>
            </button>
          ))}

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-md transition-transform group-active:scale-95">
              {copied ? <Check className="w-6 h-6 text-green-500" /> : <Link2 className="w-6 h-6" />}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>
        </div>

        {/* Preview card */}
        <div className="mx-5 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
            {shareData.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {shareData.description}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
            {shareData.url}
          </p>
        </div>

        {/* Cancel */}
        <div className="px-5 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
