'use client';

import { useState, useRef, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const AD_CATEGORIES = [
  { icon: '🎓', name: 'Education' },
  { icon: '💰', name: 'Finance' },
  { icon: '🛂', name: 'Visa Agents' },
  { icon: '🔧', name: 'TVET & Trades' },
  { icon: '✈️', name: 'Visa & Travel' },
  { icon: '💻', name: 'Technology' },
  { icon: '💼', name: 'Career' },
  { icon: '🏥', name: 'Health' },
  { icon: '🏦', name: 'Banking' },
  { icon: '✈️', name: 'Airlines' },
  { icon: '🛡️', name: 'Insurance' },
];

// Duplicated below to give the marquee a seamless infinite loop
const SLOT_COUNT = 8;

export default function AdPortalSection() {
  const [activeCat, setActiveCat] = useState('Education');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dynamic price from GET /api/config/public (see elimux-backend/src/routes/config.ts)
  const [priceKes, setPriceKes] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/config/public`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled) setPriceKes(res?.data?.ad_placeholder_price_kes ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const price = priceKes
    ? `KES ${Number(priceKes).toLocaleString('en-KE')}/month`
    : 'KES 10,000/month';

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }

  return (
    <div className="mt-10 mb-6">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-display-2 text-[#7c6f50] dark:text-primary-400">
            LIVE Partners & Advertisers
          </span>
        </div>
        <a
          href="/ads/self-serve"
          className="text-gray-900 dark:text-white text-sm underline underline-offset-4 decoration-gray-400 hover:text-[#7c6f50] dark:hover:text-primary-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 rounded"
        >
          Advertise here →
        </a>
      </div>

      {/* Category Pills with Scroll Arrows */}
      <div className="relative mb-6">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-full shadow-md flex items-center justify-center text-gray-600 dark:text-muted hover:bg-gray-50 dark:hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1"
          >
            ‹
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto py-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {AD_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCat(cat.name)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 ${
                activeCat === cat.name
                  ? 'bg-[#1e293b] text-white'
                  : 'bg-white dark:bg-elimux-card text-gray-600 dark:text-muted border border-gray-200 dark:border-border hover:border-gray-400 dark:hover:border-primary-400'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-full shadow-md flex items-center justify-center text-gray-600 dark:text-muted hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          >
            ›
          </button>
        )}

        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white dark:from-background to-transparent pointer-events-none z-[5]" />
        )}
      </div>

      {/* Marquee Ad Ribbon */}
      <div className="relative overflow-hidden mb-8 group">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-background to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
          {[...Array(SLOT_COUNT * 2)].map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-56 mx-2 bg-[#fafaf9] dark:bg-elimux-card border border-dashed border-gray-300 dark:border-border rounded-2xl p-5 text-center cursor-pointer hover:border-gray-400 dark:hover:border-primary-400 hover:bg-white dark:hover:bg-white/5 hover:shadow-lg transition-all"
              onClick={() => { window.location.href = '/ads/self-serve'; }}
            >
              <div className="text-2xl mb-2">📣</div>
              <div className="text-gray-900 dark:text-white text-sm font-semibold mb-0.5">Your ad here</div>
              <div className="text-gray-400 dark:text-muted text-xs mb-1.5">
                Be the first {activeCat} advertiser
              </div>
              <div className="text-[#7c6f50] dark:text-primary-400 text-xs font-medium">
                From {price}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dark CTA Banner */}
      <div className="bg-[#0f172a] rounded-2xl p-8 text-center">
        <h3 className="text-white text-xl font-bold mb-2">
          Reach students across 194 countries at their decision moment
        </h3>
        <p className="text-[#fbbf24] text-sm mb-6">
          Universities · Banks · Airlines · Insurance · Tech · Employers
        </p>
        <div className="flex justify-center gap-3">
          <a
            href="https://wa.me/254793002436"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-transparent border border-gray-500 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
          >
            WhatsApp us
          </a>
          <a
            href="/ads/self-serve"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
          >
            Advertise
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
          width: max-content;
        }
      `}</style>
    </div>
  );
}

