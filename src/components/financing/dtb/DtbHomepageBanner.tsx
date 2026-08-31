'use client';

import Link from 'next/link';

export function DtbHomepageBanner() {
  return (
    <section className="w-full px-4 py-10">
      {/* DEMO badge */}
      <div className="max-w-3xl mx-auto mb-3 flex justify-end">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-semibold tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Demo — Not yet live
        </span>
      </div>
      <div className="max-w-3xl mx-auto relative rounded-2xl border border-border overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f] px-6 py-8 sm:px-10 sm:py-10 text-center">
        {/* Ambient glow */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-[radial-gradient(circle,rgba(200,16,46,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[radial-gradient(circle,rgba(200,16,46,0.06)_0%,transparent_70%)] pointer-events-none" />

        {/* Partner badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[rgba(200,16,46,0.10)] border border-[rgba(200,16,46,0.18)] text-[#ff4d6d] text-xs font-medium mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d6d] animate-pulse" />
          Partnered with Diamond Trust Bank
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-[28px] font-medium text-white leading-tight mb-2">
          Struggling with school fees?
          <br />
          <span className="text-[#ff4d6d]">DTB Academy has you covered.</span>
        </h2>
        <p className="text-sm text-[#999] max-w-md mx-auto mb-6 leading-relaxed">
          Get up to KES 1,000,000 per student. No collateral. Paid directly to the school. Repay over 10 months.
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-6 sm:gap-8 mb-7">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-medium text-white tabular-nums">1M</div>
            <div className="text-[11px] text-[#666] mt-0.5">Max per student</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-medium text-white tabular-nums">0</div>
            <div className="text-[11px] text-[#666] mt-0.5">Collateral needed</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-medium text-white tabular-nums">10</div>
            <div className="text-[11px] text-[#666] mt-0.5">Months to repay</div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/financing/dtb-academy"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#c8102e] text-white font-medium text-[15px] hover:bg-[#e01435] hover:-translate-y-px transition-all"
          >
            Try demo application
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link
            href="/financing/dtb-academy"
            className="px-6 py-3 rounded-xl border border-[#333] text-[#aaa] font-medium text-[15px] hover:border-[#555] hover:text-[#ccc] transition-colors"
          >
            Learn more
          </Link>
        </div>

        {/* Trust footer */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-5 mt-6 pt-5 border-t border-[#222]">
          <span className="flex items-center gap-1.5 text-[11px] text-[#555]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Bank-grade secure
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#555]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Direct to school
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#555]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Instant eligibility check
          </span>
        </div>
      </div>
    </section>
  );
}
