import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, X, ShoppingBasket } from 'lucide-react';
import { useProductContext } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';

const Products = () => {
  const { products } = useProductContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('featured');

  // Synchronize state when the search URL parameter changes
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const categoryFilter = searchParams.get('category');
  
  const categories = ['Fruits', 'Vegetables', 'Dairy', 'Grains', 'Spices & Herbs'];

  const handleCategoryChange = (category: string) => {
    if (categoryFilter === category) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    if (categoryFilter) {
      result = result.filter(p => {
        const catName = typeof p.category === 'string' ? p.category : p.category?.name;
        if (categoryFilter === 'Spices & Herbs' && (catName === 'Spices' || catName === 'Spices & Herbs')) {
          return true;
        }
        return catName === categoryFilter;
      });
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        p => p.name?.toLowerCase().includes(lowerSearch) || 
             p.farmerName?.toLowerCase().includes(lowerSearch)
      );
    }

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [products, categoryFilter, searchTerm, sortBy]);

  return (
    <div className="page-root bg-[var(--color-surface)] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar / Filters (Desktop) */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0">
            <div className="bg-white p-5 rounded-[var(--radius-md)] border border-[var(--color-border)] sticky top-24 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-xl text-[var(--color-text-primary)]">Filters</h3>
                {(categoryFilter || searchTerm) && (
                  <button 
                    onClick={() => { setSearchParams(new URLSearchParams()); setSearchTerm(''); }}
                    className="text-[var(--color-primary)] text-sm font-medium hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-[var(--color-text-secondary)] mb-3 text-sm">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-4 py-1.5 rounded-[var(--radius-pill)] border text-sm transition-all ${
                        categoryFilter === cat 
                          ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' 
                          : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Optional: Add price range/rating filters here later */}
              
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <span className="text-[var(--color-text-secondary)]">
                Showing <strong className="text-[var(--color-text-primary)]">{filteredAndSortedProducts.length}</strong> products
              </span>
              
              <div className="flex w-full sm:w-auto items-center gap-3">
                <button 
                  className="lg:hidden flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[var(--color-border)] rounded-[var(--radius-sm)] flex-1 text-[var(--color-text-secondary)]"
                  onClick={() => setIsMobileFiltersOpen(true)}
                >
                  <Filter size={18} /> Filters
                </button>
                
                <div className="relative w-full sm:w-auto flex-1 sm:min-w-[200px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-[var(--radius-sm)] px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="featured">Most Popular</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price Low-High</option>
                    <option value="price-high">Price High-Low</option>
                  </select>
                  <SlidersHorizontal size={16} className="absolute right-3 top-3 text-[var(--color-text-muted)] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Mobile Filter Bottom Sheet Overlay (Simplified) */}
            {isMobileFiltersOpen && (
              <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden">
                <div className="bg-white w-full rounded-t-2xl p-6 animate-fade-up">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display font-bold text-xl">Filters</h3>
                    <button onClick={() => setIsMobileFiltersOpen(false)}><X size={24} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-4 py-1.5 rounded-[var(--radius-pill)] border text-sm transition-all ${
                          categoryFilter === cat ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-[var(--color-primary)] text-white py-3 rounded-[var(--radius-sm)] font-medium">Apply</button>
                </div>
              </div>
            )}

            {/* Product Grid */}
            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-border)] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <ShoppingBasket size={64} className="text-[var(--color-border)] mb-4" />
                <h3 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-2">No products found</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">Try adjusting your filters or search term.</p>
                <button 
                  onClick={() => { setSearchParams(new URLSearchParams()); setSearchTerm(''); }}
                  className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-[var(--radius-sm)] font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
