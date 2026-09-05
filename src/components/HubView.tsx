import React, { useState, useMemo } from 'react';
import {
  Store,
  Filter,
  Search,
  SlidersHorizontal,
  Star,
  ShieldCheck,
  MessageCircle,
  Heart,
  ArrowUpDown,
  Laptop,
  Check,
  X,
  Plus,
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

export const HubView: React.FC<HubViewProps> = ({
  hubListings = [],
  wishlist = [],
  toggleWishlist,
  navigateTo,
  romanUrduMode,
  globalSearchQuery,
  setGlobalSearchQuery,
}) => {
  // Filter states
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

  const useCases = [
    'all',
    'Programming & Dev',
    'Student',
    'Gaming',
    'Video Editing',
    'Office & Business',
    'Business & Frequent Travel',
  ];

  const filteredListings = useMemo(() => {
    return hubListings
      .filter((item) => {
        // Search query match
        if (globalSearchQuery.trim()) {
          const q = globalSearchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchBrand = item.brand.toLowerCase().includes(q);
          const matchCpu = item.specs.cpu.toLowerCase().includes(q);
          const matchRam = item.specs.ram.toLowerCase().includes(q);
          const matchTags = item.use_case_tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchBrand && !matchCpu && !matchRam && !matchTags) {
            return false;
          }
        }

        // Brand match
        if (selectedBrand !== 'all' && item.brand !== selectedBrand) return false;

        // Use-case match
        if (selectedUseCase !== 'all' && !item.use_case_tags.includes(selectedUseCase)) return false;

        // Condition match
        if (selectedCondition !== 'all' && item.condition !== selectedCondition) return false;

        // RAM match
        if (selectedRam !== 'all') {
          if (!item.specs.ram.toLowerCase().includes(selectedRam.toLowerCase())) return false;
        }

        // Price match
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
      {/* Header & Slogan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-extrabold font-display text-on-surface flex items-center gap-2">
            <Store className="w-5 h-5 text-whatsapp-dark" />
            <span>Laptop Hub</span>
            <span className="bg-whatsapp/10 text-whatsapp-dark text-[10px] px-2 py-0.5 rounded font-bold">Verified Stock</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {romanUrduMode
              ? 'Nankana Sahib ke trusted suppliers se sourced stock.'
              : 'Directly sourced from verified laptop suppliers in Nankana Sahib.'}
          </p>
        </div>
        <button
          onClick={() => navigateTo('finder')}
          className="text-xs font-bold text-whatsapp-dark border border-whatsapp/30 bg-whatsapp/10 px-3.5 py-2 rounded whitespace-nowrap self-start sm:self-auto"
        >
          Not sure what to pick? Take the Finder Quiz →
        </button>
      </div>

      {/* Main Layout: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block bg-surface-container-lowest rounded p-5 border border-outline-variant shadow-sm space-y-6 sticky top-24">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3">
            <h3 className="font-bold text-on-surface text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-whatsapp-dark" />
              <span>Filters</span>
            </h3>
            <button
              onClick={clearAllFilters}
              className="text-xs text-outline hover:text-error font-semibold"
            >
              Reset All
            </button>
          </div>

          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant">Search Specs / Model</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="e.g. i5 8th Gen, M1..."
                className="w-full bg-surface-container-low text-xs pl-8 pr-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:border-whatsapp"
              />
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-on-surface-variant">Max Budget (PKR)</label>
              <span className="font-bold text-whatsapp-dark">{formatPKR(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="30000"
              max="300000"
              step="5000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-whatsapp cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-outline">
              <span>Rs. 30k</span>
              <span>Rs. 150k</span>
              <span>Rs. 300k</span>
            </div>
          </div>

          {/* Use Case Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant">Primary Use-Case</label>
            <div className="flex flex-wrap gap-1.5">
              {useCases.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedUseCase(tag)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors capitalize ${
                    selectedUseCase === tag
                      ? 'bg-whatsapp text-white font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {tag === 'all' ? 'All Uses' : tag}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant">Brand</label>
            <div className="flex flex-wrap gap-1.5">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                    selectedBrand === b
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {b === 'all' ? 'All Brands' : b}
                </button>
              ))}
            </div>
          </div>

          {/* RAM Size */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant">RAM Capacity</label>
            <div className="grid grid-cols-4 gap-1">
              {['all', '8GB', '16GB', '32GB'].map((ram) => (
                <button
                  key={ram}
                  onClick={() => setSelectedRam(ram)}
                  className={`text-xs py-1 rounded-lg border text-center font-medium ${
                    selectedRam === ram
                      ? 'bg-whatsapp/10 border-whatsapp text-whatsapp-dark font-bold'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {ram === 'all' ? 'Any' : ram}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant">Condition</label>
            <div className="space-y-1 text-xs">
              {['all', 'Like New (Open Box)', 'Used - Excellent (Grade A+)', 'Used - Good (Grade A)'].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCondition(c)}
                  className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between ${
                    selectedCondition === c
                      ? 'bg-whatsapp/10 text-whatsapp-dark font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span>{c === 'all' ? 'All Conditions' : c}</span>
                  {selectedCondition === c && <Check className="w-3.5 h-3.5 text-whatsapp-dark" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid & Sorting */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Bar: Total Count & Sort By */}
          <div className="bg-surface-container-lowest p-3.5 rounded border border-outline-variant flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <span>Showing <strong>{filteredListings.length}</strong> Verified Laptops</span>
              {globalSearchQuery && (
                <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-md flex items-center gap-1">
                  Query: "{globalSearchQuery}"
                  <button onClick={() => setGlobalSearchQuery('')} className="hover:text-error">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden bg-surface-container text-on-surface text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <ArrowUpDown className="w-3.5 h-3.5 text-outline" />
                <span className="hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant text-on-surface font-semibold rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-whatsapp"
                >
                  <option value="featured">Featured / Best Deals</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Filter Sheet */}
          {mobileFilterOpen && (
            <div className="lg:hidden bg-surface-container-lowest p-4 rounded border border-outline-variant shadow-md space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                <span className="font-bold text-xs text-on-surface">Filter Products</span>
                <button onClick={() => setMobileFilterOpen(false)} className="text-xs text-on-surface-variant">
                  Close
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant block mb-1">Max Price: {formatPKR(maxPrice)}</label>
                  <input
                    type="range"
                    min="30000"
                    max="300000"
                    step="5000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-whatsapp"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {brands.map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`text-xs px-2 py-1 rounded ${
                        selectedBrand === b ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Listings List */}
          {filteredListings.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant space-y-4">
              <Laptop className="w-12 h-12 text-outline mx-auto" />
              <div>
                <h3 className="font-bold text-on-surface text-base">No laptops found matching your criteria</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Try adjusting your price range or search terms, or ask our team on WhatsApp.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={clearAllFilters}
                  className="bg-primary text-on-primary text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Clear Filters
                </button>
                <a
                  href="https://wa.me/923001234567?text=Hi%20Apna%20Laptop%20team,%20I%20am%20looking%20for%20a%20specific%20laptop%20model"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-whatsapp text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ask on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredListings.map((listing) => {
                const isSaved = wishlist.includes(listing.id);
                const discount = listing.original_price && listing.original_price > listing.sale_price
                  ? Math.round((1 - listing.sale_price / listing.original_price) * 100)
                  : 0;
                return (
                  <div
                    key={listing.id}
                    className="bg-surface-container-lowest rounded border border-outline-variant/60 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group flex flex-col"
                  >
                    {/* Image */}
                    <div
                      onClick={() => navigateTo('hub_detail', { hubId: listing.id })}
                      className="relative aspect-square overflow-hidden bg-white cursor-pointer"
                    >
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      />
                      {discount > 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-deal text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                          -{discount}%
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(listing.id);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 bg-surface-container-lowest/90 rounded-full text-on-surface-variant hover:text-error transition-colors"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSaved ? 'text-error fill-error' : ''}`} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-2.5 space-y-1 flex-1 flex flex-col">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">{listing.brand}</span>
                      <h3
                        onClick={() => navigateTo('hub_detail', { hubId: listing.id })}
                        className="font-semibold text-on-surface text-xs line-clamp-2 cursor-pointer leading-snug min-h-[2.4em]"
                      >
                        {listing.title}
                      </h3>
                      <p className="text-[10px] text-on-surface-variant font-mono-spec truncate">
                        {listing.specs.cpu.split('(')[0].trim()} · {listing.specs.ram.split(' ')[0]} · {listing.specs.storage.split(' ')[0]}
                      </p>

                      <div className="pt-1 mt-auto">
                        <span className="text-sm font-extrabold text-deal font-display block">{formatPKR(listing.sale_price)}</span>
                        {discount > 0 && (
                          <span className="text-[10px] text-outline line-through">{formatPKR(listing.original_price!)}</span>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {listing.rating} ({listing.reviewCount})
                          </span>
                          <span className="text-whatsapp-dark font-semibold">{listing.condition.split(' ')[0]}</span>
                        </div>
                      </div>

                      <a
                        href={getHubWhatsAppLink(listing)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 bg-whatsapp hover:bg-whatsapp-dark text-white text-[11px] font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
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
