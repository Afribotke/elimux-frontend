"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function EmployerActivatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ password: "", confirmPassword: "", companyName: "", industry: "", location: "", website: "", phone: "", description: "" })

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing activation link")
      setLoading(false)
      return
    }
    fetch(`/api/employers/verify-token?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setValid(true)
          setForm(prev => ({ ...prev, companyName: data.employer.company_name || "" }))
        } else {
          setError("This invitation link is invalid or has expired")
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to verify invitation")
        setLoading(false)
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/employers/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, ...form })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Activation failed")
      router.push("/employer/dashboard")
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-600 dark:text-gray-400">Verifying invitation...</p></div>
  if (error && !valid) return <div className="flex min-h-screen items-center justify-center"><div className="text-center"><p className="text-red-600">{error}</p></div></div>

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activate Your Employer Account</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Complete your profile to start posting internships.</p>
        {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label><input required value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Industry</label><input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label><input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label><input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label><input type="password" required value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{loading ? "Activating..." : "Activate Account"}</button>
        </form>
      </div>
    </main>
  )
}
