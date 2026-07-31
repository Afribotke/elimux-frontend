import CheckoutForm from "@/components/CheckoutForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Payments | Elimux",
  description: "Secure payments for education services",
}

export default function PaymentsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Secure Payments</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">Pay for applications, tuition, and services securely via Stripe, Paystack, or M-Pesa.</p>
        <CheckoutForm />
      </div>
    </main>
  )
}
