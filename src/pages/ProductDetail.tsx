import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, MapPin, ChevronRight, Star, ShieldCheck, Truck, RefreshCw, Heart } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useToast } from '../components/ToastProvider';
import { useCartContext } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useContext(AppContext);
  const { addToCart, cartItems } = useCartContext();
  const { showToast } = useToast();
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('Details');

  const product = state.products.find(p => p.id === id);
  const relatedProducts = state.products.filter(p => {
    const pCat = typeof p.category === 'string' ? p.category : p.category?.name;
    const currCat = typeof product?.category === 'string' ? product?.category : product?.category?.name;
    return pCat === currCat && p.id !== product?.id;
  }).slice(0, 4);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/products')} className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg">Back to Products</button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    showToast(`Added ${quantity} ${product.unit} of ${product.name} to cart`, 'success');
  };

  const originalPrice = Math.round(product.price * 1.2);
  const saveAmount = originalPrice - product.price;
  const savePercent = Math.round((saveAmount / originalPrice) * 100);

  return (
    <div className="page-root bg-[var(--color-surface)] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)] mb-8">
          <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
          <ChevronRight size={14} />
          <Link to={`/products?category=${typeof product.category === 'string' ? product.category : product.category?.name}`} className="hover:text-[var(--color-primary)]">{typeof product.category === 'string' ? product.category : product.category?.name}</Link>
          <ChevronRight size={14} />
          <span className="text-[var(--color-text-primary)] font-medium line-clamp-1">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 mb-16">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-[var(--color-border)]">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 bg-[var(--color-green-light)] text-[var(--color-green)] px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-bold flex items-center gap-1.5 shadow-sm border border-[var(--color-green)]/20">
                <ShieldCheck size={14} /> Fresh Guarantee
              </div>
            </div>
            {/* Thumbnail Strip (Mock) */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className={`aspect-square rounded-lg border-2 overflow-hidden cursor-pointer ${i === 0 ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)] opacity-60 hover:opacity-100'}`}>
                  <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col">
            <h1 className="font-display font-bold text-[34px] text-[var(--color-text-primary)] mb-2 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="flex text-[var(--color-primary)]">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill="currentColor" />)}
              </div>
              <span className="text-[13px] text-[var(--color-text-muted)]">(42 reviews)</span>
            </div>

            <div className="flex items-end gap-3 mb-8">
              <span className="text-[28px] font-bold text-[var(--color-primary)]">₹{product.price}</span>
              <span className="text-[16px] text-[var(--color-text-muted)] line-through mb-1">₹{originalPrice}</span>
              <span className="bg-[var(--color-green-light)] text-[var(--color-green)] px-2 py-0.5 rounded text-[12px] font-bold mb-1.5">
                Save ₹{saveAmount} ({savePercent}%)
              </span>
            </div>

            <hr className="border-[var(--color-border)] mb-8" />

            <div className="flex items-center gap-4 bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] flex items-center justify-center font-bold text-[14px]">
                {product.farmerName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--color-text-primary)]">{product.farmerName}</span>
                  <span className="bg-[var(--color-green-light)] text-[var(--color-green)] text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold uppercase"><ShieldCheck size={10}/> Verified ✓</span>
                </div>
                <div className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5"><MapPin size={12}/> Local Farm, India</div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--color-text-primary)]">Quantity</span>
                <span className={`text-[13px] font-medium ${product.stock > 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} ${product.unit}s available)` : 'Out of Stock'}
                </span>
              </div>
              
              <div className="flex items-center border border-[var(--color-primary)] rounded-[var(--radius-sm)] w-[140px] h-[48px] overflow-hidden bg-white">
                <button onClick={() => quantity > 1 && setQuantity(q => q - 1)} className="w-12 h-full flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-amber-light)] transition-colors disabled:opacity-50" disabled={product.stock === 0}><Minus size={18} /></button>
                <div className="flex-1 h-full flex items-center justify-center font-bold text-[16px] text-[var(--color-text-primary)]">{quantity}</div>
                <button onClick={() => quantity < product.stock && setQuantity(q => q + 1)} className="w-12 h-full flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-amber-light)] transition-colors disabled:opacity-50" disabled={product.stock === 0}><Plus size={18} /></button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button 
                onClick={handleAddToCart} 
                disabled={product.stock === 0}
                className="flex-1 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] h-[52px] rounded-[var(--radius-sm)] flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button 
                onClick={() => { handleAddToCart(); navigate('/checkout'); }}
                disabled={product.stock === 0}
                className="flex-1 border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] h-[52px] rounded-[var(--radius-sm)] flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-amber-light)] px-3 py-1.5 rounded-[var(--radius-pill)]"><Truck size={14} className="text-[var(--color-primary)]"/> Ships in 24hrs</div>
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-amber-light)] px-3 py-1.5 rounded-[var(--radius-pill)]"><ShieldCheck size={14} className="text-[var(--color-primary)]"/> Farm Fresh</div>
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-amber-light)] px-3 py-1.5 rounded-[var(--radius-pill)]"><RefreshCw size={14} className="text-[var(--color-primary)]"/> 7-day Return</div>
            </div>

            {/* Tabs */}
            <div className="mt-12">
              <div className="flex gap-8 border-b border-[var(--color-border)] mb-6">
                {['Details', 'Nutrition', 'Farm Story'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 font-medium transition-colors relative ${activeTab === tab ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-primary)]"></div>}
                  </button>
                ))}
              </div>
              <div className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                {activeTab === 'Details' && <p>{product.description} Organically grown and hand-picked at peak ripeness for maximum flavor.</p>}
                {activeTab === 'Nutrition' && <p>Rich in essential vitamins and minerals. No artificial preservatives or chemical pesticides used.</p>}
                {activeTab === 'Farm Story' && <p>Grown with love by {product.farmerName}. Our partner farms practice sustainable agriculture to protect soil health and water resources.</p>}
              </div>
            </div>
            
          </div>
        </div>

        {/* BELOW FOLD */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display font-bold text-[28px] text-[var(--color-text-primary)] mb-8">You may also like</h2>
            <div className="flex overflow-x-auto gap-6 pb-8 hide-scrollbar">
              {relatedProducts.map(rp => (
                <div key={rp.id} className="min-w-[260px] max-w-[260px]">
                  <ProductCard product={rp} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
