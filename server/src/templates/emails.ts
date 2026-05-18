export const orderConfirmationEmail = (order: {
  userName: string;
  orderId: string;
  items: { name: string; qty: number; price: number }[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  estimatedDelivery: string;
}) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FDFAF5;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #E8DCC8;overflow:hidden;">
        
        <!-- HEADER -->
        <tr><td style="background:#D47C0F;padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-family:Georgia,serif;">🌾 KisanMart</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Farm Fresh, Delivered to Your Door</p>
        </td></tr>

        <!-- SUCCESS BANNER -->
        <tr><td style="background:#EAF4EC;padding:24px 40px;text-align:center;border-bottom:1px solid #E8DCC8;">
          <div style="font-size:48px;margin-bottom:8px;">✅</div>
          <h2 style="color:#3A7D44;font-size:22px;margin:0;font-family:Georgia,serif;">Order Placed Successfully!</h2>
          <p style="color:#6B5B3E;margin:8px 0 0;font-size:14px;">Hi ${order.userName}, we have received your order and it is being prepared.</p>
        </td></tr>

        <!-- ORDER ID -->
        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8DCC8;">
          <table width="100%"><tr>
            <td>
              <p style="margin:0;font-size:13px;color:#9C8A72;">Order ID</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#D47C0F;font-family:monospace;">#${order.orderId}</p>
            </td>
            <td align="right">
              <p style="margin:0;font-size:13px;color:#9C8A72;">Estimated Delivery</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1C1408;">🚚 ${order.estimatedDelivery}</p>
            </td>
          </tr></table>
        </td></tr>

        <!-- ITEMS -->
        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8DCC8;">
          <h3 style="margin:0 0 16px;font-size:16px;color:#1C1408;font-family:Georgia,serif;">Items Ordered</h3>
          ${order.items.map(item => `
          <table width="100%" style="margin-bottom:12px;">
            <tr>
              <td style="font-size:14px;color:#1C1408;">${item.name}</td>
              <td align="center" style="font-size:13px;color:#9C8A72;">Qty: ${item.qty}</td>
              <td align="right" style="font-size:14px;font-weight:600;color:#D47C0F;">₹${item.price * item.qty}</td>
            </tr>
          </table>`).join("")}
          <table width="100%" style="border-top:2px solid #E8DCC8;padding-top:12px;margin-top:4px;">
            <tr>
              <td style="font-size:16px;font-weight:700;color:#1C1408;">Total Paid</td>
              <td align="right" style="font-size:18px;font-weight:700;color:#D47C0F;">₹${order.totalAmount}</td>
            </tr>
          </table>
        </td></tr>

        <!-- DELIVERY + PAYMENT -->
        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8DCC8;">
          <table width="100%"><tr>
            <td width="50%" style="vertical-align:top;">
              <p style="margin:0 0 6px;font-size:13px;color:#9C8A72;">📍 Delivery Address</p>
              <p style="margin:0;font-size:14px;color:#1C1408;line-height:1.6;">${order.deliveryAddress}</p>
            </td>
            <td width="50%" style="vertical-align:top;padding-left:20px;">
              <p style="margin:0 0 6px;font-size:13px;color:#9C8A72;">💳 Payment Method</p>
              <p style="margin:0;font-size:14px;color:#1C1408;">${order.paymentMethod}</p>
            </td>
          </tr></table>
        </td></tr>

        <!-- ORDER TIMELINE -->
        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8DCC8;">
          <h3 style="margin:0 0 16px;font-size:16px;color:#1C1408;font-family:Georgia,serif;">Order Journey</h3>
          <table width="100%">
            <tr><td style="padding:8px 0;">
              <span style="background:#EAF4EC;color:#3A7D44;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">✓ Order Placed</span>
              <span style="font-size:12px;color:#9C8A72;margin-left:8px;">Just now</span>
            </td></tr>
            <tr><td style="padding:8px 0;">
              <span style="background:#FEF3E2;color:#D47C0F;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">⏳ Processing</span>
              <span style="font-size:12px;color:#9C8A72;margin-left:8px;">Upcoming</span>
            </td></tr>
            <tr><td style="padding:8px 0;">
              <span style="background:#F1EFE8;color:#9C8A72;padding:4px 12px;border-radius:999px;font-size:12px;">📦 Shipped</span>
              <span style="font-size:12px;color:#9C8A72;margin-left:8px;">Upcoming</span>
            </td></tr>
            <tr><td style="padding:8px 0;">
              <span style="background:#F1EFE8;color:#9C8A72;padding:4px 12px;border-radius:999px;font-size:12px;">🏠 Delivered</span>
              <span style="font-size:12px;color:#9C8A72;margin-left:8px;">Upcoming</span>
            </td></tr>
          </table>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="padding:28px 40px;text-align:center;background:#FDFAF5;">
          <p style="margin:0 0 8px;font-size:13px;color:#6B5B3E;">Need help? Contact us at <a href="mailto:support@kisanmart.com" style="color:#D47C0F;">support@kisanmart.com</a></p>
          <p style="margin:0;font-size:12px;color:#9C8A72;">© 2025 KisanMart · Supporting Indian Farmers 🌾</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const orderShippedEmail = (order: {
  userName: string;
  orderId: string;
  deliveryAddress: string;
  estimatedDelivery: string;
  trackingNote?: string;
}) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FDFAF5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #E8DCC8;overflow:hidden;">
        
        <tr><td style="background:#D47C0F;padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-family:Georgia,serif;">🌾 KisanMart</h1>
        </td></tr>

        <tr><td style="background:#EEF4FF;padding:24px 40px;text-align:center;border-bottom:1px solid #E8DCC8;">
          <div style="font-size:48px;margin-bottom:8px;">🚚</div>
          <h2 style="color:#185FA5;font-size:22px;margin:0;font-family:Georgia,serif;">Your Order is On Its Way!</h2>
          <p style="color:#6B5B3E;margin:8px 0 0;font-size:14px;">Hi ${order.userName}, your fresh produce has been shipped and is heading to you!</p>
        </td></tr>

        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8DCC8;">
          <table width="100%"><tr>
            <td>
              <p style="margin:0;font-size:13px;color:#9C8A72;">Order ID</p>
              <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#D47C0F;font-family:monospace;">#${order.orderId}</p>
            </td>
            <td align="right">
              <p style="margin:0;font-size:13px;color:#9C8A72;">Expected Delivery</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1C1408;">${order.estimatedDelivery}</p>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8DCC8;">
          <h3 style="margin:0 0 12px;font-size:15px;color:#1C1408;">📍 Delivering To</h3>
          <p style="margin:0;font-size:14px;color:#6B5B3E;line-height:1.6;">${order.deliveryAddress}</p>
          ${order.trackingNote ? `
          <div style="background:#FEF3E2;border:1px solid #E8DCC8;border-radius:8px;padding:12px 16px;margin-top:16px;">
            <p style="margin:0;font-size:13px;color:#A85F08;">📋 Note: ${order.trackingNote}</p>
          </div>` : ""}
        </td></tr>

        <!-- TIMELINE — Shipped active -->
        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8DCC8;">
          <h3 style="margin:0 0 16px;font-size:16px;color:#1C1408;font-family:Georgia,serif;">Order Journey</h3>
          <table width="100%">
            <tr><td style="padding:8px 0;"><span style="background:#EAF4EC;color:#3A7D44;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">✓ Order Placed</span></td></tr>
            <tr><td style="padding:8px 0;"><span style="background:#EAF4EC;color:#3A7D44;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">✓ Processing Complete</span></td></tr>
            <tr><td style="padding:8px 0;"><span style="background:#EEF4FF;color:#185FA5;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">🚚 Shipped ← You are here</span></td></tr>
            <tr><td style="padding:8px 0;"><span style="background:#F1EFE8;color:#9C8A72;padding:4px 12px;border-radius:999px;font-size:12px;">🏠 Delivered — Upcoming</span></td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 40px;text-align:center;background:#FDFAF5;">
          <p style="margin:0 0 8px;font-size:13px;color:#6B5B3E;">Questions? <a href="mailto:support@kisanmart.com" style="color:#D47C0F;">support@kisanmart.com</a></p>
          <p style="margin:0;font-size:12px;color:#9C8A72;">© 2025 KisanMart · Supporting Indian Farmers 🌾</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const orderDeliveredEmail = (order: {
  userName: string;
  orderId: string;
  totalAmount: number;
}) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FDFAF5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #E8DCC8;overflow:hidden;">

        <tr><td style="background:#D47C0F;padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-family:Georgia,serif;">🌾 KisanMart</h1>
        </td></tr>

        <tr><td style="background:#EAF4EC;padding:32px 40px;text-align:center;border-bottom:1px solid #E8DCC8;">
          <div style="font-size:56px;margin-bottom:8px;">🎉</div>
          <h2 style="color:#3A7D44;font-size:24px;margin:0;font-family:Georgia,serif;">Order Delivered!</h2>
          <p style="color:#6B5B3E;margin:10px 0 0;font-size:14px;line-height:1.6;">Hi ${order.userName}, your fresh farm produce has been delivered successfully. We hope you enjoy every bite! 🌱</p>
        </td></tr>

        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8DCC8;text-align:center;">
          <p style="margin:0;font-size:13px;color:#9C8A72;">Order ID</p>
          <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#D47C0F;font-family:monospace;">#${order.orderId}</p>
          <p style="margin:6px 0 0;font-size:14px;color:#6B5B3E;">Total Paid: <strong style="color:#D47C0F;">₹${order.totalAmount}</strong></p>
        </td></tr>

        <!-- TIMELINE — All complete -->
        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8DCC8;">
          <h3 style="margin:0 0 16px;font-size:16px;color:#1C1408;font-family:Georgia,serif;">Order Journey — Complete ✓</h3>
          <table width="100%">
            <tr><td style="padding:8px 0;"><span style="background:#EAF4EC;color:#3A7D44;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">✓ Order Placed</span></td></tr>
            <tr><td style="padding:8px 0;"><span style="background:#EAF4EC;color:#3A7D44;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">✓ Processing Complete</span></td></tr>
            <tr><td style="padding:8px 0;"><span style="background:#EAF4EC;color:#3A7D44;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">✓ Shipped</span></td></tr>
            <tr><td style="padding:8px 0;"><span style="background:#EAF4EC;color:#3A7D44;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">✓ Delivered Successfully 🏠</span></td></tr>
          </table>
        </td></tr>

        <!-- RATE US -->
        <tr><td style="padding:24px 40px;text-align:center;border-bottom:1px solid #E8DCC8;">
          <p style="margin:0 0 12px;font-size:15px;color:#1C1408;font-weight:600;">How was your experience?</p>
          <p style="margin:0;font-size:28px;letter-spacing:6px;">⭐⭐⭐⭐⭐</p>
          <p style="margin:10px 0 0;font-size:13px;color:#9C8A72;">Your feedback helps our farmers grow 🌱</p>
        </td></tr>

        <!-- REORDER CTA -->
        <tr><td style="padding:24px 40px;text-align:center;border-bottom:1px solid #E8DCC8;">
          <a href="https://kisanmart.com/products" style="display:inline-block;background:#D47C0F;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">🛒 Order Again</a>
        </td></tr>

        <tr><td style="padding:28px 40px;text-align:center;background:#FDFAF5;">
          <p style="margin:0 0 8px;font-size:13px;color:#6B5B3E;">Need help? <a href="mailto:support@kisanmart.com" style="color:#D47C0F;">support@kisanmart.com</a></p>
          <p style="margin:0;font-size:12px;color:#9C8A72;">© 2025 KisanMart · Supporting Indian Farmers 🌾</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const orderProcessingEmail = (order: {
  userName: string;
  orderId: string;
  estimatedDelivery: string;
}) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FDFAF5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #E8DCC8;overflow:hidden;">
        <tr><td style="background:#D47C0F;padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-family:Georgia,serif;">🌾 KisanMart</h1>
        </td></tr>
        <tr><td style="background:#FEF3E2;padding:24px 40px;text-align:center;border-bottom:1px solid #E8DCC8;">
          <div style="font-size:48px;margin-bottom:8px;">⏳</div>
          <h2 style="color:#D47C0F;font-size:22px;margin:0;font-family:Georgia,serif;">Your Order is Now Processing!</h2>
          <p style="color:#6B5B3E;margin:8px 0 0;font-size:14px;">Hi ${order.userName}, our farmers and team are now picking and packing your fresh order (#${order.orderId}).</p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8DCC8;text-align:center;">
          <p style="margin:0;font-size:13px;color:#9C8A72;">Estimated Delivery</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1C1408;">🚚 ${order.estimatedDelivery}</p>
        </td></tr>
        <tr><td style="padding:28px 40px;text-align:center;background:#FDFAF5;">
          <p style="margin:0 0 8px;font-size:13px;color:#6B5B3E;">Questions? <a href="mailto:support@kisanmart.com" style="color:#D47C0F;">support@kisanmart.com</a></p>
          <p style="margin:0;font-size:12px;color:#9C8A72;">© 2025 KisanMart · Supporting Indian Farmers 🌾</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const orderCancelledEmail = (order: {
  userName: string;
  orderId: string;
}) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FDFAF5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #E8DCC8;overflow:hidden;">
        <tr><td style="background:#C0392B;padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;font-family:Georgia,serif;">🌾 KisanMart</h1>
        </td></tr>
        <tr><td style="background:#FADBD8;padding:24px 40px;text-align:center;border-bottom:1px solid #E8DCC8;">
          <div style="font-size:48px;margin-bottom:8px;">❌</div>
          <h2 style="color:#C0392B;font-size:22px;margin:0;font-family:Georgia,serif;">Order Cancelled</h2>
          <p style="color:#6B5B3E;margin:8px 0 0;font-size:14px;">Hi ${order.userName}, your order #${order.orderId} has been cancelled. Any payment made will be refunded within 3-5 business days.</p>
        </td></tr>
        <tr><td style="padding:28px 40px;text-align:center;background:#FDFAF5;">
          <p style="margin:0 0 8px;font-size:13px;color:#6B5B3E;">Questions? <a href="mailto:support@kisanmart.com" style="color:#D47C0F;">support@kisanmart.com</a></p>
          <p style="margin:0;font-size:12px;color:#9C8A72;">© 2025 KisanMart · Supporting Indian Farmers 🌾</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
