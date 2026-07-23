export interface CampaignCreate {
  name: string;
  institution_name: string;
  headline: string;
  description: string;
  cta_text: string;
  cta_url: string;
  image_url: string;
  placement: string[];
  duration_days: number;
  budget: number;
}

export async function createCampaign(data: CampaignCreate) {
  const response = await fetch("/api/self-serve-ads/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create campaign");
  }

  return response.json();
}

export async function getCampaigns() {
  const response = await fetch("/api/self-serve-ads/campaigns");
  if (!response.ok) throw new Error("Failed to fetch campaigns");
  return response.json();
}

export async function getCampaignAnalytics(campaignId: string) {
  const response = await fetch(`/api/self-serve-ads/campaigns/${campaignId}/analytics`);
  if (!response.ok) throw new Error("Failed to fetch analytics");
  return response.json();
}
