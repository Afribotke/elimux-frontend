"use client";

import { useState, useCallback } from "react";

interface SearchResult {
  id: string;
  type: "program" | "institution";
  title: string;
  description: string;
  similarity: number;
  metadata: Record<string, any>;
}

interface SearchFilters {
  type?: ("program" | "institution")[];
  location?: string;
  level?: string;
  duration?: string;
  priceRange?: [number, number];
}

export function useSemanticSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setResults(data.results || []);
      return data.results || [];
    } catch (err: any) {
      setError(err.message || "Search failed");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchByEmbedding = useCallback(async (embedding: number[], filters?: SearchFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search/vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding, filters }),
      });

      if (!response.ok) throw new Error("Vector search failed");

      const data = await response.json();
      setResults(data.results || []);
      return data.results || [];
    } catch (err: any) {
      setError(err.message || "Vector search failed");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    searchByEmbedding,
  };
}
