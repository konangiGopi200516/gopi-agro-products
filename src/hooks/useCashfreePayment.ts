import { useState, useCallback } from "react";
import { load } from "@cashfreepayments/cashfree-js";

interface PaymentParams {
  paymentSessionId: string;
  orderId: string;
  onSuccess: (orderId: string) => void;
  onFailure: (orderId: string, reason: string) => void;
}

export function useCashfreePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(async (params: PaymentParams) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Determine environment
      const envVar = import.meta.env.VITE_CASHFREE_ENV?.toUpperCase();
      const mode = envVar === "PROD" ? "production" : "sandbox";

      console.log(`[Cashfree] Loading SDK in "${mode}" mode`);

      // 2. Load Cashfree JS SDK via official package
      const cashfree = await load({ mode });

      if (!cashfree) {
        throw new Error("Failed to initialize Cashfree SDK");
      }

      console.log(`[Cashfree] SDK loaded. Opening modal checkout...`);
      console.log(`[Cashfree] Session ID: ${params.paymentSessionId.slice(0, 20)}...`);

      // 3. Open MODAL checkout (no HTTPS required for localhost)
      const result = await cashfree.checkout({
        paymentSessionId: params.paymentSessionId,
        redirectTarget: "_modal",
      });

      // 4. Handle all outcomes
      if (result.error) {
        // Payment failed
        const reason =
          result.error.message ||
          result.error.code ||
          "Payment failed. Please try again.";
        console.error("[Cashfree] Payment error:", result.error);
        setError(reason);
        params.onFailure(params.orderId, reason);
      } else if (result.paymentDetails) {
        // Payment succeeded
        console.log("[Cashfree] ✅ Payment completed:", result.paymentDetails);
        params.onSuccess(params.orderId);
      } else if (result.redirect) {
        // User was redirected (shouldn't happen with _modal)
        console.log("[Cashfree] Redirect detected — treating as pending");
        params.onSuccess(params.orderId);
      } else {
        // Modal closed without payment — user cancelled
        console.log("[Cashfree] Modal closed (user cancelled)");
        const reason = "Payment was cancelled. You can try again.";
        setError(reason);
        params.onFailure(params.orderId, reason);
      }
    } catch (err: any) {
      const message = err.message || "Payment initiation failed. Please try again.";
      console.error("[Cashfree] SDK Error:", err);
      setError(message);
      params.onFailure(params.orderId, message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { initiatePayment, loading, error };
}
