"use client";

// ============================================================
// ELIMUX 22: Campaign Creation (FIXED for live schema)
// Uses: image_url, target_url (live columns)
// Uses: advertiserFetch helper + advertiser layout
// Currency: KES throughout
// Placement: fetched from /api/placements (if exists) or hardcoded
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { advertiserFetch } from "@/lib/advertiserAuth";  // Project's helper
import AdvertiserNav from "@/components/AdvertiserNav";

interface AdPricing {
  ad_cpc_rate: number; ad_cpm_rate: number; ad_cpa_rate: number;
  ad_min_daily_budget: number; ad_min_campaign_budget: number; ad_max_daily_budget: number;
  ad_billing_enabled: boolean;
}

interface Placement { id: string; name: string; type: string; }

export default function CreateCampaign() {
  const router = useRouter();
  const [pricing, setPricing] = useState<AdPricing | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    title: "", description: "", billing_model: "cpc" as "cpc"|"cpm"|"cpa",
    budget: 50, daily_budget: 5, total_budget: 50,
    duration_days: 7, placement: "", start_date: "", end_date: "",
    image_url: "", target_url: ""
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => { fetchPricing(); fetchPlacements(); }, []);

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/settings/ad-pricing`);
      const result = await res.json();
      if (result.success) {
        setPricing(result.data);
        setForm(p => ({ ...p, budget: result.data.ad_min_campaign_budget, daily_budget: result.data.ad_min_daily_budget, total_budget: result.data.ad_min_campaign_budget }));
      }
    } catch (err) { console.error("Fetch pricing error:", err); }
  };

  const fetchPlacements = async () => {
    try {
      // Try live endpoint first
      const res = await advertiserFetch("/placements");
      const result = await res.json();
      if (result.success && result.data?.length > 0) {
        setPlacements(result.data);
      } else {
        // Fallback: match live ad_slots.slot_type values exactly
        setPlacements([
          { id: "featured", name: "Featured Listing", type: "featured" },
          { id: "hero", name: "Homepage Hero", type: "hero" },
          { id: "banner", name: "Banner Ad", type: "banner" },
          { id: "sponsored", name: "Sponsored Content", type: "sponsored" },
          { id: "search", name: "Search Results", type: "search" }
        ]);
      }
    } catch (err) {
      console.error("Fetch placements error:", err);
      // Fallback on error too
      setPlacements([
        { id: "featured", name: "Featured Listing", type: "featured" },
        { id: "hero", name: "Homepage Hero", type: "hero" },
        { id: "banner", name: "Banner Ad", type: "banner" },
        { id: "sponsored", name: "Sponsored Content", type: "sponsored" },
        { id: "search", name: "Search Results", type: "search" }
      ]);
    } finally { setLoading(false); }
  };

  const handleChange = (field: string, value: any) => { setForm(p => ({ ...p, [field]: value })); setMsg({ type: "", text: "" }); };

  const getRate = () => {
    if (!pricing) return 0;
    switch (form.billing_model) { case "cpc": return pricing.ad_cpc_rate; case "cpm": return pricing.ad_cpm_rate; case "cpa": return pricing.ad_cpa_rate; default: return 0; }
  };

  const getEstimatedReach = () => {
    const rate = getRate();
    if (rate <= 0) return 0;
    if (form.billing_model === "cpm") return Math.floor((form.daily_budget / rate) * 1000);
    return Math.floor(form.daily_budget / rate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setMsg({ type: "", text: "" });
    try {
      const res = await advertiserFetch("/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title, description: form.description, billing_model: form.billing_model,
          budget: parseFloat(form.budget.toString()),
          daily_budget: form.daily_budget ? parseFloat(form.daily_budget.toString()) : undefined,
          total_budget: form.total_budget ? parseFloat(form.total_budget.toString()) : undefined,
          duration_days: parseInt(form.duration_days.toString()),
          placement: form.placement,
          start_date: form.start_date || undefined, end_date: form.end_date || undefined,
          image_url: form.image_url || undefined,
          target_url: form.target_url || undefined
        })
      });
      const result = await res.json();
      if (result.success) { setMsg({ type: "success", text: result.message }); setTimeout(() => router.push("/advertiser/campaigns"), 2000); }
      else setMsg({ type: "error", text: result.error || "Failed to create campaign" });
    } catch (err: any) { setMsg({ type: "error", text: err.message || "Failed to create campaign" }); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdvertiserNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
          <p className="mt-2 text-muted">
            {pricing?.ad_billing_enabled
              ? "Pay-per-click billing: no upfront charge. You pay only for actual clicks."
              : "Flat budget mode: budget deducted upfront at creation."}
          </p>
        </div>

        {msg.text && <div className={`mb-6 p-4 rounded-lg ${msg.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200 elimux-danger"}`}>{msg.text}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title *</label>
                <input type="text" required value={form.title} onChange={(e) => handleChange("title", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Summer Enrollment Drive" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => handleChange("description", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Describe your campaign goals..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Billing Model *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[{id:"cpc",label:"Pay Per Click",desc:"Best for traffic",color:"blue"},{id:"cpm",label:"Pay Per View",desc:"Best for awareness",color:"green"},{id:"cpa",label:"Pay Per Action",desc:"Best for conversions",color:"purple"}].map((m) => (
                    <button key={m.id} type="button" onClick={() => handleChange("billing_model", m.id)} className={`p-4 rounded-lg border-2 text-left transition-all ${form.billing_model === m.id ? `border-${m.color}-500 bg-${m.color}-50` : "border-gray-200 hover:border-gray-300"}`}>
                      <p className={`font-medium ${form.billing_model === m.id ? `text-${m.color}-700` : "text-gray-900"}`}>{m.label}</p>
                      <p className="text-xs text-muted mt-1">{m.desc}</p>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600">Current rate: <span className="font-semibold text-blue-600">KES {getRate().toFixed(2)} {form.billing_model === "cpm" ? "per 1,000 impressions" : form.billing_model === "cpa" ? "per conversion" : "per click"}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placement *</label>
                <select required value={form.placement} onChange={(e) => handleChange("placement", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select placement...</option>
                  {placements.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget (KES) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">KES</span>
                    <input type="number" required min={pricing?.ad_min_campaign_budget || 1} step="0.01" value={form.budget} onChange={(e) => handleChange("budget", parseFloat(e.target.value))} className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days) *</label>
                  <input type="number" required min={1} value={form.duration_days} onChange={(e) => handleChange("duration_days", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {pricing?.ad_billing_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Budget (KES)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">KES</span>
                      <input type="number" min={pricing?.ad_min_daily_budget || 1} max={pricing?.ad_max_daily_budget || 10000} step="0.01" value={form.daily_budget} onChange={(e) => handleChange("daily_budget", parseFloat(e.target.value))} className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input type="url" value={form.image_url} onChange={(e) => handleChange("image_url", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target URL (Landing Page)</label>
                  <input type="url" value={form.target_url} onChange={(e) => handleChange("target_url", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={submitting} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {submitting ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Calculator</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-muted">Model</span><span className="font-medium uppercase">{form.billing_model}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-muted">Rate</span><span className="font-medium">KES {getRate().toFixed(2)}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-muted">Daily Budget</span><span className="font-medium">KES {form.daily_budget.toFixed(2)}</span></div>
                <div className="pt-4">
                  <p className="text-sm text-muted mb-2">Est. Daily Reach</p>
                  <p className="text-3xl font-bold text-blue-600">{getEstimatedReach().toLocaleString()}<span className="text-sm font-normal text-gray-500 ml-2">{form.billing_model === "cpm" ? "impressions" : "clicks"}</span></p>
                </div>
                {pricing?.ad_billing_enabled && <div className="bg-blue-50 rounded-lg p-4 mt-4"><p className="text-sm text-blue-800 font-medium">Pay-Per-Click Mode</p><p className="text-sm text-blue-700 mt-1">No upfront charge. Pay only when users click your ad.</p></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
