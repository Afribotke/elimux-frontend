'use client';

// ============================================
// ELIMUX AD PORTAL - PAYSTACK CALLBACK PAGE
// /advertiser/billing/callback
// Handles Paystack redirect after payment
// ============================================

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { advertiserFetch } from '@/lib/advertiserAuth';

function PaystackCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [message, setMessage] = useState('Verifying your payment...');
    const [paymentRef, setPaymentRef] = useState<string | null>(null);
    const [retryAmount, setRetryAmount] = useState<number | null>(null);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        verifyPayment();
    }, []);

    const verifyPayment = async () => {
        const reference = searchParams.get('reference');
        const trxref = searchParams.get('trxref');

        if (!reference && !trxref) {
            setStatus('failed');
            setMessage('No payment reference found. Please try again.');
            return;
        }

        const ref = reference || trxref;
        setPaymentRef(ref);

        try {
            const response = await advertiserFetch(`/api/advertiser/payments/paystack/verify/${ref}`);
            const data = await response.json();

            const paystackStatus = data?.data?.status;
            const isPaid = paystackStatus === 'success' || paystackStatus === 'paid';

            if (!response.ok || !data.success || !isPaid) {
                setStatus('failed');
                setMessage(!response.ok || !data.success ? (data.error || 'Payment verification failed. Please contact support.') : 'The transaction was not completed.');
                setRetryAmount(data.data?.payment?.amount ?? null);
                return;
            }

            setStatus('success');
            setMessage('Payment successful! Your balance has been updated.');

            // Redirect to billing page after 3 seconds
            setTimeout(() => {
                router.push('/advertiser/billing');
            }, 3000);
        } catch (err: any) {
            setStatus('failed');
            setMessage('Error verifying payment: ' + err.message);
        }
    };

    const handleRetry = async () => {
        if (!retryAmount) {
            router.push('/advertiser/billing');
            return;
        }

        setRetrying(true);
        try {
            const response = await advertiserFetch('/api/advertiser/payments/paystack/create', {
                method: 'POST',
                body: JSON.stringify({ amount: retryAmount }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to restart payment');

            if (data.data?.authorization_url) {
                window.location.href = data.data.authorization_url;
            } else {
                throw new Error('No authorization URL received');
            }
        } catch (err: any) {
            setMessage('Error retrying payment: ' + err.message);
            setRetrying(false);
        }
    };

    return (
        <div className="min-h-screen bg-elimux-dark flex items-center justify-center p-4">
            <div className="bg-elimux-card border border-border rounded-xl p-8 max-w-md w-full text-center">
                {status === 'verifying' && (
                    <>
                        <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <svg className="w-8 h-8 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Verifying Payment</h2>
                        <p className="text-muted">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-elimux-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-elimux-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
                        <p className="text-muted mb-4">{message}</p>
                        {paymentRef && (
                            <Link
                                href={`/receipts/${encodeURIComponent(paymentRef)}`}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-border text-foreground hover:bg-elimux-dark font-semibold mb-4"
                            >
                                View Receipt
                            </Link>
                        )}
                        <p className="text-sm text-muted">Redirecting to billing page...</p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div className="w-16 h-16 bg-elimux-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-elimux-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h2>
                        <p className="text-muted mb-4">{message}</p>
                        <div className="flex items-center justify-center gap-3">
                            {retryAmount && (
                                <button
                                    onClick={handleRetry}
                                    disabled={retrying}
                                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-elimux-dark font-semibold px-6 py-2 rounded-lg"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    {retrying ? 'Redirecting...' : 'Retry Payment'}
                                </button>
                            )}
                            <button
                                onClick={() => router.push('/advertiser/billing')}
                                className="border border-border text-foreground hover:bg-elimux-dark font-semibold px-6 py-2 rounded-lg"
                            >
                                Back to Billing
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function PaystackCallbackPage() {
    return (
        <Suspense fallback={null}>
            <PaystackCallbackContent />
        </Suspense>
    );
}
