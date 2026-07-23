"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ReferralLinkProps {
  referralCode: string;
}

export function ReferralLink({ referralCode }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://elimux.ke";
  const referralUrl = `${baseUrl}?ref=${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareViaWhatsApp = () => {
    const text = `Discover your perfect education path with ElimuX! Use my referral link: ${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referral Link</CardTitle>
        <CardDescription>Share this link to earn commissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={referralUrl} readOnly className="font-mono text-sm" />
          <Button onClick={copyToClipboard} variant="outline">
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={shareViaWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
            Share on WhatsApp
          </Button>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-sm font-medium text-slate-700">Referral Code</p>
          <p className="text-2xl font-bold text-emerald-600">{referralCode}</p>
        </div>
      </CardContent>
    </Card>
  );
}
