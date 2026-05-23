import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag, CreditCard, Truck, CheckCircle, MapPin, Phone,
  Mail, User, Shield, Loader2, Banknote, Wifi, Lock
} from "lucide-react";
import { useCartContext, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from "../context/CartContext";
import { AppContext } from "../context/AppContext";
import { createCODOrder, createOnlineOrder } from "../services/paymentApi";
import { useCashfreePayment } from "../hooks/useCashfreePayment";
import { QRModal } from "../components/QRModal";
import { QrCode } from "lucide-react";

type PaymentMethod = "UPI" | "CARD" | "COD";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir",
];

interface AddressForm {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, subtotal, deliveryCharge, tax, total, clearCart } = useCartContext();
  const { state } = useContext(AppContext);
  const currentUser = state.currentUser;
  const { initiatePayment, loading: paymentLoading } = useCashfreePayment();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ONLINE");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBrief, setSuccessBrief] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [upiId, setUpiId] = useState("");
  const [selectedUpiApp, setSelectedUpiApp] = useState("");

  const [address, setAddress] = useState<AddressForm>({
    fullName: currentUser?.name === "Guest User" ? "" : (currentUser?.name || ""),
    phone: currentUser?.phone || "",
    email: "",
    line1: "",
    city: "",
    state: "Telangana",
    pincode: "",
  });
  const [errors, setErrors] = useState<Partial<AddressForm>>({});

  const isLoading = processing || paymentLoading;
  const codDisabled = total > 5000;

  // If COD was selected but total went above 5000, switch to UPI
  useEffect(() => {
    if (paymentMethod === "COD" && codDisabled) setPaymentMethod("UPI");
  }, [codDisabled, paymentMethod]);

  /* ── Empty cart guard ─────────────────────────────────────────────────── */
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBag size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-600 mb-2">Your cart is empty</h2>
        <p className="text-gray-400 mb-6">Add some fresh produce before checking out!</p>
        <button onClick={() => navigate("/products")} className="bg-[#2d5a27] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#1e3d1a] transition-colors">
          Browse Products
        </button>
      </div>
    );
  }

  /* ── Validation ───────────────────────────────────────────────────────── */
  function validateAddress(): boolean {
    const e: Partial<AddressForm> = {};
    if (!address.fullName.trim()) e.fullName = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, "")))
      e.phone = "Enter a valid 10-digit Indian mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email))
      e.email = "Enter a valid email address";
    if (!address.line1.trim()) e.line1 = "Address is required";
    if (!address.city.trim()) e.city = "City is required";
    if (!address.state) e.state = "State is required";
    if (!/^\d{6}$/.test(address.pincode)) e.pincode = "Enter a valid 6-digit PIN code";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Place Order ──────────────────────────────────────────────────────── */
  async function handlePlaceOrder() {
    if (!validateAddress()) return;
    setProcessing(true);
    setError(null);

    const checkoutData = {
      uid: currentUser?.uid ?? "guest",
      cartItems: cartItems.map(ci => ({
        id: ci.product.id,
        name: ci.product.name,
        price: ci.product.price,
        quantity: ci.quantity,
        unit: ci.product.unit,
        imageUrl: ci.product.imageUrl,
      })),
      address,
      customerName: address.fullName,
      customerEmail: address.email,
      customerPhone: address.phone.replace(/\D/g, "").replace(/^(\+?91)/, "").slice(-10),
      totalAmount: parseFloat(total.toFixed(2)),
    };

    try {
      if (paymentMethod === "COD") {
        const result = await createCODOrder(checkoutData);
        setSuccessBrief(true);
        clearCart();
        setTimeout(() => navigate(`/order-success?order_id=${result.orderId}`), 1200);
      } else {
        // Both UPI and CARD will route through the robust Cashfree Drop-in UI
        const result = await createOnlineOrder(checkoutData);
        await initiatePayment({
          paymentSessionId: result.paymentSessionId,
          orderId: result.orderId,
          onSuccess: (oid) => {
            setSuccessBrief(true);
            clearCart();
            setTimeout(() => navigate(`/order-success?order_id=${oid}`), 1200);
          },
          onFailure: (_oid, reason) => {
            setError(`Payment failed: ${reason}`);
          },
        });
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  const handleQRSuccess = (oid: string) => {
    setShowQRModal(false);
    setSuccessBrief(true);
    clearCart();
    setTimeout(() => navigate(`/order-success?order_id=${oid}`), 1200);
  };

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const inputCls = (field: keyof AddressForm) =>
    `w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all duration-200 bg-white ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:border-[#2d5a27] focus:ring-2 focus:ring-green-100"
    }`;

  const ctaLabel = () => {
    if (successBrief) return "✓ Order Placed!";
    if (isLoading) return "Processing…";
    if (paymentMethod === "COD") return `Place Order — ₹${total.toFixed(0)} on Delivery`;
    if (paymentMethod === "UPI") return `Pay ₹${total.toFixed(0)} via UPI`;
    return `Pay ₹${total.toFixed(0)} via Card`;
  };

  const ctaBg = () => {
    if (successBrief) return "linear-gradient(135deg, #16a34a, #22c55e)";
    return "linear-gradient(135deg, #2d5a27, #4a8f3f)";
  };

  /* ── RENDER ───────────────────────────────────────────────────────────── */
  return (
    <div className="bg-[var(--color-surface)] min-h-screen py-6 md:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--color-text-primary)]">Checkout</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Complete your order in a few steps</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ════════════ LEFT COLUMN — Address Form ════════════ */}
          <div className="flex-1 w-full">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                <MapPin size={20} className="text-[#2d5a27]" /> Delivery Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><User size={12} /> Full Name</label>
                  <input className={inputCls("fullName")} value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })} placeholder="Enter full name" />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>
                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Phone size={12} /> Phone</label>
                  <input className={inputCls("phone")} value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} placeholder="10-digit mobile" maxLength={10} />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Mail size={12} /> Email</label>
                  <input className={inputCls("email")} value={address.email} onChange={e => setAddress({ ...address, email: e.target.value })} placeholder="you@example.com" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><MapPin size={12} /> Address</label>
                  <input className={inputCls("line1")} value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} placeholder="House/flat no., street, area" />
                  {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1}</p>}
                </div>
                {/* City */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1">City</label>
                  <input className={inputCls("city")} value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} placeholder="City" />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>
                {/* State */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1">State</label>
                  <select className={inputCls("state")} value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })}>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Pincode */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1">PIN Code</label>
                  <input className={inputCls("pincode")} value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} placeholder="6-digit PIN" maxLength={6} />
                  {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* ════════════ RIGHT COLUMN — Order Summary ════════════ */}
          <div className="w-full lg:w-[400px] lg:sticky lg:top-24 flex-shrink-0">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Items */}
              <div className="p-6 border-b border-gray-100">
                <h4 className="font-bold text-gray-800 text-sm mb-4">Order Summary ({cartItems.length} items)</h4>
                <div className="max-h-52 overflow-y-auto space-y-3 pr-1">
                  {cartItems.map(ci => (
                    <div key={ci.product.id} className="flex items-center gap-3 text-sm">
                      <img src={ci.product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-700 truncate">{ci.product.name}</div>
                        <div className="text-xs text-gray-400">Qty: {ci.quantity} × ₹{ci.product.price}</div>
                      </div>
                      <span className="font-bold text-gray-800 flex-shrink-0">₹{(ci.product.price * ci.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="px-6 py-4 space-y-2 text-sm border-b border-gray-100">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Truck size={14} /> Delivery
                  </span>
                  {deliveryCharge === 0 ? (
                    <span className="text-green-600 font-semibold">FREE</span>
                  ) : (
                    <span className="text-orange-500 font-semibold">₹{deliveryCharge}</span>
                  )}
                </div>
                {deliveryCharge > 0 && (
                  <p className="text-[11px] text-orange-400">Add ₹{(FREE_DELIVERY_THRESHOLD - subtotal).toFixed(0)} more for free delivery</p>
                )}
                {deliveryCharge === 0 && subtotal > 0 && (
                  <p className="text-[11px] text-green-500">🎉 Free delivery on orders above ₹{FREE_DELIVERY_THRESHOLD}</p>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>GST (5%)</span>
                  <span>₹{tax.toFixed(0)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-base">Total</span>
                  <span className="font-bold text-xl text-[#2d5a27]">₹{total.toFixed(0)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="px-6 py-6 border-b border-gray-100 bg-[#222222] text-white">
                <h4 className="font-bold text-gray-300 text-xs tracking-wider mb-4 uppercase">
                  Choose Payment Method
                </h4>

                <div className="space-y-3">
                  {/* UPI */}
                  <div className={`rounded-xl border transition-all ${
                    paymentMethod === "UPI" ? "border-blue-500 bg-[#2a2a2a]" : "border-gray-700 bg-[#2a2a2a]"
                  }`}>
                    <label className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setPaymentMethod("UPI")}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === "UPI" ? "border-blue-500" : "border-gray-500"
                      }`}>
                        {paymentMethod === "UPI" && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 flex-shrink-0">
                        📱
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">UPI</div>
                        <div className="text-[11px] text-gray-400">GPay, PhonePe, Paytm, BHIM & more</div>
                      </div>
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recommended</span>
                    </label>

                    {/* UPI Expanded Content */}
                    {paymentMethod === "UPI" && (
                      <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {[
                            { id: "gpay", label: "GPay", icon: "G", color: "bg-blue-600" },
                            { id: "phonepe", label: "PhonePe", icon: "P", color: "bg-purple-600" },
                            { id: "paytm", label: "Paytm", icon: "B", color: "bg-sky-500" },
                            { id: "bhim", label: "BHIM", icon: "B", color: "bg-orange-600" }
                          ].map(app => (
                            <button
                              key={app.id}
                              onClick={() => setSelectedUpiApp(app.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                selectedUpiApp === app.id ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold ${app.color}`}>
                                {app.icon}
                              </div>
                              {app.label}
                            </button>
                          ))}
                        </div>
                        <div className="text-[11px] text-gray-400 mb-1.5 font-medium">Or enter UPI ID manually</div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="yourname@upi"
                            className="flex-1 bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => { if(upiId) setSelectedUpiApp("manual") }}
                            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Credit / Debit Card */}
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === "CARD" ? "border-blue-500 bg-[#2a2a2a]" : "border-gray-700 bg-[#2a2a2a] hover:border-gray-600"
                    }`}
                    onClick={() => setPaymentMethod("CARD")}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === "CARD" ? "border-blue-500" : "border-gray-500"
                    }`}>
                      {paymentMethod === "CARD" && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 flex-shrink-0">
                      💳
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm">Credit / Debit Card</div>
                      <div className="text-[11px] text-gray-400">Visa, Mastercard, RuPay, Amex</div>
                    </div>
                  </label>

                  {/* COD */}
                  <div className="relative">
                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        codDisabled
                          ? "border-gray-700 bg-[#2a2a2a] cursor-not-allowed opacity-50"
                          : paymentMethod === "COD"
                          ? "border-blue-500 bg-[#2a2a2a] cursor-pointer"
                          : "border-gray-700 bg-[#2a2a2a] hover:border-gray-600 cursor-pointer"
                      }`}
                      onClick={() => { if (!codDisabled) setPaymentMethod("COD"); }}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === "COD" ? "border-blue-500" : "border-gray-500"
                      }`}>
                        {paymentMethod === "COD" && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 flex-shrink-0">
                        💵
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">Cash on Delivery</div>
                        <div className="text-[11px] text-gray-400">Pay when your order arrives</div>
                      </div>
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full whitespace-nowrap">+₹30 fee</span>
                    </label>
                    {codDisabled && (
                      <p className="text-[11px] text-red-400 mt-1 ml-1">COD unavailable for orders above ₹5,000</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              {/* CTA Button */}
              <div className="p-6">
                <button
                  onClick={handlePlaceOrder}
                  disabled={isLoading || successBrief}
                  style={{ background: ctaBg() }}
                  className="w-full text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-green-200"
                >
                  {isLoading && <Loader2 size={18} className="animate-spin" />}
                  {successBrief && <CheckCircle size={18} />}
                  {ctaLabel()}
                </button>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-2 px-2">
                  <div className="flex flex-col items-center gap-1 text-[10px] font-semibold text-gray-500">
                    <Shield size={16} className="text-green-600" />
                    <span>PCI DSS</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-[10px] font-semibold text-gray-500">
                    <Lock size={16} className="text-gray-400" />
                    <span>256-bit SSL</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-[10px] font-semibold text-gray-500">
                    <CheckCircle size={16} className="text-blue-500" />
                    <span>100% Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QRModal
        isOpen={showQRModal}
        onClose={() => { setShowQRModal(false); setProcessing(false); }}
        orderId={currentOrderId}
        amount={total}
        onSuccess={handleQRSuccess}
      />
    </div>
  );
}
