import { supabase } from "./supabase";

export interface PartnerRegistration {
  full_name: string;
  email: string;
  phone: string;
  company?: string;
  website?: string;
}

export async function registerPartner(data: PartnerRegistration & { user_id: string }) {
  const response = await fetch("/api/partners/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Registration failed");
  }

  return response.json();
}

export async function getPartnerStats(partnerId: string) {
  const response = await fetch(`/api/partners/${partnerId}/stats`);
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
}

export async function generateReferralLink(partnerId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const response = await fetch("/api/referrals/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partner_id: partnerId }),
  });

  if (!response.ok) throw new Error("Failed to generate link");
  return response.json();
}
