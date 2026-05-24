import express, { Request, Response } from "express";
import crypto from "crypto";
import { db } from "../firebase";
import { createCashfreeOrder, verifyCashfreeWebhook, fetchCashfreeOrderStatus } from "../services/cashfree";
import { generateOTP, storeOTP, verifyOTP } from "../services/otp";
import { sendOrderConfirmationEmail, sendCODOTPEmail, sendPaymentFailedEmail } from "../services/emailTemplates";

const router = express.Router();

// ─── CREATE CASHFREE ORDER ───────────────────────────────────────────────────
router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { uid, cartItems, address, customerName, customerEmail, customerPhone, totalAmount } = req.body;

    // -------- Input validation --------
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart items are required and must be a non‑empty array" });
    }
    if (!address || !customerEmail || !customerPhone) {
      return res.status(400).json({ error: "Missing required fields: address, customerEmail, customerPhone" });
    }
    if (!totalAmount || typeof totalAmount !== "number" || totalAmount <= 0) {
      return res.status(400).json({ error: "Invalid totalAmount — must be a positive number" });
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: "Invalid Indian phone number" });
    }

    // -------- Order IDs --------
    const internalOrderId = `KM_${Date.now()}_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:5173");

    // -------- Internal order data (will be stored under Cashfree order ID) --------
    const orderData = {
      internalOrderId,
      uid: uid || "guest",
      customerName,
      customerEmail,
      customerPhone: cleanPhone,
      address,
      cartItems,
      totalAmount,
      paymentMethod: "CASHFREE",
      paymentStatus: "PENDING",
      orderStatus: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // -------- Create Cashfree order --------
    // Cashfree PRODUCTION strictly requires HTTPS for return_url.
    // Since we use the _modal JS integration, the browser won't actually redirect here,
    // so we can safely spoof https for localhost testing to bypass validation.
    let returnUrl = `${clientUrl}/payment/success?orderId={order_id}`;
    if (process.env.CASHFREE_ENV === "PROD" && returnUrl.startsWith("http://localhost")) {
      returnUrl = returnUrl.replace("http://", "https://");
    }

    let cashfreeOrder;
    try {
      cashfreeOrder = await createCashfreeOrder({
        orderId: internalOrderId,
        orderAmount: totalAmount,
        customerName,
        customerEmail,
        customerPhone: cleanPhone,
        returnUrl: returnUrl,
      });
    } catch (cfError: any) {
      // Store failure under internal ID for audit purposes
      await db.ref(`orders/${internalOrderId}`).set({ ...orderData, failureReason: cfError.message });
      console.error("[create-order] Cashfree error:", cfError.message);
      return res.status(502).json({ error: "Payment gateway error. Please try again.", details: cfError.message });
    }

    // -------- Persist order using Cashfree order ID (cf_order_id) as the key --------
    const cfOrderId = cashfreeOrder.cf_order_id;
    await db.ref(`orders/${cfOrderId}`).set({ ...orderData, cfOrderId, paymentSessionId: cashfreeOrder.payment_session_id });

    // Respond with identifiers the front‑end needs
    res.json({
      success: true,
      internalOrderId,
      cfOrderId,
      paymentSessionId: cashfreeOrder.payment_session_id,
    });
  } catch (error: any) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create payment order", details: error.message });
  }
});

// ─── CASHFREE WEBHOOK ────────────────────────────────────────────────────────
router.post("/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-webhook-signature"] as string;
    const timestamp = req.headers["x-webhook-timestamp"] as string;
    const rawBody = typeof req.body === "string" ? req.body : req.body.toString("utf8");

    // Verify signature first – always acknowledge receipt
    const isValid = await verifyCashfreeWebhook(rawBody, signature, timestamp);
    if (!isValid) {
      console.error("[webhook] Invalid webhook signature");
      return res.status(200).json({ received: true, verified: false });
    }

    const { data, type } = JSON.parse(rawBody);

    // -------- PAYMENT SUCCESS --------
    if (type === "PAYMENT_SUCCESS_WEBHOOK") {
      const cfOrderId = data.order.order_id;
      const orderSnap = await db.ref(`orders/${cfOrderId}`).get();
      if (!orderSnap.exists()) {
        console.error(`[webhook] Order ${cfOrderId} not found`);
        return res.status(200).json({ received: true });
      }
      const order = orderSnap.val();

      await db.ref(`orders/${cfOrderId}`).update({
        paymentStatus: "PAID",
        orderStatus: "Processing",
        cfPaymentId: data.payment.cf_payment_id,
        paymentMode: data.payment.payment_group,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Deduct stock
      for (const item of order.cartItems || []) {
        const itemId = item.id || item.product?.id || item.productId;
        if (itemId) {
          const productRef = db.ref(`products/${itemId}/stock`);
          const snap = await productRef.get();
          if (snap.exists()) {
            const newStock = Math.max(0, snap.val() - item.quantity);
            await productRef.set(newStock);
          }
        }
      }

      // Send confirmation email (use internalOrderId for reference)
      await sendOrderConfirmationEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        orderId: order.internalOrderId,
        items: order.cartItems,
        totalAmount: order.totalAmount,
        address: order.address,
        paymentMethod: `Online (${data.payment.payment_group})`,
      }).catch(e => console.error("[webhook] Email error:", e));
    }

    // -------- PAYMENT FAILURE --------
    if (type === "PAYMENT_FAILED_WEBHOOK") {
      const cfOrderId = data.order.order_id;
      await db.ref(`orders/${cfOrderId}`).update({
        paymentStatus: "FAILED",
        orderStatus: "Payment Failed",
        failureReason: data.payment.payment_message,
        updatedAt: new Date().toISOString(),
      });

      const orderSnap = await db.ref(`orders/${cfOrderId}`).get();
      if (orderSnap.exists()) {
        const order = orderSnap.val();
        await sendPaymentFailedEmail({
          to: order.customerEmail,
          customerName: order.customerName,
          orderId: order.internalOrderId,
          reason: data.payment.payment_message,
        }).catch(e => console.error("[webhook] Failed email error:", e));
      }
    }

    // Always acknowledge
    res.status(200).json({ received: true, success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    // Still acknowledge to avoid retries
    res.status(200).json({ received: true, error: error.message });
  }
});

// ─── VERIFY PAYMENT STATUS (frontend polling) ────────────────────────────────
router.get("/status/:orderId", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params; // Cashfree order ID
    const orderSnap = await db.ref(`orders/${orderId}`).get();
    if (!orderSnap.exists()) return res.status(404).json({ error: "Order not found" });
    const order = orderSnap.val();

    // If still pending, pull latest status from Cashfree
    if (order.paymentStatus === "PENDING" && order.paymentMethod === "CASHFREE") {
      try {
        const cfStatus = await fetchCashfreeOrderStatus(orderId as string);
        if (cfStatus.order_status === "PAID") {
          await db.ref(`orders/${orderId}`).update({
            paymentStatus: "PAID",
            orderStatus: "Processing",
            updatedAt: new Date().toISOString(),
          });
          order.paymentStatus = "PAID";
          order.orderStatus = "Processing";
        }
      } catch (cfErr: any) {
        console.error("[status] Cashfree fetch error:", cfErr.message);
      }
    }

    res.json({
      success: true,
      orderId: order.cfOrderId || orderId,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
});

// ─── CASH ON DELIVERY — PLACE ORDER ─────────────────────────────────────────
router.post("/cod/create", async (req: Request, res: Response) => {
  try {
    const { uid, cartItems, address, customerName, customerEmail, customerPhone, totalAmount } = req.body;
    if (!cartItems || !address || !customerEmail || !customerPhone || !totalAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: "Invalid Indian phone number" });
    }
    if (totalAmount > 5000) {
      return res.status(400).json({ error: "COD not available for orders above ₹5,000. Please use online payment." });
    }
    const orderId = `KM_COD_${Date.now()}_${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const orderData = {
      orderId,
      uid: uid || "guest",
      customerName,
      customerEmail,
      customerPhone: cleanPhone,
      address,
      cartItems,
      totalAmount,
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      orderStatus: "Processing",
      codOtpVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const sanitizeForFirebase = (obj: any): any => {
      if (obj === undefined) return null;
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeForFirebase);
      const newObj: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) newObj[key] = sanitizeForFirebase(obj[key]);
      }
      return newObj;
    };
    await db.ref(`orders/${orderId}`).set(sanitizeForFirebase(orderData));
    await sendOrderConfirmationEmail({
      to: customerEmail,
      customerName,
      orderId,
      items: cartItems,
      totalAmount,
      address,
      paymentMethod: "COD",
    }).catch(e => console.error("[cod/create] Email error:", e));
    // Deduct stock immediately for COD
    for (const item of cartItems) {
      const itemId = item.id || item.product?.id || item.productId;
      if (itemId) {
        const productRef = db.ref(`products/${itemId}/stock`);
        const snap = await productRef.get();
        if (snap.exists()) {
          const newStock = Math.max(0, snap.val() - item.quantity);
          await productRef.set(newStock);
        }
      }
    }
    res.json({ success: true, orderId, message: "Order placed successfully!" });
  } catch (error: any) {
    console.error("COD create error:", error);
    res.status(500).json({ error: "Failed to place COD order", details: error.message });
  }
});

