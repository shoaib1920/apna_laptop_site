import React, { useState } from 'react';
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
} from 'lucide-react';
import { HubListing, Review, User } from '../types';
import { formatPKR, getHubWhatsAppLink } from '../utils/helpers';

interface HubDetailViewProps {
  listingId: string;
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
  listingId,
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
  const listing = (hubListings || []).find((item) => item.id === listingId) || hubListings[0];
  const isSaved = (wishlist || []).includes(listing?.id || '');

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedRamUpgrade, setSelectedRamUpgrade] = useState<{ label: string; price: number; ramAdded: string } | null>(null);
  const [selectedStorageUpgrade, setSelectedStorageUpgrade] = useState<{ label: string; price: number; storageAdded: string } | null>(null);

  // Review modal/form state
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewName, setReviewName] = useState<string>(currentUser?.name || '');
  const [reviewCity, setReviewCity] = useState<string>(currentUser?.city || 'Lahore');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [addedToCartToast, setAddedToCartToast] = useState<boolean>(false);

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-on-surface">Product not found</h2>
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

  const handleAddToCart = () => {
    addToCart(listing, selectedRamUpgrade || undefined, selectedStorageUpgrade || undefined);
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 3000);
  };

  const handleBuyNow = () => {
    addToCart(listing, selectedRamUpgrade || undefined, selectedStorageUpgrade || undefined);
    navigateTo('checkout');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    addReview({
      target_type: 'hub_order',
      target_id: listing.id,
      reviewer_name: reviewName || 'Verified Buyer',
      reviewer_city: reviewCity || 'Pakistan',
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const itemReviews = (reviews || []).filter((r) => r.target_id === listing.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('hub')}
          className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-whatsapp-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Laptop Hub</span>
        </button>
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
          <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-primary border border-outline-variant shadow-md">
            <img
              src={listing.images[activeImageIndex] || listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            {/* Badges on image */}
            <div className="absolute top-3 left-3 bg-whatsapp text-white text-xs font-bold px-3 py-1 rounded-lg shadow">
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
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-whatsapp scale-105 shadow-sm'
                      : 'border-outline-variant opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Supplier Verification Card */}
          <div className="bg-whatsapp/10 rounded p-4 border border-whatsapp/30 text-xs text-whatsapp-dark space-y-2">
            <div className="flex items-center gap-2 font-bold text-whatsapp-dark">
              <ShieldCheck className="w-5 h-5 text-whatsapp-dark" />
              <span>Apna Laptop Supplier Verification</span>
            </div>
            <p className="text-whatsapp-dark leading-relaxed">
              {listing.supplierNote || 'Inspected by verified shop partner in Hafeez Centre, Lahore.'}
            </p>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-whatsapp-dark pt-1">
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
                <span className="text-2xl sm:text-3xl font-extrabold text-on-primary font-display">
                  {formatPKR(finalPrice)}
                </span>
                {listing.original_price && (
                  <span className="text-sm text-on-primary-container line-through">
                    {formatPKR(listing.original_price)}
                  </span>
                )}
              </div>
              {upgradeTotal > 0 && (
                <span className="text-[11px] text-whatsapp block mt-0.5">
                  Includes +{formatPKR(upgradeTotal)} in custom hardware upgrades
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block bg-whatsapp/20 text-whatsapp text-xs font-bold px-2.5 py-1 rounded-lg border border-whatsapp/40">
                {listing.stock_qty > 0 ? `In Stock (${listing.stock_qty} available)` : 'Out of Stock'}
              </span>
              <span className="text-[11px] text-on-primary-container block mt-1">Cash on Delivery Available</span>
            </div>
          </div>

          {/* UPGRADE ADDON SELECTOR */}
          {listing.availableUpgrades && (
            <div className="bg-surface-container-low rounded p-4 border border-outline-variant space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-whatsapp-dark" />
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
                          ? 'bg-whatsapp text-white font-bold border-whatsapp shadow-sm'
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
                            ? 'bg-whatsapp text-white font-bold border-whatsapp shadow-sm'
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
                          ? 'bg-whatsapp text-white font-bold border-whatsapp shadow-sm'
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
                            ? 'bg-whatsapp text-white font-bold border-whatsapp shadow-sm'
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
          <div className="space-y-2.5">
            {/* WhatsApp Deep Link Button */}
            <a
              id="whatsapp-buy-btn"
              href={getHubWhatsAppLink(listing)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-extrabold py-3.5 px-4 rounded flex items-center justify-center gap-2.5 shadow-sm transition-all hover:scale-[1.01]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{romanUrduMode ? 'WhatsApp Par Baat Karein & Deal Lock Karein' : 'Chat on WhatsApp to Buy'}</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="add-to-cart-btn"
                onClick={handleAddToCart}
                className="bg-primary hover:bg-primary-container text-on-primary font-bold py-3 rounded text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                id="buy-now-cod-btn"
                onClick={handleBuyNow}
                className="bg-whatsapp-dark hover:bg-whatsapp text-white font-extrabold py-3 rounded text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <Truck className="w-4 h-4" />
                <span>Order with COD</span>
              </button>
            </div>

            {addedToCartToast && (
              <div className="bg-whatsapp/10 text-whatsapp-dark border border-whatsapp/30 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
                <span>✓ Added to cart with selected upgrades!</span>
                <button onClick={() => navigateTo('cart')} className="underline font-bold">
                  View Cart
                </button>
              </div>
            )}
          </div>

          {/* Key Trust Checkpoints */}
          <div className="border-t border-outline-variant pt-4 grid grid-cols-2 gap-3 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-whatsapp-dark shrink-0" />
              <span>{listing.warrantyMonths}-Month Checking Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-whatsapp-dark shrink-0" />
              <span>Free Delivery in Pakistan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-whatsapp-dark shrink-0" />
              <span>Open Parcel Checking Allowed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-whatsapp-dark shrink-0" />
              <span>Original Charger Included</span>
            </div>
          </div>
        </div>
      </div>

      {/* FULL SPECIFICATION SHEET */}
      <section className="bg-surface-container-lowest rounded-lg p-6 sm:p-8 border border-outline-variant shadow-sm space-y-6">
        <div className="border-b border-outline-variant pb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-on-surface font-display flex items-center gap-2">
            <Layers className="w-5 h-5 text-whatsapp-dark" />
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
            <span className="font-bold text-whatsapp-dark text-right">{listing.condition}</span>
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
            className="bg-whatsapp/10 hover:bg-whatsapp/20 text-whatsapp-dark text-xs font-bold px-3.5 py-2 rounded-xl border border-whatsapp/30 transition-colors"
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
                    <span className="text-[10px] text-whatsapp-dark bg-whatsapp/10 font-bold px-1.5 py-0.2 rounded">
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
                <CheckCircle2 className="w-10 h-10 text-whatsapp-dark mx-auto" />
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
                  <label className="font-bold text-on-surface-variant block mb-1">City in Pakistan</label>
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
                    className="px-5 py-2 rounded-xl text-white font-bold bg-whatsapp hover:bg-whatsapp-dark shadow"
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
