import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ApplyClient from "./ApplyClient";

export const dynamic = 'force-dynamic'


export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: internship } = await supabase
    .from("internships")
    .select("*, employer:employers(company_name, logo_url)")
    .eq("id", id)
    .single();

  if (!internship) notFound();

  return <ApplyClient internship={internship} internshipId={id} />;
}
