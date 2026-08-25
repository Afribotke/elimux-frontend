Implement OG tags, UTM params, deep links via SharePreview
I'll build the complete sharing system now. This is a consolidated code package — Claude pastes each file as-is.
File 1: src/lib/share-utils.ts
TypeScript
// src/lib/share-utils.ts
// Utility functions for sharing, OG tags, UTM params, and platform deep links

export interface ShareData {
  title: string;
  description: string;
  url: string;
  image?: string;
  hashtags?: string[];
}

export interface PlatformShareConfig {
  name: string;
  icon: string;
  color: string;
  getUrl: (data: ShareData) => string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.elimux.ke';

export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

export function addUtmParams(url: string, medium: string, campaign: string = 'user_share'): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=elimux&utm_medium=${medium}&utm_campaign=${campaign}`;
}

export function encodeShareText(text: string): string {
  return encodeURIComponent(text);
}

export const PLATFORM_CONFIGS: PlatformShareConfig[] = [
  {
    name: 'WhatsApp',
    icon: 'MessageCircle',
    color: '#25D366',
    getUrl: (data) => {
      const text = `${data.title}\n\n${data.description}\n\n${addUtmParams(data.url, 'whatsapp')}`;
      return `https://wa.me/?text=${encodeShareText(text)}`;
    },
  },
  {
    name: 'Facebook',
    icon: 'Facebook',
    color: '#1877F2',
    getUrl: (data) => {
      const url = addUtmParams(data.url, 'facebook');
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeShareText(data.title)}`;
    },
  },
  {
    name: 'X (Twitter)',
    icon: 'Twitter',
    color: '#000000',
    getUrl: (data) => {
      const url = addUtmParams(data.url, 'twitter');
      const hashtags = data.hashtags?.join(',') || 'ElimuX,Education,Scholarship';
      return `https://twitter.com/intent/tweet?text=${encodeShareText(data.title)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`;
    },
  },
  {
    name: 'LinkedIn',
    icon: 'Linkedin',
    color: '#0A66C2',
    getUrl: (data) => {
      const url = addUtmParams(data.url, 'linkedin');
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    },
  },
  {
    name: 'Telegram',
    icon: 'Send',
    color: '#0088CC',
    getUrl: (data) => {
      const url = addUtmParams(data.url, 'telegram');
      return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeShareText(data.title)}`;
    },
  },
  {
    name: 'Email',
    icon: 'Mail',
    color: '#EA4335',
    getUrl: (data) => {
      const url = addUtmParams(data.url, 'email');
      const subject = encodeURIComponent(data.title);
      const body = encodeURIComponent(`${data.description}\n\n${url}`);
      return `mailto:?subject=${subject}&body=${body}`;
    },
  },
];

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve(successful);
  } catch (err) {
    document.body.removeChild(textArea);
    return Promise.resolve(false);
  }
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

export function getDefaultShareData(path: string, pageType: string): ShareData {
  const url = getCanonicalUrl(path);
  
  const defaults: Record<string, ShareData> = {
    scholarship: {
      title: 'Find Scholarships on ElimuX',
      description: 'Discover and apply for scholarships that match your profile. Your education journey starts here.',
      url,
      image: `${BASE_URL}/og-scholarship.jpg`,
      hashtags: ['ElimuX', 'Scholarship', 'Education'],
    },
    course: {
      title: 'Discover Courses on ElimuX',
      description: 'Find the perfect course or program to advance your career. Browse verified institutions.',
      url,
      image: `${BASE_URL}/og-course.jpg`,
      hashtags: ['ElimuX', 'Course', 'Career'],
    },
    institution: {
      title: 'Explore Institutions on ElimuX',
      description: 'Compare universities, colleges, and TVET institutions. Make informed decisions about your future.',
      url,
      image: `${BASE_URL}/og-institution.jpg`,
      hashtags: ['ElimuX', 'University', 'Education'],
    },
    search: {
      title: 'Search Results on ElimuX',
      description: 'I found great education opportunities matching my search. Check them out!',
      url,
      image: `${BASE_URL}/og-search.jpg`,
      hashtags: ['ElimuX', 'Education'],
    },
    default: {
      title: 'ElimuX — Discover Your Perfect Education',
      description: 'Find scholarships, courses, internships, and attachments. The smartest way to plan your academic future.',
      url,
      image: `${BASE_URL}/og-default.jpg`,
      hashtags: ['ElimuX', 'Education', 'Africa'],
    },
  };
  
  return defaults[pageType] || defaults.default;
}
File 2: src/hooks/useShare.ts
TypeScript
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
      // Don't treat user cancellation as an error
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
File 3: src/components/share/ShareBottomSheet.tsx
TypeScript
// src/components/share/ShareBottomSheet.tsx
// Animated bottom sheet for mobile fallback sharing

'use client';

import React, { useEffect, useRef } from 'react';
import { X, Link2, Check, MessageCircle, Facebook, Twitter, Linkedin, Send, Mail } from 'lucide-react';
import { ShareData, PLATFORM_CONFIGS, copyToClipboard } from '@/lib/share-utils';
import { useState } from 'react';

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

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on escape key
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Share options"
    >
      <div
        ref={sheetRef}
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300"
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
File 4: src/components/share/ShareButton.tsx
TypeScript
// src/components/share/ShareButton.tsx
// Universal share button — triggers native share or opens bottom sheet

'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareData } from '@/lib/share-utils';
import { useShare } from '@/hooks/useShare';
import { ShareBottomSheet } from './ShareBottomSheet';

interface ShareButtonProps {
  shareData: ShareData;
  variant?: 'floating' | 'inline' | 'icon-only';
  className?: string;
  label?: string;
}

export function ShareButton({ 
  shareData, 
  variant = 'inline', 
  className = '',
  label = 'Share'
}: ShareButtonProps) {
  const { isNativeSupported, share } = useShare();
  const [showSheet, setShowSheet] = useState(false);

  const handleClick = async () => {
    if (isNativeSupported) {
      await share(shareData);
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
        shareData={shareData}
      />
    </>
  );
}
File 5: src/components/share/ShareBar.tsx
TypeScript
// src/components/share/ShareBar.tsx
// Fixed bottom share bar for mobile — appears on content detail pages

'use client';

import React, { useState } from 'react';
import { Share2, Heart, Bookmark, ExternalLink } from 'lucide-react';
import { ShareData } from '@/lib/share-utils';
import { useShare } from '@/hooks/useShare';
import { ShareBottomSheet } from './ShareBottomSheet';

interface ShareBarProps {
  shareData: ShareData;
  onSave?: () => void;
  onApply?: () => void;
  isSaved?: boolean;
  showApply?: boolean;
  applyLabel?: string;
}

export function ShareBar({
  shareData,
  onSave,
  onApply,
  isSaved = false,
  showApply = true,
  applyLabel = 'Apply Now',
}: ShareBarProps) {
  const { isNativeSupported, share } = useShare();
  const [showSheet, setShowSheet] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  const handleShare = async () => {
    if (isNativeSupported) {
      await share(shareData);
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
        shareData={shareData}
      />
    </>
  );
}
File 6: src/components/share/SharePreview.tsx
TypeScript
// src/components/share/SharePreview.tsx
// Dynamic Open Graph meta tags for any page — drop this in your page head

import React from 'react';
import Head from 'next/head';
import { ShareData } from '@/lib/share-utils';

interface SharePreviewProps {
  shareData: ShareData;
  children?: React.ReactNode;
}

export function SharePreview({ shareData, children }: SharePreviewProps) {
  const { title, description, url, image, hashtags } = shareData;
  const tagString = hashtags?.join(', ') || 'ElimuX, Education, Africa';

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta name="keywords" content={tagString} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {image && <meta property="og:image" content={image} />}
        <meta property="og:site_name" content="ElimuX" />
        <meta property="og:locale" content="en_KE" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        {image && <meta property="twitter:image" content={image} />}
        <meta property="twitter:creator" content="@elimux" />

        {/* WhatsApp (uses OG tags) */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Canonical */}
        <link rel="canonical" href={url} />
      </Head>
      {children}
    </>
  );
}
File 7: src/components/share/index.ts
TypeScript
// src/components/share/index.ts
// Barrel export for all share components

export { ShareButton } from './ShareButton';
export { ShareBar } from './ShareBar';
export { ShareBottomSheet } from './ShareBottomSheet';
export { SharePreview } from './SharePreview';
File 8: src/components/share/ShareToast.tsx
TypeScript
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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-2 fade-in duration-200">
      <div className={`${bgColor} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]`}>
        <Check className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
        
        {/* Progress bar */}
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
File 9: src/app/globals.css additions
Add this to your existing globals.css for the safe-area padding:
css
/* Safe area padding for mobile bottom bars */
.safe-area-pb {
  padding-bottom: max(env(safe-area-inset-bottom), 16px);
}

/* Animation utilities for share sheet */
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Line clamp utilities */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
Usage Examples — Drop these into your pages
Scholarship Detail Page
tsx
import { ShareBar, SharePreview } from '@/components/share';
import { getDefaultShareData } from '@/lib/share-utils';

// Inside your scholarship page component:
const shareData = {
  title: `${scholarship.title} — Apply on ElimuX`,
  description: `${scholarship.description?.substring(0, 150)}... Deadline: ${scholarship.deadline}`,
  url: `https://www.elimux.ke/scholarships/${scholarship.id}`,
  image: scholarship.image_url || 'https://www.elimux.ke/og-scholarship.jpg',
  hashtags: ['ElimuX', 'Scholarship', 'Education'],
};

