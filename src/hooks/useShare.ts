// src/hooks/useShare.ts
// Core sharing hook — handles native Web Share API with fallback state

import { useState, useCallback } from 'react';
import { ShareData, canUseNativeShare, copyToClipboard, addUtmParams } from '@/lib/share-utils';

interface UseShareReturn {
  isSharing: boolean;
  shareError: string | null;
  isNativeSupported: boolean;
  share: (data: ShareData) => Promise<void>;
  copyLink: (url: string) => Promise<boolean>;
  clearError: () => void;
}

export function useShare(): UseShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isNativeSupported] = useState(() => canUseNativeShare());

  const share = useCallback(async (data: ShareData): Promise<void> => {
    setIsSharing(true);
    setShareError(null);

    try {
      if (canUseNativeShare() && navigator.share) {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: addUtmParams(data.url, 'native_share'),
        });
      } else {
        throw new Error('Native sharing not supported');
      }
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        setShareError(null);
      } else {
        setShareError(error.message || 'Failed to share. Please try another method.');
      }
    } finally {
      setIsSharing(false);
    }
  }, []);

  const copyLink = useCallback(async (url: string): Promise<boolean> => {
    const success = await copyToClipboard(addUtmParams(url, 'copy_link'));
    return success;
  }, []);

  const clearError = useCallback(() => {
    setShareError(null);
  }, []);

  return {
    isSharing,
    shareError,
    isNativeSupported,
    share,
    copyLink,
    clearError,
  };
}
