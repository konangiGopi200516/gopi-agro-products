const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface CheckoutData {
  uid?: string;
  cartItems: Array<{ id: string; name: string; price: number; quantity: number; unit?: string }>;
  address: { line1: string; city: string; state: string; pincode: string } | string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
}

// ─── POST /api/create-order → Cashfree → returns payment_session_id ─────────
export async function createOnlineOrder(data: CheckoutData) {
  const res = await fetch(`${API_BASE}/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let errMessage = "Failed to create order";
    try {
      const err = await res.json();
      errMessage = err.error || errMessage;
    } catch (parseError) {
      errMessage = "Backend server error. If testing locally, ensure the backend is running. If on Vercel, check environment variables.";
    }
    throw new Error(errMessage);
  }
  const result = await res.json(); // { success, internalOrderId, paymentSessionId, cfOrderId }
  console.log("[paymentApi] createOnlineOrder response:", {
    success: result.success,
    hasPaymentSessionId: !!result.paymentSessionId,
    internalOrderId: result.internalOrderId,
    cfOrderId: result.cfOrderId,
  });
  return result;
}

// ─── GET /api/verify-order?order_id=xxx → confirms PAID status ──────────────
export async function verifyOrder(orderId: string) {
  const res = await fetch(`${API_BASE}/verify-order?order_id=${encodeURIComponent(orderId)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to verify order");
  }
  return res.json(); // { success, orderId, paymentStatus, orderStatus, totalAmount, ... }
}

// ─── COD Order ───────────────────────────────────────────────────────────────
export async function createCODOrder(data: CheckoutData) {
  const res = await fetch(`${API_BASE}/cod/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let errMessage = "Failed to place COD order";
    try {
      const err = await res.json();
      errMessage = err.error || errMessage;
    } catch (parseError) {
      errMessage = "Backend server error. If testing locally, ensure the backend is running. If on Vercel, check environment variables.";
    }
    throw new Error(errMessage);
  }
  return res.json();
}

// ─── Legacy status check (used by old payment-status page) ───────────────────
export async function checkPaymentStatus(orderId: string) {
  const res = await fetch(`${API_BASE}/status/${orderId}`);
  if (!res.ok) throw new Error("Failed to check status");
  return res.json();
}

// ─── COD OTP Helpers ─────────────────────────────────────────────────────────
export async function verifyCODOtp(orderId: string, otp: string) {
  const res = await fetch(`${API_BASE}/cod/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, otp }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "OTP verification failed");
  }
  return res.json();
}

export async function resendCODOtp(orderId: string) {
  const res = await fetch(`${API_BASE}/cod/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  return res.json();
}
