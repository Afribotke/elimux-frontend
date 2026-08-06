"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, AlertCircle, Loader2 } from "lucide-react";
import { useAdminKey } from "@/components/admin/AdminKeyContext";

interface ResultItem {
  name: string;
  status: string;
  website_url?: string | null;
  abbreviation?: string | null;
}

export default function EmployerNameDiscoverPage() {
  const { adminKey } = useAdminKey();
  const [names, setNames] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [summary, setSummary] = useState<{total: number; created: number; skipped: number; errors: number} | null>(null);
  const [error, setError] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animated progress bar while waiting for response
  useEffect(() => {
    if (loading) {
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Cap at 90% until real response
          return prev + Math.random() * 15;
        });
      }, 300);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  async function handleUpload() {
    const nameList = names.split("\n").map(n => n.trim()).filter(n => n.length > 0);
    if (nameList.length === 0) {
      setError("Please enter at least one employer name");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setSummary(null);
    setProgress(0);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const resp = await fetch(`${apiUrl}/api/employer-names/bulk-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey || "",
        },
        body: JSON.stringify({ names: nameList }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
      }

      setResults(data.results || []);
      setSummary({
        total: data.total,
        created: data.created,
        skipped: data.skipped,
        errors: data.errors,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employer Name Upload</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Paste employer names below (one per line). The system will:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4 list-disc pl-5">
            <li>Normalize names to Title Case automatically</li>
            <li>Extract abbreviations (e.g., Kenya Revenue Authority → KRA)</li>
            <li>Discover website URLs using abbreviations + full names</li>
            <li>Check for duplicates automatically</li>
          </ul>

          <textarea
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder="Kenya Revenue Authority&#10;Kenya Power & Lighting Company&#10;Safaricom Limited&#10;KCB Group"
            disabled={loading}
            className="w-full h-64 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none resize-none mb-4 disabled:opacity-50"
          />

          {/* Progress Bar */}
          {loading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Discovering websites...</span>
                <span>{Math.min(Math.round(progress), 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          {summary && !loading && (
            <div className="flex gap-4 mb-4 text-xs">
              <span className="text-gray-600 dark:text-gray-400 font-medium">{summary.total} total</span>
              <span className="text-green-600 dark:text-green-400 font-medium">{summary.created} created</span>
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">{summary.skipped} skipped</span>
              {summary.errors > 0 && <span className="text-red-600 dark:text-red-400 font-medium">{summary.errors} errors</span>}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload & Discover Websites
              </>
            )}
          </button>

          {error && !loading && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Results list */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Results</h3>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {results.map((r, i) => (
                <div key={i} className="text-xs flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    r.status === "created" ? "bg-green-500" : r.status === "skipped" ? "bg-yellow-500" : "bg-red-500"
                  }`} />
                  <span className="flex-1 text-gray-700 dark:text-gray-300 truncate font-medium">{r.name}</span>
                  {r.abbreviation && (
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                      {r.abbreviation}
                    </span>
                  )}
                  <span className="text-gray-500 shrink-0">{r.status}</span>
                  {r.website_url && (
                    <a
                      href={r.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-[120px] shrink-0"
                    >
                      {r.website_url.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <strong>Liability Note:</strong> Website URLs are discovered via safe URL pattern matching only.
            No third-party websites are scraped. Employers must verify their own website URL during registration.
          </p>
        </div>
      </div>
    </div>
  );
}
