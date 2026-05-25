import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import AdminLayout from './Admin';
import { useProductContext } from '../context/ProductContext';
import { useToast } from '../components/ToastProvider';
import type { Product } from '../types';

const AdminProducts = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProductContext();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const defaultForm = { name: '', category: 'Vegetables' as any, price: 0, unit: 'kg' as any, stock: 0, farmerName: '', description: '', imageUrl: '' };
  const [formData, setFormData] = useState(defaultForm);

  const openDrawer = (p?: Product) => {
    if (p) { 
      setEditingProduct(p); 
      setFormData({...p, category: typeof p.category === 'string' ? p.category : p.category?.name as any}); 
    }
    else { setEditingProduct(null); setFormData(defaultForm); }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) await updateProduct({ ...editingProduct, ...formData });
      else await addProduct({ id: Date.now().toString(), ...formData, createdAt: new Date().toISOString() });
      showToast('Product saved', 'success');
      closeDrawer();
    } catch { showToast('Error saving product', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this product? This cannot be undone.')) {
      try { await deleteProduct(id); showToast('Product deleted', 'info'); }
      catch { showToast('Error deleting', 'error'); }
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout>
      <div className="animate-fade-up">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="font-display font-bold text-[24px] text-[var(--color-text-primary)]">Products ({products.length})</h1>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 h-10 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[14px] outline-none focus:border-[var(--color-primary)]" />
            </div>
            <button onClick={()=>openDrawer()} className="bg-[var(--color-primary)] text-white h-10 px-4 rounded-[var(--radius-sm)] font-medium flex items-center gap-2 hover:bg-[var(--color-primary-dark)] shrink-0">
              <Plus size={18} /> <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="px-5 py-4 font-bold">Image</th>
                  <th className="px-5 py-4 font-bold">Name</th>
                  <th className="px-5 py-4 font-bold">Category</th>
                  <th className="px-5 py-4 font-bold">Price</th>
                  <th className="px-5 py-4 font-bold">Stock</th>
                  <th className="px-5 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((p, i) => (
                  <tr key={p.id} className={`${i%2!==0?'bg-[var(--color-surface)]':''} hover:bg-[var(--color-amber-light)] transition-colors`}>
                    <td className="px-5 py-3"><img src={p.imageUrl} alt="" className="w-12 h-12 rounded-[var(--radius-sm)] object-cover border border-[var(--color-border)] bg-white" /></td>
                    <td className="px-5 py-3 font-medium text-[var(--color-text-primary)] text-[14px]">{p.name}</td>
                    <td className="px-5 py-3"><span className="bg-[var(--color-border)]/50 text-[var(--color-text-secondary)] px-2.5 py-1 rounded-[var(--radius-pill)] text-[11px] font-bold">{typeof p.category === 'string' ? p.category : p.category?.name}</span></td>
                    <td className="px-5 py-3 font-bold text-[var(--color-primary)] text-[14px]">₹{p.price} / {p.unit || 'kg'}</td>
                    <td className="px-5 py-3 font-medium text-[14px]">{p.stock}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={()=>openDrawer(p)} className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] rounded-full mr-1"><Edit2 size={16}/></button>
                      <button onClick={()=>handleDelete(p.id)} className="p-2 text-[var(--color-red)] hover:bg-[var(--color-red-light)] rounded-full"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide-over Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
            <div className="bg-white w-full max-w-[420px] h-full shadow-2xl flex flex-col animate-[fadeUp_0.3s_ease-out]">
              <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
                <h2 className="font-display font-bold text-[20px] text-[var(--color-text-primary)]">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button onClick={closeDrawer} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"><X size={24}/></button>
              </div>
              <form id="product-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div><label className="block text-[13px] font-bold text-[var(--color-text-secondary)] mb-1">Name</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full h-11 px-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-primary)]"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[13px] font-bold text-[var(--color-text-secondary)] mb-1">Price (₹)</label><input required type="number" value={formData.price} onChange={e=>setFormData({...formData, price: +e.target.value})} className="w-full h-11 px-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-primary)]"/></div>
                  <div><label className="block text-[13px] font-bold text-[var(--color-text-secondary)] mb-1">Stock</label><input required type="number" value={formData.stock} onChange={e=>setFormData({...formData, stock: +e.target.value})} className="w-full h-11 px-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-primary)]"/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[13px] font-bold text-[var(--color-text-secondary)] mb-1">Category</label><select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value as any})} className="w-full h-11 px-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-primary)]"><option>Vegetables</option><option>Fruits</option><option>Dairy</option><option>Grains</option><option>Spices & Herbs</option></select></div>
                  <div><label className="block text-[13px] font-bold text-[var(--color-text-secondary)] mb-1">Unit</label><select value={formData.unit} onChange={e=>setFormData({...formData, unit: e.target.value as any})} className="w-full h-11 px-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-primary)]"><option>kg</option><option>piece</option><option>dozen</option><option>litre</option></select></div>
                </div>
                <div><label className="block text-[13px] font-bold text-[var(--color-text-secondary)] mb-1">Farmer Name</label><input required type="text" value={formData.farmerName} onChange={e=>setFormData({...formData, farmerName: e.target.value})} className="w-full h-11 px-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-primary)]"/></div>
                <div><label className="block text-[13px] font-bold text-[var(--color-text-secondary)] mb-1">Image URL</label><input required type="url" value={formData.imageUrl} onChange={e=>setFormData({...formData, imageUrl: e.target.value})} className="w-full h-11 px-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-primary)]"/></div>
                <div><label className="block text-[13px] font-bold text-[var(--color-text-secondary)] mb-1">Description</label><textarea required rows={3} value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-primary)] resize-none"/></div>
              </form>
              <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex gap-3">
                <button onClick={closeDrawer} type="button" className="flex-1 bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] h-11 rounded-[var(--radius-sm)] font-bold">Cancel</button>
                <button type="submit" form="product-form" className="flex-1 bg-[var(--color-primary)] text-white h-11 rounded-[var(--radius-sm)] font-bold">Save</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
