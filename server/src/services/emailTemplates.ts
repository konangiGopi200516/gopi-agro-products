import { sendMail } from "../config/mailer";

interface OrderEmailParams {
  to: string;
  customerName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number; unit?: string }>;
  totalAmount: number;
  address: { line1: string; city: string; state: string; pincode: string } | string;
  paymentMethod: string;
}

interface CODOTPEmailParams extends Omit<OrderEmailParams, "paymentMethod"> {
  otp: string;
  phone: string;
}

interface PaymentFailedParams {
  to: string;
  customerName: string;
  orderId: string;
  reason: string;
}

const itemsHtml = (items: any[]) =>
  items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${item.name || item.product?.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${item.quantity} ${item.unit || item.product?.unit || "pcs"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">₹${((item.price || item.product?.price || 0) * item.quantity).toFixed(2)}</td>
    </tr>`
    )
    .join("");

const formatAddress = (addr: any) => {
  if (typeof addr === "string") return addr;
  return `${addr.line1 || addr.address || ""}, ${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}`;
};

export async function sendOrderConfirmationEmail(params: OrderEmailParams) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">
      <!-- Header -->
      <tr><td style="background:#2d5a27;padding:28px 32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">🌾 KisanMart</h1>
        <p style="color:#a8d5a2;margin:6px 0 0;font-size:13px">Farm Fresh · Delivered with Care</p>
      </td></tr>
      <!-- Success Banner -->
      <tr><td style="background:#f0faf0;padding:20px 32px;text-align:center;border-bottom:1px solid #d4edda">
        <div style="font-size:32px">✅</div>
        <h2 style="color:#2d5a27;margin:8px 0 4px;font-size:18px">Order Confirmed!</h2>
        <p style="color:#666;margin:0;font-size:14px">Your order <strong style="color:#2d5a27">#${params.orderId}</strong> has been placed successfully.</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:28px 32px">
        <p style="color:#333;font-size:15px;margin:0 0 20px">Hi ${params.customerName}, thank you for shopping with KisanMart! Here's your order summary:</p>
        <!-- Items Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #eee;margin-bottom:20px">
          <thead><tr style="background:#f8f8f8">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase">Product</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;text-transform:uppercase">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase">Amount</th>
          </tr></thead>
          <tbody>${itemsHtml(params.items)}</tbody>
          <tfoot><tr style="background:#f8f8f8">
            <td colspan="2" style="padding:12px;font-weight:700;color:#333">Total</td>
            <td style="padding:12px;text-align:right;font-weight:700;color:#2d5a27;font-size:16px">₹${params.totalAmount.toFixed(2)}</td>
          </tr></tfoot>
        </table>
        <!-- Details Grid -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
          <tr>
            <td width="50%" style="padding-right:8px;vertical-align:top">
              <div style="background:#f9f9f9;border-radius:8px;padding:14px">
                <p style="margin:0 0 6px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Delivery Address</p>
                <p style="margin:0;font-size:13px;color:#333;line-height:1.6">${formatAddress(params.address)}</p>
              </div>
            </td>
            <td width="50%" style="padding-left:8px;vertical-align:top">
              <div style="background:#f9f9f9;border-radius:8px;padding:14px">
                <p style="margin:0 0 6px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Payment Method</p>
                <p style="margin:0;font-size:13px;color:#333">${params.paymentMethod}</p>
                <p style="margin:8px 0 0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Status</p>
                <p style="margin:4px 0 0;font-size:13px;color:#2d8a4e;font-weight:600">✓ Paid & Confirmed</p>
              </div>
            </td>
          </tr>
        </table>
        <p style="color:#888;font-size:13px;margin:0">We'll notify you when your order is shipped. Expect delivery in 2–4 business days.</p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#2d5a27;padding:18px 32px;text-align:center">
        <p style="color:#a8d5a2;margin:0;font-size:12px">KisanMart · Direct from Indian Farmers · support@kisanmart.in</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const res = await sendMail(
    params.to,
    `✅ Order Confirmed — #${params.orderId} | KisanMart`,
    html
  );
  return res.previewUrl || null;
}

