import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  MapPin,
  MessageCircle,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ArrowRight,
  Sparkles,
  Phone,
} from 'lucide-react';
import { P2PListing, User } from '../types';
import { PAKISTAN_CITIES } from '../services/pricingEngine';
import { formatPKR, getP2PWhatsAppLink } from '../utils/helpers';

interface MarketplaceViewProps {
  p2pListings: P2PListing[];
  currentUser: User | null;
  navigateTo: (route: string, params?: any) => void;
  reportP2PListing: (id: string) => void;
  romanUrduMode: boolean;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  p2pListings = [],
  currentUser,
  navigateTo,
  reportP2PListing,
  romanUrduMode,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(300000);
  const [reportedToast, setReportedToast] = useState<string | null>(null);

  const brands = useMemo(() => {
    const set = new Set((p2pListings || []).map((l) => l.brand));
    return ['all', ...Array.from(set)];
  }, [p2pListings]);

  const filteredListings = useMemo(() => {
    return (p2pListings || []).filter((item) => {
      if (item.status !== 'active') return false;

      // City filter
      if (selectedCity !== 'all' && !item.seller_city.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'all' && item.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }

      // Max Price filter
      if (item.asking_price > maxPrice) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inDesc = item.description.toLowerCase().includes(q);
        const inCpu = item.specs.cpu.toLowerCase().includes(q);
        const inCity = item.seller_city.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inCpu && !inCity) return false;
      }

      return true;
    });
  }, [p2pListings, selectedCity, selectedBrand, maxPrice, searchQuery]);

  const handleReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    reportP2PListing(id);
    setReportedToast(id);
    setTimeout(() => setReportedToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-primary-container text-on-primary rounded-lg p-6 sm:p-8 border border-outline-variant/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-whatsapp flex items-center justify-center text-white font-bold">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
              P2P Used Laptop <span className="text-whatsapp">Marketplace</span>
            </h1>
            <span className="bg-whatsapp/15 text-whatsapp text-xs px-2 py-0.5 rounded-md font-bold border border-whatsapp/30">
              OLX-Style Deals
            </span>
          </div>
          <p className="text-xs sm:text-sm text-on-primary-container max-w-xl">
            {romanUrduMode
              ? 'Pakistan bhar ke students aur freelancers se direct used laptops khareedein ya apna laptop 0% commission par bechein.'
              : 'Direct user-to-user marketplace. Browse community listings, verify specs, and chat on WhatsApp directly with sellers.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigateTo('sell')}
            className="bg-whatsapp hover:bg-whatsapp-dark text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>{romanUrduMode ? 'Apna Laptop Post Karein (Free)' : 'Post Free Ad'}</span>
          </button>

          <button
            onClick={() => navigateTo('calculator')}
            className="bg-on-primary/10 hover:bg-on-primary/20 text-on-primary font-semibold text-xs px-4 py-3 rounded border border-on-primary/10 transition-colors"
          >
            Check Fair Price First
          </button>
        </div>
      </div>

      {/* Safety Notice Strip for Pakistan P2P */}
      <div className="bg-secondary-container rounded p-3.5 border border-secondary/20 flex items-start gap-2.5 text-xs text-on-secondary-container">
        <AlertTriangle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
        <div>
          <strong>{romanUrduMode ? 'Yaqeeni Deal Rehnumai:' : 'Safe Trading Tip:'}</strong>{' '}
          {romanUrduMode
            ? 'P2P deals mein hamesha public place (jaise cafe ya mobile market) mein milein, laptop ka display aur battery backup check karein aur tasalli hone par payment karein.'
            : 'Always meet in a public location (e.g. coffee shop or shopping centre), physically check the laptop, and verify specs before transferring funds.'}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded border border-outline-variant shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, specs, seller..."
              className="w-full bg-surface-container-low text-xs pl-9 pr-3 py-2.5 rounded-xl border border-outline-variant focus:outline-none focus:border-whatsapp"
            />
          </div>

          {/* City Selector */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-surface-container-low text-xs px-3 py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-whatsapp"
            >
              <option value="all">All Pakistan Cities</option>
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Selector */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-surface-container-low text-xs px-3 py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-whatsapp"
            >
              <option value="all">All Brands</option>
              {brands.filter((b) => b !== 'all').map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price */}
          <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant">
            <span className="text-[11px] font-bold text-on-surface-variant">Max: {formatPKR(maxPrice)}</span>
            <input
              type="range"
              min="20000"
              max="350000"
              step="5000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-28 accent-whatsapp"
            />
          </div>
        </div>

        {/* Quick City Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-outline font-medium text-[11px] shrink-0">Popular:</span>
          {['all', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad'].map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                selectedCity === city
                  ? 'bg-whatsapp text-white font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {city === 'all' ? 'All' : city}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {reportedToast && (
        <div className="bg-whatsapp/10 border border-whatsapp/30 text-whatsapp-dark p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Flag className="w-4 h-4 text-whatsapp-dark" />
          <span>Listing reported for team review. Thank you for keeping Apna Laptop safe!</span>
        </div>
      )}

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-surface-container-lowest rounded p-12 text-center border border-outline-variant space-y-4">
          <Users className="w-12 h-12 text-outline mx-auto" />
          <div>
            <h3 className="font-bold text-on-surface text-base">No P2P listings found</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Be the first in {selectedCity !== 'all' ? selectedCity : 'Pakistan'} to post a used laptop!
            </p>
          </div>
          <button
            onClick={() => navigateTo('sell')}
            className="bg-whatsapp hover:bg-whatsapp-dark text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Post Your Ad Now (Free)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => navigateTo('marketplace_detail', { p2pId: listing.id })}
              className="bg-surface-container-lowest rounded border border-outline-variant hover:border-outline hover:shadow-sm transition-all overflow-hidden cursor-pointer group flex flex-col"
            >
              {/* Photo */}
              <div className="relative aspect-square bg-surface-container-high overflow-hidden">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {listing.is_verified_badge && (
                  <span className="absolute top-1.5 left-1.5 bg-whatsapp/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                )}
                <button
                  onClick={(e) => handleReport(listing.id, e)}
                  className="absolute top-1.5 right-1.5 p-1 bg-surface-container-lowest/90 rounded-full text-on-surface-variant hover:text-error transition-colors"
                  title="Report Listing"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-2.5 space-y-1 flex-1 flex flex-col">
                <h3 className="font-semibold text-on-surface text-xs line-clamp-2 leading-snug min-h-[2.4em] group-hover:text-whatsapp-dark transition-colors">
                  {listing.title}
                </h3>
                <p className="text-[10px] text-on-surface-variant font-mono-spec truncate">
                  {listing.specs.cpu.split('(')[0].trim()} · {listing.specs.ram} · {listing.specs.storage}
                </p>

                <div className="pt-1 mt-auto">
                  <span className="text-sm font-extrabold text-deal font-display block">{formatPKR(listing.asking_price)}</span>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1">
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {listing.seller_city}
                    </span>
                    <span className="text-outline shrink-0">{listing.created_at}</span>
                  </div>
                </div>

                <a
                  href={getP2PWhatsAppLink(listing, currentUser?.name)}
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
          ))}
        </div>
      )}
    </div>
  );
};
