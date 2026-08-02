import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Opportunities | Elimux",
  description: "Find internships and attachment placements with top employers",
}

export const dynamic = "force-dynamic"

async function getOpportunities(type: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/internships?type=${type}`, {
      cache: "no-store"
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function OpportunitiesPage() {
  const internships = await getOpportunities("internship")
  const attachments = await getOpportunities("attachment")

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Career Opportunities</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Find internships for graduates and attachment placements for current students.
          </p>
        </div>

        {/* ATTACHMENTS SECTION */}
        <div className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 px-3 py-1 dark:bg-amber-900/20">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-400">🎓 For Current Students</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attachment Placements</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              {attachments.length} Active
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Mandatory work placements for university students before graduation.
            <span className="font-semibold text-amber-700 dark:text-amber-400"> Only verified students can apply.</span>
          </p>

          {attachments.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
              <p className="text-gray-500 dark:text-gray-400">No attachment placements available right now.</p>
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Check back soon or contact your university placement office.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {attachments.map((job: any) => (
                <Link key={job.id} href={`/attachments/${job.id}`} className="group rounded-xl border-2 border-amber-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-amber-300 dark:border-amber-900/30 dark:bg-slate-900 dark:hover:border-amber-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">{job.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{job.employer?.company_name || "Unknown Company"}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">Attachment</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>📍 {job.location || "Not specified"}</span>
                    <span>⏱️ {job.duration || "Not specified"}</span>
                    {job.slots && <span>👥 {job.slots} slots</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="my-8 border-t-2 border-dashed border-gray-300 dark:border-gray-700" />

        {/* INTERNSHIPS SECTION */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 px-3 py-1 dark:bg-blue-900/20">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-400">🚀 For Graduates</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Internships</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              {internships.length} Active
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Work experience opportunities for recent graduates. Build your career with leading employers.
          </p>

          {internships.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
              <p className="text-gray-500 dark:text-gray-400">No internships available right now.</p>
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Check back soon or set up job alerts.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {internships.map((job: any) => (
                <Link key={job.id} href={`/internships/${job.id}`} className="group rounded-xl border-2 border-blue-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-blue-300 dark:border-blue-900/30 dark:bg-slate-900 dark:hover:border-blue-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">{job.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{job.employer?.company_name || "Unknown Company"}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">Internship</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>📍 {job.location || "Not specified"}</span>
                    <span>⏱️ {job.duration || "Not specified"}</span>
                    {job.stipend && <span>💰 {job.stipend}</span>}
                    {job.slots && <span>👥 {job.slots} slots</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