return (
  <SharePreview shareData={shareData}>
    <main className="pb-24"> {/* pb-24 to clear the fixed bottom bar */}
      {/* Your scholarship content */}
      
      {/* Desktop: inline share button */}
      <div className="hidden md:block">
        <ShareButton shareData={shareData} variant="inline" />
      </div>
    </main>

    {/* Mobile: fixed bottom share bar */}
    <div className="md:hidden">
      <ShareBar 
        shareData={shareData}
        onApply={() => router.push(`/scholarships/${scholarship.id}/apply`)}
        applyLabel="Apply Now"
        onSave={() => {/* save logic */}}
      />
    </div>
  </SharePreview>
);
Course / Program Detail Page
tsx
const shareData = {
  title: `${program.name} at ${institution.name} — ElimuX`,
  description: `${program.duration} • ${program.level} • ${institution.location}. Find your perfect course on ElimuX.`,
  url: `https://www.elimux.ke/courses/${program.id}`,
  image: institution.logo_url || 'https://www.elimux.ke/og-course.jpg',
  hashtags: ['ElimuX', 'Course', 'Career'],
};
Institution Page
tsx
const shareData = {
  title: `Explore ${institution.name} on ElimuX`,
  description: `${institution.program_count} programs available. ${institution.description?.substring(0, 120)}...`,
  url: `https://www.elimux.ke/institutions/${institution.id}`,
  image: institution.cover_image || 'https://www.elimux.ke/og-institution.jpg',
  hashtags: ['ElimuX', 'University', 'Education'],
};
Search Results Page
tsx
const shareData = {
  title: `I found ${results.length} opportunities on ElimuX`,
  description: `Search results for "${query}" — scholarships, courses, and institutions matching your criteria.`,
  url: `https://www.elimux.ke/search?q=${encodeURIComponent(query)}`,
  image: 'https://www.elimux.ke/og-search.jpg',
  hashtags: ['ElimuX', 'Education'],
};
What Claude needs to do
Create all 9 files above exactly as written.
Install lucide-react if not already present: npm install lucide-react
Add the CSS from File 9 to globals.css.
Generate OG images (1200×630px) for:
/public/og-default.jpg
/public/og-scholarship.jpg
/public/og-course.jpg
/public/og-institution.jpg
/public/og-search.jpg
(Use Canva or similar — text overlay with ElimuX branding.)
Wire into pages: Add SharePreview to page <head> and ShareBar/ShareButton to scholarship, course, institution, and search result pages.
Set NEXT_PUBLIC_APP_URL in your .env.local and Vercel environment variables: NEXT_PUBLIC_APP_URL=https://www.elimux.ke
Build and test: Verify the bottom sheet opens on mobile browsers, native share triggers on Safari/Chrome mobile, and OG tags render correctly (test with Facebook Sharing Debugger).
Key Design Decisions Made
Table
Decision	Rationale
Web Share API first	Native feel on mobile, no UI maintenance for new platforms
Bottom sheet fallback	Covers desktop + older mobile browsers with branded experience
WhatsApp prioritized	Kenya's dominant platform — deeplink opens directly to chat
UTM tracking on every link	You can measure which platform drives traffic in Google Analytics
OG tags per page	Rich previews on WhatsApp/Facebook drive click-through rates
Fixed bottom bar on mobile	Always accessible, doesn't scroll away, feels like native apps
Desktop: inline/FAB only	No fixed bar on desktop — screen space is less constrained
Run the build. Let me know if any TypeScript errors surface.