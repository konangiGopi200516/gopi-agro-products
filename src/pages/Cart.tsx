import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Trash2, Minus, Plus, Tag } from 'lucide-react';
import { useCartContext } from '../context/CartContext';

const Cart = () => {
  const { cartItems, itemCount, subtotal, deliveryCharge, total, updateQuantity, removeFromCart } = useCartContext();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="page-root bg-[var(--color-surface)] min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)] flex flex-col items-center max-w-md w-full text-center">
          <div className="w-24 h-24 bg-[var(--color-amber-light)] rounded-full flex items-center justify-center mb-6 text-[var(--color-primary)]">
            <ShoppingCart size={48} />
          </div>
          <h2 className="text-[26px] font-display font-bold text-[var(--color-text-primary)] mb-3">Your cart is empty</h2>
          <p className="text-[var(--color-text-secondary)] mb-8">Looks like you haven't added any fresh produce to your cart yet.</p>
          <Link 
            to="/products"
            className="bg-[var(--color-primary)] text-white px-8 py-4 rounded-[var(--radius-md)] hover:bg-[var(--color-primary-dark)] transition-colors font-medium w-full flex items-center justify-center gap-2"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-root bg-[var(--color-surface)] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cart Items List */}
          <div className="flex-1">
            <h1 className="text-[26px] font-display font-bold text-[var(--color-text-primary)] mb-6">Your Cart ({itemCount} items)</h1>
            
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.product.id} className="bg-white rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">
                  
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-20 h-20 rounded-lg object-cover bg-[var(--color-surface)] border border-[var(--color-border)]" />
                  
                  <div className="flex-1">
                    <Link to={`/product/${item.product.id}`} className="text-[16px] font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors">
                      {item.product.name}
                    </Link>
                    <div className="text-[13px] text-[var(--color-text-muted)] mt-1">₹{item.product.price} / {item.product.unit} · {item.product.farmerName}</div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center border border-[var(--color-primary)] rounded-[var(--radius-sm)] h-9 bg-white">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-9 h-full flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-amber-light)] disabled:opacity-50"><Minus size={14} /></button>
                      <div className="w-8 h-full flex items-center justify-center font-bold text-[14px] text-[var(--color-text-primary)]">{item.quantity}</div>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock} className="w-9 h-full flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-amber-light)] disabled:opacity-50"><Plus size={14} /></button>
                    </div>
                    
                    <div className="text-[18px] font-bold text-[var(--color-primary)] min-w-[80px] text-right">
                      ₹{item.product.price * item.quantity}
                    </div>
                  </div>

                  <button onClick={() => removeFromCart(item.product.id)} className="absolute top-4 right-4 sm:static sm:ml-4 w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-red)] hover:bg-[var(--color-red-light)] rounded-full transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-[380px] flex-shrink-0">
            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-border)] p-6 sticky top-24">
              <h3 className="font-display font-bold text-xl text-[var(--color-text-primary)] mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6 text-[15px]">
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Subtotal</span>
                  <span className="text-[var(--color-text-primary)]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Delivery <span className="text-[12px]">(Free above ₹499)</span></span>
                  <span className={deliveryCharge === 0 ? "text-[var(--color-green)] font-medium" : "text-[var(--color-text-primary)]"}>
                    {deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge}`}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Discount</span>
                  <span className="text-[var(--color-text-primary)]">₹0</span>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input type="text" placeholder="Promo code" className="w-full pl-9 pr-3 h-[42px] rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[14px] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]" />
                </div>
                <button className="h-[42px] px-4 rounded-[var(--radius-sm)] border border-[var(--color-primary)] text-[var(--color-primary)] text-[14px] font-medium hover:bg-[var(--color-primary-light)]">Apply</button>
              </div>
              
              <div className="border-t border-[var(--color-border)] pt-4 mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[18px] text-[var(--color-text-primary)]">Total</span>
                  <span className="font-bold text-[22px] text-[var(--color-primary)]">₹{total.toFixed(0)}</span>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] h-[52px] rounded-[var(--radius-md)] font-bold transition-all flex justify-center items-center gap-2 mb-4"
              >
                Proceed to Checkout
              </button>
              
              <div className="text-center text-[12px] text-[var(--color-text-muted)]">
                🔒 Secure Checkout  ·  ✓ Easy Returns
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
