'use client';

// ============================================
// ELIMUX AD PORTAL - BILLING & PAYMENTS PAGE
// /advertiser/billing
// ============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { advertiserFetch, ADVERTISER_LOGIN_PATH } from '@/lib/advertiserAuth';
import AdvertiserNav from '@/components/AdvertiserNav';

interface Payment {
    id: string;
    amount: number;
    currency: string;
    payment_method: string;
    payment_status: string;
    created_at: string;
    transaction_id?: string;
}

export default function BillingPage() {
    const router = useRouter();
    const [balance, setBalance] = useState(0);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paystackAmount, setPaystackAmount] = useState(50);
    const [paystackLoading, setPaystackLoading] = useState(false);
    const [mpesaAmount, setMpesaAmount] = useState(5000);
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [mpesaLoading, setMpesaLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push(ADVERTISER_LOGIN_PATH);
                return;
            }

            const statsRes = await advertiserFetch('/api/advertiser/stats');
            const statsData = await statsRes.json();
            if (statsData.success) setBalance(statsData.data.balance);

            const paymentsRes = await advertiserFetch('/api/advertiser/payments/history');
            const paymentsData = await paymentsRes.json();
            if (paymentsData.success) setPayments(paymentsData.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePaystackPayment = async () => {
        if (paystackAmount < 10) {
            setError('Minimum amount is $10');
            return;
        }

        setPaystackLoading(true);
        setError('');

        try {
            const response = await advertiserFetch('/api/advertiser/payments/paystack/create', {
                method: 'POST',
                body: JSON.stringify({
                    amount: paystackAmount,
                    currency: 'usd'
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Redirect to Paystack checkout
            if (data.data?.authorization_url) {
                window.location.href = data.data.authorization_url;
            } else {
                throw new Error('No authorization URL received');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPaystackLoading(false);
        }
    };

    const handleMpesaPayment = async () => {
        if (!mpesaPhone || mpesaAmount < 100) {
            setError('Enter valid phone number and minimum KES 100');
            return;
        }

        setMpesaLoading(true);
        setError('');

        try {
            const response = await advertiserFetch('/api/advertiser/payments/mpesa/create', {
                method: 'POST',
                body: JSON.stringify({
                    amount: mpesaAmount,
                    phone_number: mpesaPhone
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            alert('M-Pesa payment initiated! Check your phone for STK push.');
            fetchData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setMpesaLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            refunded: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-elimux-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-elimux-dark">
            <AdvertiserNav />
            <div className="max-w-6xl mx-auto px-4 pb-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
                        <p className="text-muted mt-1">Manage your advertising budget</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Balance Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <div className="text-sm text-gray-500 mb-1">Current Balance</div>
                            <div className="text-4xl font-bold text-gray-900">${balance.toFixed(2)}</div>
                            <div className="text-sm text-gray-400 mt-1">Available for campaigns</div>
                        </div>

                        {/* Paystack Payment */}
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Top Up with Card (Paystack)</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USD)</label>
                                    <div className="flex gap-2 mb-2">
                                        {[25, 50, 100, 250, 500].map(amt => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setPaystackAmount(amt)}
                                                className={`px-3 py-1 rounded border text-sm ${
                                                    paystackAmount === amt
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 text-gray-600'
                                                }`}
                                            >
                                                ${amt}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        min={10}
                                        value={paystackAmount}
                                        onChange={(e) => setPaystackAmount(parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={handlePaystackPayment}
                                    disabled={paystackLoading}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {paystackLoading ? 'Processing...' : `Pay $${paystackAmount}`}
                                </button>
                            </div>
                        </div>

                        {/* M-Pesa Payment */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Top Up with M-Pesa</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                                    <div className="flex gap-2 mb-2">
                                        {[500, 1000, 5000, 10000].map(amt => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setMpesaAmount(amt)}
                                                className={`px-3 py-1 rounded border text-sm ${
                                                    mpesaAmount === amt
                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                        : 'border-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {amt.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        value={mpesaAmount}
                                        onChange={(e) => setMpesaAmount(parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        min={100}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone</label>
                                    <input
                                        type="tel"
                                        value={mpesaPhone}
                                        onChange={(e) => setMpesaPhone(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="254700000000"
                                    />
                                </div>
                                <button
                                    onClick={handleMpesaPayment}
                                    disabled={mpesaLoading}
                                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {mpesaLoading ? 'Processing...' : `Pay KES ${mpesaAmount.toLocaleString()}`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
                            </div>

                            {payments.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No payments yet</h3>
                                    <p className="text-gray-500">Top up your balance to start advertising</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {payments.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {new Date(payment.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            payment.payment_method === 'paystack' ? 'bg-blue-100 text-blue-800' :
                                                            payment.payment_method === 'mpesa' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {payment.payment_method.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        ${payment.amount.toFixed(2)} {payment.currency}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.payment_status)}`}>
                                                            {payment.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                                        {payment.transaction_id || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
