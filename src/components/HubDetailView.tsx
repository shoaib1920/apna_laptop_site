import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  MessageCircle,
  ShoppingCart,
  Heart,
  Star,
  Cpu,
  HardDrive,
  Monitor,
  BatteryCharging,
  Layers,
  ArrowLeft,
  Share2,
  Check,
  AlertCircle,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  BellRing,
  MapPin,
  Loader2,
} from 'lucide-react';
import { HubListing, Review, User } from '../types';
import { useShop } from '../services/store';
import { brandPath } from '../services/router';
import { SERVICE_AREA_CITIES } from '../services/pricingEngine';
import { CITY_DELIVERY, EXPRESS_DELIVERY_FEE, LOW_STOCK_THRESHOLD } from '../config';
import { formatPKR, getHubWhatsAppLink, isOutOfStock, optimizeImage, productPath, productUrl } from '../utils/helpers';
import { ImageZoomViewer } from './ImageZoomViewer';
import { RecentlyViewed } from './Overlays';

interface HubDetailViewProps {
  /** The open laptop; undefined while the catalogue loads or if it no longer exists. */
  listing?: HubListing;
  catalogLoaded: boolean;
  hubListings: HubListing[];
  reviews: Review[];
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  addToCart: (
    listing: HubListing,
    selectedRamUpgrade?: { label: string; price: number; ramAdded: string },
    selectedStorageUpgrade?: { label: string; price: number; storageAdded: string }
  ) => void;
  addReview: (review: Omit<Review, 'id' | 'created_at'>) => void;
  navigateTo: (route: string, params?: any) => void;
  currentUser: User | null;
  romanUrduMode: boolean;
}

