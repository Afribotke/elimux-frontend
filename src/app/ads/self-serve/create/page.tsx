"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AdPricingCalculator } from "@/components/ads/AdPricingCalculator";
import { AdPreview } from "@/components/ads/AdPreview";
import { toast } from "sonner";

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
  placement: string[];
}

const PLACEMENT_OPTIONS = [
  { id: "homepage_banner", name: "Homepage Banner", basePrice: 5000 },
  { id: "search_sidebar", name: "Search Sidebar", basePrice: 3000 },
  { id: "program_highlight", name: "Program Highlight", basePrice: 2000 },
  { id: "mobile_sticky", name: "Mobile Sticky", basePrice: 4000 },
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
    placement: [],
  });

  const handlePlacementToggle = (placementId: string) => {
    setForm((prev) => ({
      ...prev,
      placement: prev.placement.includes(placementId)
        ? prev.placement.filter((p) => p !== placementId)
        : [...prev.placement, placementId],
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    form.placement.forEach((p) => {
      const option = PLACEMENT_OPTIONS.find((o) => o.id === p);
      if (option) total += option.basePrice * (form.duration_days / 7);
    });
    // Apply duration discount
    if (form.duration_days >= 30) total *= 0.85;
    else if (form.duration_days >= 14) total *= 0.9;
    return Math.round(total);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/self-serve-ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          total_cost: calculateTotal(),
        }),
      });

      if (!response.ok) throw new Error("Failed to create campaign");

      toast.success("Campaign created! Proceed to payment.");
      router.push("/ads/self-serve/dashboard");
    } catch (error) {
      toast.error("Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Ad Campaign</h1>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  s <= step ? "bg-emerald-600" : "bg-slate-200"
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
                <p className="text-xs text-slate-500">{form.headline.length}/60 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of your offer"
                  maxLength={150}
                />
                <p className="text-xs text-slate-500">{form.description.length}/150 characters</p>
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
                <Label>Select Placements</Label>
                <div className="grid grid-cols-2 gap-3">
                  {PLACEMENT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handlePlacementToggle(option.id)}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        form.placement.includes(option.id)
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="font-medium">{option.name}</p>
                      <p className="text-sm text-slate-600">KES {option.basePrice.toLocaleString()}/week</p>
                    </button>
                  ))}
                </div>
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
                <p className="text-xs text-slate-500">
                  14+ days: 10% discount | 30+ days: 15% discount
                </p>
              </div>
              <AdPricingCalculator 
                placements={form.placement} 
                durationDays={form.duration_days}
                total={calculateTotal()}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1">Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Preview & Pay</CardTitle>
              <CardDescription>Review your campaign before payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AdPreview campaign={form} />
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Cost</span>
                  <span className="text-2xl font-bold text-emerald-600">KES {calculateTotal().toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Creating..." : "Pay & Launch Campaign"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
