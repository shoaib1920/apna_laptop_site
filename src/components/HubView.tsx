import React, { useState, useMemo } from 'react';
import {
  Store,
  Filter,
  Search,
  Star,
  MessageCircle,
  Heart,
  ArrowUpDown,
  Laptop,
  Check,
  X,
  BadgeCheck,
  ChevronRight,
} from 'lucide-react';
import { HubListing } from '../types';
import { formatPKR, getHubWhatsAppLink } from '../utils/helpers';

interface HubViewProps {
  hubListings: HubListing[];
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  navigateTo: (route: string, params?: any) => void;
  romanUrduMode: boolean;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
}

const conditionBadgeClasses = (condition: string) => {
  if (condition === 'Brand New') return 'bg-graphite text-on-graphite';
  if (condition === 'Like New (Open Box)') return 'bg-surface-container text-on-surface-variant';
  return 'bg-copper-tint text-copper-dark';
};

export const HubView: React.FC<HubViewProps> = ({
  hubListings = [],
  wishlist = [],
  toggleWishlist,
  navigateTo,
  romanUrduMode,
  globalSearchQuery,
  setGlobalSearchQuery,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedUseCase, setSelectedUseCase] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedRam, setSelectedRam] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(300000);
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'rating'>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  const brands = useMemo(() => {
    const list = Array.from(new Set((hubListings || []).map((h) => h.brand)));
    return ['all', ...list];
  }, [hubListings]);

  const useCases = ['all', 'Programming & Dev', 'Student', 'Gaming', 'Video Editing', 'Office & Business', 'Business & Frequent Travel'];

  const filteredListings = useMemo(() => {
    return hubListings
      .filter((item) => {
        if (globalSearchQuery.trim()) {
          const q = globalSearchQuery.toLowerCase();
          const matches = [item.title, item.brand, item.specs.cpu, item.specs.ram, ...item.use_case_tags]
            .some((f) => f.toLowerCase().includes(q));
          if (!matches) return false;
        }
        if (selectedBrand !== 'all' && item.brand !== selectedBrand) return false;
        if (selectedUseCase !== 'all' && !item.use_case_tags.includes(selectedUseCase)) return false;
        if (selectedCondition !== 'all' && item.condition !== selectedCondition) return false;
        if (selectedRam !== 'all' && !item.specs.ram.toLowerCase().includes(selectedRam.toLowerCase())) return false;
        if (item.sale_price > maxPrice) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.sale_price - b.sale_price;
        if (sortBy === 'price_high') return b.sale_price - a.sale_price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [hubListings, globalSearchQuery, selectedBrand, selectedUseCase, selectedCondition, selectedRam, maxPrice, sortBy]);

  const clearAllFilters = () => {
    setSelectedBrand('all');
    setSelectedUseCase('all');
    setSelectedCondition('all');
    setSelectedRam('all');
    setMaxPrice(300000);
    setGlobalSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-extrabold font-display text-on-surface flex items-center gap-2">
            <Store className="w-5 h-5 text-steel-dark" />
            <span>Laptop Hub</span>
            <span className="flex items-center gap-1 bg-copper-tint text-copper-dark text-[10px] px-2 py-0.5 rounded font-bold">
              <BadgeCheck className="w-3 h-3" /> Verified Stock
            </span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Fixed prices, in-stock guarantee, 7-day checking warranty — sourced from a trusted supplier in Nankana Sahib.
          </p>
        </div>
        <button
          onClick={() => navigateTo('finder')}
          className="text-xs font-bold text-steel-dark border border-steel/30 bg-steel-tint px-3.5 py-2 rounded whitespace-nowrap self-start sm:self-auto"
        >
          Not sure what to pick? Take the Finder Quiz →
        </button>
      </div>

      {/* Main Layout: Filters Sidebar + Spec-sheet listing */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block bg-surface-container-lowest rounded p-5 border border-outline-variant shadow-sm space-y-6 sticky top-24">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3">
            <h3 className="font-bold text-on-surface text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-steel-dark" />
              <span>Filters</span>
            </h3>
            <button onClick={clearAllFilters} className="text-xs text-outline hover:text-error font-semibold">
              Reset All
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant">Search Specs / Model</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="e.g. i5 8th Gen, M1..."
                className="w-full bg-surface-container-low text-xs pl-8 pr-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:border-steel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-on-surface-variant">Max Budget (PKR)</label>
              <span className="price text-xs">{formatPKR(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="30000"
              max="300000"
              step="5000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-steel cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-outline">
              <span>Rs. 30k</span>
              <span>Rs. 150k</span>
              <span>Rs. 300k</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant">Primary Use-Case</label>
            <div className="flex flex-wrap gap-1.5">
              {useCases.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedUseCase(tag)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors capitalize ${
                    selectedUseCase === tag
                      ? 'bg-steel text-white font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {tag === 'all' ? 'All Uses' : tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant">Brand</label>
            <div className="flex flex-wrap gap-1.5">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                    selectedBrand === b ? 'bg-graphite text-on-graphite font-bold' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {b === 'all' ? 'All Brands' : b}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant">RAM Capacity</label>
            <div className="grid grid-cols-4 gap-1">
              {['all', '8GB', '16GB', '32GB'].map((ram) => (
                <button
                  key={ram}
                  onClick={() => setSelectedRam(ram)}
                  className={`text-xs py-1 rounded-lg border text-center font-medium ${
                    selectedRam === ram ? 'bg-steel-tint border-steel text-steel-dark font-bold' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {ram === 'all' ? 'Any' : ram}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant">Condition</label>
            <div className="space-y-1 text-xs">
              {['all', 'Like New (Open Box)', 'Used - Excellent (Grade A+)', 'Used - Good (Grade A)'].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCondition(c)}
                  className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between ${
                    selectedCondition === c ? 'bg-steel-tint text-steel-dark font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span>{c === 'all' ? 'All Conditions' : c}</span>
                  {selectedCondition === c && <Check className="w-3.5 h-3.5 text-steel-dark" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Spec-sheet listing */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-surface-container-lowest p-3.5 rounded border border-outline-variant flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <span>Showing <strong>{filteredListings.length}</strong> Verified Laptops</span>
              {globalSearchQuery && (
                <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-md flex items-center gap-1">
                  "{globalSearchQuery}"
                  <button onClick={() => setGlobalSearchQuery('')} className="hover:text-error">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden bg-surface-container text-on-surface text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <ArrowUpDown className="w-3.5 h-3.5 text-outline" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant text-on-surface font-semibold rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-steel"
                >
                  <option value="featured">Featured / Best Deals</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {mobileFilterOpen && (
            <div className="lg:hidden bg-surface-container-lowest p-4 rounded border border-outline-variant shadow-md space-y-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Max Price: {formatPKR(maxPrice)}</label>
                <input type="range" min="30000" max="300000" step="5000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-steel" />
              </div>
              <div className="flex flex-wrap gap-1">
                {brands.map((b) => (
                  <button key={b} onClick={() => setSelectedBrand(b)} className={`text-xs px-2 py-1 rounded ${selectedBrand === b ? 'bg-graphite text-on-graphite font-bold' : 'bg-surface-container text-on-surface-variant'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredListings.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant space-y-4">
              <Laptop className="w-12 h-12 text-outline mx-auto" />
              <div>
                <h3 className="font-bold text-on-surface text-base">No laptops found matching your criteria</h3>
                <p className="text-xs text-on-surface-variant mt-1">Try adjusting your price range or search terms, or ask our team on WhatsApp.</p>
              </div>
              <div className="flex justify-center gap-3">
                <button onClick={clearAllFilters} className="bg-graphite text-on-graphite text-xs font-semibold px-4 py-2 rounded-lg">Clear Filters</button>
                <a href="https://wa.me/923001234567?text=Hi%20Apna%20Laptop%20team,%20I%20am%20looking%20for%20a%20specific%20laptop%20model" target="_blank" rel="noopener noreferrer" className="bg-whatsapp text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>Ask on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded border border-outline-variant overflow-hidden">
              {/* Column headers — spec-sheet feel, desktop only */}
              <div className="hidden md:grid grid-cols-[56px_1fr_120px_80px_110px_120px_110px] gap-3 px-4 py-2.5 bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wide font-mono-spec">
                <span />
                <span>Laptop</span>
                <span>CPU</span>
                <span>RAM</span>
                <span>Storage</span>
                <span className="text-right">Price</span>
                <span className="text-right">Contact</span>
              </div>

              {filteredListings.map((listing) => {
                const isSaved = wishlist.includes(listing.id);
                const discount = listing.original_price && listing.original_price > listing.sale_price
                  ? Math.round((1 - listing.sale_price / listing.original_price) * 100)
                  : 0;
                return (
                  <div
                    key={listing.id}
                    className="grid grid-cols-[56px_1fr_auto] md:grid-cols-[56px_1fr_120px_80px_110px_120px_110px] gap-3 items-center px-4 py-3 border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors"
                  >
                    <button onClick={() => navigateTo('hub_detail', { hubId: listing.id })} className="w-14 h-14 bg-white rounded border border-outline-variant overflow-hidden shrink-0 relative">
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-contain p-1" />
                      {discount > 0 && (
                        <span className="absolute -top-1 -left-1 bg-copper text-white text-[8px] font-extrabold px-1 rounded-sm">-{discount}%</span>
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3
                          onClick={() => navigateTo('hub_detail', { hubId: listing.id })}
                          className="font-semibold text-on-surface text-xs sm:text-sm truncate cursor-pointer hover:text-steel-dark"
                        >
                          {listing.title}
                        </h3>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${conditionBadgeClasses(listing.condition)}`}>
                          {listing.condition.split(' ')[0]}
                        </span>
                      </div>
                      <p className="md:hidden text-[10px] font-mono-spec text-on-surface-variant mt-0.5 truncate">
                        {listing.specs.cpu.split('(')[0].trim()} · {listing.specs.ram.split(' ')[0]} · {listing.specs.storage.split(' ')[0]}
                      </p>
                      <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {listing.rating} ({listing.reviewCount})
                      </span>
                    </div>

                    <div className="hidden md:block font-mono-spec text-[11px] text-on-surface-variant truncate">{listing.specs.cpu.split('(')[0].trim()}</div>
                    <div className="hidden md:block font-mono-spec text-[11px] text-on-surface-variant">{listing.specs.ram.split(' ')[0]}</div>
                    <div className="hidden md:block font-mono-spec text-[11px] text-on-surface-variant">{listing.specs.storage.split(' ')[0]}</div>

                    <div className="text-right">
                      <span className="price text-sm block">{formatPKR(listing.sale_price)}</span>
                      {discount > 0 && <span className="text-[10px] text-outline line-through font-mono-spec">{formatPKR(listing.original_price!)}</span>}
                    </div>

                    <div className="flex md:justify-end">
                      <a
                        href={getHubWhatsAppLink(listing)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-whatsapp hover:bg-whatsapp-dark text-white text-[11px] font-bold px-2.5 py-1.5 rounded flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
