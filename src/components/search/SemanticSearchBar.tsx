"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SearchSuggestion {
  text: string;
  type: "program" | "institution" | "career" | "location";
  confidence: number;
}

export function SemanticSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch {
      // Silently fail for suggestions
    }
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=semantic`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const getSuggestionIcon = (type: string) => {
    const icons: Record<string, string> = {
      program: "📚",
      institution: "🏫",
      career: "💼",
      location: "📍",
    };
    return icons[type] || "🔍";
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search programs, institutions, careers... Try: 'computer science in Nairobi'"
            className="h-12 text-lg pl-4 pr-10"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        <Button 
          onClick={() => handleSearch()} 
          disabled={isLoading}
          className="h-12 px-6"
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b last:border-0"
            >
              <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
              <div className="flex-1">
                <p className="font-medium">{suggestion.text}</p>
                <p className="text-xs text-slate-500 capitalize">{suggestion.type}</p>
              </div>
              <div className="w-16">
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${suggestion.confidence * 100}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-2 text-center">
        Try: "software engineering bachelor near me" or "nursing diploma affordable"
      </p>
    </div>
  );
}
