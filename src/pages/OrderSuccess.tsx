import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Loader2, ShoppingBag, ArrowRight, Package, Truck, Calendar, Download } from "lucide-react";
import { verifyOrder } from "../services/paymentApi";
import { useCartContext } from "../context/CartContext";

type VerifyStatus = "verifying" | "PAID" | "FAILED" | "PENDING";

interface OrderData {
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
  totalAmount: number;
  customerName?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCartContext();
  const orderId = params.get("order_id");

  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Estimated delivery: 3-5 days from now
  const deliveryStart = new Date();
  deliveryStart.setDate(deliveryStart.getDate() + 3);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 5);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  useEffect(() => {
    if (!orderId) { navigate("/"); return; }

    let interval: ReturnType<typeof setInterval>;
    let cancelled = false;

    const verify = async () => {
      try {
        const result = await verifyOrder(orderId);
        if (cancelled) return;
        setOrderData(result);

        if (result.paymentStatus === "PAID") {
          setStatus("PAID");
          clearCart();
          clearInterval(interval);
        } else if (result.paymentStatus === "FAILED") {
          setStatus("FAILED");
          clearInterval(interval);
        } else {
          setPollCount((c) => {
            if (c >= 15) { setStatus("PENDING"); clearInterval(interval); }
            return c + 1;
          });
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message);
        setStatus("FAILED");
        clearInterval(interval);
      }
    };

    verify();
    interval = setInterval(verify, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [orderId, navigate, clearCart]);

  /* ── VERIFYING ────────────────────────────────────────────────────────── */
  if (status === "verifying") {
    return (
      <div style={containerStyle}>
        <style>{animations}</style>
        <div style={cardStyle("#fafafa", "#e0e0e0")}>
          <div style={{ animation: "spin 1s linear infinite", marginBottom: 28 }}>
            <Loader2 size={52} color="#f57c00" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#333", margin: "0 0 8px" }}>Verifying Payment...</h2>
          <p style={{ fontSize: 14, color: "#888", margin: "0 0 20px", lineHeight: 1.6 }}>
            Please wait while we confirm your payment with Cashfree
          </p>
          <div style={{ width: 200, height: 4, background: "#eee", borderRadius: 4, overflow: "hidden", margin: "0 auto" }}>
            <div style={{ width: `${Math.min(pollCount * 7, 95)}%`, height: "100%", background: "linear-gradient(90deg, #f57c00, #ff9800)", borderRadius: 4, transition: "width 0.5s ease" }} />
          </div>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 12 }}>Order: <strong>#{orderId}</strong></p>
        </div>
      </div>
    );
  }

  /* ── PAID / SUCCESS ───────────────────────────────────────────────────── */
  if (status === "PAID" && orderData) {
    return (
      <div style={containerStyle}>
        <style>{animations}</style>
        <div style={{ ...cardStyle("#f0faf0", "#c8e6c9"), animation: "fadeInUp 0.6s ease-out" }}>
          {/* Icon */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #2d5a27, #4a8f3f)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(45,90,39,0.3)",
            animation: "successPulse 2s ease-in-out infinite",
          }}>
            <CheckCircle size={42} color="#fff" />
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#2d5a27", margin: "0 0 8px" }}>
            Payment Successful! 🎉
          </h2>
          <p style={{ fontSize: 14, color: "#666", margin: "0 0 6px", lineHeight: 1.6 }}>
            Thank you{orderData.customerName ? `, ${orderData.customerName}` : ""}! Your order has been confirmed.
          </p>

          {/* Order ID */}
          <div style={{ display: "inline-block", background: "rgba(45,90,39,0.1)", border: "1px solid rgba(45,90,39,0.2)", borderRadius: 24, padding: "8px 20px", margin: "8px 0 16px" }}>
            <span style={{ fontSize: 13, color: "#666" }}>Order ID: </span>
            <strong style={{ fontSize: 14, color: "#2d5a27" }}>#{orderData.orderId}</strong>
          </div>

          {/* Amount */}
          <div style={{ fontSize: 28, fontWeight: 800, color: "#2d5a27", margin: "4px 0 20px" }}>
            ₹{orderData.totalAmount?.toFixed(2)} <span style={{ fontSize: 14, fontWeight: 500, color: "#888" }}>paid</span>
          </div>

          {/* Delivery Estimate */}
          <div style={{
            background: "rgba(255,255,255,0.8)", border: "1px solid #e8f5e9", borderRadius: 12,
            padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
              <Truck size={18} color="#2d5a27" />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#2d5a27" }}>Estimated Delivery</div>
                <div style={{ fontSize: 13, color: "#666" }}>{fmt(deliveryStart)} – {fmt(deliveryEnd)}</div>
              </div>
            </div>
            <Calendar size={16} color="#888" />
          </div>

          {/* Order Items */}
          {orderData.items && orderData.items.length > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.8)", border: "1px solid #e8f5e9", borderRadius: 12,
              padding: "14px 18px", marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Package size={14} /> Order Items ({orderData.items.length})
              </div>
              {orderData.items.map((item, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: 13, color: "#444", padding: "5px 0",
                  borderBottom: i < orderData.items!.length - 1 ? "1px solid #f0f0f0" : "none",
                }}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong style={{ color: "#2d5a27" }}>₹{(item.price * item.quantity).toFixed(2)}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/my-orders")} style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingBag size={16} /> View My Orders <ArrowRight size={14} />
            </button>
            <button onClick={() => window.print()} style={{ ...outlineBtnStyle, display: "flex", alignItems: "center", gap: 6, color: "#f57c00", borderColor: "#f57c00" }}>
              <Download size={16} /> Download Invoice
            </button>
            <button onClick={() => navigate("/products")} style={outlineBtnStyle}>
              Continue Shopping
            </button>
          </div>

          <div className="no-print" style={{ marginTop: 24, fontSize: 12, color: "#999", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            🔒 Payment secured by Cashfree
          </div>
        </div>
      </div>
    );
  }

  /* ── FAILED ───────────────────────────────────────────────────────────── */
  if (status === "FAILED") {
    return (
      <div style={containerStyle}>
        <style>{animations}</style>
        <div style={{ ...cardStyle("#fff3f3", "#f9c0c0"), animation: "fadeInUp 0.6s ease-out" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #c62828, #e53935)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(198,40,40,0.3)",
          }}>
            <XCircle size={42} color="#fff" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#c62828", margin: "0 0 8px" }}>Payment Failed</h2>
          <p style={{ fontSize: 14, color: "#666", margin: "0 0 16px", lineHeight: 1.6 }}>
            Your payment could not be processed. No money was deducted from your account.
          </p>
          {orderId && <p style={{ fontSize: 13, color: "#999", margin: "0 0 8px" }}>Order: <strong>#{orderId}</strong></p>}
          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ef9a9a", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#b71c1c", marginBottom: 16 }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            <button onClick={() => navigate("/checkout")} style={{ ...primaryBtnStyle, background: "linear-gradient(135deg, #c62828, #e53935)", boxShadow: "0 4px 12px rgba(198,40,40,0.3)" }}>
              🔄 Retry Payment
            </button>
            <button onClick={() => navigate("/products")} style={outlineBtnStyle}>Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── PENDING ──────────────────────────────────────────────────────────── */
  return (
    <div style={containerStyle}>
      <style>{animations}</style>
      <div style={{ ...cardStyle("#fff8e1", "#ffe082"), animation: "fadeInUp 0.6s ease-out" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, #f57c00, #ff9800)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(245,124,0,0.3)",
        }}>
          <Clock size={42} color="#fff" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#e65100", margin: "0 0 8px" }}>Payment Processing</h2>
        <p style={{ fontSize: 14, color: "#666", margin: "0 0 16px", lineHeight: 1.6 }}>
          Your payment is still being processed. Please check My Orders in a few minutes.
        </p>
        {orderId && <p style={{ fontSize: 13, color: "#999", margin: "0 0 20px" }}>Order: <strong>#{orderId}</strong></p>}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/my-orders")} style={primaryBtnStyle}>📦 View My Orders</button>
          <button onClick={() => navigate("/products")} style={outlineBtnStyle}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}

/* ── Shared Styles ────────────────────────────────────────────────────────── */
const containerStyle: React.CSSProperties = { maxWidth: 520, margin: "60px auto", padding: "0 20px", textAlign: "center" };

function cardStyle(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, borderRadius: 20, padding: "48px 36px", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" };
}

const primaryBtnStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #2d5a27, #4a8f3f)", color: "#fff", border: "none",
  borderRadius: 12, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s", boxShadow: "0 4px 12px rgba(45,90,39,0.3)",
};

const outlineBtnStyle: React.CSSProperties = {
  background: "transparent", color: "#2d5a27", border: "2px solid #2d5a27",
  borderRadius: 12, padding: "11px 24px", fontSize: 14, fontWeight: 700,
  cursor: "pointer", transition: "all 0.2s",
};

const animations = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes successPulse { 0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(45,90,39,0.3); } 50% { transform: scale(1.05); box-shadow: 0 12px 32px rgba(45,90,39,0.4); } }
  @media print {
    .no-print { display: none !important; }
    body { background: white !important; }
    div { box-shadow: none !important; }
  }
`;
