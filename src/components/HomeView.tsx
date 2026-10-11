import React, { useState, useEffect } from 'react';
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
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { HubListing, Review } from '../types';
import { formatPKR, getHubWhatsAppLink, optimizeImage, productPath } from '../utils/helpers';
import { useShop } from '../services/store';
import { brandPath } from '../services/router';
import { SERVICE_AREA_CITIES } from '../services/pricingEngine';
import { RecentlyViewed } from './Overlays';

interface HomeViewProps {
  hubListings: HubListing[];
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
  { route: 'hub', icon: Store, label: 'Browse Laptops' },
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
  reviews = [],
  wishlist = [],
  toggleWishlist,
  navigateTo,
  romanUrduMode,
  globalSearchQuery = '',
  setGlobalSearchQuery,
}) => {
  const shop = useShop();
  const brands = Array.from(new Set(hubListings.map((l) => l.brand))).sort();
  // Rotate the hero through in-stock laptops only - never feature something
  // that's sold/out of stock, and don't leave it stuck on one unit forever.
  const inStockListings = (hubListings || []).filter((l) => l.status !== 'out_of_stock');
  const [heroIndex, setHeroIndex] = useState(0);
  // Bumped whenever the visitor manually navigates, so the auto-advance
  // timer restarts from a full interval instead of cutting in right after.
  const [manualNavTick, setManualNavTick] = useState(0);

  useEffect(() => {
    if (inStockListings.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % inStockListings.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [inStockListings.length, manualNavTick]);

  const goToHero = (delta: number) => {
    if (inStockListings.length <= 1) return;
    setHeroIndex((i) => (i + delta + inStockListings.length) % inStockListings.length);
    setManualNavTick((t) => t + 1);
  };

  const heroListing = inStockListings.length > 0
    ? inStockListings[heroIndex % inStockListings.length]
    : hubListings[0];
  const featuredHub = (hubListings || []).filter((l) => l.id !== heroListing?.id).slice(0, 6);

  return (
    <div className="pb-12">
      {/* HERO — the product IS the hero, not marketing copy */}
      <section className="bg-graphite text-on-graphite border-b border-graphite-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-3 mb-5">
            <p className="text-sm text-on-graphite-elevated">
              {romanUrduMode
                ? 'Nankana Sahib ka verified laptop store — fixed price, 7 din checking warranty.'
                : "Nankana Sahib's verified laptop store — fixed prices, 7-day checking warranty."}
            </p>
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery && setGlobalSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigateTo('hub');
                }}
                placeholder="Search ThinkPad, MacBook M1..."
                className="w-full bg-graphite-elevated text-on-graphite pl-9 pr-3 py-2 rounded text-sm border border-graphite-line focus:outline-none focus:border-steel"
              />
            </div>
          </div>

          {heroListing && (
            <div
              key={heroListing.id}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,340px)_1fr] gap-6 items-stretch animate-hero-fade"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigateTo('hub_detail', { hubId: heroListing.id })}
                onKeyDown={(e) => { if (e.key === 'Enter') navigateTo('hub_detail', { hubId: heroListing.id }); }}
                className="relative rounded-lg overflow-hidden bg-white group cursor-pointer"
              >
                <img
                  src={heroListing.images[0]}
                  alt={heroListing.title}
                  className="w-full h-64 md:h-full object-contain p-6"
                />
                {discountOf(heroListing) > 0 && (
                  <span className="absolute top-3 left-3 price bg-copper-tint text-copper text-xs px-2 py-1 rounded">
                    -{discountOf(heroListing)}%
                  </span>
                )}

                {inStockListings.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); goToHero(-1); }}
                      aria-label="Previous laptop"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-graphite/70 hover:bg-graphite text-on-graphite flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); goToHero(1); }}
                      aria-label="Next laptop"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-graphite/70 hover:bg-graphite text-on-graphite flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-col justify-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-copper bg-copper-tint px-2 py-1 rounded">
                    <BadgeCheck className="w-3.5 h-3.5" /> Supplier Verified
                  </span>
                  <span className="text-xs text-on-graphite-elevated">{heroListing.condition}</span>
                </div>

                <h1 className="text-display-2 font-extrabold font-display leading-tight">
                  {heroListing.title}
                </h1>

                {/* Real spec sheet, not marketing copy */}
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs font-mono-spec border-y border-graphite-line py-3">
                  <div>
                    <dt className="text-outline uppercase tracking-wide text-[10px]">CPU</dt>
                    <dd className="text-on-graphite">{heroListing.specs.cpu.split('(')[0].trim()}</dd>
                  </div>
                  <div>
                    <dt className="text-outline uppercase tracking-wide text-[10px]">RAM</dt>
                    <dd className="text-on-graphite">{heroListing.specs.ram.split(' ')[0]}</dd>
                  </div>
                  <div>
                    <dt className="text-outline uppercase tracking-wide text-[10px]">Storage</dt>
                    <dd className="text-on-graphite">{heroListing.specs.storage.split(' ')[0]}</dd>
                  </div>
                  <div>
                    <dt className="text-outline uppercase tracking-wide text-[10px]">Screen</dt>
                    <dd className="text-on-graphite">{heroListing.specs.screenSize}"</dd>
                  </div>
                </dl>

                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <span className="price text-3xl">{formatPKR(heroListing.sale_price)}</span>
                    {heroListing.original_price && heroListing.original_price > heroListing.sale_price && (
                      <span className="text-sm text-outline line-through ml-2 font-mono-spec">
                        {formatPKR(heroListing.original_price)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        shop.orderOnWhatsApp(heroListing);
                      }}
                      className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold px-4 py-2.5 rounded text-sm flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Order on WhatsApp
                    </button>
                    <button
                      onClick={() => navigateTo('hub_detail', { hubId: heroListing.id })}
                      className="bg-steel hover:bg-steel-dark text-white font-bold px-4 py-2.5 rounded text-sm"
                    >
                      View Specs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CATEGORY / QUICK LINKS STRIP */}
      <section className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORY_LINKS.map(({ route, icon: Icon, label }) => (
              <button
                key={route}
                onClick={() => navigateTo(route)}
                className="flex flex-col items-center gap-1.5 py-2.5 rounded hover:bg-surface-container-low transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-steel-tint text-steel-dark flex items-center justify-center">
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
            <ShieldCheck className="w-4 h-4 text-steel-dark shrink-0" />
            <span>7-Day Checking Warranty</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-steel-dark shrink-0" />
            <span>WhatsApp Direct Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-steel-dark shrink-0" />
            <span>Cash on Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-steel-dark shrink-0" />
            <span>Free RAM/SSD Upgrade Fitting</span>
          </div>
        </div>
      </section>

      {/* FEATURED HUB GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-1 font-extrabold text-on-surface font-display">
            Verified Hub Deals
          </h2>
          <button
            onClick={() => navigateTo('hub')}
            className="text-xs font-bold text-steel-dark flex items-center gap-1"
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
                className="bg-surface-container-lowest rounded border border-outline-variant/60 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
              >
                <div
                  onClick={() => navigateTo('hub_detail', { hubId: listing.id })}
                  className="relative aspect-square overflow-hidden bg-white cursor-pointer"
                >
                  <img
                    src={optimizeImage(listing.images[0], 400)}
                    alt={listing.title}
                    loading="lazy"
                    className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                  />
                  {discount > 0 && (
                    <span className="absolute top-1.5 left-1.5 price bg-copper-tint text-[10px] px-1.5 py-0.5 rounded">
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
                  <h3 className="font-semibold text-on-surface text-[11px] sm:text-xs line-clamp-2 leading-snug min-h-[2.4em]">
                    {/* A real link, so search engines can follow it. */}
                    <a
                      href={productPath(listing)}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('hub_detail', { hubId: listing.id });
                      }}
                    >
                      {listing.title}
                    </a>
                  </h3>
                  <span className="price text-sm block">{formatPKR(listing.sale_price)}</span>
                  {listing.original_price && listing.original_price > listing.sale_price && (
                    <span className="text-[10px] text-outline line-through block -mt-1 font-mono-spec">{formatPKR(listing.original_price)}</span>
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

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-outline-variant">
          <h2 className="text-heading-1 font-extrabold text-on-surface font-display mb-4">
            What Buyers Are Saying
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

      {/* SHOP BY BRAND */}
      {brands.length > 1 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-outline-variant">
          <h2 className="text-heading-1 font-extrabold text-on-surface font-display mb-4">Shop by Brand</h2>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <a
                key={brand}
                href={brandPath(brand)}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('hub', { brand });
                }}
                className="bg-surface-container-lowest border border-outline-variant hover:border-steel text-on-surface text-xs font-bold px-4 py-2.5 rounded"
              >
                {brand} Laptops
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <RecentlyViewed />
      </div>

      {/* WHY SHOP HERE - plain text with real links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-outline-variant">
        <h2 className="text-heading-1 font-extrabold text-on-surface font-display mb-2">Why shop at Apna Laptop?</h2>
        <p className="text-xs text-on-surface-variant leading-relaxed max-w-3xl">
          Apna Laptop is a verified laptop store in Nankana Sahib. Every laptop in our{' '}
          <a href="/shop" onClick={(e) => { e.preventDefault(); navigateTo('hub'); }} className="text-steel-dark font-bold underline">
            Laptop Hub
          </a>{' '}
          is tested before it is listed and sold at a fixed price with a 7-day checking warranty. We deliver free to{' '}
          {SERVICE_AREA_CITIES.join(', ')} with Cash on Delivery, so you can check the laptop before you pay. Not sure
          what to buy? Try the{' '}
          <a href="/finder" onClick={(e) => { e.preventDefault(); navigateTo('finder'); }} className="text-steel-dark font-bold underline">
            Laptop Finder
          </a>
          , read our{' '}
          <a href="/contact" onClick={(e) => { e.preventDefault(); navigateTo('contact'); }} className="text-steel-dark font-bold underline">
            Help & FAQs
          </a>{' '}
          or{' '}
          <a href="/track" onClick={(e) => { e.preventDefault(); navigateTo('track'); }} className="text-steel-dark font-bold underline">
            track your order
          </a>
          .
        </p>
      </section>
    </div>
  );
};
