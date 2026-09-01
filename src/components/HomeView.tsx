import React from 'react';
import {
  Store,
  Users,
  Calculator,
  Compass,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
  MessageCircle,
  PlusCircle,
  Truck,
  Flame,
  Star,
  Cpu,
  HardDrive,
  Layers,
  MapPin,
  Heart,
  BadgeCheck,
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

export const HomeView: React.FC<HomeViewProps> = ({
  hubListings = [],
  p2pListings = [],
  reviews = [],
  wishlist = [],
  toggleWishlist,
  addToCart,
  navigateTo,
  romanUrduMode,
  globalSearchQuery = '',
  setGlobalSearchQuery,
}) => {
  const featuredHub = (hubListings || []).slice(0, 4);
  const recentP2P = (p2pListings || []).slice(0, 3);

  return (
    <div className="space-y-12 pb-12">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-primary-container text-on-primary pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-primary">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 bg-whatsapp/15 border border-whatsapp/40 px-3.5 py-1.5 rounded-full text-xs text-whatsapp font-semibold shadow-inner">
                <BadgeCheck className="w-4 h-4 text-whatsapp" />
                <span>
                  {romanUrduMode
                    ? 'Pakistan ka No.1 Verified Laptop Hub & P2P Market'
                    : 'Pakistan’s Curated Laptop Store & P2P Marketplace'}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-on-primary leading-tight font-display">
                {romanUrduMode ? (
                  <>
                    Apna Laptop Khareedein Ya Bechein —{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-whatsapp to-secondary-container">
                      Baghair Kisi Faraad Ke.
                    </span>
                  </>
                ) : (
                  <>
                    Buy & Sell Laptops in Pakistan with{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-whatsapp to-secondary-container">
                      100% Checking Warranty.
                    </span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-on-primary-container max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {romanUrduMode
                  ? 'Hafeez Centre aur Techno City ke verified supplier laptops, 0% commission par direct used laptop listings, aur intelligent valuation calculator.'
                  : 'Curated verified supplier stock with 7-day checking warranty, an OLX-style free P2P used marketplace, and smart price valuation tools.'}
              </p>

              {/* Quick Search in Hero */}
              <div className="max-w-xl mx-auto lg:mx-0 bg-primary/90 p-2 rounded border border-primary-container shadow-xl flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-primary-container" />
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigateTo('hub');
                    }}
                    placeholder="Search ThinkPad, MacBook M1, Core i5, RTX..."
                    className="w-full bg-primary text-on-primary pl-11 pr-4 py-3 rounded-xl text-sm border border-primary-container/80 focus:outline-none focus:border-whatsapp placeholder:text-on-primary-container"
                  />
                </div>
                <button
                  id="hero-search-btn"
                  onClick={() => navigateTo('hub')}
                  className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold px-6 py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Hub</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  id="hero-explore-hub-btn"
                  onClick={() => navigateTo('hub')}
                  className="bg-gradient-to-r from-whatsapp to-whatsapp-dark hover:from-whatsapp-dark hover:to-whatsapp-dark text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Store className="w-4 h-4 text-white" />
                  <span>{romanUrduMode ? 'Verified Stock Dekhein' : 'Explore Laptop Hub'}</span>
                </button>

                <button
                  id="hero-finder-btn"
                  onClick={() => navigateTo('finder')}
                  className="bg-primary hover:bg-primary-container text-on-primary font-semibold px-5 py-3 rounded-xl text-sm border border-primary-container transition-colors flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-whatsapp" />
                  <span>{romanUrduMode ? 'Laptop Finder Quiz' : 'Find My Laptop (Quiz)'}</span>
                </button>

                <button
                  id="hero-sell-btn"
                  onClick={() => navigateTo('sell')}
                  className="bg-whatsapp/10 hover:bg-whatsapp/20 text-whatsapp font-semibold px-4 py-3 rounded-xl text-sm border border-whatsapp/30 transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-whatsapp" />
                  <span>{romanUrduMode ? 'Laptop Bechein (0% Fee)' : 'Post Used Listing'}</span>
                </button>
              </div>

              {/* Trust Micro-Badges */}
              <div className="grid grid-cols-3 gap-2 pt-4 max-w-lg mx-auto lg:mx-0 text-[11px] text-on-primary-container">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-whatsapp shrink-0" />
                  <span>7 Din Checking Warranty</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-whatsapp shrink-0" />
                  <span>WhatsApp Direct Deal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-whatsapp shrink-0" />
                  <span>Cash on Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Card / Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="bg-primary/80 rounded-lg p-5 border border-primary-container/80 shadow-lg backdrop-blur-sm relative space-y-4">
                <div className="flex items-center justify-between border-b border-primary-container pb-3">
                  <span className="text-xs font-bold text-on-primary-container">This Week's Featured Lot</span>
                  <span className="flex items-center gap-1.5 text-[11px] bg-whatsapp/15 text-whatsapp px-2 py-0.5 rounded-full border border-whatsapp/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-whatsapp animate-pulse"></span>
                    Hafeez Centre Lot Active
                  </span>
                </div>

                {/* Card Item Preview */}
                {hubListings[0] && (
                  <div
                    onClick={() => navigateTo('hub_detail', { hubId: hubListings[0].id })}
                    className="group cursor-pointer bg-primary/90 rounded p-4 border border-primary-container/60 hover:border-whatsapp/50 transition-all space-y-3"
                  >
                    <div className="relative h-44 rounded-xl overflow-hidden bg-primary">
                      <img
                        src={hubListings[0].images[0]}
                        alt={hubListings[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 bg-whatsapp text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                        Hot Deal • {hubListings[0].condition}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-primary/80 backdrop-blur-md text-on-primary text-xs font-bold px-2.5 py-1 rounded-lg border border-primary-container">
                        {formatPKR(hubListings[0].sale_price)}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-on-primary text-sm line-clamp-1 group-hover:text-whatsapp transition-colors">
                        {hubListings[0].title}
                      </h3>
                      <p className="text-xs text-on-primary-container mt-1 line-clamp-1">
                        {hubListings[0].specs.cpu} • {hubListings[0].specs.ram} • {hubListings[0].specs.storage}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-whatsapp font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> 7-Day Checking Warranty
                      </span>
                      <span className="text-on-primary-container text-[11px] group-hover:text-on-primary flex items-center gap-1">
                        View Specs <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick valuation teaser */}
                <div
                  onClick={() => navigateTo('calculator')}
                  className="cursor-pointer bg-gradient-to-r from-whatsapp/10 to-primary p-3.5 rounded border border-whatsapp/30 flex items-center justify-between hover:border-whatsapp transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-whatsapp/20 text-whatsapp flex items-center justify-center shrink-0">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-primary">
                        {romanUrduMode ? 'Apne Laptop Ki Value Check Karein' : 'Instant Laptop Price Valuation'}
                      </p>
                      <p className="text-[11px] text-on-primary-container">
                        Get exact Pakistani market resale estimate in 1 min
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-whatsapp" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE SMART TOOLS SHOWCASE (BENTO GRID) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-on-surface font-display">
              <span className="w-2 h-6 bg-whatsapp rounded-full inline-block"></span>
              <span>{romanUrduMode ? "Smart Decision Tools" : "Smart Decision Tools"}</span>
              <span className="text-xs font-normal text-outline">({romanUrduMode ? "Pricing, Finder & Upgrade" : "Pricing, Finder & Upgrade"})</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Data-driven valuation models and spec compatibility tailored for the Pakistani market.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tool 1: Price Calculator */}
          <div
            id="tool-card-calculator"
            onClick={() => navigateTo('calculator')}
            className="group cursor-pointer bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm hover:shadow-md hover:border-whatsapp transition-all space-y-4 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-lg bg-whatsapp/10 text-whatsapp-dark flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface group-hover:text-whatsapp-dark transition-colors">
                  Laptop Price Calculator
                </h3>
                <span className="text-[10px] bg-whatsapp/10 text-whatsapp-dark font-bold px-2 py-0.5 rounded-full">
                  Valuation
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                {romanUrduMode
                  ? 'Apne purane laptop ke specs (CPU gen, RAM, battery health) daalein aur market price estimate paayein.'
                  : 'Answer a short spec checklist and receive an accurate Pakistani market resale price range in PKR.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-whatsapp-dark pt-2 border-t border-outline-variant">
              <span>{romanUrduMode ? 'Price Calculate Karein' : 'Calculate Valuation'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tool 2: Finder Wizard */}
          <div
            id="tool-card-finder"
            onClick={() => navigateTo('finder')}
            className="group cursor-pointer bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm hover:shadow-md hover:border-whatsapp transition-all space-y-4 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-lg bg-whatsapp/10 text-whatsapp-dark flex items-center justify-center group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface group-hover:text-whatsapp-dark transition-colors">
                  Laptop Finder Wizard
                </h3>
                <span className="text-[10px] bg-whatsapp/10 text-whatsapp-dark font-bold px-2 py-0.5 rounded-full">
                  Buyer Guide
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                {romanUrduMode
                  ? 'Agar samajh nahi aa raha kon sa laptop lein, toh 4 asaan sawalon ke jawab dein aur best match paayein.'
                  : 'A 4-step guided quiz matching your exact budget and use-case (Coding, Gaming, University, Video).'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-whatsapp-dark pt-2 border-t border-outline-variant">
              <span>{romanUrduMode ? 'Finder Quiz Shuru Karein' : 'Start Recommendation Quiz'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tool 3: Upgrade Advisor */}
          <div
            id="tool-card-advisor"
            onClick={() => navigateTo('advisor')}
            className="group cursor-pointer bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm hover:shadow-md hover:border-whatsapp transition-all space-y-4 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-lg bg-whatsapp/10 text-whatsapp-dark flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface group-hover:text-whatsapp-dark transition-colors">
                  Upgrade & Boost Advisor
                </h3>
                <span className="text-[10px] bg-whatsapp/10 text-whatsapp-dark font-bold px-2 py-0.5 rounded-full">
                  Hardware Sim
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                {romanUrduMode
                  ? 'Check karein RAM ya SSD upgrade karne se laptop ki speed kitne percent barhegi aur kharcha kitna hoga.'
                  : 'Simulate RAM and NVMe SSD upgrades, calculate component costs in PKR, and see performance gains.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-whatsapp-dark pt-2 border-t border-outline-variant">
              <span>{romanUrduMode ? 'Upgrade Simulator Kholein' : 'Simulate Upgrades'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED HUB VERIFIED LAPTOPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-on-surface font-display">
              <span className="w-2 h-6 bg-whatsapp rounded-full inline-block"></span>
              <span>{romanUrduMode ? 'Verified Hub' : 'Verified Hub'}</span>
              <span className="text-xs font-normal text-outline">(Direct from Supplier)</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Direct from Hafeez Centre & Techno City supplier lots. 100% genuine motherboards with 7-Day checking warranty.
            </p>
          </div>
          <button
            id="see-all-hub-btn"
            onClick={() => navigateTo('hub')}
            className="text-xs font-bold text-whatsapp-dark hover:text-whatsapp-dark flex items-center gap-1 bg-whatsapp/10 px-3.5 py-1.5 rounded-lg border border-whatsapp/30 transition-colors"
          >
            <span>View All Stock ({hubListings.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredHub.map((listing) => {
            const isSaved = wishlist.includes(listing.id);
            return (
              <div
                key={listing.id}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group p-3 space-y-3"
              >
                {/* Image & Badges */}
                <div className="relative rounded-lg overflow-hidden bg-surface-container">
                  <div
                    onClick={() => navigateTo('hub_detail', { hubId: listing.id })}
                    className="h-44 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Condition Tag */}
                  <div className="absolute top-2 left-2 bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {listing.condition}
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={() => toggleWishlist(listing.id)}
                    className="absolute top-2 right-2 p-1.5 bg-surface-container-lowest/90 backdrop-blur-md rounded-full shadow-sm text-on-surface-variant hover:text-error transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${isSaved ? 'text-error fill-error' : ''}`}
                    />
                  </button>

                  {/* 7-Day Warranty Badge */}
                  <div className="absolute bottom-2 left-2 bg-primary/80 backdrop-blur-md text-on-primary text-[9px] font-bold px-2 py-0.5 rounded">
                    7-Day Warranty
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                      <span className="font-bold text-on-surface-variant">{listing.brand}</span>
                      <span className="text-amber-500 font-semibold flex items-center gap-0.5 text-[11px]">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {listing.rating}
                      </span>
                    </div>

                    <h3
                      onClick={() => navigateTo('hub_detail', { hubId: listing.id })}
                      className="font-bold text-on-surface text-xs sm:text-sm line-clamp-2 hover:text-whatsapp-dark cursor-pointer transition-colors"
                    >
                      {listing.title}
                    </h3>

                    {/* Spec grid pills */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] text-on-surface-variant">
                      <div className="bg-surface-container-low p-1 rounded border border-outline-variant truncate">
                        <span className="font-mono-spec text-outline uppercase tracking-wide">CPU:</span> {listing.specs.cpu.split('(')[0]}
                      </div>
                      <div className="bg-surface-container-low p-1 rounded border border-outline-variant truncate">
                        <span className="font-mono-spec text-outline uppercase tracking-wide">RAM:</span> {listing.specs.ram.split(' ')[0]}
                      </div>
                      <div className="bg-surface-container-low p-1 rounded border border-outline-variant truncate">
                        <span className="font-mono-spec text-outline uppercase tracking-wide">SSD:</span> {listing.specs.storage.split(' ')[0]}
                      </div>
                      <div className="bg-surface-container-low p-1 rounded border border-outline-variant truncate">
                        <span className="font-mono-spec text-outline uppercase tracking-wide">Screen:</span> {listing.specs.screenSize}"
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="border-t border-outline-variant pt-2.5 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-base font-extrabold text-whatsapp-dark font-display">
                          {formatPKR(listing.sale_price)}
                        </span>
                        {listing.original_price && (
                          <span className="text-[11px] text-outline line-through ml-1.5">
                            {formatPKR(listing.original_price)}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-whatsapp-dark font-bold bg-whatsapp/10 px-1.5 py-0.5 rounded border border-whatsapp/30">
                        In Stock
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={getHubWhatsAppLink(listing)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-whatsapp hover:bg-whatsapp-dark text-white text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        onClick={() => navigateTo('hub_detail', { hubId: listing.id })}
                        className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. RECENT P2P COMMUNITY LISTINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary-container rounded p-6 sm:p-7 text-on-primary shadow-md border border-primary">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-6 bg-whatsapp rounded-full inline-block"></span>
                <h2 className="text-lg sm:text-xl font-bold text-on-primary font-display">
                  {romanUrduMode ? 'P2P Used Market' : 'P2P Marketplace'}
                </h2>
                <span className="text-xs text-on-primary-container font-normal">(Direct User Listings)</span>
              </div>
              <p className="text-xs text-on-primary-container mt-1">
                Laptops posted directly by students, devs, and gamers across Pakistani cities. 0% platform commission.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('sell')}
                className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{romanUrduMode ? 'Post Free Ad' : 'Sell Laptop'}</span>
              </button>
              <button
                onClick={() => navigateTo('marketplace')}
                className="bg-primary hover:bg-primary/80 text-on-primary font-semibold text-xs px-3.5 py-2 rounded-lg border border-primary flex items-center gap-1 transition-colors"
              >
                <span>Browse All P2P</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* P2P Listing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentP2P.map((listing) => (
              <div
                key={listing.id}
                className="bg-primary/90 rounded-xl border border-primary/80 p-3.5 space-y-3 hover:border-whatsapp/50 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div
                    onClick={() => navigateTo('marketplace_detail', { p2pId: listing.id })}
                    className="h-36 rounded-lg overflow-hidden bg-primary cursor-pointer relative"
                  >
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-primary/80 text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-md">
                      {listing.condition}
                    </div>
                    <div className="absolute bottom-2 left-2 bg-primary-container/90 text-on-primary text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-md">
                      <MapPin className="w-3 h-3 text-on-primary-container" />
                      <span>{listing.seller_city}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-on-primary-container mb-1">
                      <span className="font-semibold text-on-primary">{listing.seller_name}</span>
                      {listing.is_phone_verified && (
                        <span className="text-whatsapp text-[10px] flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Verified Seller
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => navigateTo('marketplace_detail', { p2pId: listing.id })}
                      className="font-bold text-on-primary text-xs sm:text-sm line-clamp-1 hover:text-whatsapp cursor-pointer transition-colors"
                    >
                      {listing.title}
                    </h3>
                    <p className="text-[11px] text-on-primary-container line-clamp-1 mt-0.5">
                      {listing.specs.cpu} • {listing.specs.ram} • {listing.specs.storage}
                    </p>
                  </div>
                </div>

                <div className="border-t border-primary/80 pt-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-on-primary-container block leading-none">Asking Price</span>
                    <span className="text-base font-extrabold text-on-primary font-display">
                      {formatPKR(listing.asking_price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={getP2PWhatsAppLink(listing)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-whatsapp hover:bg-whatsapp-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      onClick={() => navigateTo('marketplace_detail', { p2pId: listing.id })}
                      className="bg-primary-container hover:bg-primary text-on-primary text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW APNA LAPTOP WORKS (DUAL PATH) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-container-lowest rounded-lg p-6 sm:p-10 border border-outline-variant shadow-sm space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface font-display">
              {romanUrduMode ? 'Apna Laptop Kaise Kaam Karta Hai?' : 'How Apna Laptop Works'}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Simple, transparent, and built around Pakistan's WhatsApp commerce habits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buyer Path */}
            <div className="bg-whatsapp/10 rounded p-6 border border-whatsapp/20 space-y-4">
              <div className="flex items-center gap-2 text-whatsapp-dark font-bold">
                <Store className="w-5 h-5 text-whatsapp-dark" />
                <h3 className="text-base font-bold">For Buyers (Laptop Khareednay Walay)</h3>
              </div>

              <div className="space-y-3 text-xs text-on-surface-variant">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-whatsapp text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-on-surface">Browse Hub or Take the Quiz:</strong> Search verified stock with spec filters or let our Finder Wizard pick the best match for your budget.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-whatsapp text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-on-surface">Inspect & Chat on WhatsApp:</strong> View real photos, test videos, or request custom RAM/SSD upgrades directly from the supplier.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-whatsapp text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-on-surface">Cash on Delivery & 7-Day Warranty:</strong> Pay at your doorstep anywhere in Pakistan with complete checking warranty.
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Path */}
            <div className="bg-whatsapp/10 rounded p-6 border border-whatsapp/20 space-y-4">
              <div className="flex items-center gap-2 text-whatsapp-dark font-bold">
                <PlusCircle className="w-5 h-5 text-whatsapp-dark" />
                <h3 className="text-base font-bold">For Sellers (Laptop Bechnay Walay)</h3>
              </div>

              <div className="space-y-3 text-xs text-on-surface-variant">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-whatsapp text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-on-surface">Check Fair Value on Price Calculator:</strong> Get realistic PKR market price range based on CPU gen and battery health.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-whatsapp text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-on-surface">Post Free P2P Ad in 2 Minutes:</strong> Auto-transfer specs to the sell form, add photos, set your city, and go live instantly.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-whatsapp text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-on-surface">Direct WhatsApp Inquiries:</strong> Receive messages from genuine local buyers. Zero hidden commission.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VERIFIED REVIEWS FROM PAKISTAN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
          <h2 className="text-2xl font-extrabold text-on-surface font-display">
            {romanUrduMode ? 'Pakistan Bhar Se Khush Grahak' : 'Trusted by Buyers Nationwide'}
          </h2>
          <p className="text-xs text-on-surface-variant">Real customer feedback from Lahore, Karachi, Islamabad & Faisalabad.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(reviews || []).map((rev) => (
            <div
              key={rev.id}
              className="bg-surface-container-lowest rounded p-5 border border-outline-variant shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-on-surface text-sm">{rev.reviewer_name}</span>
                    <span className="text-[10px] bg-whatsapp/10 text-whatsapp-dark font-bold px-1.5 py-0.2 rounded">
                      Verified Buyer
                    </span>
                  </div>
                  <p className="text-xs text-outline">{rev.reviewer_city} • {rev.created_at}</p>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed italic">
                "{rev.comment}"
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
