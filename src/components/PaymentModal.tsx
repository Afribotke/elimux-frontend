"use client";

import { useState } from "react";
import { usePayments, PaymentProvider } from "@/hooks/usePayments";
import { X, CreditCard, Smartphone, Globe, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  email: string;
  successUrl?: string;
  cancelUrl?: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  planId,
  planName,
  amount,
  currency,
  email,
  successUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/payment/success`,
  cancelUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/payment/cancel`,
}: PaymentModalProps) {
  const [provider, setProvider] = useState<PaymentProvider>("paystack");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState<"select" | "processing" | "success" | "error">("select");
  const [message, setMessage] = useState("");

  const { loading, error, clearError, payWithPaystack, payWithMpesa, payWithStripe } = usePayments();

  if (!isOpen) return null;

  const handlePay = async () => {
    clearError();
    setStep("processing");
    setMessage("Initializing payment...");

    try {
      if (provider === "paystack") {
        const result = await payWithPaystack({
          email,
          amount: Math.round(amount * 100), // convert to kobo/cents
          callbackUrl: successUrl,
        });
        if (result.authorization_url) {
          window.location.href = result.authorization_url;
          return;
        }
      }

      if (provider === "mpesa") {
        if (!phoneNumber || phoneNumber.length < 10) {
          throw new Error("Please enter a valid phone number");
        }
        const result = await payWithMpesa({
          phoneNumber,
          amount,
          accountReference: planId,
        });
        setStep("success");
        setMessage(`M-Pesa request sent to ${phoneNumber}. Check your phone to complete payment.`);
        setTimeout(onClose, 5000);
        return;
      }

      if (provider === "stripe") {
        const result = await payWithStripe({
          planId,
          successUrl,
          cancelUrl,
        });
        if (result.url) {
          window.location.href = result.url;
          return;
        }
      }

      throw new Error("Payment initialization returned no redirect URL");
    } catch (err: any) {
      setStep("error");
      setMessage(err.message || "Payment failed. Please try again.");
    }
  };

  const formatAmount = () => {
    if (currency === "KES") return `KSh ${amount.toLocaleString()}`;
    if (currency === "USD") return `$${amount.toLocaleString()}`;
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Complete Payment</h2>
            <p className="text-sm text-slate-500">{planName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={step === "processing"}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount */}
        <div className="mb-6 rounded-xl bg-blue-50 p-4 text-center">
          <p className="text-sm text-blue-600 font-medium">Total Amount</p>
          <p className="text-3xl font-bold text-blue-700">{formatAmount()}</p>
        </div>

        {/* Provider Selection */}
        {step === "select" && (
          <>
            <p className="mb-3 text-sm font-medium text-slate-700">Select payment method</p>
            <div className="space-y-2 mb-6">
              <button
                onClick={() => setProvider("paystack")}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  provider === "paystack"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Globe className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Paystack</p>
                  <p className="text-xs text-slate-500">Card, Bank Transfer, USSD</p>
                </div>
              </button>

              <button
                onClick={() => setProvider("mpesa")}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  provider === "mpesa"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Smartphone className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">M-Pesa</p>
                  <p className="text-xs text-slate-500">STK Push to your phone</p>
                </div>
              </button>

              <button
                onClick={() => setProvider("stripe")}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  provider === "stripe"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Stripe</p>
                  <p className="text-xs text-slate-500">International cards</p>
                </div>
              </button>
            </div>

            {/* M-Pesa Phone Input */}
            {provider === "mpesa" && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 254712345678"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">Format: 2547XXXXXXXX</p>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={loading || (provider === "mpesa" && !phoneNumber)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay {formatAmount()}</>
              )}
            </button>
          </>
        )}

        {/* Processing */}
        {step === "processing" && (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-sm font-medium text-slate-700">{message}</p>
            <p className="mt-2 text-xs text-slate-500">Do not close this window</p>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-4" />
            <p className="text-sm font-medium text-slate-700">{message}</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="py-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-4" />
            <p className="text-sm font-medium text-red-600">{message}</p>
            <button
              onClick={() => setStep("select")}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