export async function sendCODOTPEmail(params: CODOTPEmailParams) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">
      <tr><td style="background:#2d5a27;padding:28px 32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">🌾 KisanMart</h1>
        <p style="color:#a8d5a2;margin:6px 0 0;font-size:13px">Cash on Delivery Order</p>
      </td></tr>
      <tr><td style="padding:28px 32px">
        <h2 style="color:#2d5a27;margin:0 0 12px;font-size:18px">Your Order is Confirmed! 🎉</h2>
        <p style="color:#333;font-size:15px;margin:0 0 20px">Hi ${params.customerName}, your COD order <strong>#${params.orderId}</strong> has been placed successfully.</p>
        <!-- OTP Box -->
        <div style="background:#fff8e1;border:2px dashed #f9a825;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px">Delivery Verification OTP</p>
          <div style="font-size:40px;font-weight:800;letter-spacing:10px;color:#2d5a27;font-family:monospace">${params.otp}</div>
          <p style="margin:12px 0 0;font-size:12px;color:#f57c00">⏱ Valid for 10 minutes at time of delivery</p>
        </div>
        <div style="background:#e8f5e9;border-radius:8px;padding:14px;margin-bottom:20px">
          <p style="margin:0;font-size:13px;color:#2d5a27;font-weight:600">📦 How OTP Verification Works:</p>
          <ol style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#444;line-height:2">
            <li>Our delivery agent will arrive at your address</li>
            <li>Share this 6-digit OTP with the delivery agent</li>
            <li>OTP is verified → Order is marked as Delivered</li>
            <li>Pay ₹${params.totalAmount.toFixed(2)} in cash at delivery</li>
          </ol>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
          <tr>
            <td width="50%" style="padding-right:8px;vertical-align:top">
              <div style="background:#f9f9f9;border-radius:8px;padding:14px">
                <p style="margin:0 0 6px;font-size:11px;color:#888;text-transform:uppercase">Delivery Address</p>
                <p style="margin:0;font-size:13px;color:#333;line-height:1.6">${formatAddress(params.address)}</p>
              </div>
            </td>
            <td width="50%" style="padding-left:8px;vertical-align:top">
              <div style="background:#f9f9f9;border-radius:8px;padding:14px">
                <p style="margin:0 0 6px;font-size:11px;color:#888;text-transform:uppercase">Contact Number</p>
                <p style="margin:0;font-size:13px;color:#333">${params.phone}</p>
                <p style="margin:8px 0 0;font-size:11px;color:#888;text-transform:uppercase">Amount to Pay</p>
                <p style="margin:4px 0 0;font-size:15px;color:#2d5a27;font-weight:700">₹${params.totalAmount.toFixed(2)}</p>
              </div>
            </td>
          </tr>
        </table>
        <p style="color:#888;font-size:12px;margin:0">⚠️ Do not share this OTP with anyone except our delivery agent. KisanMart never calls asking for OTP.</p>
      </td></tr>
      <tr><td style="background:#2d5a27;padding:18px 32px;text-align:center">
        <p style="color:#a8d5a2;margin:0;font-size:12px">KisanMart · Direct from Indian Farmers · support@kisanmart.in</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const res = await sendMail(
    params.to,
    `📦 COD Order #${params.orderId} — Your Delivery OTP Inside | KisanMart`,
    html
  );
  return res.previewUrl || null;
}

export async function sendPaymentFailedEmail(params: PaymentFailedParams) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">
      <tr><td style="background:#c62828;padding:28px 32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">🌾 KisanMart</h1>
        <p style="color:#ffcdd2;margin:6px 0 0;font-size:13px">Payment Failed Notice</p>
      </td></tr>
      <tr><td style="padding:28px 32px">
        <h2 style="color:#c62828;margin:0 0 12px;font-size:18px">Payment Failed ❌</h2>
        <p style="color:#333;font-size:15px;margin:0 0 16px">Hi ${params.customerName}, unfortunately your payment for order <strong>#${params.orderId}</strong> could not be processed.</p>
        <div style="background:#fff3f3;border-left:4px solid #c62828;border-radius:4px;padding:14px;margin-bottom:20px">
          <p style="margin:0;font-size:13px;color:#c62828;font-weight:600">Reason: ${params.reason || "Payment declined by bank"}</p>
        </div>
        <p style="color:#555;font-size:14px">Your cart has been saved. Please try again with:</p>
        <ul style="color:#555;font-size:14px;line-height:2">
          <li>A different UPI ID or bank account</li>
          <li>Net Banking or Debit/Credit Card</li>
          <li>Cash on Delivery option</li>
        </ul>
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/cart" style="display:inline-block;background:#2d5a27;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:8px">Retry Payment →</a>
        <p style="color:#888;font-size:12px;margin:20px 0 0">No amount has been deducted. If you see a deduction, it will be refunded within 5–7 business days.</p>
      </td></tr>
      <tr><td style="background:#2d5a27;padding:18px 32px;text-align:center">
        <p style="color:#a8d5a2;margin:0;font-size:12px">KisanMart · support@kisanmart.in</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  await sendMail(
    params.to,
    `❌ Payment Failed — Order #${params.orderId} | KisanMart`,
    html
  );
}
