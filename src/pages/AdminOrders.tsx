import React, { useState, useEffect } from 'react';
import { Search, Eye, X } from 'lucide-react';
import AdminLayout from './Admin';
import type { Order } from '../types';
import { useToast } from '../components/ToastProvider';
import { updateOrderStatus, getAllOrders } from '../services/api';

const AdminOrders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    getAllOrders().then(data => setOrders(data)).catch(console.error);
  }, []);

  const handleUpdateStatus = async (id: string, userId: string, st: string) => {
    try {
      const res: any = await updateOrderStatus(id, st);
      setOrders(orders.map(o => o.id === id ? {...o, status: st} : o));
      if (selectedOrder?.id === id) setSelectedOrder({...selectedOrder, status: st});
      showToast(`Order status updated to ${st}`, 'success');
      if (res?.previewUrl) {
        setEmailPreviewUrl(res.previewUrl);
      }
    } catch { showToast('Error updating status', 'error'); }
  };

  const statusColors = {
    'Pending': 'bg-[var(--color-amber-light)] text-[var(--color-primary-dark)]',
    'Processing': 'bg-blue-50 text-blue-700',
    'Shipped': 'bg-purple-50 text-purple-700',
    'Delivered': 'bg-[var(--color-green-light)] text-[var(--color-green)]',
    'Cancelled': 'bg-[var(--color-red-light)] text-[var(--color-red)]'
  };

  const filtered = orders.filter(o => filter === 'All' || o.status === filter);

  return (
    <AdminLayout>
      <div className="animate-fade-up">
        {emailPreviewUrl && (
          <div className="mb-6 p-4 bg-[#EEF4FF] border border-[#185FA5] rounded-[var(--radius-md)] flex justify-between items-center animate-[fadeUp_0.3s_ease-out]">
            <div className="flex items-center gap-3">
              <span className="text-[24px]">✉️</span>
              <div>
                <div className="font-bold text-[14px] text-[#185FA5]">Email Notification Sent!</div>
                <div className="text-[12px] text-gray-600">An automated test email was successfully generated for the customer.</div>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <a href={emailPreviewUrl} target="_blank" rel="noopener noreferrer" className="bg-[#185FA5] text-white px-4 py-2 rounded-[var(--radius-sm)] text-[13px] font-bold hover:bg-blue-700 transition-colors">View Live Email Preview</a>
              <button onClick={() => setEmailPreviewUrl(null)} className="text-gray-400 hover:text-black font-bold text-lg px-1.5">✕</button>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display font-bold text-[24px] text-[var(--color-text-primary)]">Orders</h1>
        </div>

        <div className="flex gap-6 border-b border-[var(--color-border)] mb-6">
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered'].map(t => (
            <button key={t} onClick={()=>setFilter(t)} className={`pb-3 font-medium text-[14px] relative ${filter===t?'text-[var(--color-primary)]':'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}>
              {t} {t !== 'All' && <span className="ml-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] px-1.5 rounded-[var(--radius-pill)] text-[10px]">{orders.filter(o=>o.status===t).length}</span>}
              {filter===t && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-primary)]"/>}
            </button>
          ))}
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider">
                <th className="px-5 py-4 font-bold">Order ID</th>
                <th className="px-5 py-4 font-bold">Customer</th>
                <th className="px-5 py-4 font-bold">Amount</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-[var(--color-surface)]">
                  <td className="px-5 py-4"><div className="font-mono text-[13px] font-bold text-[var(--color-primary-dark)] bg-[var(--color-amber-light)] px-2 py-1 rounded inline-block">{o.orderId || o.id.slice(0,8)}</div></td>
                  <td className="px-5 py-4 text-[14px] font-medium text-[var(--color-text-primary)]">{o.userName || o.buyerName}</td>
                  <td className="px-5 py-4 font-bold text-[14px] text-[var(--color-text-primary)]">₹{o.totalAmount || o.total}</td>
                  <td className="px-5 py-4">
                    <select value={o.status} onChange={e=>handleUpdateStatus(o.id, o.userId, e.target.value)} className={`text-[12px] font-bold px-3 py-1.5 rounded-[var(--radius-pill)] outline-none appearance-none cursor-pointer ${statusColors[o.status as keyof typeof statusColors]}`}>
                      {Object.keys(statusColors).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={()=>setSelectedOrder(o)} className="text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] p-2 rounded-full"><Eye size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
            <div className="bg-white w-full max-w-[500px] h-full shadow-2xl flex flex-col animate-[fadeUp_0.3s_ease-out]">
              <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
                <h2 className="font-display font-bold text-[20px] text-[var(--color-text-primary)]">Order #{selectedOrder.id.slice(0,8)}</h2>
                <button onClick={()=>setSelectedOrder(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h4 className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Customer</h4>
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-4 text-[14px]">
                    <div className="font-bold text-[var(--color-text-primary)]">{selectedOrder.userName || selectedOrder.buyerName}</div>
                    <div className="text-[var(--color-text-secondary)]">{selectedOrder.userPhone || selectedOrder.phone}</div>
                    <div className="text-[var(--color-text-secondary)] mt-2">{selectedOrder.deliveryAddress || selectedOrder.address}</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Payment Info</h4>
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-4 text-[14px]">
                    <div className="flex justify-between mb-1.5"><span className="text-[var(--color-text-secondary)]">Method:</span> <span className="font-bold">{selectedOrder.paymentMethod}</span></div>
                    <div className="flex justify-between mb-1.5"><span className="text-[var(--color-text-secondary)]">Payment:</span> <span className="font-bold text-[var(--color-green)]">{selectedOrder.paymentStatus || (selectedOrder.paymentMethod === 'COD' ? 'Pending' : 'Paid')}</span></div>
                    {selectedOrder.upiTransactionId && (
                      <div className="flex justify-between mt-3 pt-3 border-t border-[var(--color-border)] text-[13px]"><span className="text-[var(--color-text-muted)] font-medium">UPI Ref:</span> <span className="font-mono font-bold text-[var(--color-primary)]">{selectedOrder.upiTransactionId}</span></div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Status</h4>
                  <select value={selectedOrder.status} onChange={e=>handleUpdateStatus(selectedOrder.id, selectedOrder.userId, e.target.value)} className={`w-full h-12 px-4 text-[14px] font-bold rounded-[var(--radius-sm)] outline-none border border-[var(--color-border)] cursor-pointer ${statusColors[selectedOrder.status as keyof typeof statusColors]}`}>
                      {Object.keys(statusColors).map(k => <option key={k} value={k} className="bg-white text-black">{k}</option>)}
                  </select>
                </div>
                <div>
                  <h4 className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Items</h4>
                  <div className="border border-[var(--color-border)] rounded-[var(--radius-sm)] divide-y divide-[var(--color-border)]">
                    {selectedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="p-3 flex justify-between items-center text-[14px]">
                        <div><span className="font-medium text-[var(--color-text-primary)]">{item.product.name}</span> <span className="text-[var(--color-text-muted)]">× {item.quantity}</span></div>
                        <div className="font-bold text-[var(--color-text-primary)]">₹{item.product.price * item.quantity}</div>
                      </div>
                    ))}
                    <div className="p-3 bg-[var(--color-surface)] flex justify-between items-center font-bold">
                      <span>Total Paid</span>
                      <span className="text-[16px] text-[var(--color-primary)]">₹{selectedOrder.totalAmount || selectedOrder.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
