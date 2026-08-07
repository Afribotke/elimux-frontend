"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, ExternalLink } from "lucide-react";
import { searchTvetaPublic, type TvetaPublicSearchResult } from "@/lib/api";

export default function VerifyCollegePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TvetaPublicSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (query.trim().length < 3) return;
    setSearching(true);
    setError("");

    try {
      const resp = await searchTvetaPublic(query.trim());
      setResults(resp.data || []);
    } catch {
      setResults([]);
      setError("Could not reach the verification service. Please try again.");
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <ShieldCheck className="w-12 h-12 text-primary-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-foreground mb-2">Verify Your College</h1>
        <p className="text-muted">
          Check if your institution is officially accredited by TVETA. Protect yourself from fake colleges.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-elimux-card border border-border rounded-2xl p-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Type college name (e.g. Kenya Coast National Polytechnic)"
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || query.trim().length < 3}
            className="bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 shrink-0"
          >
            {searching ? "Checking..." : "Verify"}
          </button>
        </div>

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        <div className="mt-8">
          {searched && !searching && results.length === 0 && !error && (
            <div className="text-center py-12 bg-elimux-card border border-red-500/30 rounded-2xl">
              <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Not Found in TVETA Registry</h3>
              <p className="text-muted text-sm max-w-md mx-auto">
                This institution does not appear in the official TVETA accredited list. Proceed with caution — it
                may be unaccredited.
              </p>
            </div>
          )}

          {results.map((inst) => (
            <div key={inst.id} className="bg-elimux-card border border-border rounded-2xl p-6 mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{inst.name}</h3>
                  {inst.registrationNumber && (
                    <p className="text-sm text-muted font-mono mt-1">TVETA Reg: {inst.registrationNumber}</p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shrink-0 ${
                    inst.accredited
                      ? "bg-green-500/15 text-green-400 border-green-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {inst.accredited ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  {inst.accredited ? "Accredited" : "Unverified"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted">Category</p>
                  <p className="font-medium text-foreground">{inst.category || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted">County</p>
                  <p className="font-medium text-foreground">{inst.county || "N/A"}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <a
                  href="https://www.tveta.go.ke/accredited-tvet-institutions/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  View on TVETA website
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted text-center mt-8">
          Data sourced from TVETA&apos;s public accredited institutions registry. ElimuX does not guarantee accuracy
          — always verify directly with TVETA.
        </p>
      </div>
    </main>
  );
}
