import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import InternshipDetailClient from "./InternshipDetailClient";

export const dynamic = 'force-dynamic'


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
