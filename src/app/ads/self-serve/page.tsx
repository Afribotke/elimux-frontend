"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PricingTier {
  name: string;
  price: number;
  duration: string;
  features: string[];
  recommended?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: 5000,
    duration: "7 days",
    features: [
      "Homepage banner (bottom)",
      "1 program listing highlight",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: 15000,
    duration: "14 days",
    features: [
      "Homepage banner (top)",
      "3 program listing highlights",
      "Advanced analytics",
      "Priority support",
      "WhatsApp sharing boost",
    ],
    recommended: true,
  },
  {
    name: "Premium",
    price: 35000,
    duration: "30 days",
    features: [
      "Homepage hero banner",
      "Unlimited program highlights",
      "Real-time analytics",
      "Dedicated account manager",
      "AI-targeted placement",
      "QR code campaign",
    ],
  },
];

export default function SelfServeAdPortalPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    setIsLoading(false);
  };

  const handleGetStarted = (tier: PricingTier) => {
    if (!isLoggedIn) {
      sessionStorage.setItem("ad_tier_selection", JSON.stringify(tier));
      router.push("/auth/login?redirect=/ads/self-serve/create");
      return;
    }
    router.push(`/ads/self-serve/create?tier=${tier.name.toLowerCase()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Promote Your Institution
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Reach thousands of students actively searching for education programs. 
            Self-serve ad campaigns with transparent pricing.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING_TIERS.map((tier) => (
            <Card key={tier.name} className={`relative ${tier.recommended ? "border-emerald-500 shadow-lg" : ""}`}>
              {tier.recommended && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600">
                  Recommended
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-slate-900">KES {tier.price.toLocaleString()}</span>
                  <span className="text-slate-500"> / {tier.duration}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={tier.recommended ? "default" : "outline"}
                  onClick={() => handleGetStarted(tier)}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Why Advertise on ElimuX?</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { number: "50K+", label: "Monthly Visitors" },
              { number: "12K+", label: "Student Signups" },
              { number: "85%", label: "Kenyan Traffic" },
              { number: "4.2x", label: "Avg. ROAS" },
            ].map((stat) => (
              <div key={stat.label} className="p-4">
                <p className="text-3xl font-bold text-emerald-600">{stat.number}</p>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
