import React from 'react';
import {
  Store,
  Calculator,
  Compass,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Search,
  MessageCircle,
  PlusCircle,
  Truck,
  Star,
  MapPin,
  Heart,
  Users,
  Wrench,
} from 'lucide-react';
import { HubListing, P2PListing, Review } from '../types';
import { formatPKR, getHubWhatsAppLink, getP2PWhatsAppLink } from '../utils/helpers';

interface HomeViewProps {
  hubListings: HubListing[];
  p2pListings: P2PListing[];
  reviews?: Review[];
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  addToCart?: (listing: HubListing) => void;
  navigateTo: (route: string, params?: any) => void;
  romanUrduMode: boolean;
  globalSearchQuery?: string;
  setGlobalSearchQuery?: (q: string) => void;
}

const CATEGORY_LINKS = [
  { route: 'hub', icon: Store, label: 'Laptop Hub' },
  { route: 'marketplace', icon: Users, label: 'P2P Market' },
  { route: 'sell', icon: PlusCircle, label: 'Sell Laptop' },
  { route: 'calculator', icon: Calculator, label: 'Valuation' },
  { route: 'finder', icon: Compass, label: 'Finder Quiz' },
  { route: 'advisor', icon: Sliders, label: 'Upgrade Sim' },
];

const discountOf = (listing: HubListing) =>
  listing.original_price && listing.original_price > listing.sale_price
    ? Math.round((1 - listing.sale_price / listing.original_price) * 100)
    : 0;

