'use client';

import { useState, useRef, useEffect } from 'react';

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

const AD_SLOTS = [
  { category: 'Education', price: 'KES 10,000/month' },
  { category: 'Education', price: 'KES 10,000/month' },
  { category: 'Education', price: 'KES 10,000/month' },
  { category: 'Education', price: 'KES 10,000/month' },
];

export default function AdPortalSection() {
  const [activeCat, setActiveCat] = useState('Education');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-[#7c6f50] text-xs font-semibold tracking-widest uppercase">
            LIVE Partners & Advertisers
          </span>
        </div>
        <a
          href="/advertise"
          className="text-gray-900 text-sm underline underline-offset-4 decoration-gray-400 hover:text-[#7c6f50] transition-colors"
        >
          Advertise here →
        </a>
      </div>

      {/* Category Pills with Scroll Arrows */}
      <div className="relative mb-6">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
          >
            ‹
          </button>
        )}

        {/* Scrollable Pills */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto py-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {AD_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCat(cat.name)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCat === cat.name
                  ? 'bg-[#1e293b] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
          >
            ›
          </button>
        )}

        {/* Right Edge Fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-[5]" />
        )}
      </div>

      {/* Ad Placeholder Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {AD_SLOTS.map((slot, i) => (
          <div
            key={i}
            className="bg-[#fafaf9] border border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-white transition-all group"
            onClick={() => { window.location.href = '/advertise'; }}
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">📣</div>
            <div className="text-gray-900 text-sm font-semibold mb-1">Your ad here</div>
            <div className="text-gray-400 text-xs mb-2">
              Be the first {activeCat} advertiser
            </div>
            <div className="text-[#7c6f50] text-xs font-medium">
              From {slot.price}
            </div>
          </div>
        ))}
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
            href="https://wa.me/254XXXXXXXXX"
            className="inline-flex items-center gap-2 bg-transparent border border-gray-500 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            WhatsApp us
          </a>
          <a
            href="/advertise"
            className="inline-flex items-center gap-2 bg-[#fbbf24] text-[#0f172a] px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#f59e0b] transition-colors"
          >
            Advertise
          </a>
        </div>
      </div>
    </div>
  );
}
