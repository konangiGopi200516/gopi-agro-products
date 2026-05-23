import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Truck, Users, Shield, Apple, Carrot, Milk, Wheat, Leaf } from 'lucide-react';
import { useProductContext } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';

const Home = () => {
  const { products } = useProductContext();
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="page-root flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex items-center bg-[var(--color-surface)]">
        {/* Background Image with warm overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(28,20,8,0.85)] to-[rgba(28,20,8,0.45)]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl space-y-6">
            <h1 
              className="font-display font-bold text-[38px] md:text-[64px] text-white leading-[1.1] animate-fade-up"
              style={{ animationDelay: '0ms' }}
            >
              Farm Fresh,<br/>Delivered to Your Door
            </h1>
            <p 
              className="font-sans text-[19px] text-[rgba(255,255,255,0.82)] leading-relaxed animate-fade-up"
              style={{ animationDelay: '150ms' }}
            >
              Direct from 500+ verified farmers across India. Experience the true taste of organic, locally-sourced agriculture.
            </p>
            <div 
              className="pt-4 flex flex-col sm:flex-row gap-4 animate-fade-up"
              style={{ animationDelay: '300ms' }}
            >
              <Link 
                to="/products" 
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium py-3.5 px-8 rounded-[var(--radius-sm)] transition-all flex items-center justify-center"
              >
                Shop Now
              </Link>
              <Link 
                to="/farmers" 
                className="bg-transparent border border-white text-white hover:bg-white/10 font-medium py-3.5 px-8 rounded-[var(--radius-sm)] transition-all flex items-center justify-center"
              >
                Meet Our Farmers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Strip */}
      <section className="bg-white border-y border-[var(--color-border)] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Fruits', icon: <Apple size={18} /> },
              { name: 'Vegetables', icon: <Carrot size={18} /> },
              { name: 'Dairy', icon: <Milk size={18} /> },
              { name: 'Grains', icon: <Wheat size={18} /> },
              { name: 'Spices & Herbs', icon: <Leaf size={18} /> }
            ].map((cat) => (
              <Link
                key={cat.name}
                to={`/products?category=${cat.name}`}
                className="flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-pill)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
              >
                {cat.icon}
                <span className="font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 py-8 border-y border-[var(--color-border)] opacity-80">
            {[
              { label: '100% Fresh', icon: <CheckCircle className="text-[var(--color-primary)]" /> },
              { label: 'Same-day Delivery', icon: <Truck className="text-[var(--color-primary)]" /> },
              { label: 'Direct Farmers', icon: <Users className="text-[var(--color-primary)]" /> },
              { label: 'Quality Guaranteed', icon: <Shield className="text-[var(--color-primary)]" /> }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {item.icon}
                <span className="text-[var(--color-text-secondary)] font-medium text-[15px]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <h2 className="font-display font-bold text-[32px] text-[var(--color-text-primary)]">Fresh Today</h2>
            <Link to="/products" className="text-[var(--color-primary)] font-medium hover:text-[var(--color-primary-dark)] flex items-center gap-1 transition-colors">
              See all <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
