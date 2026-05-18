import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldCheck, MapPin, CreditCard, ClipboardList, Smartphone, Banknote, Building2, Lock, BadgeCheck, Info, QrCode } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useCartContext } from '../context/CartContext';
import { useToast } from '../components/ToastProvider';
import { placeOrder } from '../services/api';
import paymentConfig from '../config/payment';

const Checkout = () => {
  const { state, dispatch } = useContext(AppContext);
  const { cartItems, clearCart } = useCartContext();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
    window.scrollTo(0, 0);
  }, [cartItems, navigate]);

  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (subtotal > 499 ? 0 : 50) : 0;
  const total = subtotal + shipping;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    buyerName: '',
    phone: '',
    email: '',
    pincode: '',
    city: '',
    state: '',
    address: '',
    landmark: '',
    paymentMethod: 'UPI',
    upiTransactionId: ''
  });

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 2) setCurrentStep(c => c + 1);
  };

  const handleSubmit = async () => {
    setIsPlacingOrder(true);
    try {
      const fullAddress = `${formData.address}, ${formData.landmark}, ${formData.city}, ${formData.state} - ${formData.pincode}`;
      
      const createdOrder = await placeOrder({
        userId: state.currentUser?.uid || 'guest',
        userName: formData.buyerName,
        userEmail: formData.email,
        userPhone: formData.phone,
        items: cartItems.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            unit: item.product.unit,
            imageUrl: item.product.imageUrl
          },
          quantity: item.quantity
        })),
        totalAmount: total,
        deliveryAddress: fullAddress,
        paymentMethod: formData.paymentMethod,
        upiTransactionId: formData.paymentMethod === 'UPI' ? 'Verified via PhonePe' : formData.upiTransactionId
      });

      const orderObj = createdOrder.order || createdOrder;
      dispatch({ type: 'PLACE_ORDER', payload: orderObj });
      clearCart();
      showToast('Order placed successfully!', 'success');
      navigate(`/order-confirmation/${orderObj.id}`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to place order.', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <div className="page-root bg-[var(--color-surface)] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        
        <div className="flex-1">
          {/* Progress Stepper */}
          <div className="flex items-center justify-center mb-10 max-w-sm mx-auto">
            {[
              { step: 1, label: 'Address', icon: <MapPin size={16}/> },
              { step: 2, label: 'Payment', icon: <CreditCard size={16}/> }
            ].map((item, index) => (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep > item.step ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' :
                    currentStep === item.step ? 'bg-white border-[var(--color-primary)] text-[var(--color-primary)]' :
                    'bg-white border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}>
                    {currentStep > item.step ? <Check size={20} /> : item.icon}
                  </div>
                  <span className={`text-[12px] font-medium ${currentStep >= item.step ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>{item.label}</span>
                </div>
                {index < 1 && (
                  <div className={`flex-1 h-0.5 mx-2 -mt-6 transition-colors ${currentStep > item.step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-sm">
            <form id="checkout-form" onSubmit={currentStep === 1 ? handleNextStep : (e) => { e.preventDefault(); handleSubmit(); }} className="p-6 sm:p-8">
              
              {/* STEP 1: Address */}
              {currentStep === 1 && (
                <div className="animate-fade-up">
                  <h2 className="font-display font-bold text-[24px] text-[var(--color-text-primary)] mb-6">Delivery Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-1">
                      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">Full Name</label>
                      <input required type="text" name="buyerName" value={formData.buyerName} onChange={handleInputChange} className="w-full h-11 px-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">Phone</label>
                      <input required type="tel" pattern="[0-9]{10}" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full h-11 px-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
                      <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full h-11 px-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">Pincode</label>
                      <input required type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full h-11 px-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">City</label>
                        <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full h-11 px-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">State</label>
                        <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full h-11 px-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">Full Address</label>
                      <textarea required rows={2} name="address" value={formData.address} onChange={handleInputChange} className="w-full p-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)] resize-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">Landmark (Optional)</label>
                      <input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange} className="w-full h-11 px-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]" />
                    </div>
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex justify-end">
                    <button type="submit" className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] px-8 h-[52px] rounded-[var(--radius-md)] font-bold transition-all min-w-[160px]">
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Payment */}
              {currentStep === 2 && (
                <div className="animate-fade-up">
                  <h2 className="font-display font-bold text-[24px] text-[var(--color-text-primary)] mb-6 flex items-center justify-between">
                    Payment Method
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-[14px] text-[var(--color-primary)] font-sans font-medium hover:underline">Edit Address</button>
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* CARD 1 — UPI */}
                    <div onClick={() => setFormData({...formData, paymentMethod: 'UPI'})} className={`relative bg-white border-[1.5px] rounded-[var(--radius-md)] p-5 cursor-pointer transition-all duration-200 ${formData.paymentMethod === 'UPI' ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm'}`}>
                      {formData.paymentMethod === 'UPI' && <div className="absolute top-3 right-3 text-[var(--color-primary)]"><Check size={20} strokeWidth={3} /></div>}
                      <Smartphone className="text-[#5f259f] mb-3" size={28} />
                      <h3 className="font-sans text-[16px] font-medium text-[var(--color-text-primary)]">UPI / PhonePe</h3>
                      <p className="text-[13px] text-[var(--color-text-muted)] mt-1">Pay using PhonePe, GPay, Paytm or any UPI app</p>
                    </div>

                    {/* CARD 2 — COD */}
                    <div onClick={() => setFormData({...formData, paymentMethod: 'COD'})} className={`relative bg-white border-[1.5px] rounded-[var(--radius-md)] p-5 cursor-pointer transition-all duration-200 ${formData.paymentMethod === 'COD' ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm'}`}>
                      <div className="absolute top-3 right-3 bg-[var(--color-green)] text-white text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-pill)]">Most Popular</div>
                      <Banknote className="text-[#3A7D44] mb-3" size={28} />
                      <h3 className="font-sans text-[16px] font-medium text-[var(--color-text-primary)]">Cash on Delivery</h3>
                      <p className="text-[13px] text-[var(--color-text-muted)] mt-1">Pay when your order arrives at your door</p>
                    </div>
                  </div>

                  {/* Expanded Views */}
                  <div className="mt-6">
                    {formData.paymentMethod === 'UPI' && (
                      <div className="animate-[fadeUp_0.3s_ease-out]">
                        <div className="flex flex-col items-center">
                          {paymentConfig.PHONEPE_QR_URL ? (
                            <img src={paymentConfig.PHONEPE_QR_URL} width={240} height={240} className="rounded-xl border-2 border-[#E8DCC8]" alt="PhonePe QR" />
                          ) : (
                            <div className="w-[240px] h-[240px] border-2 border-dashed border-[#E8DCC8] rounded-xl flex flex-col items-center justify-center bg-[var(--color-surface)]">
                              <QrCode size={48} className="text-[var(--color-text-muted)] mb-2" />
                              <div className="text-[14px] text-[var(--color-text-muted)] font-medium">Scan to Pay</div>
                              <div className="text-[12px] text-[var(--color-text-muted)] mt-1 mb-3">QR code will appear here</div>
                              <div className="bg-[var(--color-amber-light)] text-[var(--color-primary-dark)] text-[10px] font-bold px-2 py-1 rounded-[var(--radius-pill)]">PhonePe QR — Coming Soon</div>
                            </div>
                          )}
                          <div className="w-full max-w-sm mt-4 text-center">
                            <div className="text-[14px] font-bold text-[#3A7D44]">Scan QR code with any UPI app</div>
                            <div className="text-[12px] text-[var(--color-text-muted)] mt-1">PhonePe • Google Pay • Paytm • BHIM</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.paymentMethod === 'COD' && (
                      <div className="bg-[#EAF4EC] border border-[#3A7D44] rounded-[var(--radius-md)] p-4 flex items-start gap-3 animate-[fadeUp_0.3s_ease-out]">
                        <Info className="text-[#3A7D44] mt-0.5" size={20} />
                        <div>
                          <div className="font-medium text-[#1C4024]">You will pay ₹{total} in cash upon delivery.</div>
                          <div className="text-[13px] text-[#3A7D44] mt-1">Please keep exact change ready.</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Security Trust Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 pt-6 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-1.5 text-[12px] font-sans text-[var(--color-text-secondary)]">
                      <Lock size={16} className="text-[var(--color-primary)]" /> 256-bit SSL Encryption
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] font-sans text-[var(--color-text-secondary)]">
                      <ShieldCheck size={16} className="text-[var(--color-primary)]" /> 100% Secure Payments
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] font-sans text-[var(--color-text-secondary)]">
                      <BadgeCheck size={16} className="text-[var(--color-primary)]" /> RBI Compliant
                    </div>
                  </div>

                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: ORDER TOTAL SUMMARY */}
        <div className="w-full lg:w-[380px]">
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-6 sticky top-24 shadow-sm">
            <h3 className="font-display font-bold text-[18px] text-[var(--color-text-primary)] mb-4 pb-3 border-b border-[var(--color-border)]">Order Summary</h3>
            
            <div className="space-y-3 mb-6 text-[14px]">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Items total ({cartItems.length})</span>
                <span className="font-medium text-[var(--color-text-primary)]">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Delivery Fee</span>
                <span className="font-medium text-[var(--color-green)]">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--color-text-primary)] text-[16px]">Total to Pay</span>
                <span className="font-bold text-[var(--color-primary)] text-[22px]">₹{total}</span>
              </div>
            </div>

            {currentStep === 2 && (
              <button 
                onClick={handleSubmit}
                disabled={isPlacingOrder}
                className="w-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] h-[52px] rounded-[12px] font-bold transition-all flex items-center justify-center gap-2 text-[16px]"
              >
                {isPlacingOrder ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Place Order →'
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
