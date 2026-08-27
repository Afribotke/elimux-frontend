Cycle: Instant Scroll + Loading Feedback on Career Card Click
Problem
Clicking a career card (Doctor, Civil Engineer, Graphic Designer, etc.) triggers a search but the user stays scrolled down. The page feels frozen. The user must manually scroll up to discover results loaded. The previous fix scrolled only after results arrived — too late.
Solution
Two changes working together:
1. Instant Scroll on Click (Not After Results)
When ANY career card is clicked, immediately scroll the viewport to the search bar area before the API call even starts.
File: src/app/ai-search/page.tsx
tsx
const searchSectionRef = useRef<HTMLDivElement>(null);

const handleCareerSelect = (career: string) => {
  // SCROLL FIRST — instant feedback
  searchSectionRef.current?.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
  
  // THEN start search
  setSearchQuery(`I want to become a ${career}`);
  handleSearch(`I want to become a ${career}`);
};
Attach searchSectionRef to the container that wraps the hero headline + search bar + results area — the top of the interactive zone.
2. Loading State Visible Immediately
When isSearching is true, show a prominent loading indicator inside the results container so the user sees activity right away.
tsx
{isSearching && (
  <div className="mt-6 w-full max-w-4xl mx-auto bg-slate-800/50 rounded-2xl border border-slate-700 p-8 text-center">
    <div className="animate-spin inline-block w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mb-4" />
    <p className="text-white text-lg">Finding the best programs for you...</p>
    <p className="text-gray-400 text-sm mt-2">Searching for "{searchQuery}"</p>
  </div>
)}
This container must be already in the DOM before the search starts (or mount it instantly), so when the scroll lands, the user sees the spinner immediately.
3. Ensure All Card Clicks Trigger Scroll
Verify that every clickable element that triggers a search calls the scroll function:
Table
Element	Must Scroll To Search Area
Career pathway cards (Doctor, Civil Engineer, etc.)	YES
Search button	YES (if user scrolled down and clicked it)
Category cards below search	Already navigate away — no change
URL param auto-search on page load	NO (user is already at top)
Check: Find all onClick handlers in ai-search/page.tsx that call handleSearch or runAISearch. Add the scrollIntoView call to each one at the top of the handler, before any async work.
Acceptance Criteria
[ ] Click "Civil Engineer" card while scrolled down → page immediately smooth-scrolls up to search bar area
[ ] While scrolling, a "Finding the best programs for you..." spinner is visible in the results zone
[ ] When results arrive, spinner is replaced by actual results
[ ] Click "Graphic Designer" → same instant scroll + loading feedback
[ ] Click "Doctor" → same behavior
[ ] Click Search button while scrolled down → same scroll behavior
[ ] If already at top of page, no jarring scroll jump
[ ] Works on mobile viewport
Commit
Stage src/app/ai-search/page.tsx.
Message: fix: instant scroll to search area + loading spinner on career card click