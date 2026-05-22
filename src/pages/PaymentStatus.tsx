import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { checkPaymentStatus } from "../services/paymentApi";
import { useCartContext } from "../context/CartContext";

export default function PaymentStatus() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCartContext();
  const orderId = params.get("order_id") || sessionStorage.getItem("cashfree_order_id");
  const [status, setStatus] = useState<"loading" | "PAID" | "FAILED" | "PENDING">("loading");
  const [pollCount, setPollCount] = useState(0);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (!orderId) { navigate("/"); return; }

    let interval: ReturnType<typeof setInterval>;
    const poll = async () => {
      try {
        const result = await checkPaymentStatus(orderId);
        setOrderDetails(result);
        if (result.paymentStatus === "PAID") {
          setStatus("PAID");
          clearCart(); // Clear the cart after successful payment
          sessionStorage.removeItem("cashfree_order_id");
          clearInterval(interval);
        } else if (result.paymentStatus === "FAILED") {
          setStatus("FAILED");
          sessionStorage.removeItem("cashfree_order_id");
          clearInterval(interval);
        } else {
          setPollCount((c) => {
            if (c >= 12) { setStatus("PENDING"); clearInterval(interval); }
            return c + 1;
          });
        }
      } catch {
        setStatus("FAILED");
        clearInterval(interval);
      }
    };

    poll();
    interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [orderId, navigate, clearCart]);

  const statusConfig = {
    loading: {
      icon: <RefreshCw size={56} color="#f57c00" style={{ animation: "spin 1s linear infinite" }} />,
      title: "Verifying Payment...",
      subtitle: "Please wait while we confirm your payment with Cashfree",
      color: "#f57c00",
      bg: "linear-gradient(135deg, #fff8e1, #fff3cd)",
      borderColor: "#f57c0030",
    },
    PAID: {
      icon: <CheckCircle size={64} color="#2d5a27" />,
      title: "Payment Successful! 🎉",
      subtitle: "Your order has been confirmed. A confirmation email has been sent.",
      color: "#2d5a27",
      bg: "linear-gradient(135deg, #f0faf0, #e8f5e9)",
      borderColor: "#2d5a2730",
    },
    FAILED: {
      icon: <XCircle size={64} color="#c62828" />,
      title: "Payment Failed",
      subtitle: "Your payment could not be processed. No money was deducted from your account.",
      color: "#c62828",
      bg: "linear-gradient(135deg, #fff3f3, #ffebee)",
      borderColor: "#c6282830",
    },
    PENDING: {
      icon: <Clock size={56} color="#f57c00" />,
      title: "Payment Processing",
      subtitle: "Your payment is being processed. Please check My Orders in a few minutes.",
      color: "#f57c00",
      bg: "linear-gradient(135deg, #fff8e1, #fff3cd)",
      borderColor: "#f57c0030",
    },
  }[status];

  return (
    <div style={{ maxWidth: 520, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .payment-card { animation: fadeInUp 0.5s ease-out; }
        .success-icon { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      <div
        className="payment-card"
        style={{
          background: statusConfig.bg,
          border: `1px solid ${statusConfig.borderColor}`,
          borderRadius: 20,
          padding: "48px 36px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <div className={status === "PAID" ? "success-icon" : ""} style={{ marginBottom: 24 }}>
          {statusConfig.icon}
        </div>

        <h2 style={{
          color: statusConfig.color,
          margin: "0 0 12px",
          fontSize: 24,
          fontWeight: 800,
        }}>
          {statusConfig.title}
        </h2>

        <p style={{
          color: "#666",
          margin: "0 0 8px",
          fontSize: 14,
          lineHeight: 1.6,
        }}>
          {statusConfig.subtitle}
        </p>

        {orderId && (
          <p style={{
            color: "#888",
            margin: "0 0 8px",
            fontSize: 13,
            background: "rgba(255,255,255,0.6)",
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 20,
          }}>
            Order: <strong style={{ color: statusConfig.color }}>#{orderId}</strong>
          </p>
        )}

        {orderDetails?.totalAmount && status === "PAID" && (
          <p style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#2d5a27",
            margin: "12px 0 0",
          }}>
            ₹{orderDetails.totalAmount.toFixed(2)} paid
          </p>
        )}

        {status === "loading" && (
          <div style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 13,
            color: "#888",
          }}>
            <div style={{
              width: 120,
              height: 4,
              background: "#eee",
              borderRadius: 4,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${Math.min(pollCount * 8, 95)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #f57c00, #ff9800)",
                borderRadius: 4,
                transition: "width 0.5s ease",
              }} />
            </div>
            <span>Checking...</span>
          </div>
        )}

        {status !== "loading" && (
          <div style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 28,
          }}>
            {status === "FAILED" && (
              <button
                onClick={() => navigate("/cart")}
                style={{
                  background: "linear-gradient(135deg, #c62828, #e53935)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "13px 28px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 4px 12px rgba(198,40,40,0.3)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(198,40,40,0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(198,40,40,0.3)";
                }}
              >
                🔄 Retry Payment
              </button>
            )}
            <button
              onClick={() => navigate("/my-orders")}
              style={{
                background: "linear-gradient(135deg, #2d5a27, #4a8f3f)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "13px 28px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 12px rgba(45,90,39,0.3)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(45,90,39,0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(45,90,39,0.3)";
              }}
            >
              📦 View My Orders
            </button>
            <button
              onClick={() => navigate("/products")}
              style={{
                background: "transparent",
                color: "#2d5a27",
                border: "2px solid #2d5a27",
                borderRadius: 12,
                padding: "11px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f0faf0";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              🛒 Continue Shopping
            </button>
          </div>
        )}

        {status === "PAID" && (
          <div style={{
            marginTop: 24,
            padding: "12px 16px",
            background: "rgba(45,90,39,0.08)",
            borderRadius: 12,
            fontSize: 12,
            color: "#2d5a27",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}>
            🔒 Payment secured by Cashfree
          </div>
        )}
      </div>
    </div>
  );
}
