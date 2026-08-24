'use client';

import { usePathname } from 'next/navigation';
import JsonLd from './JsonLd';

const BASE_URL = 'https://www.elimux.ke';

// Generic, route-agnostic breadcrumb: title-cases each path segment rather
// than requiring a hand-maintained label per route (100+ routes exist -
// a per-page BreadcrumbList would need updating every time a route is
// added/renamed). "Every page, dynamically generated" is satisfied by
// mounting this once in the root layout instead of wiring it into each
// page individually.
function humanize(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BreadcrumbJsonLd() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Homepage has no trail beyond itself - a single-item BreadcrumbList
  // (just "Home") isn't meaningful structured data.
  if (segments.length === 0) return null;

  const itemListElement = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
    ...segments.map((seg, i) => ({
      '@type': 'ListItem',
      position: i + 2,
      name: humanize(seg),
      item: `${BASE_URL}/${segments.slice(0, i + 1).join('/')}/`,
    })),
  ];

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement,
      }}
    />
  );
}
