QUICK FIX — ADD TVET CREDIBILITY LINE WITH REAL PROGRAM COUNT (execute immediately, no questions)

In src/app/programs/page.tsx, within the TVET hero section (below the subheadline, above the grade selector):

ADD a centered credibility line:

"Discover [X] programs from top TVET institutions under TVET Authority"

Where [X] is the EXACT, REAL count of TVET programs from the database.

REQUIREMENTS:
1. The count must be dynamic — query it from the same Supabase table that powers the program listings.
2. Use the existing TVET filter (institution.type matching tvet/technical/vocational/polytechnic) to get the accurate count.
3. The count should update automatically as programs are added/removed.
4. If the count query is slow, show a skeleton or spinner briefly, then the number.
5. Style:
   - text-sm text-gray-400 dark:text-gray-500
   - centered
   - mt-2 mb-6
   - Optional: small shield/check icon before the text for trust signal

EXACT TEXT TO USE:
"Discover {count} programs from top TVET institutions under TVET Authority"

Do NOT hardcode "11,571" or any number. Fetch the real count.

If fetching the exact count requires a separate API call that doesn't exist yet, use the count from the existing programs query result (the same data that populates the grid below). The page already fetches TVET programs — derive the count from that response.

After change:
- npx tsc --noEmit
- npm run build
- npx next start
- Navigate to /programs?type=tvet
- Verify the real program count appears below the subheadline

DO NOT commit. DO NOT push.