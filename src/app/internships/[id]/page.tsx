import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import InternshipDetailClient from "./InternshipDetailClient";

export async function generateStaticParams() {
  const { data } = await supabase.from("internships").select("id").eq("status", "active");
  if (!data || data.length === 0) return [{ id: "_placeholder" }];
  return data.map((i: any) => ({ id: i.id }));
}

export default async function InternshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: internship } = await supabase
    .from("internships")
    .select("*, employer:employers(*)")
    .eq("id", id)
    .single();

  if (!internship) notFound();

  return <InternshipDetailClient internship={internship} />;
}
