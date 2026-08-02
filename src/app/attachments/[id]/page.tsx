import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Attachment Details | Elimux",
  description: "View attachment placement details",
}

export const dynamic = "force-dynamic"

async function getAttachment(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/internships/${id}`, {
      cache: "no-store"
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function AttachmentDetailPage({ params }: { params: { id: string } }) {
  const job = await getAttachment(params.id)
  if (!job || job.type !== "attachment") {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-600 dark:text-gray-400">Attachment placement not found</p></div>
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border-2 border-amber-200 bg-white p-8 shadow-sm dark:border-amber-900/30 dark:bg-slate-900">
          <div className="mb-4 inline-block rounded-lg bg-amber-100 px-3 py-1 dark:bg-amber-900/20">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-400">🎓 Attachment Placement</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
          <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">{job.employer?.company_name || "Unknown Company"}</p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>📍 {job.location || "Not specified"}</span>
            <span>⏱️ {job.duration || "Not specified"}</span>
            <span>👥 {job.slots || 1} slots</span>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-line">{job.description}</p>
          </div>

          {job.requirements && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Requirements</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-line">{job.requirements}</p>
            </div>
          )}

          <div className="mt-8 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-sm text-amber-800 dark:text-amber-400">
              <span className="font-semibold">Eligibility:</span> Only students uploaded by their university can apply for attachment placements.
              If you are a verified student, <Link href={`/attachments/${job.id}/apply`} className="underline">click here to apply</Link>.
            </p>
          </div>

          <div className="mt-8">
            <Link href="/opportunities" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">← Back to all opportunities</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
