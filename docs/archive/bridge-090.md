Cycle: AI Search — Live Result Count & Immediate Results Display
Overview
Upgrade the /ai-search page so that after a search executes, the orange Search button displays the result count (e.g., "17 Results"), and the matching results render immediately below the search bar — no scrolling past category cards required.
Files to Modify
src/components/AISearchBar.tsx — Button states and count display
src/app/ai-search/page.tsx — Results container placement and layout
1. AISearchBar Component — Button States
Modify the search button to cycle through three states:
Table
State	Button Text	Style
Idle (no search yet)	🔍 Search	Orange bg, white text
Loading	⏳ Searching...	Orange bg, white text, disabled cursor
Results returned	17 Results	Orange bg, white text — number is dynamic
Implementation:
Add resultCount: number | null as a prop to AISearchBar
Add isSearching: boolean as a prop
Button text logic:
tsx
if (isSearching) return '⏳ Searching...';
if (resultCount !== null) return `${resultCount} Result${resultCount !== 1 ? 's' : ''}`;
return '🔍 Search';
When resultCount === 0, show 0 Results (do not hide the count)
Button remains clickable in results state to allow re-search
2. AI Search Page — Results Placement
Current Layout (problem)
plain
[Category pills row]
[Hero text]
[Search bar]
[Or browse by category]
[Results ??? somewhere far below]
New Layout (target)
plain
[Category pills row]
[Hero text]
[Search bar]
[RESULTS CONTAINER — appears here immediately below search bar]
[Or browse by category — pushed down when results exist]
Implementation
In src/app/ai-search/page.tsx:
Add state:
tsx
const [searchResults, setSearchResults] = useState<any[]>([]);
const [resultCount, setResultCount] = useState<number | null>(null);
const [isSearching, setIsSearching] = useState(false);
const [hasSearched, setHasSearched] = useState(false);
Search execution flow:
tsx
const handleSearch = async (query: string) => {
  setIsSearching(true);
  setHasSearched(true);
  try {
    const response = await fetch(`/api/ai-search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    setSearchResults(data.results || []);
    setResultCount(data.results?.length || 0);
  } catch (err) {
    setSearchResults([]);
    setResultCount(0);
  } finally {
    setIsSearching(false);
  }
};
Results container — render immediately below search bar:
tsx
{/* Search bar */}
<AISearchBar 
  onSearch={handleSearch} 
  isSearching={isSearching}
  resultCount={resultCount}
/>

{/* Results appear directly below */}
{hasSearched && (
  <div className="mt-6 w-full max-w-4xl mx-auto">
    {isSearching ? (
      <div className="text-center py-12 text-gray-400">
        <div className="animate-spin inline-block w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mb-4" />
        <p>Finding the best programs for you...</p>
      </div>
    ) : searchResults.length === 0 ? (
      <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
        <p className="text-xl text-white mb-2">No results found</p>
        <p className="text-gray-400">Try adjusting your search or browse categories below</p>
      </div>
    ) : (
      <div className="space-y-4">
        <p className="text-sm text-gray-400 mb-4">
          Found {resultCount} program{resultCount !== 1 ? 's' : ''} matching your search
        </p>
        <div className="grid gap-4">
          {searchResults.map((result, idx) => (
            <SearchResultCard key={idx} result={result} />
          ))}
        </div>
      </div>
    )}
  </div>
)}

{/* Category cards — always below results */}
<div className="mt-12">
  <h3 className="text-center text-gray-400 mb-6">Or browse by category</h3>
  {/* existing category cards */}
</div>
SearchResultCard component — If it doesn't exist, create it or reuse existing card component:
Must display: program name, institution, location, level badge
Must link to program detail page on click
Must match the dark design system (slate backgrounds, proper borders)
3. Visual Specifications
Results Container
Background: bg-slate-800/50 with backdrop-blur-sm
Border: border border-slate-700/50
Border radius: rounded-2xl
Padding: p-6
Max width: Same as search bar (max-w-4xl or max-w-5xl)
Centered: mx-auto
Smooth Transition
Add transition-all duration-300 ease-out to the results container
Results should fade/slide in when they appear (use animate-fadeIn or Framer Motion if available)
Mobile
Results container must be full-width on mobile with px-4 padding
Cards should stack vertically (already likely the case)
4. Empty State
When search returns 0 results:
Show a centered message inside the results container
Text: "No results found" (white, text-xl)
Subtext: "Try adjusting your search or browse categories below" (gray-400)
Keep the category cards visible below so user can pivot immediately
5. Error State
If the API fails:
Show: "Something went wrong. Please try again." in red/orange
Button reverts to "Search"
resultCount stays at previous value or resets to null
6. URL Sync (maintain existing behavior)
When search executes, update URL to /ai-search?q={query} using router.push with shallow: true
On page load with ?q param, auto-trigger search and show results immediately
Acceptance Criteria
[ ] Search button shows "Searching..." during API call
[ ] Search button shows "X Results" after search completes (e.g., "17 Results")
[ ] Results render in a container immediately below the search bar
[ ] "Or browse by category" cards are pushed down below results
[ ] 0 results shows empty state with helpful message
[ ] Loading state shows spinner + "Finding the best programs for you..."
[ ] Results cards match dark design system
[ ] Mobile layout is correct (full width, proper padding)
[ ] URL updates with ?q= parameter on search
[ ] Page load with ?q= auto-triggers search and displays results immediately
Commit
Stage src/app/ai-search/page.tsx and src/components/AISearchBar.tsx (and any new component files).
Message: feat: live result count on search button + immediate results display below search bar
