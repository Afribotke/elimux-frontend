File 1: src/lib/share-utils.ts
TypeScript
// src/lib/share-utils.ts
// Utility functions for sharing, UTM params, deep links, and platform configs

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
    program: {
      title: 'Discover Programs on ElimuX',
      description: 'Find the perfect program to advance your career. Browse verified institutions.',
      url,
      image: `${BASE_URL}/og-program.jpg`,
      hashtags: ['ElimuX', 'Program', 'Career'],
    },
    course: {
      title: 'Discover Courses on ElimuX',
      description: 'Browse courses from top universities and colleges.',
      url,
      image: `${BASE_URL}/og-course.jpg`,
      hashtags: ['ElimuX', 'Course', 'Education'],
    },
    institution: {
      title: 'Explore Institutions on ElimuX',
      description: 'Compare universities, colleges, and TVET institutions. Make informed decisions about your future.',
      url,
      image: `${BASE_URL}/og-institution.jpg`,
      hashtags: ['ElimuX', 'University', 'Education'],
    },
    search: {
      title