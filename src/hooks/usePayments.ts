"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import {
  initializePaystackPayment,
  verifyPaystackPayment,
  getPaystackSubscription,
  cancelPaystackSubscription,
  getPaystackHistory,
} from "@/lib/paystack";
import {
  initiateMpesaPayment,
  checkMpesaStatus,
  getMpesaHistory,
} from "@/lib/mpesa";
import {
  createStripeSession,
  getStripeSubscription,
  cancelStripeSubscription,
} from "@/lib/stripe";

export type PaymentProvider = "paystack" | "mpesa" | "stripe";

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: "monthly" | "yearly" | "one-time";
  features: string[];
}

export function usePayments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ─── Fetch Plans ───
  const getPlans = useCallback(async (): Promise<PaymentPlan[]> => {
    setLoading(true);
    clearError();
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API_BASE}/api/payments/plans`);
      if (!res.ok) throw new Error("Failed to fetch plans");
      const data = await res.json();
      return data.plans || [];
    } catch (err: any) {
      setError(err.message || "Failed to load plans");
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // ─── Paystack ───
  const payWithPaystack = useCallback(
    async (params: { email: string; amount: number; plan?: string; callbackUrl?: string }) => {
      setLoading(true);
      clearError();
      try {
        const result = await initializePaystackPayment({
          email: params.email,
          amount: params.amount,
          plan: params.plan,
          callback_url: params.callbackUrl,
          userId: user?.id,
        });
        return result;
      } catch (err: any) {
        setError(err.message || "Paystack payment failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, clearError]
  );

  const verifyPaystack = useCallback(
    async (reference: string) => {
      setLoading(true);
      clearError();
      try {
        return await verifyPaystackPayment(reference);
      } catch (err: any) {
        setError(err.message || "Verification failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const getPaystackSub = useCallback(async () => {
    if (!user?.id) return null;
    setLoading(true);
    try {
      return await getPaystackSubscription(user.id);
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const cancelPaystackSub = useCallback(
    async (code: string, token: string) => {
      setLoading(true);
      clearError();
      try {
        return await cancelPaystackSubscription(code, token);
      } catch (err: any) {
        setError(err.message || "Cancellation failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  // ─── M-Pesa ───
  const payWithMpesa = useCallback(
    async (params: { phoneNumber: string; amount: number; accountReference?: string }) => {
      setLoading(true);
      clearError();
      try {
        return await initiateMpesaPayment({
          phoneNumber: params.phoneNumber,
          amount: params.amount,
          accountReference: params.accountReference,
          userId: user?.id,
        });
      } catch (err: any) {
        setError(err.message || "M-Pesa payment failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, clearError]
  );

  const checkMpesa = useCallback(
    async (checkoutRequestId: string) => {
      setLoading(true);
      try {
        return await checkMpesaStatus(checkoutRequestId);
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ─── Stripe ───
  const payWithStripe = useCallback(
    async (params: { planId: string; successUrl: string; cancelUrl: string }) => {
      setLoading(true);
      clearError();
      try {
        return await createStripeSession({
          planId: params.planId,
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
          userId: user?.id,
          email: (user as any)?.email,
        });
      } catch (err: any) {
        setError(err.message || "Stripe session failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, clearError]
  );

  const getStripeSub = useCallback(async () => {
    if (!user?.id) return null;
    setLoading(true);
    try {
      return await getStripeSubscription(user.id);
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ─── History ───
  const getHistory = useCallback(
    async (provider: PaymentProvider) => {
      if (!user?.id) return [];
      setLoading(true);
      try {
        if (provider === "paystack") return await getPaystackHistory(user.id);
        if (provider === "mpesa") return await getMpesaHistory(user.id);
        return [];
      } catch (err: any) {
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    loading,
    error,
    clearError,
    getPlans,
    // Paystack
    payWithPaystack,
    verifyPaystack,
    getPaystackSub,
    cancelPaystackSub,
    // M-Pesa
    payWithMpesa,
    checkMpesa,
    // Stripe
    payWithStripe,
    getStripeSub,
    // History
    getHistory,
  };
}
