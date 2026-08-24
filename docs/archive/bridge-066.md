COMMIT AND PUSH EVERYTHING

All pending changes from Cycles 025–028 are verified and ready to ship.

1. Stage all changes:
   git add -A

2. Commit with message:
   git commit -m "design: SV-grade overhaul + TVET grade matcher + unified nav — Cycles 025-028"

3. Push to production:
   git push origin main

4. Monitor the Vercel deploy:
   - Watch the build output
   - Confirm deploy succeeds
   - Report the production URL when live

5. After deploy, verify live:
   - https://www.elimux.ke/ — homepage loads with dark hero, 6 category cards, AI search
   - https://www.elimux.ke/programs?type=tvet — TVET page with "Match Your Grade" hero, live count, working filter
   - https://www.elimux.ke/internships — dedicated internship page
   - https://www.elimux.ke/attachments — polished empty state
   - https://www.elimux.ke/scholarships — unified nav visible
   - Dark mode toggle works
   - Mobile nav has no "Jobs" tab

Report: commit hash, push result, deploy status, and any errors.