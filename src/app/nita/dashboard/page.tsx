import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "NITA Dashboard | Elimux",
  description: "NITA registered employers and inspections",
};

export const dynamic = "force-dynamic";

export default async function NitaDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/nita/dashboard");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = userData?.role || user.user_metadata?.role || "student";
  if (role !== "admin" && role !== "super_admin" && role !== "nita_admin") {
    redirect("/dashboard");
  }

  const { data: employers } = await supabase
    .from("employers")
    .select("*, inspections:nita_inspections(*)")
    .eq("nita_registered", true)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">NITA Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">NITA registered employers and inspection history.</p>
        <div className="mt-8">
          {(!employers || employers.length === 0) ? (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm dark:bg-slate-900">
              <p className="text-gray-500 dark:text-gray-400">No NITA registered employers found.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {employers.map((e: any) => (
                <div key={e.id} className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{e.company_name}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{e.nita_registration_number || "No NITA number"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">NITA Registered</span>
                    {e.inspections?.length > 0 && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">{e.inspections.length} Inspections</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
