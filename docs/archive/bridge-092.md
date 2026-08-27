Cycle: Reset Search Result Count on Input Clear / Navigation
Problem
The orange button shows "2 Results" after a search. When the user:
Clicks the X (clear button) in the search input
Deletes all text from the input
Navigates away and back
…the button still says "2 Results" instead of reverting to "Search".
Root Cause
The resultCount state in AISearchBar or the parent page is not being cleared when the input is emptied or the component resets.
Fix
File 1: src/components/AISearchBar.tsx
Add an onClear callback prop and wire it to the clear button:
tsx
interface AISearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;        // ADD THIS
  loading?: boolean;
  resultCount?: number | null;
  initialQuery?: string;
}

// In the component, when clear/X is clicked:
const handleClear = () => {
  setQuery('');
  if (onClear) onClear();      // ADD THIS
  inputRef.current?.focus();
};
Also clear on input change when text becomes empty:
tsx
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value;
  setQuery(val);
  if (val.trim() === '' && onClear) {
    onClear();                  // ADD THIS
  }
};
File 2: src/app/ai-search/page.tsx
Pass onClear to AISearchBar and reset the result state:
tsx
<AISearchBar
  onSearch={handleSearch}
  onClear={() => {
    setResultCount(null);
    setSearchResults([]);
    setHasSearched(false);
    // Optional: clear URL param
    router.push('/ai-search', undefined, { shallow: true });
  }}
  loading={isSearching}
  resultCount={resultCount}
  initialQuery={router.query.q as string || ''}
/>
Additional: Reset on Page Load / Unmount
In src/app/ai-search/page.tsx, ensure resultCount resets when the page mounts without a ?q param:
tsx
useEffect(() => {
  const q = router.query.q as string;
  if (!q) {
    setResultCount(null);
    setSearchResults([]);
    setHasSearched(false);
  }
}, [router.query.q]);
Acceptance Criteria
[ ] After searching, button shows "2 Results"
[ ] Clicking the X (clear) button in the search input resets button to "Search"
[ ] Deleting all text from the input manually resets button to "Search"
[ ] Navigating to /ai-search with no ?q param shows "Search" button
[ ] Results container disappears when input is cleared
[ ] URL ?q= param is removed when input is cleared
Commit
Stage src/components/AISearchBar.tsx and src/app/ai-search/page.tsx.
Message: fix: reset result count and clear results when search input is emptied
Cycle: Auto-Scroll to Results on AI Search Trigger
Problem
When a user clicks a career card or category card lower down on /ai-search, the search runs but the user stays at their current scroll position. The results appear above the fold, invisible. The user thinks the click did nothing.
Solution
After any search-triggering action completes (and results are ready), smoothly scroll the viewport to the top of the results container — the area directly below the search bar.
Implementation
File: src/app/ai-search/page.tsx
Add a resultsRef and scroll to it after search completes:
tsx
import { useRef } from 'react';

// Add ref
const resultsRef = useRef<HTMLDivElement>(null);

// In handleSearch / runAISearch, after results are set:
const handleSearch = async (query: string) => {
  setIsSearching(true);
  setHasSearched(true);
  
  try {
    const results = await runAISearch(query);
    setSearchResults(results);
    setResultCount(results.length);
    
    // SCROLL TO RESULTS after state updates
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100); // small delay to let React render the container
    
  } finally {
    setIsSearching(false);
  }
};
Attach the ref to the results container:
tsx
{/* Results container */}
{hasSearched && (
  <div 
    ref={resultsRef}        // ADD THIS REF
    className="mt-6 w-full max-w-4xl mx-auto"
  >
    {/* existing results content */}
  </div>
)}
Also scroll when clicking category/career cards:
In the click handlers for category cards and career pathway cards, after calling handleSearch(query), the same scroll logic fires automatically since handleSearch now includes it.
If cards call a separate function, ensure that function also triggers the scroll after setting results.
Acceptance Criteria
[ ] Click "Graphic Designer" career card → page smoothly scrolls up to show results below search bar
[ ] Click "Doctor" career card → same behavior
[ ] Click any category card (Universities, Skills & Trades, etc.) → same behavior
[ ] Click Search button after typing → same behavior
[ ] If user is already at the top of the page, scroll does nothing (no jarring jump)
[ ] Smooth scroll animation (not instant jump)
[ ] Works on mobile viewport
Commit
Stage src/app/ai-search/page.tsx.
Message: feat: auto-scroll to search results when career/category cards are clicked