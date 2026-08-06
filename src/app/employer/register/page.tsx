"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, CheckCircle, Search } from "lucide-react";
import { useEmployerNames } from "@/lib/useEmployerNames";

const INDUSTRIES = [
  "Engineering","Information Technology","Healthcare and Medicine","Education",
  "Business and Finance","Agriculture","Hospitality and Tourism","Media and Communications",
  "Law and Legal","Architecture and Design","Science and Research","Manufacturing",
  "Retail","Transport and Logistics","Energy","Construction"
];

const COMPANY_SIZES = ["1-10","11-50","51-200","201-500","500+"];

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ── Employer Name Auto-Complete ──
// Searches employer_names table as user types 3+ letters
function EmployerAutocomplete({ value, onSelect }: { value: string; onSelect: (name: string, suggestedUrl?: string | null) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const { results, loading, search } = useEmployerNames();

  useEffect(() => {
    if (query.length >= 3) {
      search(query);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [query, search]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelect(e.target.value);
          }}
          onFocus={() => query.length >= 3 && setOpen(true)}
          placeholder="Start typing your company name..."
          className="pl-10"
        />
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-4 py-2 text-xs text-gray-500">Searching...</div>
          )}
          {results.map((employer) => (
            <button
              key={employer.id}
              type="button"
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              onClick={() => {
                setQuery(employer.name);
                onSelect(employer.name, employer.suggested_website_url);
                setOpen(false);
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{employer.name}</span>
                {employer.suggested_website_url && (
                  <span className="text-[10px] text-blue-600 truncate max-w-[120px]">
                    {employer.suggested_website_url.replace(/^https?:\/\//, "")}
                  </span>
                )}
              </div>
              {employer.suggested_website_url && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Suggested URL — verify during registration
                </p>
              )}
            </button>
          ))}
          {results.length === 0 && !loading && query.length >= 3 && (
            <div className="px-4 py-2 text-xs text-gray-500">
              No matches found. You can still register with this name.
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export default function EmployerRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    registration_number: "",
    kra_pin: "",
    industry: "",
    company_size: "",
    website_url: "",
    description: "",
    location_county: "",
    location_address: "",
  });

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in");
        setError("Please log in to register as an employer.");
        return;
      }

      if (!form.industry || form.industry.trim() === "") {
        setError("Industry is required. Please select an industry.");
        toast.error("Industry is required");
        return;
      }

      // verification_status/is_verified aren't sent - the backend always
      // sets those itself (new employers start pending/unverified
      // regardless of what a caller sends).
      const res = await fetch(`${API_URL}/api/employers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!result.success) {
        setError("Failed to register: " + result.error);
        toast.error("Failed to register: " + result.error);
        return;
      }

      toast.success("Registration submitted for review");
      router.push("/employer/dashboard");
    } catch (err: any) {
      const message = err?.message || "An unexpected error occurred. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <Building2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Register as Employer</h1>
          <p className="text-muted-foreground">Post internships and find verified student talent.</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Step {step} of 2</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="relative">
                  <Label>Company Name *</Label>
                  <EmployerAutocomplete
                    value={form.company_name}
                    onSelect={(name, suggestedUrl) => {
                      setForm({ ...form, company_name: name, website_url: suggestedUrl || form.website_url });
                    }}
                  />
                </div>
                <div><Label>Company Email *</Label><Input type="email" value={form.company_email} onChange={(e) => setForm({ ...form, company_email: e.target.value })} /></div>
                <div><Label>Company Phone</Label><Input value={form.company_phone} onChange={(e) => setForm({ ...form, company_phone: e.target.value })} /></div>
                <div><Label>Registration Number</Label><Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} /></div>
                <div><Label>KRA PIN</Label><Input value={form.kra_pin} onChange={(e) => setForm({ ...form, kra_pin: e.target.value })} /></div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setStep(2)}>Next Step</Button>
              </>
            )}
            {step === 2 && (
              <>
                <div>
                  <Label>Industry <span className="text-red-500">*</span></Label>
                  <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                    <SelectTrigger className={!form.industry ? "border-red-300" : ""}><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company Size</Label>
                  <Select value={form.company_size} onValueChange={(v) => setForm({ ...form, company_size: v })}>
                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                    <SelectContent>{COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Website URL</Label><Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>County</Label><Input value={form.location_county} onChange={(e) => setForm({ ...form, location_county: e.target.value })} /></div>
                <div><Label>Address</Label><Input value={form.location_address} onChange={(e) => setForm({ ...form, location_address: e.target.value })} /></div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : <><CheckCircle className="w-4 h-4 mr-2" />Submit Registration</>}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