export const HubDetailView: React.FC<HubDetailViewProps> = ({
  listing,
  catalogLoaded,
  hubListings = [],
  reviews = [],
  wishlist = [],
  toggleWishlist,
  addToCart,
  addReview,
  navigateTo,
  currentUser,
  romanUrduMode,
}) => {
  const shop = useShop();
  const isSaved = (wishlist || []).includes(listing?.id || '');

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedRamUpgrade, setSelectedRamUpgrade] = useState<{ label: string; price: number; ramAdded: string } | null>(null);
  const [selectedStorageUpgrade, setSelectedStorageUpgrade] = useState<{ label: string; price: number; storageAdded: string } | null>(null);

  // Review modal/form state
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewName, setReviewName] = useState<string>(currentUser?.name || '');
  const [reviewCity, setReviewCity] = useState<string>(currentUser?.city || 'Nankana Sahib');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [addedToCartToast, setAddedToCartToast] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [zoomOpen, setZoomOpen] = useState<boolean>(false);
  const [hoverOrigin, setHoverOrigin] = useState<string | null>(null);
  const [checkCity, setCheckCity] = useState<string>(SERVICE_AREA_CITIES[0]);
  const touchStartX = useRef<number | null>(null);

  // A shared link can arrive before the catalogue has loaded.
  if (!listing && !catalogLoaded) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-outline" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-on-surface">Sorry, this laptop is no longer listed</h2>
        <p className="text-xs text-on-surface-variant">It may have been sold. Have a look at what is in stock now.</p>
        <button
          onClick={() => navigateTo('hub')}
          className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Back to Hub
        </button>
      </div>
    );
  }

  // Calculate final dynamic price with upgrades
  const upgradeTotal = (selectedRamUpgrade?.price || 0) + (selectedStorageUpgrade?.price || 0);
  const finalPrice = listing.sale_price + upgradeTotal;

  const soldOut = isOutOfStock(listing);
  const imageCount = listing.images.length;
  const showImage = (index: number) => setActiveImageIndex((index + imageCount) % imageCount);

  const addSelectionToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(listing, selectedRamUpgrade || undefined, selectedStorageUpgrade || undefined);
    }
  };

  const handleAddToCart = () => {
    addSelectionToCart();
    shop.notify('Added to bag');
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 3000);
  };

  const handleBuyNow = () => {
    addSelectionToCart();
    navigateTo('checkout');
  };

  // Goes through the same checkout form so the order is saved, then opens WhatsApp.
  const handleWhatsAppOrder = () => {
    addSelectionToCart();
    shop.orderOnWhatsApp();
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    addReview({
      target_type: 'hub_order',
      target_id: listing.id,
      reviewer_name: reviewName || 'Verified Buyer',
      reviewer_city: reviewCity || 'Nankana Sahib',
      is_verified_purchase: true,
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
    setReviewSubmitted(true);
    setTimeout(() => {
      setShowReviewModal(false);
      setReviewSubmitted(false);
      setReviewComment('');
    }, 1500);
  };

  const handleShare = async () => {
    const url = productUrl(listing);
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, text: `${listing.title} - ${formatPKR(listing.sale_price)}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // share sheet dismissed
    }
  };

  const related = [
    ...hubListings.filter((l) => l.id !== listing.id && l.brand === listing.brand),
    ...hubListings.filter((l) => l.id !== listing.id && l.brand !== listing.brand),
  ]
    .filter((l) => !isOutOfStock(l))
    .slice(0, 4);
  const cityInfo = CITY_DELIVERY[checkCity];

  const itemReviews = (reviews || []).filter((r) => r.target_id === listing.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24 lg:pb-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant min-w-0">
          <button onClick={() => navigateTo('hub')} className="flex items-center gap-1.5 hover:text-steel-dark shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span>Laptop Hub</span>
          </button>
          <span className="text-outline">/</span>
          <a
            href={brandPath(listing.brand)}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('hub', { brand: listing.brand });
            }}
            className="hover:text-steel-dark shrink-0"
          >
            {listing.brand}
          </a>
          <span className="text-outline hidden sm:inline">/</span>
          <span className="truncate font-medium hidden sm:inline">{listing.title}</span>
        </nav>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface font-semibold bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? 'Link Copied!' : 'Share Laptop'}</span>
        </button>
      </div>

      {/* Main Product Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-3">
          {/* Main Large Image */}
          <div
            className="relative aspect-4/3 rounded-lg overflow-hidden bg-white border border-outline-variant shadow-md"
            onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX.current === null || imageCount < 2) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(dx) > 40) showImage(activeImageIndex + (dx < 0 ? 1 : -1));
            }}
          >
            {/* Hovering with a mouse magnifies the spot under the cursor; click opens the full viewer. */}
            <img
              src={optimizeImage(listing.images[activeImageIndex] || listing.images[0], 1000)}
              alt={listing.title}
              onClick={() => setZoomOpen(true)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoverOrigin(
                  `${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`
                );
              }}
              onMouseLeave={() => setHoverOrigin(null)}
              style={hoverOrigin ? { transformOrigin: hoverOrigin, transform: 'scale(2)' } : undefined}
              className="w-full h-full object-contain p-6 cursor-zoom-in transition-transform duration-150"
            />
            {imageCount > 1 && (
              <>
                <button
                  onClick={() => showImage(activeImageIndex - 1)}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-surface-container-lowest/90 rounded-full shadow"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => showImage(activeImageIndex + 1)}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-surface-container-lowest/90 rounded-full shadow"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="absolute bottom-3 left-3 bg-primary/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {activeImageIndex + 1} / {imageCount}
                </span>
              </>
            )}
            <button
              onClick={() => setZoomOpen(true)}
              aria-label="Zoom photo"
              className="absolute bottom-3 right-3 p-2 bg-surface-container-lowest/90 rounded-full shadow text-on-surface-variant"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {/* Badges on image */}
            <div className="absolute top-3 left-3 bg-copper text-white text-xs font-bold px-3 py-1 rounded-lg shadow">
              Verified Stock • {listing.condition}
            </div>
            <button
              onClick={() => toggleWishlist(listing.id)}
              className="absolute top-3 right-3 p-2 bg-surface-container-lowest/90 backdrop-blur-md rounded-full shadow text-on-surface-variant hover:text-error transition-colors"
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'text-error fill-error' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-16 rounded-xl overflow-hidden bg-white border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-steel scale-105 shadow-sm'
                      : 'border-outline-variant opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={optimizeImage(img, 160)} alt="" className="w-full h-full object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}

          {/* Supplier Verification Card */}
          <div className="bg-copper/10 rounded p-4 border border-copper/30 text-xs text-copper-dark space-y-2">
            <div className="flex items-center gap-2 font-bold text-copper-dark">
              <ShieldCheck className="w-5 h-5 text-copper-dark" />
              <span>Apna Laptop Supplier Verification</span>
            </div>
            <p className="text-copper-dark leading-relaxed">
              {listing.supplierNote || 'Inspected by our verified supplier partner before listing.'}
            </p>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-copper-dark pt-1">
              <span>✓ 7-Day Checking Warranty</span>
              <span>✓ Genuine Motherboard Guaranteed</span>
              <span>✓ Free Delivery</span>
            </div>
          </div>
        </div>

        {/* Right Info & Checkout Panel (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-primary text-on-primary text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                {listing.brand}
              </span>
              <span className="text-amber-500 font-semibold text-xs flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {listing.rating} ({listing.reviewCount} customer reviews)
              </span>
              <span className="text-xs text-on-surface-variant">
                • Model: <strong>{listing.model}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface font-display leading-snug">
              {listing.title}
            </h1>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {listing.shortDescription}
            </p>
          </div>

          {/* Price Box */}
          <div className="bg-primary text-on-primary rounded p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-xs text-on-primary-container block">Total Sale Price (PKR)</span>
              <div className="flex items-baseline gap-2">
                <span className="price text-2xl sm:text-3xl">
                  {formatPKR(finalPrice)}
                </span>
                {listing.original_price && listing.original_price > finalPrice && (
                  <>
                    <span className="text-sm text-on-primary-container line-through">
                      {formatPKR(listing.original_price)}
                    </span>
                    <span className="text-[11px] font-extrabold text-deal bg-deal-container px-1.5 py-0.5 rounded">
                      -{Math.round((1 - finalPrice / listing.original_price) * 100)}%
                    </span>
                  </>
                )}
              </div>
              {upgradeTotal > 0 && (
                <span className="text-[11px] text-steel block mt-0.5">
                  Includes +{formatPKR(upgradeTotal)} in custom hardware upgrades
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block bg-steel/20 text-steel text-xs font-bold px-2.5 py-1 rounded-lg border border-steel/40">
                {soldOut
                  ? 'Out of Stock'
                  : listing.stock_qty <= LOW_STOCK_THRESHOLD
                  ? `Only ${listing.stock_qty} left`
                  : `In Stock (${listing.stock_qty} available)`}
              </span>
              <span className="text-[11px] text-on-primary-container block mt-1">Cash on Delivery Available</span>
            </div>
          </div>

          {/* UPGRADE ADDON SELECTOR */}
          {listing.availableUpgrades && (
            <div className="bg-surface-container-low rounded p-4 border border-outline-variant space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-steel-dark" />
                  <span>Custom Hardware Upgrades (Optional)</span>
                </span>
                <span className="text-[10px] text-on-surface-variant">Installed & tested before dispatch</span>
              </div>

              {/* RAM options */}
              {listing.availableUpgrades?.ramOptions && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-on-surface-variant">RAM Expansion:</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedRamUpgrade(null)}
                      className={`text-xs px-3 py-1.5 rounded-xl border text-left transition-all ${
                        !selectedRamUpgrade
                          ? 'bg-steel text-white font-bold border-steel shadow-sm'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                      }`}
                    >
                      Default ({listing.specs.ram.split(' ')[0]})
                    </button>
                    {listing.availableUpgrades.ramOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedRamUpgrade(opt)}
                        className={`text-xs px-3 py-1.5 rounded-xl border text-left transition-all ${
                          selectedRamUpgrade?.label === opt.label
                            ? 'bg-steel text-white font-bold border-steel shadow-sm'
                            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                        }`}
                      >
                        {opt.label} (+{formatPKR(opt.price)})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Storage options */}
              {listing.availableUpgrades?.storageOptions && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant">Storage SSD Upgrade:</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedStorageUpgrade(null)}
                      className={`text-xs px-3 py-1.5 rounded-xl border text-left transition-all ${
                        !selectedStorageUpgrade
                          ? 'bg-steel text-white font-bold border-steel shadow-sm'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                      }`}
                    >
                      Default ({listing.specs.storage.split(' ')[0]})
                    </button>
                    {listing.availableUpgrades.storageOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedStorageUpgrade(opt)}
                        className={`text-xs px-3 py-1.5 rounded-xl border text-left transition-all ${
                          selectedStorageUpgrade?.label === opt.label
                            ? 'bg-steel text-white font-bold border-steel shadow-sm'
                            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                        }`}
                      >
                        {opt.label} (+{formatPKR(opt.price)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Primary Action Buttons */}
          {soldOut ? (
            <div className="space-y-2.5">
              <button
                onClick={() => shop.setRestockFor(listing)}
                className="w-full bg-primary hover:bg-primary-container text-on-primary font-extrabold py-3.5 px-4 rounded flex items-center justify-center gap-2.5"
              >
                <BellRing className="w-5 h-5" />
                <span>Request restock notification</span>
              </button>
              <a
                href={getHubWhatsAppLink(listing)}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs font-bold text-whatsapp-dark underline"
              >
                Ask on WhatsApp about a similar laptop
              </a>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-on-surface-variant">Quantity</span>
                <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="p-1 text-outline hover:text-on-surface"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold px-2 min-w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(listing.stock_qty, q + 1))}
                    disabled={quantity >= listing.stock_qty}
                    aria-label="Increase quantity"
                    className="p-1 text-outline hover:text-on-surface disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                id="whatsapp-buy-btn"
                onClick={handleWhatsAppOrder}
                className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-extrabold py-3.5 px-4 rounded flex items-center justify-center gap-2.5 shadow-sm transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{romanUrduMode ? 'WhatsApp Par Order Karein' : 'Order on WhatsApp'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="add-to-cart-btn"
                  onClick={handleAddToCart}
                  className="bg-primary hover:bg-primary-container text-on-primary font-bold py-3 rounded text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart ({formatPKR(finalPrice * quantity)})</span>
                </button>

                <button
                  id="buy-now-cod-btn"
                  onClick={handleBuyNow}
                  className="bg-steel-dark hover:bg-steel text-white font-extrabold py-3 rounded text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  <span>Order with COD</span>
                </button>
              </div>

              {addedToCartToast && (
                <div className="bg-steel/10 text-steel-dark border border-steel/30 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
                  <span>✓ Added to cart with selected upgrades!</span>
                  <button onClick={() => navigateTo('cart')} className="underline font-bold">
                    View Cart
                  </button>
                </div>
              )}

              <a
                href={getHubWhatsAppLink(listing)}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs font-bold text-on-surface-variant hover:text-whatsapp-dark underline"
              >
                Have a question? Ask on WhatsApp
              </a>
            </div>
          )}

          {/* City delivery checker */}
          <div className="bg-surface-container-low rounded p-4 border border-outline-variant text-xs space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-on-surface flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-steel-dark" />
                Delivery to
              </span>
              <select
                value={checkCity}
                onChange={(e) => setCheckCity(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1.5 font-semibold"
              >
                {SERVICE_AREA_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <ul className="text-on-surface-variant space-y-0.5">
              <li>
                Estimated delivery: <strong className="text-on-surface">{cityInfo?.days || 'Next day'}</strong> by local
                rider, free
              </li>
              <li>Cash on Delivery: available, check the laptop before paying</li>
              {cityInfo?.express && <li>Same-day express: {formatPKR(EXPRESS_DELIVERY_FEE)}</li>}
            </ul>
          </div>

          {/* Key Trust Checkpoints */}
          <div className="border-t border-outline-variant pt-4 grid grid-cols-2 gap-3 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-copper-dark shrink-0" />
              <span>{listing.warrantyMonths}-Month Checking Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-copper-dark shrink-0" />
              <span>Free Local Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-copper-dark shrink-0" />
              <span>Open Parcel Checking Allowed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-copper-dark shrink-0" />
              <span>Original Charger Included</span>
            </div>
          </div>
        </div>
      </div>

      {/* FULL SPECIFICATION SHEET */}
      <section className="bg-surface-container-lowest rounded-lg p-6 sm:p-8 border border-outline-variant shadow-sm space-y-6">
        <div className="border-b border-outline-variant pb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-on-surface font-display flex items-center gap-2">
            <Layers className="w-5 h-5 text-steel-dark" />
            <span>Complete Hardware Specifications</span>
          </h2>
          <span className="text-xs text-outline font-medium">100% Genuine Lot Specs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-outline-variant">
            <span className="font-mono-spec text-outline uppercase tracking-wide">Processor (CPU):</span>
            <span className="font-bold text-on-surface text-right">{listing.specs.cpu}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-outline-variant">
            <span className="font-mono-spec text-outline uppercase tracking-wide">Installed RAM:</span>
            <span className="font-bold text-on-surface text-right">{listing.specs.ram}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-outline-variant">
            <span className="font-mono-spec text-outline uppercase tracking-wide">Primary Storage:</span>
            <span className="font-bold text-on-surface text-right">{listing.specs.storage}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-outline-variant">
            <span className="font-mono-spec text-outline uppercase tracking-wide">Graphics Card (GPU):</span>
            <span className="font-bold text-on-surface text-right">{listing.specs.gpu}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-outline-variant">
            <span className="font-mono-spec text-outline uppercase tracking-wide">Display Screen:</span>
            <span className="font-bold text-on-surface text-right">
              {listing.specs.screenSize}" ({listing.specs.resolution || 'FHD 1080p'})
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-outline-variant">
            <span className="font-mono-spec text-outline uppercase tracking-wide">Battery Backup & Health:</span>
            <span className="font-bold text-on-surface text-right">{listing.specs.batteryHealth || '85%+ Health'}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-outline-variant">
            <span className="font-mono-spec text-outline uppercase tracking-wide">Weight:</span>
            <span className="font-bold text-on-surface text-right">{listing.specs.weightKg ? `${listing.specs.weightKg} kg` : 'Standard'}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-outline-variant">
            <span className="font-mono-spec text-outline uppercase tracking-wide">Condition Grade:</span>
            <span className="font-bold text-copper-dark text-right">{listing.condition}</span>
          </div>

          {listing.specs.ports && (
            <div className="md:col-span-2 py-2 border-b border-outline-variant flex flex-col sm:flex-row justify-between gap-1">
              <span className="font-mono-spec text-outline uppercase tracking-wide">Ports & Connectivity:</span>
              <span className="font-semibold text-on-surface text-right">{listing.specs.ports.join(' • ')}</span>
            </div>
          )}
        </div>

        {/* Detailed description */}
        <div className="bg-surface-container-low p-4 rounded text-xs text-on-surface-variant space-y-2 border border-outline-variant/70">
          <h4 className="font-bold text-on-surface">About this Unit & Usage Suitability</h4>
          <p className="leading-relaxed">{listing.fullDescription}</p>
        </div>
      </section>

      {/* REVIEWS & RATINGS SECTION */}
      <section className="bg-surface-container-lowest rounded-lg p-6 sm:p-8 border border-outline-variant shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface font-display flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span>Customer Reviews & Feedback</span>
            </h2>
            <p className="text-xs text-on-surface-variant">Real verified buyers who purchased this model.</p>
          </div>
          <button
            onClick={() => setShowReviewModal(true)}
            className="bg-steel/10 hover:bg-steel/20 text-steel-dark text-xs font-bold px-3.5 py-2 rounded-xl border border-steel/30 transition-colors"
          >
            + Write a Review
          </button>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {itemReviews.length === 0 ? (
            <div className="text-center py-6 text-xs text-outline">
              No written reviews for this listing yet. Be the first to leave one!
            </div>
          ) : (
            itemReviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded bg-surface-container-low border border-outline-variant space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface text-xs">{rev.reviewer_name}</span>
                    <span className="text-[10px] text-copper-dark bg-copper/10 font-bold px-1.5 py-0.5 rounded">
                      Verified Purchase
                    </span>
                    <span className="text-[11px] text-outline">• {rev.reviewer_city}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant italic">"{rev.comment}"</p>
                <span className="text-[10px] text-outline block">{rev.created_at}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related laptops */}
      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-on-surface font-display">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {related.map((item) => (
              <a
                key={item.id}
                href={productPath(item)}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('hub_detail', { hubId: item.id });
                }}
                className="bg-surface-container-lowest border border-outline-variant rounded p-3 hover:shadow-card-hover transition-shadow"
              >
                <div className="aspect-4/3 bg-white rounded overflow-hidden">
                  <img
                    src={optimizeImage(item.images[0], 400)}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <div className="text-xs font-semibold text-on-surface line-clamp-2 mt-2">{item.title}</div>
                <div className="price text-sm mt-1">{formatPKR(item.sale_price)}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={listing.id} />

      {/* Mobile sticky purchase bar */}
      {!soldOut && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant px-3 py-2.5 flex items-center gap-2 shadow-[0px_-4px_12px_rgba(26,32,44,0.08)]">
          <div className="flex-1 min-w-0">
            <div className="price text-base leading-tight">{formatPKR(finalPrice * quantity)}</div>
            <div className="text-[10px] text-on-surface-variant truncate">Free delivery · Cash on Delivery</div>
          </div>
          <button
            onClick={handleWhatsAppOrder}
            aria-label="Order on WhatsApp"
            className="bg-whatsapp text-white p-3 rounded"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button
            onClick={handleAddToCart}
            className="bg-primary text-on-primary font-bold text-xs px-4 py-3 rounded flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      )}

      {zoomOpen && (
        <ImageZoomViewer
          images={listing.images.map((img) => optimizeImage(img, 1600))}
          startIndex={activeImageIndex}
          alt={listing.title}
          onClose={() => setZoomOpen(false)}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-lg p-6 max-w-md w-full border border-outline-variant shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <h3 className="font-bold text-on-surface text-sm">Leave a Customer Review</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-xs text-outline hover:text-on-surface">
                ✕
              </button>
            </div>

            {reviewSubmitted ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-steel-dark mx-auto" />
                <p className="text-sm font-bold text-on-surface">Shukriya! Your review has been posted.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Your Name</label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Service Area</label>
                  <input
                    type="text"
                    value={reviewCity}
                    onChange={(e) => setReviewCity(e.target.value)}
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Rating (1 to 5 Stars)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`p-2 rounded-lg border flex items-center justify-center ${
                          reviewRating >= star ? 'bg-amber-50 border-amber-400 text-amber-500' : 'bg-surface-container-low border-outline-variant text-outline'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${reviewRating >= star ? 'fill-amber-400' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Your Feedback / Review</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience regarding screen quality, battery backup, and packaging..."
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 rounded-xl text-on-surface-variant bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-white font-bold bg-steel hover:bg-steel-dark shadow"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
