import { Metadata } from "next"
import { getDashboardStats } from "@/lib/dashboard-data"

export const metadata: Metadata = {
  title: "Admin Dashboard | Elimux",
  description: "Elimux administration panel",
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Institutions</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.institutions.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Programs</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.programs.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Students</p>
            <p className="mt-2 text-3xl font-bold text-purple-600">{stats.students.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">${stats.revenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/institution/dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Institution Portal</a>
            <a href="/partner" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Partner Portal</a>
            <a href="/advertiser" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">Advertiser Portal</a>
            <a href="/payments" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Payments</a>
          </div>
        </div>
      </div>
    </main>
  )
}
