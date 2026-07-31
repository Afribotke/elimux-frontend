"use client"
import { useState } from "react"
import PaymentModal from "./PaymentModal"

export default function CheckoutForm({ defaultAmount = 0, defaultCurrency = "USD" }: { defaultAmount?: number; defaultCurrency?: string }) {
  const [amount, setAmount] = useState<number | "">(defaultAmount > 0 ? defaultAmount : "")
  const [currency, setCurrency] = useState(defaultCurrency)
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [showModal, setShowModal] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = typeof amount === "string" ? 0 : amount
    if (numAmount <= 0) { alert("Please enter a valid amount"); return }
    setShowModal(true)
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Payment Checkout</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-slate-800 dark:text-white" min="0" step="0.01" placeholder="Enter amount" required /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-slate-800 dark:text-white"><option value="USD">USD</option><option value="KES">KES</option><option value="NGN">NGN</option><option value="GBP">GBP</option></select></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-slate-800 dark:text-white" placeholder="What is this payment for?" required /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-slate-800 dark:text-white" placeholder="user@example.com" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone (for M-Pesa)</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-slate-800 dark:text-white" placeholder="254712345678" /></div>
        <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700">Proceed to Payment</button>
      </form>
      <PaymentModal isOpen={showModal} onClose={() => setShowModal(false)} amount={typeof amount === "string" ? 0 : amount} currency={currency} description={description} metadata={{ email, phone }} />
    </div>
  )
}
