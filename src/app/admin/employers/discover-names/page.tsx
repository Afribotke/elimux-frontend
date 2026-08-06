"use client";

import { useState } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAdminKey } from "@/components/admin/AdminKeyContext";

export default function EmployerNameDiscoveryUploadPage() {
  const { adminKey } = useAdminKey();
  const [names, setNames] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    const nameList = names.split("\n").map(n => n.trim()).filter(n => n.length > 0);
    if (nameList.length === 0) {
      setError("Please enter at least one employer name");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const resp = await fetch(`${apiUrl}/api/employer-names/bulk-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey || "" },
        body: JSON.stringify({ names: nameList }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Upload failed");

      setResult(data);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employer Name Discovery Upload</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Paste employer names below (one per line). The system will:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4 list-disc pl-5">
            <li>Check for duplicates automatically</li>
            <li>Attempt to discover website URLs safely (no scraping)</li>
            <li>Mark all entries as pending verification</li>
          </ul>

          <textarea
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder="Safaricom Limited&#10;Kenya Power&#10;Equity Bank&#10;KCB Group"
            className="w-full h-64 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none resize-none mb-4"
          />

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

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Processed {result.processed} names
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {result.results?.map((r: any, i: number) => (
                  <div key={i} className="text-xs flex items-center gap-2 py-1 border-b border-green-100 dark:border-green-800 last:border-0">
                    <span className={`w-2 h-2 rounded-full ${r.status === 'created' ? 'bg-green-500' : r.status === 'skipped' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="flex-1 text-gray-700 dark:text-gray-300">{r.name}</span>
                    <span className="text-gray-500">{r.status}</span>
                    {r.website_url && <span className="text-blue-600 truncate max-w-[150px]">{r.website_url}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
