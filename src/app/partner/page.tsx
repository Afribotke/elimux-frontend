"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function PartnerLandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    website: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Store form data in session storage for post-login
        sessionStorage.setItem("partner_registration", JSON.stringify(formData));
        router.push("/auth/login?redirect=/partner/register");
        return;
      }

      const response = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          user_id: user.id,
        }),
      });

      if (!response.ok) throw new Error("Registration failed");

      toast.success("Partner application submitted! Check your email.");
      router.push("/partner/dashboard");
    } catch (error) {
      toast.error("Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Become an ElimuX Partner
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Earn commissions by helping students discover their perfect education path. 
            Get up to 15% commission on every successful referral.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-emerald-600">15%</CardTitle>
              <CardDescription>Commission Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Earn on every successful student application through your referral link.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-600">30 Days</CardTitle>
              <CardDescription>Cookie Duration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Students have 30 days to apply after clicking your link.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-purple-600">Weekly</CardTitle>
              <CardDescription>Payout Schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Get paid every week directly to your M-Pesa or bank account.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Apply to Become a Partner</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+254..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company/Organization</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website/Social Media</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Apply Now"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
