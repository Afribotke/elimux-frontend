
### Visual Requirements

1. **Background:** Use a subtle gradient (not solid green). Suggestion: `bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700` for dark mode, or a clean light gradient for light mode. The current solid green looks dated.

2. **Headline typography:**
   - `text-display-1` (3.5rem, font-weight 800, tracking-tight, text-balance)
   - Color: `text-white` on dark gradient, or `text-gray-900` on light
   - Centered, max-width for readability

3. **Subheadline:**
   - `text-body-lg` (1.125rem, line-height 1.6)
   - Color: `text-white/80` on dark, `text-gray-500` on light
   - Centered, max-width 2xl

4. **Category Cards (the 6 items):**
   - Layout: 3x2 grid on desktop, 2x3 on tablet, 1x6 horizontal scroll on mobile
   - Card style: `bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6` on dark gradient
     - OR on light: `bg-white border border-gray-200 shadow-card rounded-2xl p-6`
   - Icon: 48px, centered, with subtle background circle
   - Label: `text-lg font-semibold text-center mt-3`
   - Hover: `hover:bg-white/20 hover:scale-[1.02] transition-all duration-200` (dark)
     - OR `hover:shadow-card-hover hover:-translate-y-0.5` (light)
   - Active/selected: `ring-2 ring-primary-400 ring-offset-2` (if used as filter)

5. **AI Search Input:**
   - Large, prominent, centered below the category cards
   - `bg-white rounded-2xl shadow-soft-lg px-6 py-4 text-lg`
   - Placeholder: "Ask anything... e.g., 'I want to study medicine in Kenya'"
   - Search button: `btn-primary` style, inside the input (right side)

6. **Stats bar below hero:**
   - `bg-white border-y border-gray-100 py-8`
   - 4 stats in a row with real data (or mock if unavailable)
   - Number: `text-3xl font-bold text-primary-600`
   - Label: `text-sm text-gray-500`

---

## STEP 3: POLISH BELOW-THE-FOLD SECTIONS

Every section below the hero must match SV-grade standards:

### Popular Programs Section
- Heading: `text-display-2` with "🔥 Popular Programs" and "Explore all →" link right-aligned
- Cards: `card-interactive` with proper image aspect ratio, institution name, duration, category badge
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`

### Live Partners & Advertisers Section
- Heading: `text-display-3` with green dot indicator
- Category pills: same style as the 6 hero cards but smaller
- Ad cards: `card` with dashed border for empty slots, solid for filled
- Marquee or grid layout

### Sponsor Banner (Afribot)
- Full-width banner with dark background
- Centered logo, tagline, CTA button
- `bg-gray-900 text-white py-16`

### How It Works Section
- Heading: `text-display-2` centered
- 3 steps in a row with numbered circles (1, 2, 3)
- Each step: icon, title, description
- Connecting line between steps on desktop

---

## STEP 4: GLOBAL CONSISTENCY FIXES

1. **Top navbar:** Keep it clean — ElimuX logo left, nav links center, auth right. The navbar should NOT compete with the hero for attention. Consider making it transparent over the hero with a backdrop blur, transitioning to solid on scroll.

2. **Footer:** Must appear on the homepage. The old Skolex design had no footer — add it.

3. **Dark mode:** The entire homepage must respect the dark mode toggle. No hardcoded light-only sections.

---

## STEP 5: VERIFICATION

After implementing:

1. `npx tsc --noEmit` — clean
2. `npm run build` — clean
3. `npx next start`
4. Manual checks:
   - Homepage loads, no UnifiedNavBar below the top navbar
   - 6 category cards visible in the hero, 3x2 grid on desktop
   - Headline reads "Discover Your Perfect Education"
   - AI search input prominent and centered
   - Stats bar visible below hero
   - Popular Programs, Partners, Sponsor, How It Works all render
   - Footer visible at bottom
   - Dark mode toggle works on homepage
   - Other pages (`/programs`, `/scholarships`, etc.) still show the UnifiedNavBar

---

## WHAT NOT TO DO

- Do NOT remove UnifiedNavBar from non-homepage routes.
- Do NOT change any API routes or database schema.
- Do NOT break existing auth, payments, or admin pages.
- Do NOT commit or push.

---

## REPORTING

After each step, report: files changed, tsc result, build result, any blockers.

After Step 5, report: "Cycle 027 complete. Homepage hero redesigned. Awaiting review and 'commit and push it'."