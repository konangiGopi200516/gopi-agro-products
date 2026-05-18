import React, { useEffect, useState, useContext } from 'react';
import { PackageX, Eye, RefreshCw, MapPin, CreditCard, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { getUserOrders } from '../services/api';
import { useCartContext } from '../context/CartContext';
import { useToast } from '../components/ToastProvider';

const MyOrders = () => {
  const { state } = useContext(AppContext);
  const { addToCart } = useCartContext();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (state.currentUser?.uid) {
        try {
          const userOrders = await getUserOrders(state.currentUser.uid);
          setOrders(userOrders);
        } catch (error) {
          console.error("Error fetching orders:", error);
        }
      }
      setLoading(false);
    };
    fetchOrders();
  }, [state.currentUser]);

  const handleReorder = (order: any) => {
    order.items.forEach((item: any) => {
      addToCart(item.product, item.quantity);
    });
    showToast('Items added to cart!', 'success');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-[var(--color-amber-light)] text-[var(--color-primary-dark)]';
      case 'Processing': return 'bg-[var(--color-amber-light)] text-[var(--color-primary-dark)]';
      case 'Shipped': return 'bg-blue-50 text-blue-700';
      case 'Delivered': return 'bg-[var(--color-green-light)] text-[var(--color-green)]';
      case 'Cancelled': return 'bg-[var(--color-red-light)] text-[var(--color-red)]';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="page-root bg-[var(--color-surface)] min-h-screen py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-[32px] text-[var(--color-text-primary)] mb-2">My Orders</h1>
          <p className="text-[15px] text-[var(--color-text-muted)] mb-8">Track all your farm-fresh deliveries</p>
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-[var(--radius-md)] skeleton-loader w-full"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="page-root bg-[var(--color-surface)] min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)] flex flex-col items-center max-w-md w-full text-center">
          <PackageX size={56} className="text-[var(--color-text-muted)] mb-4" />
          <h2 className="text-[20px] font-bold text-[var(--color-text-primary)] mb-2">No orders yet</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">Looks like you haven't placed any orders.</p>
          <Link to="/products" className="bg-[var(--color-primary)] text-white px-8 py-3.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-primary-dark)] font-bold transition-all w-full text-center">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-root bg-[var(--color-surface)] min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display font-bold text-[32px] text-[var(--color-text-primary)] mb-2">My Orders</h1>
        <p className="text-[15px] text-[var(--color-text-muted)] mb-8">Track all your farm-fresh deliveries</p>
        
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden shadow-sm">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-[13px] font-bold text-[var(--color-primary-dark)]">{order.orderId || `Order #${order.id.slice(0, 8)}`}</div>
                    <div className="text-[12px] text-[var(--color-text-muted)] mt-1">{new Date(order.createdAt).toLocaleString()}</div>
                  </div>
                  <div className={`text-[12px] font-bold px-3 py-1.5 rounded-[var(--radius-pill)] ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {order.items.slice(0, 3).map((item: any, i: number) => (
                    <img key={i} src={item.product.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover border border-[var(--color-border)]" />
                  ))}
                  {order.items.length > 3 && <div className="text-[12px] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-1 rounded-md">+{order.items.length - 3} more</div>}
                </div>
                <div className="text-[13px] text-[var(--color-text-muted)] mt-2 line-clamp-2">
                  {order.items.map((i: any) => i.product.name).join(', ')}
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--color-border)]">
                  <div>
                    <div className="font-bold text-[16px] text-[var(--color-primary)]">₹{order.totalAmount}</div>
                    <div className="text-[12px] text-[var(--color-text-muted)]">{order.items.reduce((acc: number, cur: any) => acc + cur.quantity, 0)} items</div>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'Delivered' && (
                      <button onClick={() => handleReorder(order)} className="bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-[var(--radius-sm)] flex items-center gap-1.5 text-[13px] font-bold hover:bg-[var(--color-primary-dark)]">
                        <RefreshCw size={14} /> Reorder
                      </button>
                    )}
                    <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="border border-[var(--color-primary)] text-[var(--color-primary)] px-3 py-1.5 rounded-[var(--radius-sm)] flex items-center gap-1.5 text-[13px] font-bold hover:bg-[var(--color-primary-light)]">
                      <Eye size={14} /> View Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Detail Accordion */}
              <div className={`bg-[var(--color-surface)] overflow-hidden transition-all duration-300 border-t border-[var(--color-border)] ${expandedOrder === order.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 border-t-0'}`}>
                <div className="p-5">
                  <div className="space-y-3 mb-5">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-[14px]">
                        <div className="flex items-center gap-3">
                          <img src={item.product.imageUrl} alt="" className="w-12 h-12 rounded-md object-cover border border-[var(--color-border)]" />
                          <div>
                            <div className="font-medium text-[var(--color-text-primary)]">{item.product.name}</div>
                            <div className="text-[12px] text-[var(--color-text-muted)]">{item.quantity} × ₹{item.product.price}</div>
                          </div>
                        </div>
                        <div className="font-bold text-[var(--color-text-primary)]">₹{item.product.price * item.quantity}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-[13px]">
                    <div className="bg-white p-4 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                      <div className="flex items-center gap-1.5 font-bold text-[var(--color-text-secondary)] mb-2"><MapPin size={14} /> Delivery Address</div>
                      <div className="text-[var(--color-text-primary)]">{order.deliveryAddress}</div>
                    </div>
                    <div className="bg-white p-4 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                      <div className="flex items-center gap-1.5 font-bold text-[var(--color-text-secondary)] mb-2"><CreditCard size={14} /> Payment Method</div>
                      <div className="text-[var(--color-text-primary)]">{order.paymentMethod}</div>
                      {order.upiTransactionId && (
                        <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex justify-between text-[12px]">
                          <span className="text-[var(--color-text-muted)] font-medium">UPI Ref:</span>
                          <span className="font-mono font-bold text-[var(--color-primary)]">{order.upiTransactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] mb-5">
                    <h4 className="font-bold text-[13px] text-[var(--color-text-secondary)] mb-4">Order Timeline</h4>
                    <div className="relative border-l-2 border-[var(--color-border)] ml-2 space-y-4">
                      <div className="relative pl-6">
                        <div className="absolute w-3 h-3 bg-[var(--color-green)] rounded-full -left-[7px] top-1"></div>
                        <div className="font-bold text-[13px] text-[var(--color-text-primary)]">Order Placed</div>
                        <div className="text-[11px] text-[var(--color-text-muted)]">{new Date(order.createdAt).toLocaleString()}</div>
                      </div>
                      {['Processing', 'Shipped', 'Delivered'].map((step, idx) => {
                        const statusLevel = ['Pending', 'Processing', 'Shipped', 'Delivered'].indexOf(order.status);
                        const stepLevel = idx + 1;
                        const isReached = statusLevel >= stepLevel;
                        let color = 'bg-[var(--color-border)]';
                        if (isReached) color = step === 'Delivered' ? 'bg-[var(--color-green)]' : 'bg-[var(--color-primary)]';
                        if (order.status === 'Cancelled' && step === 'Delivered') color = 'bg-[var(--color-red)]';

                        return (
                          <div key={step} className="relative pl-6">
                            <div className={`absolute w-3 h-3 ${color} rounded-full -left-[7px] top-1`}></div>
                            <div className={`font-bold text-[13px] ${isReached ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                              {order.status === 'Cancelled' && step === 'Delivered' ? 'Cancelled' : step}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-center">
                    <Link to="/contact" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                      <HelpCircle size={14} /> Need Help with this order?
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
