import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import CertificateClient from "./CertificateClient";

export async function generateStaticParams() {
  const { data } = await supabase.from("certificates").select("certificate_number");
  if (!data || data.length === 0) return [{ number: "_placeholder" }];
  return data.map((c: any) => ({ number: c.certificate_number }));
}

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
