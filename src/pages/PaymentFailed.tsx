import { useNavigate } from "react-router-dom";

export const PaymentFailed = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
      <h2 className="text-2xl font-bold mb-4 text-red-800">Payment Failed</h2>
      <p className="text-gray-700 mb-6">
        Your payment could not be processed. You may retry or go back to checkout.
      </p>
      <div className="flex gap-4">
        <button onClick={() => navigate("/checkout")} className="btn-primary">
          Retry Checkout
        </button>
        <button onClick={() => navigate("/cart")} className="btn-outline">
          Back to Cart
        </button>
      </div>
    </div>
  );
};
