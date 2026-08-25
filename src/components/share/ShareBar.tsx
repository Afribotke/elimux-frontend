// src/components/share/ShareBar.tsx
// Fixed bottom share bar for mobile — appears on content detail pages

'use client';

import React, { useState } from 'react';
import { Share2, Bookmark, ExternalLink } from 'lucide-react';
import { ShareData, getSmartShareUrl } from '@/lib/share-utils';
import { useShare } from '@/hooks/useShare';
import { ShareBottomSheet } from './ShareBottomSheet';

interface ShareBarProps {
  shareData: ShareData;
  onSave?: () => void;
  onApply?: () => void;
  isSaved?: boolean;
  showApply?: boolean;
  applyLabel?: string;
  /** When both are provided, share actions use a trackable smart link instead of the raw URL. */
  contentType?: string;
  contentId?: string;
}

export function ShareBar({
  shareData,
  onSave,
  onApply,
  isSaved = false,
  showApply = true,
  applyLabel = 'Apply Now',
  contentType,
  contentId,
}: ShareBarProps) {
  const { isNativeSupported, share } = useShare();
  const [showSheet, setShowSheet] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [resolvedShareData, setResolvedShareData] = useState(shareData);

  const handleShare = async () => {
    let data = shareData;
    if (contentType && contentId) {
      const smartUrl = await getSmartShareUrl(contentType, contentId);
      if (smartUrl) data = { ...shareData, url: smartUrl };
    }
    setResolvedShareData(data);
    if (isNativeSupported) {
      await share(data);
    } else {
      setShowSheet(true);
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    onSave?.();
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-4 py-3">
          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Share</span>
          </button>

          {/* Save button */}
          {onSave && (
            <button
              onClick={handleSave}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bookmark className={`w-5 h-5 ${saved ? 'fill-emerald-500 text-emerald-500' : 'text-gray-600 dark:text-gray-400'}`} />
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                {saved ? 'Saved' : 'Save'}
              </span>
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Apply button */}
          {showApply && onApply && (
            <button
              onClick={onApply}
              className="flex-1 max-w-[200px] py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {applyLabel}
            </button>
          )}
        </div>
      </div>

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
