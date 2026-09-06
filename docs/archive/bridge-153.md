# Cycle 153 — DTB Academy Homepage Banner (Replaces Afribot Section)

> **Status:** Demo. Replaces the "Proudly Powered by Afribot" footer section on the ElimuX homepage.  
> **Scope:** Single component + one-line homepage edit. Gated by existing `dtb_academy_enabled` flag.

---

## 1. Component

Create `src/components/financing/dtb/DtbHomepageBanner.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { DtbLogo } from './DtbLogo';

export function DtbHomepageBanner() {
  return (
    <section className="w-full px-4 py-10">
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
            Apply now in 3 minutes
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link
            href="/financing/dtb-academy"
            className="px-6 py-3 rounded-xl border border-[#333] text-[#aaa] font-medium text-[15px] hover:border-[#555] hover:text-[#ccc] transition-colors"
          >
            How it works
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
2. Homepage Integration
In the homepage file (e.g., src/app/page.tsx or wherever the Afribot section lives), replace the Afribot block with this gated import:
TypeScript
import { DtbHomepageBanner } from '@/components/financing/dtb/DtbHomepageBanner';
import { isDtbAcademyEnabled } from '@/lib/dtb-api';
And in the component body, replace the Afribot section:
TypeScript
// BEFORE (Afribot section):
// <section className="...">PROUDLY POWERED BY Afribot...</section>

// AFTER:
const [dtbEnabled, setDtbEnabled] = useState(false);
useEffect(() => { isDtbAcademyEnabled().then(setDtbEnabled); }, []);

{dtbEnabled ? (
  <DtbHomepageBanner />
) : (
  // Keep Afribot as fallback when DTB demo is off
  <section className="...">PROUDLY POWERED BY Afribot...</section>
)}
If the homepage is a Server Component, use this pattern instead:
TypeScript
import { isDtbAcademyEnabled } from '@/lib/dtb-api';

export default async function HomePage() {
  const dtbEnabled = await isDtbAcademyEnabled();

  return (
    <main>
      {/* ... rest of homepage ... */}

      {dtbEnabled ? (
        <DtbHomepageBanner />
      ) : (
        <section className="...">PROUDLY POWERED BY Afribot...</section>
      )}
    </main>
  );
}
Note: isDtbAcademyEnabled() already exists from Cycle 152. If it returns false, the Afribot section stays. If true, DTB banner replaces it.
3. Build & Deploy
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
npm run build
If clean:
powershell
git add src/components/financing/dtb/DtbHomepageBanner.tsx
git add src/app/page.tsx   # or whichever file holds the Afribot section
git commit -m "Cycle 153 — DTB Academy homepage banner replaces Afribot section

- Add DtbHomepageBanner component with dark gradient, stats row, dual CTAs
- Gate display behind existing dtb_academy_enabled feature flag
- Keep Afribot section as fallback when flag is false"
git push origin main
4. Verification
Table
Check	Expected
app_config.dtb_academy_enabled = true	Homepage shows DTB banner with red accent, stats, "Apply now in 3 minutes"
app_config.dtb_academy_enabled = false	Homepage shows original Afribot section
Click "Apply now"	Routes to /financing/dtb-academy wizard
Mobile view	Banner stacks vertically, stats row stays readable
Dark mode	Banner already dark-themed, blends naturally
5. Rollback
Set dtb_academy_enabled = false in Supabase — Afribot section returns instantly. To delete code entirely, remove DtbHomepageBanner.tsx and revert the homepage edit.
