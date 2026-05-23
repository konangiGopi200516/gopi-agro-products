import { Cashfree, CFEnvironment } from "cashfree-pg";
import crypto from "crypto";

// ─── Initialize Cashfree SDK v6 ─────────────────────────────────────────────
const APP_ID = process.env.CASHFREE_APP_ID || "";
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
const IS_PROD = process.env.CASHFREE_ENV === "PROD";
const ENV = IS_PROD ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

console.log(`[Cashfree] Initialized in ${IS_PROD ? "PRODUCTION" : "SANDBOX"} mode`);
console.log(`[Cashfree] App ID: ${APP_ID.slice(0, 10)}...`);

// Create an instance with constructor: new Cashfree(environment, appId, secretKey)
const cashfree = new Cashfree(ENV, APP_ID, SECRET_KEY);

export interface CreateOrderParams {
  orderId: string;
  orderAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl?: string;
}

export async function createCashfreeOrder(params: CreateOrderParams) {
  // Sanitize phone — strip country code, keep last 10 digits only
  const cleanPhone = params.customerPhone
    .replace(/\D/g, "")
    .replace(/^(\+?91)/, "")
    .slice(-10);

  const serverUrl = process.env.BACKEND_URL || "http://localhost:5000";

  const orderMeta: any = {
    return_url: params.returnUrl || `${serverUrl}/order-success?order_id={order_id}`
  };

  // Cashfree PRODUCTION requires HTTPS for both URLs — only add if HTTPS
  const notifyUrl = `${serverUrl}/api/payment/webhook`;
  if (notifyUrl.startsWith("https://")) {
    orderMeta.notify_url = notifyUrl;
  } else {
    console.log(`[Cashfree] Skipping notify_url (not HTTPS): ${notifyUrl}`);
  }

  const orderPayload = {
    order_id: params.orderId,
    order_amount: parseFloat(params.orderAmount.toFixed(2)),
    order_currency: "INR",
    customer_details: {
      customer_id: `cust_${params.orderId}`,
      customer_name: params.customerName || "Customer",
      customer_email: params.customerEmail,
      customer_phone: cleanPhone,
    },
    order_meta: orderMeta,
    order_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };

  console.log(`[Cashfree] Creating order: ${params.orderId}, amount: ₹${orderPayload.order_amount}, phone: ${cleanPhone}`);

  try {
    const response = await cashfree.PGCreateOrder(orderPayload);
    console.log(`[Cashfree] ✅ Order created. Session ID: ${response.data.payment_session_id?.slice(0, 20)}...`);
    return response.data;
  } catch (error: any) {
    // Log the FULL error response from Cashfree for debugging
    console.error(`[Cashfree] ❌ Order creation failed:`);
    console.error(`[Cashfree] Full error response:`, JSON.stringify(error?.response?.data, null, 2));
    console.error(`[Cashfree] Error message:`, error.message);

    const cfMessage = error?.response?.data?.message || error.message || "Cashfree order creation failed";
    throw new Error(cfMessage);
  }
}

export async function verifyCashfreeWebhook(
  rawBody: string,
  signature: string,
  timestamp: string
): Promise<boolean> {
  const signedPayload = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(signedPayload)
    .digest("base64");
  return expectedSignature === signature;
}

export async function fetchCashfreeOrderStatus(orderId: string) {
  try {
    const response = await cashfree.PGFetchOrder(orderId);
    return response.data;
  } catch (error: any) {
    console.error(`[Cashfree] Failed to fetch order status for ${orderId}:`, error?.response?.data || error.message);
    throw new Error("Failed to fetch order status from Cashfree");
  }
}
