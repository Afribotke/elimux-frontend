'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2, RotateCcw } from 'lucide-react'
import { verifyPayment, initializePayment, type VerifyPaymentResult } from '@/lib/payments'
import { trackEvent } from '@/lib/analytics'

function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('trxref')

  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking')
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<VerifyPaymentResult['payment'] | null>(null)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      setError('No payment reference found')
      return
    }

    verifyPayment(reference)
      .then((result) => {
        setStatus(result.status === 'success' ? 'success' : 'failed')
        setPayment(result.payment)
        if (result.status === 'success') {
          trackEvent('payment', {
            plan: result.payment.subscription?.plan?.slug || result.payment.subscription?.plan?.name || null,
            amount: result.payment.amount,
            currency: result.payment.currency,
          })
        }
      })
      .catch((err) => {
        setStatus('failed')
        setError(err instanceof Error ? err.message : 'Verification failed')
      })
  }, [reference])

  const handleRetry = async () => {
    const email = payment?.subscriber?.email
    const planId = payment?.subscription?.plan?.id
    if (!email || !planId) {
      setError('Missing payment details — please start over from the pricing page.')
      return
    }

    setRetrying(true)
    try {
      const result = await initializePayment({ email, plan_id: planId })
      if (result.authorization_url) {
        window.location.href = result.authorization_url
      } else {
        setError('Could not restart payment. Please try again from the pricing page.')
        setRetrying(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry payment')
      setRetrying(false)
    }
  }

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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/account/subscription"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
              >
                View my subscription
              </Link>
              {reference && (
                <Link
                  href={`/receipts/${encodeURIComponent(reference)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-elimux-card font-semibold transition-colors"
                >
                  View Receipt
                </Link>
              )}
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Payment not completed</h1>
            <p className="text-muted mb-6">{error || 'The transaction was not successful.'}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {payment?.subscriber?.email && payment?.subscription?.plan?.id && (
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {retrying ? 'Redirecting...' : 'Retry Payment'}
                </button>
              )}
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-elimux-card font-semibold transition-colors"
              >
                Try again
              </Link>
            </div>
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
