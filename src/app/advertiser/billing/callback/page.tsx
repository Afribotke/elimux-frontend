'use client';

// ============================================
// ELIMUX AD PORTAL - PAYSTACK CALLBACK PAGE
// /advertiser/billing/callback
// Handles Paystack redirect after payment
// ============================================

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function PaystackCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [message, setMessage] = useState('Verifying your payment...');

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

        const paymentRef = reference || trxref;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setStatus('failed');
                setMessage('You must be logged in to verify payment.');
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/advertiser/payments/paystack/verify/${paymentRef}`,
                {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                setStatus('failed');
                setMessage(data.error || 'Payment verification failed. Please contact support.');
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

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                {status === 'verifying' && (
                    <>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <p className="text-sm text-gray-500">Redirecting to billing page...</p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <button
                            onClick={() => router.push('/advertiser/billing')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Back to Billing
                        </button>
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
