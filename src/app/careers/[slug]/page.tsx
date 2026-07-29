import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface CareersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CareersPage({ params }: CareersPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employers")
    .select("*")
    .eq("slug", slug)
    .eq("verification_status", "verified")
    .single();

  if (!employer) notFound();

  const companyName = employer.company_name || employer.name || "Careers";
  const location = employer.county || employer.town || employer.address;

  const { data: internships } = await supabase
    .from("internships")
    .select("id, title, location_county, profession_category, duration_weeks, remaining_slots, total_slots")
    .eq("employer_id", employer.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const colors: Record<string, string> = employer.brand_colors || {
    primary: employer.branding_primary_color || "#3B82F6",
    accent: "#60A5FA",
    background: "#ffffff",
    surface: "#f8fafc",
    text: "#334155",
    heading: "#0f172a",
  };

  return (
    <div style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Header */}
      <header style={{ backgroundColor: colors.surface }} className="border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {employer.logo_url && (
              <img src={employer.logo_url} alt={companyName} className="h-16 w-16 rounded-xl object-contain" />
            )}
            <div>
              <h1 style={{ color: colors.heading }} className="text-3xl font-bold">{companyName}</h1>
              <p className="mt-1 text-sm opacity-70">{[employer.industry, location].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          {employer.description && (
            <p className="mt-4 max-w-2xl text-sm opacity-80">{employer.description}</p>
          )}
          {employer.website && (
            <a href={employer.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm hover:underline" style={{ color: colors.primary }}>
              Visit Website →
            </a>
          )}
        </div>
      </header>

      {/* Internships */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 style={{ color: colors.heading }} className="text-2xl font-bold">Open Positions</h2>
        <p className="mt-1 text-sm opacity-60">Join our team</p>

        <div className="mt-8 space-y-4">
          {!internships?.length && (
            <div className="rounded-xl border border-gray-200 p-8 text-center opacity-60">
              No open positions right now. Check back later.
            </div>
          )}
          {internships?.map((job) => (
            <div
              key={job.id}
              className="group rounded-xl border border-gray-200 p-6 transition hover:shadow-md"
              style={{ backgroundColor: colors.surface }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ color: colors.heading }} className="text-lg font-semibold">{job.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm opacity-70">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location_county}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {job.profession_category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {job.duration_weeks} weeks
                    </span>
                  </div>
                </div>
                <Link
                  href={`/internships/${job.id}/apply`}
                  className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  style={{ backgroundColor: colors.primary }}
                >
                  Apply
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {job.remaining_slots !== null && (
                <p className="mt-3 text-xs opacity-50">{job.remaining_slots} of {job.total_slots ?? "unlimited"} slots remaining</p>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm opacity-50">
        <p>Powered by <a href="https://elimux.ke" className="hover:underline" style={{ color: colors.primary }}>ElimuX</a></p>
      </footer>
    </div>
  );
}
