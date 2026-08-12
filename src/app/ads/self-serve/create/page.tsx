"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AdPreview } from "@/components/ads/AdPreview";
import { toast } from "sonner";
import { advertiserFetch, ADVERTISER_LOGIN_PATH } from "@/lib/advertiserAuth";
import { getUserWithTimeout } from "@/lib/client-auth";

interface CampaignForm {
  name: string;
  institution_name: string;
  headline: string;
  description: string;
  cta_text: string;
  cta_url: string;
  image_url: string;
  target_audience: string[];
  budget: number;
  duration_days: number;
  placement: string;
}

const PLACEMENT_OPTIONS = [
  { id: "homepage_banner", name: "Homepage Banner" },
  { id: "search_sidebar", name: "Search Sidebar" },
  { id: "program_highlight", name: "Program Highlight" },
  { id: "mobile_sticky", name: "Mobile Sticky" },
];

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={null}>
      <CreateCampaignForm />
    </Suspense>
  );
}

function CreateCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTier = searchParams.get("tier");

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CampaignForm>({
    name: "",
    institution_name: "",
    headline: "",
    description: "",
    cta_text: "Apply Now",
    cta_url: "",
    image_url: "",
    target_audience: [],
    budget: preselectedTier === "growth" ? 15000 : preselectedTier === "premium" ? 35000 : 5000,
    duration_days: 7,
    placement: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
        error: authError,
      } = await getUserWithTimeout();
      if (cancelled) return;
      if (!user || authError) {
        router.push(`${ADVERTISER_LOGIN_PATH}?redirect=/ads/self-serve/create`);
        return;
      }
      setCheckingAuth(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await advertiserFetch("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          title: form.name,
          description: form.description,
          budget: form.budget,
          duration_days: form.duration_days,
          placement: form.placement,
          image_url: form.image_url,
          target_url: form.cta_url,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + form.duration_days * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit campaign");
      }

      toast.success(
        "Campaign submitted for admin review. You will be notified once approved. Per-click billing applies — no upfront charge."
      );
      router.push("/ads/self-serve/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Ad Campaign</h1>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  s <= step ? "bg-emerald-600" : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Campaign Details</CardTitle>
              <CardDescription>Tell us about your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Summer 2026 Intake"
                />
              </div>
              <div className="space-y-2">
                <Label>Institution Name</Label>
                <Input
                  value={form.institution_name}
                  onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
                  placeholder="Your institution name"
                />
              </div>
              <div className="space-y-2">
                <Label>Ad Headline</Label>
                <Input
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="Enroll Now for September Intake"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{form.headline.length}/60 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of your offer"
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground">{form.description.length}/150 characters</p>
              </div>
              <Button onClick={() => setStep(2)} className="w-full">Continue</Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Placement & Duration</CardTitle>
              <CardDescription>Choose where your ad appears</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="placement-select">Placement</Label>
                <select
                  id="placement-select"
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-background"
                >
                  <option value="">Select a placement...</option>
                  {PLACEMENT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  min={7}
                  max={90}
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!form.placement}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Preview & Submit</CardTitle>
              <CardDescription>Review your campaign before submitting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AdPreview campaign={form} />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Submitting..." : "Submit Campaign for Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
