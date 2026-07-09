'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { verifyPayment } from '@/lib/payments'

function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('trxref')

  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      setError('No payment reference found')
      return
    }

    verifyPayment(reference)
      .then((result) => {
        setStatus(result.status === 'success' ? 'success' : 'failed')
      })
      .catch((err) => {
        setStatus('failed')
        setError(err instanceof Error ? err.message : 'Verification failed')
      })
  }, [reference])

  return (
    <main className="min-h-screen py-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        {status === 'checking' && (
          <>
            <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Verifying payment...</h1>
            <p className="text-muted">Please wait while we confirm your transaction.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Payment successful</h1>
            <p className="text-muted mb-6">Your subscription is now active.</p>
            <Link
              href="/account/subscription"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
              View my subscription
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Payment not completed</h1>
            <p className="text-muted mb-6">{error || 'The transaction was not successful.'}</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
              Try again
            </Link>
          </>
        )}
      </div>
    </main>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={null}>
      <PaymentCallbackContent />
    </Suspense>
  )
}
