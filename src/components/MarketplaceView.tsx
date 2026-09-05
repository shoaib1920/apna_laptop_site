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
import { SERVICE_AREA_CITIES } from '../services/pricingEngine';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-extrabold font-display text-on-surface flex items-center gap-2">
            <Users className="w-5 h-5 text-whatsapp-dark" />
            <span>P2P Marketplace</span>
            <span className="bg-whatsapp/10 text-whatsapp-dark text-[10px] px-2 py-0.5 rounded font-bold">0% Commission</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {romanUrduMode
              ? 'Nankana Sahib aur nearby areas ke students aur freelancers se direct used laptops khareedein ya bechein.'
              : 'Direct user-to-user listings across Nankana Sahib & nearby towns. Chat on WhatsApp directly with sellers.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigateTo('calculator')}
            className="text-xs font-bold text-on-surface-variant border border-outline-variant px-3.5 py-2 rounded whitespace-nowrap"
          >
            Check Fair Price
          </button>
          <button
            onClick={() => navigateTo('sell')}
            className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-xs px-3.5 py-2 rounded flex items-center gap-1.5 whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post Free Ad</span>
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
              <option value="all">All Service Areas</option>
              {SERVICE_AREA_CITIES.map((city) => (
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
          {['all', ...SERVICE_AREA_CITIES].map((city) => (
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
              className="bg-surface-container-lowest rounded border border-outline-variant/60 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer group flex flex-col"
            >
              {/* Photo */}
              <div className="relative aspect-square bg-white overflow-hidden">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
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
