import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export const PaymentSuccess = () => {
  const { state } = useLocation() as any;
  const navigate = useNavigate();
  const orderId = state?.orderId ?? new URLSearchParams(window.location.search).get("orderId") ?? "unknown";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6">
      <CheckCircle size={80} color="#2d5a27" className="mb-4 animate-bounce" />
      <h2 className="text-2xl font-bold mb-2 text-green-800">Payment Successful!</h2>
      <p className="text-gray-700 mb-6">
        Your order <strong>{orderId}</strong> has been confirmed.
      </p>
      <button
        onClick={() => navigate("/my-orders")}
        className="btn-primary"
      >
        View My Orders
      </button>
    </div>
  );
};
