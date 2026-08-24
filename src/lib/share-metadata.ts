// src/lib/share-metadata.ts
// App Router generateMetadata helper — server-side, no next/head needed

import { Metadata } from 'next';
import { ShareData } from './share-utils';

export function generateShareMetadata(data: ShareData): Metadata {
  return {
    title: data.title,
    description: data.description,
    keywords: data.hashtags?.join(', '),
    openGraph: {
      type: 'website',
      url: data.url,
      title: data.title,
      description: data.description,
      images: data.image ? [{
        url: data.image,
        width: 1200,
        height: 630,
        alt: data.title
      }] : undefined,
      siteName: 'ElimuX',
      locale: 'en_KE',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
      images: data.image ? [data.image] : undefined,
      creator: '@elimux',
    },
    alternates: {
      canonical: data.url,
    },
  };
}
