import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import { verifyOrder } from "../services/paymentApi";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  onSuccess: (orderId: string) => void;
}

export function QRModal({ isOpen, onClose, orderId, amount, onSuccess }: QRModalProps) {
  const [status, setStatus] = useState<"PENDING" | "PAID" | "FAILED">("PENDING");
  
  const upiString = `upi://pay?pa=kisanmart@ybl&pn=KisanMart&am=${amount.toFixed(2)}&tr=${orderId}&cu=INR`;

  useEffect(() => {
    if (!isOpen) return;

    let intervalId: ReturnType<typeof setInterval>;

    const pollStatus = async () => {
      try {
        const res = await verifyOrder(orderId);
        if (res.paymentStatus === "PAID") {
          setStatus("PAID");
          clearInterval(intervalId);
          setTimeout(() => onSuccess(orderId), 1500);
        } else if (res.paymentStatus === "FAILED") {
          setStatus("FAILED");
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    intervalId = setInterval(pollStatus, 3000);
    pollStatus(); // Initial check

    return () => clearInterval(intervalId);
  }, [isOpen, orderId, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Scan to Pay</h2>
          <p className="text-sm text-gray-500 mb-6">Use any UPI app (GPay, PhonePe, Paytm)</p>

          <div className="bg-white p-4 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-gray-100 mb-6 relative">
            {status === "PAID" && (
              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 rounded-2xl animate-in fade-in duration-300">
                <CheckCircle size={48} className="text-green-500 mb-2" />
                <span className="font-bold text-green-600">Payment Successful!</span>
              </div>
            )}
            {status === "FAILED" && (
              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 rounded-2xl animate-in fade-in duration-300">
                <X size={48} className="text-red-500 mb-2" />
                <span className="font-bold text-red-600">Payment Failed!</span>
              </div>
            )}
            <QRCodeSVG value={upiString} size={200} level="H" includeMargin={false} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
              <img src="/logo.svg" alt="KisanMart" className="w-8 h-8 rounded-lg" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
          </div>

          <div className="bg-gray-50 w-full rounded-xl p-4 mb-6 text-left border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Order ID:</span>
              <span className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">{orderId.split('_').pop()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Amount:</span>
              <span className="text-lg font-bold text-[#2d5a27]">₹{amount.toFixed(2)}</span>
            </div>
          </div>

          {status === "PENDING" && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500">
              <Loader2 size={16} className="animate-spin text-[#2d5a27]" />
              Waiting for payment confirmation...
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-400">
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-3 opacity-50 grayscale hover:grayscale-0 transition-all" />
        </div>
      </div>
    </div>
  );
}
