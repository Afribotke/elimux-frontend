"use client";

import { useState, useCallback } from "react";

interface EmployerName {
  id: string;
  name: string;
  suggested_website_url: string | null;
  verified_website_url: string | null;
  verification_status: string;
}

export function useEmployerNames() {
  const [results, setResults] = useState<EmployerName[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const resp = await fetch(`/api/employers/names?q=${encodeURIComponent(query)}`);
      if (!resp.ok) throw new Error("Search failed");
      const data = await resp.json();
      setResults(data.data || []);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}
