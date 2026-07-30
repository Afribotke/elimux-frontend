import { notFound } from 'next/navigation'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { fetchSubscriberReceipt } from '@/lib/payments'
import { fetchAdPaymentReceipt } from '@/lib/adPayments'
import PrintButton from './PrintButton'

interface ReceiptPageProps {
  params: Promise<{ reference: string }>
}

interface ReceiptData {
  billedToName: string | null
  billedToEmail: string | null
  description: string
  amount: number
  currency: string
  createdAt: string
}

async function loadReceipt(reference: string): Promise<ReceiptData | null> {
  const subscriberPayment = await fetchSubscriberReceipt(reference)
  if (subscriberPayment) {
    return {
      billedToName: subscriberPayment.subscriber?.name || null,
      billedToEmail: subscriberPayment.subscriber?.email || null,
      description: `ElimuX ${subscriberPayment.subscription?.plan?.name || 'Subscription'}`,
      amount: subscriberPayment.amount,
      currency: subscriberPayment.currency,
      createdAt: subscriberPayment.created_at,
    }
  }

  const adPayment = await fetchAdPaymentReceipt(reference)
  if (adPayment) {
    return {
      billedToName: adPayment.advertiser?.organization_name || null,
      billedToEmail: adPayment.advertiser?.email || null,
      description: 'ElimuX Ad Wallet Top-up',
      amount: adPayment.amount,
      currency: 'KES',
      createdAt: adPayment.paid_at || adPayment.created_at,
    }
  }

  return null
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { reference } = await params
  const receipt = await loadReceipt(reference)

  if (!receipt) notFound()

  return (
    <div className="min-h-screen bg-elimux-dark py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <PrintButton />
        </div>

        <div className="rounded-xl border border-border bg-elimux-card p-8 print:border-0">
          <div className="flex items-start justify-between border-b border-border pb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">ElimuX</h1>
              <p className="mt-1 text-sm text-muted">Education Discovery Platform</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 rounded-full bg-elimux-success/10 px-3 py-1 text-sm font-medium text-elimux-success">
                <CheckCircle className="h-4 w-4" />
                Paid
              </div>
              <p className="mt-2 text-sm text-muted">Receipt #{reference}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-muted">Billed To</p>
              <p className="mt-1 font-medium text-foreground">{receipt.billedToName || 'Customer'}</p>
              <p className="text-sm text-muted">{receipt.billedToEmail || ''}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase text-muted">Payment Date</p>
              <p className="mt-1 text-foreground">{new Date(receipt.createdAt).toLocaleDateString()}</p>
              <p className="mt-3 text-xs font-medium uppercase text-muted">Payment Method</p>
              <p className="mt-1 text-foreground">Paystack</p>
            </div>
          </div>

          <div className="mt-8">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="pb-3 text-left font-medium text-muted">Description</th>
                  <th className="pb-3 text-right font-medium text-muted">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-4 text-foreground">{receipt.description}</td>
                  <td className="py-4 text-right text-foreground">
                    {receipt.currency} {receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-4 text-right font-medium text-muted">Total</td>
                  <td className="pt-4 text-right text-lg font-bold text-foreground">
                    {receipt.currency} {receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted">
            <p>Thank you for choosing ElimuX</p>
            <p className="mt-1">support@elimux.ke | www.elimux.ke</p>
          </div>
        </div>
      </div>
    </div>
  )
}
