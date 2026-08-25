// src/components/share/ShareButton.tsx
// Universal share button — triggers native share or opens bottom sheet

'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareData, getSmartShareUrl } from '@/lib/share-utils';
import { useShare } from '@/hooks/useShare';
import { ShareBottomSheet } from './ShareBottomSheet';

interface ShareButtonProps {
  shareData: ShareData;
  variant?: 'floating' | 'inline' | 'icon-only';
  className?: string;
  label?: string;
  /** When both are provided, share actions use a trackable smart link instead of the raw URL. */
  contentType?: string;
  contentId?: string;
}

export function ShareButton({
  shareData,
  variant = 'inline',
  className = '',
  label = 'Share',
  contentType,
  contentId,
}: ShareButtonProps) {
  const { isNativeSupported, share } = useShare();
  const [showSheet, setShowSheet] = useState(false);
  const [resolvedShareData, setResolvedShareData] = useState(shareData);

  const resolveShareData = async (): Promise<ShareData> => {
    if (!contentType || !contentId) return shareData;
    const smartUrl = await getSmartShareUrl(contentType, contentId);
    return smartUrl ? { ...shareData, url: smartUrl } : shareData;
  };

  const handleClick = async () => {
    const data = await resolveShareData();
    setResolvedShareData(data);
    if (isNativeSupported) {
      await share(data);
    } else {
      setShowSheet(true);
    }
  };

  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-95';

  const variantClasses = {
    floating: 'fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 hover:shadow-xl',
    inline: 'px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm',
    'icon-only': 'p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400',
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        aria-label="Share this content"
      >
        <Share2 className={variant === 'floating' ? 'w-5 h-5' : 'w-4 h-4'} />
        {variant !== 'icon-only' && variant !== 'floating' && (
          <span className="text-sm">{label}</span>
        )}
      </button>

      <ShareBottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        shareData={resolvedShareData}
        contentType={contentType}
        contentId={contentId}
      />
    </>
  );
}
