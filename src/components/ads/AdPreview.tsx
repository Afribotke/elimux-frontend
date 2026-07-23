"use client";

import { Card, CardContent } from "@/components/ui/card";

interface AdPreviewProps {
  campaign: {
    headline: string;
    description: string;
    cta_text: string;
    image_url: string;
    institution_name: string;
  };
}

export function AdPreview({ campaign }: AdPreviewProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Ad Preview</h3>

      {/* Homepage Banner Preview */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <p className="text-xs opacity-75 mb-1">Sponsored</p>
          <div className="flex items-start gap-4">
            {campaign.image_url && (
              <img src={campaign.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <p className="font-bold text-lg">{campaign.headline || "Your Headline Here"}</p>
              <p className="text-sm opacity-90 mt-1">{campaign.description || "Your description will appear here"}</p>
              <p className="text-xs opacity-75 mt-2">{campaign.institution_name || "Your Institution"}</p>
            </div>
            <button className="px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium text-sm hover:bg-slate-100">
              {campaign.cta_text || "Apply Now"}
            </button>
          </div>
        </div>
      </Card>

      {/* Mobile Preview */}
      <div className="max-w-xs mx-auto">
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] text-slate-400 mb-2">Sponsored</p>
            {campaign.image_url && (
              <img src={campaign.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
            )}
            <p className="font-bold text-sm">{campaign.headline || "Your Headline"}</p>
            <p className="text-xs text-slate-600 mt-1">{campaign.description || "Description"}</p>
            <button className="w-full mt-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">
              {campaign.cta_text || "Apply"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