// ─── VERIFY COD OTP (called at delivery) ────────────────────────────────────
router.post("/cod/verify-otp", async (req: Request, res: Response) => {
  try {
    const { orderId, otp } = req.body;
    if (!orderId || !otp) return res.status(400).json({ error: "orderId and otp are required" });
    const result = await verifyOTP(orderId, otp);
    if (!result.valid) {
      return res.status(400).json({ error: result.reason });
    }
    await db.ref(`orders/${orderId}`).update({
      codOtpVerified: true,
      orderStatus: "Delivered",
      paymentStatus: "PAID",
      deliveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true, message: "OTP verified. Order marked as Delivered." });
  } catch (error: any) {
    console.error("OTP verify error:", error);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// ─── RESEND COD OTP ───────────────────────────────────────────────────────────
router.post("/cod/resend-otp", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const orderSnap = await db.ref(`orders/${orderId}`).get();
    if (!orderSnap.exists()) return res.status(404).json({ error: "Order not found" });
    const order = orderSnap.val();
    const newOtp = generateOTP();
    await storeOTP(orderId, newOtp);
    await sendCODOTPEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      orderId,
      otp: newOtp,
      items: order.cartItems,
      totalAmount: order.totalAmount,
      address: order.address,
      phone: order.customerPhone,
    });
    res.json({ success: true, message: "New OTP sent to your email." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

// ─── UPI SCAN & PAY — PLACE ORDER ───────────────────────────────────────────
router.post("/upi/create", async (req: Request, res: Response) => {
  try {
    const { uid, cartItems, address, customerName, customerEmail, customerPhone, totalAmount, upiTransactionId, paymentMethod } = req.body;
    if (!cartItems || !address || !customerEmail || !customerPhone || !totalAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const orderId = `KM_UPI_${Date.now()}_${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const orderData = {
      orderId,
      uid: uid || "guest",
      customerName,
      customerEmail,
      customerPhone,
      address,
      cartItems,
      totalAmount,
      paymentMethod: paymentMethod || "UPI",
      paymentStatus: "PAID",
      orderStatus: "Processing",
      upiTransactionId: upiTransactionId || `KM_TXN_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.ref(`orders/${orderId}`).set(orderData);
    // Deduct stock
    for (const item of cartItems) {
      const itemId = item.id || item.product?.id || item.productId;
      if (itemId) {
        const productRef = db.ref(`products/${itemId}/stock`);
        const snap = await productRef.get();
        if (snap.exists()) {
          const newStock = Math.max(0, snap.val() - item.quantity);
          await productRef.set(newStock);
        }
      }
    }
    await sendOrderConfirmationEmail({
      to: customerEmail,
      customerName,
      orderId,
      items: cartItems,
      totalAmount,
      address,
      paymentMethod: "UPI (Scan & Pay)",
    }).catch(e => console.error("[upi/create] Email error:", e));
    res.json({ success: true, orderId, message: "Order placed successfully via UPI QR Code!" });
  } catch (error: any) {
    console.error("UPI create error:", error);
    res.status(500).json({ error: "Failed to place UPI order", details: error.message });
  }
});

// ─── VERIFY ORDER (GET /api/verify-order?order_id=xxx) ───────────────────────
router.get("/verify-order", async (req: Request, res: Response) => {
  try {
    const orderId = req.query.order_id as string;
    if (!orderId) {
      return res.status(400).json({ error: "order_id query param is required" });
    }
    const orderSnap = await db.ref(`orders/${orderId}`).get();
    if (!orderSnap.exists()) return res.status(404).json({ error: "Order not found" });
    const order = orderSnap.val();
    // Sync status if still pending
    if (order.paymentStatus === "PENDING" && order.paymentMethod === "CASHFREE") {
      try {
        const cfStatus = await fetchCashfreeOrderStatus(orderId);
        if (cfStatus.order_status === "PAID") {
          await db.ref(`orders/${orderId}`).update({
            paymentStatus: "PAID",
            orderStatus: "Processing",
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          order.paymentStatus = "PAID";
          order.orderStatus = "Processing";
          // Deduct stock
          for (const item of order.cartItems || []) {
            const itemId = item.id || item.product?.id || item.productId;
            if (itemId) {
              const productRef = db.ref(`products/${itemId}/stock`);
              const snap = await productRef.get();
              if (snap.exists()) {
                const newStock = Math.max(0, snap.val() - item.quantity);
                await productRef.set(newStock);
              }
            }
          }
          // Send confirmation email
          if (order.customerEmail) {
            await sendOrderConfirmationEmail({
              to: order.customerEmail,
              customerName: order.customerName,
              orderId: order.internalOrderId,
              items: order.cartItems,
              totalAmount: order.totalAmount,
              address: order.address,
              paymentMethod: "Online (Cashfree)",
            }).catch(e => console.error("[verify-order] Email error:", e));
          }
        } else if (cfStatus.order_status === "EXPIRED" || cfStatus.order_status === "TERMINATED") {
          await db.ref(`orders/${orderId}`).update({
            paymentStatus: "FAILED",
            orderStatus: "Payment Failed",
            updatedAt: new Date().toISOString(),
          });
          order.paymentStatus = "FAILED";
          order.orderStatus = "Payment Failed";
        }
      } catch (cfErr: any) {
        console.error("[verify-order] Cashfree fetch error:", cfErr.message);
      }
    }
    res.json({
      success: true,
      orderId: order.cfOrderId || orderId,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    });
  } catch (error: any) {
    console.error("Verify order error:", error);
    res.status(500).json({ error: "Failed to verify order" });
  }
});

export default router;
