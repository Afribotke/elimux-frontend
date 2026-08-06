"use client";

import { useState } from "react";
import { Upload, AlertTriangle, Loader2 } from "lucide-react";
import { useAdminKey } from "@/components/admin/AdminKeyContext";

interface ResultItem {
  name: string;
  status: string;
  error?: string;
}

interface Summary {
  total: number;
  created: number;
  skipped: number;
  errors: number;
}

const BATCH_SIZE = 100; // Process 100 names per request to avoid timeouts

export default function EmployerNameDiscoverPage() {
  const { adminKey } = useAdminKey();
  const [names, setNames] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

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

    const batches: string[][] = [];
    for (let i = 0; i < nameList.length; i += BATCH_SIZE) {
      batches.push(nameList.slice(i, i + BATCH_SIZE));
    }

    setTotalBatches(batches.length);
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const allResults: ResultItem[] = [];

    for (let i = 0; i < batches.length; i++) {
      setCurrentBatch(i + 1);
      setProgress(Math.round((i / batches.length) * 100));

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const resp = await fetch(`${apiUrl}/api/employer-names/bulk-upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Key": adminKey || "",
          },
          body: JSON.stringify({ names: batches[i] }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(`Batch ${i + 1} failed: ${errData.error || resp.statusText}`);
        }

        const data = await resp.json();
        totalCreated += data.created || 0;
        totalSkipped += data.skipped || 0;
        totalErrors += data.errors || 0;
        allResults.push(...(data.results || []));
      } catch (err: any) {
        setError(`Batch ${i + 1} failed: ${err.message}`);
        setResults(allResults);
        setSummary({ total: nameList.length, created: totalCreated, skipped: totalSkipped, errors: totalErrors });
        setLoading(false);
        return;
      }
    }

    setProgress(100);
    setResults(allResults);
    setSummary({
      total: nameList.length,
      created: totalCreated,
      skipped: totalSkipped,
      errors: totalErrors,
    });
    setLoading(false);
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

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">How it works</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Names are processed in batches of {BATCH_SIZE} to avoid timeouts.
              For 2,890 names, expect ~{Math.ceil(2890 / BATCH_SIZE)} batches.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <textarea
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder="Kenya Revenue Authority&#10;Kenya Power & Lighting Company&#10;Safaricom Limited&#10;KCB Group"
            disabled={loading}
            className="w-full h-64 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none resize-none mb-4 disabled:opacity-50"
          />

          {loading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Batch {currentBatch} of {totalBatches}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {summary && !loading && (
            <div className="flex gap-4 mb-4 text-xs">
              <span className="text-gray-600 dark:text-gray-400 font-medium">{summary.total} total</span>
              <span className="text-green-600 dark:text-green-400 font-medium">{summary.created} created</span>
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">{summary.skipped} skipped</span>
              {summary.errors > 0 && <span className="text-red-600 dark:text-red-400 font-medium">{summary.errors} errors</span>}
            </div>
          )}

          <button onClick={handleUpload} disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Batch {currentBatch}/{totalBatches}...</> : <><Upload className="w-4 h-4" /> Upload Employer Names</>}
          </button>

          {error && !loading && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Results</h3>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {results.slice(0, 50).map((r, i) => (
                <div key={i} className="text-xs flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${r.status === "created" ? "bg-green-500" : r.status === "skipped" ? "bg-yellow-500" : "bg-red-500"}`} />
                  <span className="flex-1 text-gray-700 dark:text-gray-300 truncate font-medium">{r.name}</span>
                  <span className="text-gray-500 shrink-0">{r.status}</span>
                </div>
              ))}
              {results.length > 50 && (
                <p className="text-xs text-gray-400 text-center py-2">...and {results.length - 50} more</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <strong>Liability Note:</strong> Website URLs are discovered separately and marked as suggestions only.
            Employers must verify their own URL during registration.
          </p>
        </div>
      </div>
    </div>
  );
}
