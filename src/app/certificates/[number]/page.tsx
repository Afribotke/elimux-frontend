import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import CertificateClient from "./CertificateClient";

export const dynamic = 'force-dynamic'


export default async function CertificatePage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;

  const { data: cert } = await supabase
    .from("certificates")
    .select("*, student:student_profiles(full_name, course_name, university_name), employer:employers(company_name)")
    .eq("certificate_number", number)
    .single();

  if (!cert) notFound();

  return <CertificateClient cert={cert} />;
}
