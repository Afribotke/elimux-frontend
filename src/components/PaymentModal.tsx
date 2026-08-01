"use client"
import { useState } from "react"
import { X } from "lucide-react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  currency?: string
  description: string
  metadata?: Record<string, string>
}

export default function PaymentModal({ isOpen, onClose, amount, currency = "USD", description, metadata = {} }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  if (!isOpen) return null

  const handleStripe = async () => {
    setLoading(true); setError("")
    try {
      const key = process.env.NEXT_PUBLIC_STRIPE_KEY
      if (!key) throw new Error("Stripe key not configured")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/stripe/create-session`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, description, metadata }),
      })
      if (!res.ok) throw new Error("Failed to create session")
      const { url } = await res.json()
      if (!url) throw new Error("No checkout URL returned")
      window.location.href = url
    } catch (e: any) { setError(e.message || "Payment failed"); setLoading(false) }
  }

  const handlePaystack = async () => {
    setLoading(true); setError("")
    try {
      const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      if (!key) throw new Error("Paystack key not configured")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/paystack/initialize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount * 100, email: metadata?.email || "user@elimux.ke", metadata }),
      })
      if (!res.ok) throw new Error("Failed to initialize Paystack")
      const { authorization_url } = await res.json()
      if (!authorization_url) throw new Error("No authorization URL returned")
      window.location.href = authorization_url
    } catch (e: any) { setError(e.message || "Payment failed"); setLoading(false) }
  }

  const handleMpesa = async () => {
    setLoading(true); setError("")
    try {
      const phone = metadata?.phone || ""
      if (!phone) throw new Error("Phone number required for M-Pesa")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/mpesa/stk-push`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount, accountReference: description }),
      })
      if (!res.ok) throw new Error("Failed to initiate M-Pesa")
      alert("M-Pesa request sent. Check your phone to complete payment.")
      onClose()
    } catch (e: any) { setError(e.message || "M-Pesa failed"); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Complete Payment</h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{description} — <span className="font-semibold">{currency} {amount.toFixed(2)}</span></p>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
        <div className="space-y-3">
          <button onClick={handleStripe} disabled={loading} className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">{loading ? "Processing..." : "Pay with Card (Stripe)"}</button>
          <button onClick={handlePaystack} disabled={loading} className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50">{loading ? "Processing..." : "Pay with Card/Bank (Paystack)"}</button>
          <button onClick={handleMpesa} disabled={loading} className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50">{loading ? "Processing..." : "Pay with M-Pesa"}</button>
        </div>
        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">Secured by Elimux Payments</p>
      </div>
    </div>
  )
}

