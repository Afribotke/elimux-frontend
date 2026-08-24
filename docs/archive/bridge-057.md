CYCLE 027 — HOMEPAGE DESIGN AUDIT & STANDARDIZATION PROPOSAL

The user wants you to audit the current homepage (localhost:3000) and propose what needs to be standardized to reach Silicon Valley-grade polish. Do NOT write code yet — this is an analysis and recommendation phase.

AUDIT CHECKLIST — Inspect the current local build and report on each:

=== 1. VISUAL HIERARCHY ===
- Does every section have clear visual priority? (Hero > Search > Categories > Content > Footer)
- Are heading sizes consistent and meaningful across sections?
- Is there excessive whitespace or cramped spacing anywhere?

=== 2. TYPOGRAPHY ===
- Are font sizes consistent? (e.g., does "Popular Programs" heading match "LIVE Partners" heading weight/size?)
- Is line-height comfortable for readability?
- Any stray font families or weights that don't match the design system?

=== 3. COLOR CONSISTENCY ===
- Do all interactive elements use the same primary color?
- Are hover states consistent across all cards, buttons, and links?
- Any hardcoded colors that bypass the Tailwind theme?
- Dark mode: does every section respect the toggle, or are there light-only leaks?

=== 4. COMPONENT CONSISTENCY ===
- Do cards share the same border-radius, shadow, and padding?
- Do buttons look the same everywhere?
- Are icons sized consistently?
- Is spacing (gap, margin, padding) uniform across sections?

=== 5. INTERACTION & FEEDBACK ===
- Do all clickable elements have hover states?
- Do all focusable elements have visible focus rings?
- Are loading states present where data fetches?
- Are empty states designed (not just plain text)?

=== 6. RESPONSIVE BEHAVIOR ===
- Does the layout break at any breakpoint?
- Do cards stack correctly on mobile?
- Is text readable on all screen sizes?
- Does the mobile nav work cleanly?

=== 7. CONTENT & COPY ===
- Is every headline clear and compelling?
- Is placeholder text professional (no "Lorem ipsum", no typos)?
- Are CTAs action-oriented?

=== 8. PERFORMANCE & ACCESSIBILITY ===
- Are images optimized (or properly sized if unoptimized)?
- Is color contrast sufficient (WCAG AA)?
- Are form labels associated with inputs?
- Are ARIA labels present on icon-only buttons?

=== REPORT FORMAT ===

For each category above, report:
- ✅ PASS — no issues found
- ⚠️ FLAG — minor inconsistency, recommend fix
- ❌ FAIL — significant issue, must fix before shipping

Then provide a prioritized list:
1. MUST FIX (blocks launch)
2. SHOULD FIX (polish gap)
3. NICE TO HAVE (future cycle)

Finally, propose the STANDARDIZATION PLAN:
- What specific changes would you make?
- Which files would you touch?
- What is the estimated scope (small/medium/large)?

DO NOT write any code. DO NOT modify any files. This is read-only analysis.

Report your full audit in a single consolidated response.