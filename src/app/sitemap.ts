import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.elimux.ke";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/about/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/pricing/`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/privacy/`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms/`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/contact/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/opportunities/`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  const { data: programs } = await supabase
    .from("programs")
    .select("id, updated_at")
    .eq("is_active", true);
  const programRoutes: MetadataRoute.Sitemap = (programs || []).map((p: any) => ({
    url: `${baseUrl}/programs/${p.id}/`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, updated_at")
    .eq("is_active", true);
  const institutionRoutes: MetadataRoute.Sitemap = (institutions || []).map((i: any) => ({
    url: `${baseUrl}/institutions/${i.id}/`,
    lastModified: i.updated_at ? new Date(i.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...programRoutes, ...institutionRoutes];
}
