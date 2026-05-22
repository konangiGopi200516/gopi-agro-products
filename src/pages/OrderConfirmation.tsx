import { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy, MapPin, Package, ShoppingBag, Mail } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { state } = useContext(AppContext);
  const [copied, setCopied] = useState(false);

  const order = state.orders.find(o => o.id === orderId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!order) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-root bg-[var(--color-surface)] min-h-screen py-16 relative overflow-hidden">
      {/* CSS Confetti elements generated dynamically */}
      {Array.from({ length: 20 }).map((_, i) => {
        const colors = ['#D47C0F', '#3A7D44', '#E8DCC8', '#C0392B'];
        const isCircle = Math.random() > 0.5;
        return (
          <div key={i} className="confetti absolute w-[6px] h-[6px] opacity-0 top-[-20px]" 
               style={{ 
                 left: `${Math.random() * 100}vw`, 
                 backgroundColor: colors[i % colors.length],
                 animation: `confettiFall ${2.5 + Math.random() * 1.5}s ease-in forwards`,
                 animationDelay: `${Math.random() * 1.5}s`,
                 borderRadius: isCircle ? '50%' : '0'
               }} 
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <div className="w-full max-w-[580px] mx-auto px-4 animate-[fadeUp_0.4s_ease-out]">
        
        {/* TOP SECTION */}
        <div className="flex flex-col items-center">
          <div className="w-[80px] h-[80px] bg-[#EAF4EC] rounded-full flex items-center justify-center animate-[popIn_600ms_cubic-bezier(0.175,0.885,0.32,1.275)_100ms_both]">
            <CheckCircle2 size={48} className="text-[#3A7D44]" />
          </div>
          <style>{`@keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

          <h1 className="font-display font-bold text-[34px] text-[var(--color-text-primary)] mt-6 text-center">Order Placed Successfully! 🌾</h1>
          <p className="font-sans text-[16px] text-[var(--color-text-muted)] mt-2 text-center">
            Thank you, {order.buyerName?.split(' ')[0] || order.userName?.split(' ')[0]}! Your fresh produce is on its way.
          </p>

          <div className="bg-[var(--color-amber-light)] border border-[var(--color-primary)]/30 rounded-[var(--radius-md)] p-4 mt-5 flex items-start gap-3 w-full">
            <Mail size={20} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div className="text-left">
              <div className="text-[14px] font-medium text-[var(--color-text-primary)]">A confirmation email has been sent to {order.userEmail}</div>
              <div className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Check your inbox (and spam folder) for order details.</div>
            </div>
          </div>
        </div>

        {/* ORDER DETAILS CARD */}
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 sm:p-6 mt-5 shadow-sm text-left">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-[var(--color-border)]">
            <h3 className="font-display font-bold text-[18px] text-[var(--color-text-primary)]">Order Summary</h3>
            <div className="inline-flex items-center gap-2 bg-[var(--color-amber-light)] px-3 py-1.5 rounded-[var(--radius-pill)] cursor-pointer hover:bg-[#FBE4C6] transition-colors group" onClick={copyToClipboard} title="Click to copy">
              <span className="font-mono font-bold text-[var(--color-primary-dark)] text-[13px]">#{order.id.slice(0, 8).toUpperCase()}</span>
              {copied ? <span className="text-[var(--color-primary)] text-[10px] font-bold">COPIED</span> : <Copy size={12} className="text-[var(--color-primary)] group-hover:scale-110 transition-transform" />}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <div className="text-[12px] text-[var(--color-text-muted)] mb-1">📅 Order Date</div>
              <div className="text-[14px] font-medium text-[var(--color-text-primary)]">{new Date(order.createdAt).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</div>
            </div>
            <div>
              <div className="text-[12px] text-[var(--color-text-muted)] mb-1">💳 Payment</div>
              <div className="text-[14px] font-medium text-[var(--color-text-primary)]">{order.paymentMethod}</div>
              {order.upiTransactionId && (
                <div className="text-[11px] font-mono text-[var(--color-primary)] font-bold mt-0.5">Ref: {order.upiTransactionId}</div>
              )}
            </div>
            <div>
              <div className="text-[12px] text-[var(--color-text-muted)] mb-1">📦 Items</div>
              <div className="text-[14px] font-medium text-[var(--color-text-primary)]">{order.items.reduce((acc:any, cur:any) => acc + cur.quantity, 0)} items</div>
            </div>
            <div>
              <div className="text-[12px] text-[var(--color-text-muted)] mb-1">🚚 Estimated Delivery</div>
              <div className="text-[14px] font-medium text-[var(--color-text-primary)]">Tomorrow, 8AM–12PM</div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 mb-4">
            <div className="space-y-3">
              {order.items.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[14px]">
                  <div className="flex items-center gap-3">
                    {item.product.imageUrl && <img src={item.product.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover border border-[var(--color-border)]" />}
                    <div>
                      <div className="font-medium text-[var(--color-text-primary)]">{item.product.name}</div>
                      <div className="text-[12px] text-[var(--color-text-muted)]">Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="font-medium text-[var(--color-text-primary)]">₹{item.product.price * item.quantity}</div>
                </div>
              ))}
              {order.items.length > 3 && <div className="text-[13px] text-[var(--color-text-muted)] pt-1 text-center font-medium">+ {order.items.length - 3} more items</div>}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 mb-4">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
              <div className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">{(() => { const addr = (order.deliveryAddress || order.address) as any; if (typeof addr === 'object' && addr) return `${addr.line1}, ${addr.city}, ${addr.state} - ${addr.pincode}`; return addr || 'N/A'; })()}</div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 flex justify-between items-center">
            <span className="font-bold text-[var(--color-text-primary)]">Total Paid</span>
            <span className="font-bold text-[18px] text-[var(--color-primary)]">₹{order.totalAmount || order.total}</span>
          </div>
        </div>

        {/* ORDER TIMELINE */}
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 sm:p-6 mt-5 shadow-sm text-left">
          <h3 className="font-display font-bold text-[18px] text-[var(--color-text-primary)] mb-5">Order Timeline</h3>
          <div className="relative border-l-2 border-dashed border-[var(--color-border)] ml-2.5 space-y-5">
            <div className="relative pl-6">
              <div className="absolute w-3.5 h-3.5 bg-[var(--color-green)] rounded-full -left-[8px] top-1"></div>
              <div className="font-bold text-[14px] text-[var(--color-green)]">Order Placed</div>
              <div className="text-[12px] text-[var(--color-text-muted)]">{new Date(order.createdAt).toLocaleString()}</div>
            </div>
            <div className="relative pl-6">
              <div className="absolute w-3.5 h-3.5 bg-[var(--color-amber-light)] border-2 border-[var(--color-primary)] rounded-full -left-[8px] top-1"></div>
              <div className="font-bold text-[14px] text-[var(--color-text-muted)]">Processing</div>
              <div className="text-[12px] text-[var(--color-text-muted)]">Upcoming</div>
            </div>
            <div className="relative pl-6">
              <div className="absolute w-3.5 h-3.5 bg-[var(--color-border)] rounded-full -left-[8px] top-1"></div>
              <div className="font-bold text-[14px] text-[var(--color-text-muted)]">Shipped</div>
              <div className="text-[12px] text-[var(--color-text-muted)]">Upcoming</div>
            </div>
            <div className="relative pl-6">
              <div className="absolute w-3.5 h-3.5 bg-[var(--color-border)] rounded-full -left-[8px] top-1"></div>
              <div className="font-bold text-[14px] text-[var(--color-text-muted)]">Delivered</div>
              <div className="text-[12px] text-[var(--color-text-muted)]">Upcoming</div>
            </div>
          </div>
        </div>

        {/* BOTTOM BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
          <Link to="/my-orders" className="bg-[var(--color-primary)] text-white px-6 py-3.5 rounded-[var(--radius-sm)] font-bold shadow-sm hover:bg-[var(--color-primary-dark)] flex justify-center items-center gap-2">
            <Package size={18} /> View My Orders
          </Link>
          <Link to="/products" className="bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary)] px-6 py-3.5 rounded-[var(--radius-sm)] font-bold hover:bg-[var(--color-primary-light)] flex justify-center items-center gap-2">
            <ShoppingBag size={18} /> Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
};

export default OrderConfirmation;
