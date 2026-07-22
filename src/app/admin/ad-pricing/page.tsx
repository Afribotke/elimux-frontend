"use client";

import { useState, useEffect } from "react";

interface AdPricingSettings {
  ad_cpc_rate: number; ad_cpm_rate: number; ad_cpa_rate: number;
  ad_min_daily_budget: number; ad_min_campaign_budget: number; ad_max_daily_budget: number;
  ad_platform_fee_percent: number; ad_partner_commission_percent: number;
  ad_tier_1_threshold: number; ad_tier_1_discount: number;
  ad_tier_2_threshold: number; ad_tier_2_discount: number;
  ad_tier_3_threshold: number; ad_tier_3_discount: number;
  ad_billing_enabled: boolean;
}

export default function AdminAdPricing() {
  const [settings, setSettings] = useState<AdPricingSettings | null>(null);
  const [original, setOriginal] = useState<AdPricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [tab, setTab] = useState("rates");
  const [changed, setChanged] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const ADMIN_KEY = typeof window !== "undefined" ? localStorage.getItem("admin_key") || "" : "";

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/settings/ad-pricing`, {
        headers: { "X-Admin-Key": ADMIN_KEY }
      });
      const result = await res.json();
      if (result.success) { setSettings(result.data); setOriginal(result.data); }
      else setMsg({ type: "error", text: result.error || "Failed to load settings" });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to load settings" });
    } finally { setLoading(false); }
  };

  const handleChange = (field: keyof AdPricingSettings, value: string | boolean) => {
    if (!settings) return;
    let updated: AdPricingSettings;
    if (field === "ad_billing_enabled") updated = { ...settings, [field]: value as boolean };
    else { const num = parseFloat(value as string); updated = { ...settings, [field]: isNaN(num) ? 0 : num }; }
    setSettings(updated);
    setChanged(JSON.stringify(updated) !== JSON.stringify(original));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      const res = await fetch(`${API_URL}/api/admin/settings/ad-pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify(settings),
      });
      const result = await res.json();
      if (result.success) {
        setOriginal(settings); setChanged(false);
        setMsg({ type: "success", text: "Ad pricing saved! New campaigns use updated rates immediately." });
      } else {
        setMsg({ type: "error", text: result.error || result.details?.join(", ") || "Save failed" });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Save failed" });
    } finally { setSaving(false); }
  };

  const handleReset = () => {
    if (original) { setSettings(original); setChanged(false); setMsg({ type: "", text: "" }); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!settings) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-red-600">Failed to load pricing settings. Check admin key.</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ad Pricing & Billing</h1>
              <p className="text-sm text-gray-500 mt-1">Adjust CPC, CPM, CPA rates, fees, discounts. Changes apply instantly.</p>
            </div>
            <div className="flex items-center gap-3">
              {changed && <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">Unsaved Changes</span>}
              <button onClick={handleReset} disabled={!changed} className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50">Reset</button>
              <button onClick={handleSave} disabled={!changed || saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Billing Mode</h3>
            <p className="text-sm text-gray-500">{settings.ad_billing_enabled ? "Per-click billing: advertisers pay only for actual clicks. No upfront charge." : "Flat budget mode: full budget deducted upfront at creation (legacy)."}</p>
          </div>
          <button onClick={() => handleChange("ad_billing_enabled", !settings.ad_billing_enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.ad_billing_enabled ? "bg-blue-600" : "bg-gray-200"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.ad_billing_enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {msg.text && (
        <div className="max-w-5xl mx-auto px-6 mt-4">
          <div className={`p-4 rounded-lg ${msg.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>{msg.text}</div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            {[{id:"rates",label:"Rates",icon:"$"},{id:"budgets",label:"Budgets",icon:"#"},{id:"fees",label:"Fees",icon:"%"},{id:"tiers",label:"Discounts",icon:"*"}].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`py-3 border-b-2 text-sm font-medium flex items-center gap-2 ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>{t.icon} {t.label}</button>
            ))}
          </nav>
        </div>

        {tab === "rates" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{key:"ad_cpc_rate",label:"CPC Rate",desc:"Per click",color:"blue"},{key:"ad_cpm_rate",label:"CPM Rate",desc:"Per 1,000 impressions",color:"green"},{key:"ad_cpa_rate",label:"CPA Rate",desc:"Per conversion",color:"purple"}].map((f) => (
              <div key={f.key} className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className={`font-medium text-${f.color}-700 mb-3`}>{f.label}</h3>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">KES</span>
                  <input type="number" step="0.01" min="0.01" value={settings[f.key as keyof AdPricingSettings] as number} onChange={(e) => handleChange(f.key as keyof AdPricingSettings, e.target.value)} className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "budgets" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{key:"ad_min_daily_budget",label:"Min Daily Budget"},{key:"ad_min_campaign_budget",label:"Min Campaign Budget"},{key:"ad_max_daily_budget",label:"Max Daily Budget"}].map((f) => (
              <div key={f.key} className="bg-white rounded-lg border border-gray-200 p-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">KES</span>
                  <input type="number" step="0.01" value={settings[f.key as keyof AdPricingSettings] as number} onChange={(e) => handleChange(f.key as keyof AdPricingSettings, e.target.value)} className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "fees" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[{key:"ad_platform_fee_percent",label:"Platform Fee %",desc:"ElimuX keeps this %"},{key:"ad_partner_commission_percent",label:"Partner Commission %",desc:"Referral payout %"}].map((f) => (
              <div key={f.key} className="bg-white rounded-lg border border-gray-200 p-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                <div className="relative">
                  <input type="number" step="0.01" min="0" max="100" value={settings[f.key as keyof AdPricingSettings] as number} onChange={(e) => handleChange(f.key as keyof AdPricingSettings, e.target.value)} className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "tiers" && (
          <div className="space-y-4">
            {[{tier:1,threshKey:"ad_tier_1_threshold",discKey:"ad_tier_1_discount",label:"Bronze",color:"orange",emoji:"3"},{tier:2,threshKey:"ad_tier_2_threshold",discKey:"ad_tier_2_discount",label:"Silver",color:"gray",emoji:"2"},{tier:3,threshKey:"ad_tier_3_threshold",discKey:"ad_tier_3_discount",label:"Gold",color:"yellow",emoji:"1"}].map((t) => (
              <div key={t.tier} className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-6">
                <div className={`w-12 h-12 bg-${t.color}-100 rounded-full flex items-center justify-center text-xl font-bold`}>{t.emoji}</div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.label} Threshold</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">KES</span>
                      <input type="number" step="0.01" value={settings[t.threshKey as keyof AdPricingSettings] as number} onChange={(e) => handleChange(t.threshKey as keyof AdPricingSettings, e.target.value)} className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.label} Discount</label>
                    <div className="relative">
                      <input type="number" step="0.01" value={settings[t.discKey as keyof AdPricingSettings] as number} onChange={(e) => handleChange(t.discKey as keyof AdPricingSettings, e.target.value)} className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
