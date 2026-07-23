"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdPricingCalculatorProps {
  placements: string[];
  durationDays: number;
  total: number;
}

const PLACEMENT_NAMES: Record<string, string> = {
  homepage_banner: "Homepage Banner",
  search_sidebar: "Search Sidebar",
  program_highlight: "Program Highlight",
  mobile_sticky: "Mobile Sticky",
};

export function AdPricingCalculator({ placements, durationDays, total }: AdPricingCalculatorProps) {
  const getDiscount = () => {
    if (durationDays >= 30) return 15;
    if (durationDays >= 14) return 10;
    return 0;
  };

  const discount = getDiscount();
  const subtotal = discount > 0 ? Math.round(total / (1 - discount / 100)) : total;

  return (
    <Card className="bg-slate-50">
      <CardHeader>
        <CardTitle className="text-lg">Pricing Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {placements.map((p) => (
          <div key={p} className="flex justify-between text-sm">
            <span>{PLACEMENT_NAMES[p]}</span>
            <span className="text-slate-600">KES {(subtotal / placements.length).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span>Duration</span>
          <span className="text-slate-600">{durationDays} days</span>
        </div>
        {discount > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="text-slate-600">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Duration Discount ({discount}%)</span>
              <span>-KES {(subtotal - total).toLocaleString()}</span>
            </div>
          </>
        )}
        <div className="border-t pt-2 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-emerald-600">KES {total.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