export const HomeView: React.FC<HomeViewProps> = ({
  hubListings = [],
  p2pListings = [],
  reviews = [],
  wishlist = [],
  toggleWishlist,
  navigateTo,
  romanUrduMode,
  globalSearchQuery = '',
  setGlobalSearchQuery,
}) => {
  const featuredHub = (hubListings || []).slice(0, 6);
  const recentP2P = (p2pListings || []).slice(0, 4);

  return (
    <div className="pb-12">
      {/* PROMO BANNER */}
      <section className="relative overflow-hidden bg-primary text-on-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
          <div className="space-y-3 text-center lg:text-left">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-deal bg-deal-container px-2.5 py-1 rounded">
              {romanUrduMode ? '0% Commission • 7 Din Warranty' : 'Verified Stock • 7-Day Checking Warranty'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight font-display">
              {romanUrduMode
                ? 'Apna Laptop Khareedein Ya Bechein, Baghair Kisi Faraad Ke'
                : 'Buy & Sell Laptops in Nankana Sahib — Zero Fraud, Full Warranty'}
            </h1>
            <p className="text-sm text-on-primary-container max-w-xl mx-auto lg:mx-0">
              {romanUrduMode
                ? 'Nankana Sahib ke verified supplier laptops, aur 0% commission par direct used listings.'
                : 'Curated supplier stock with checking warranty, serving Nankana Sahib & nearby towns.'}
            </p>

            <div className="max-w-lg mx-auto lg:mx-0 flex gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery && setGlobalSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigateTo('hub');
                  }}
                  placeholder="Search ThinkPad, MacBook M1, Core i5..."
                  className="w-full bg-surface-container-lowest text-on-surface pl-9 pr-3 py-2.5 rounded text-sm border border-transparent focus:outline-none focus:border-whatsapp"
                />
              </div>
              <button
                onClick={() => navigateTo('hub')}
                className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold px-5 py-2.5 rounded text-sm shrink-0"
              >
                Search
              </button>
            </div>
          </div>

          {featuredHub[0] && (
            <button
              onClick={() => navigateTo('hub_detail', { hubId: featuredHub[0].id })}
              className="group relative rounded overflow-hidden border border-white/10 hidden sm:block"
            >
              <img
                src={featuredHub[0].images[0]}
                alt={featuredHub[0].title}
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/10 to-transparent" />
              {discountOf(featuredHub[0]) > 0 && (
                <span className="absolute top-3 left-3 bg-deal text-white text-xs font-extrabold px-2 py-1 rounded">
                  -{discountOf(featuredHub[0])}%
                </span>
              )}
              <div className="absolute bottom-3 left-3 right-3 text-left">
                <p className="text-xs text-on-primary-container line-clamp-1">{featuredHub[0].title}</p>
                <p className="text-lg font-extrabold text-white font-display">{formatPKR(featuredHub[0].sale_price)}</p>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* CATEGORY / QUICK LINKS STRIP */}
      <section className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CATEGORY_LINKS.map(({ route, icon: Icon, label }) => (
              <button
                key={route}
                onClick={() => navigateTo(route)}
                className="flex flex-col items-center gap-1.5 py-2.5 rounded hover:bg-surface-container-low transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-whatsapp/10 text-whatsapp-dark flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-whatsapp-dark shrink-0" />
            <span>7-Day Checking Warranty</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-whatsapp-dark shrink-0" />
            <span>WhatsApp Direct Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-whatsapp-dark shrink-0" />
            <span>Cash on Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-whatsapp-dark shrink-0" />
            <span>0% Commission P2P</span>
          </div>
        </div>
      </section>

      {/* FEATURED HUB GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-on-surface font-display">
            {romanUrduMode ? 'Verified Hub Deals' : 'Verified Hub Deals'}
          </h2>
          <button
            onClick={() => navigateTo('hub')}
            className="text-xs font-bold text-whatsapp-dark flex items-center gap-1"
          >
            <span>View All ({hubListings.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredHub.map((listing) => {
            const isSaved = wishlist.includes(listing.id);
            const discount = discountOf(listing);
            return (
              <div
                key={listing.id}
                className="bg-surface-container-lowest rounded border border-outline-variant hover:border-outline hover:shadow-sm transition-all overflow-hidden group"
              >
                <div
                  onClick={() => navigateTo('hub_detail', { hubId: listing.id })}
                  className="relative aspect-square overflow-hidden bg-surface-container cursor-pointer"
                >
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                <div className="p-2.5 space-y-1">
                  <h3
                    onClick={() => navigateTo('hub_detail', { hubId: listing.id })}
                    className="font-semibold text-on-surface text-[11px] sm:text-xs line-clamp-2 cursor-pointer leading-snug min-h-[2.4em]"
                  >
                    {listing.title}
                  </h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-extrabold text-deal font-display">{formatPKR(listing.sale_price)}</span>
                  </div>
                  {listing.original_price && listing.original_price > listing.sale_price && (
                    <span className="text-[10px] text-outline line-through block -mt-1">{formatPKR(listing.original_price)}</span>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {listing.rating} ({listing.reviewCount})
                    </span>
                    <a
                      href={getHubWhatsAppLink(listing)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-whatsapp-dark hover:text-whatsapp font-bold"
                    >
                      Chat
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* P2P MARKETPLACE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-outline-variant">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface font-display">
              {romanUrduMode ? 'P2P Used Market' : 'Recent P2P Listings'}
            </h2>
            <p className="text-[11px] text-on-surface-variant">Posted directly by sellers in Nankana Sahib & nearby towns. 0% commission.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('sell')}
              className="text-xs font-bold text-whatsapp-dark border border-whatsapp/30 bg-whatsapp/10 px-3 py-1.5 rounded hidden sm:block"
            >
              Post Free Ad
            </button>
            <button onClick={() => navigateTo('marketplace')} className="text-xs font-bold text-whatsapp-dark flex items-center gap-1">
              <span>Browse All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {recentP2P.map((listing) => (
            <div
              key={listing.id}
              className="bg-surface-container-lowest rounded border border-outline-variant hover:border-outline hover:shadow-sm transition-all overflow-hidden group"
            >
              <div
                onClick={() => navigateTo('marketplace_detail', { p2pId: listing.id })}
                className="relative aspect-square overflow-hidden bg-surface-container cursor-pointer"
              >
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {listing.is_phone_verified && (
                  <span className="absolute top-1.5 left-1.5 bg-whatsapp/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>
              <div className="p-2.5 space-y-1">
                <h3
                  onClick={() => navigateTo('marketplace_detail', { p2pId: listing.id })}
                  className="font-semibold text-on-surface text-[11px] sm:text-xs line-clamp-2 cursor-pointer leading-snug min-h-[2.4em]"
                >
                  {listing.title}
                </h3>
                <span className="text-sm font-extrabold text-deal font-display block">{formatPKR(listing.asking_price)}</span>
                <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{listing.seller_city}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-outline-variant">
          <h2 className="text-base sm:text-lg font-bold text-on-surface font-display mb-4">
            {romanUrduMode ? 'Nankana Sahib Ke Khush Grahak' : 'What Buyers Are Saying'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {reviews.slice(0, 3).map((rev) => (
              <div key={rev.id} className="bg-surface-container-lowest rounded p-4 border border-outline-variant space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface text-xs">{rev.reviewer_name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-3">{rev.comment}</p>
                <p className="text-[10px] text-outline">{rev.reviewer_city}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
