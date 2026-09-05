import React, { useState } from 'react';
import {
  Users,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ArrowLeft,
  Share2,
  Calendar,
  Layers,
  Send,
  Sparkles,
} from 'lucide-react';
import { P2PListing, User } from '../types';
import { formatPKR, getP2PWhatsAppLink } from '../utils/helpers';

interface MarketplaceDetailViewProps {
  listingId: string;
  p2pListings: P2PListing[];
  currentUser: User | null;
  navigateTo: (route: string, params?: any) => void;
  reportP2PListing: (id: string) => void;
  sendMessage: (receiverId: string, listingId: string, listingTitle: string, text: string) => void;
  romanUrduMode: boolean;
}

export const MarketplaceDetailView: React.FC<MarketplaceDetailViewProps> = ({
  listingId,
  p2pListings = [],
  currentUser,
  navigateTo,
  reportP2PListing,
  sendMessage,
  romanUrduMode,
}) => {
  const listing = (p2pListings || []).find((item) => item.id === listingId) || p2pListings[0];
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showInAppChat, setShowInAppChat] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [messageSent, setMessageSent] = useState<boolean>(false);
  const [reportedToast, setReportedToast] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-on-surface">Listing not found</h2>
        <button
          onClick={() => navigateTo('marketplace')}
          className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !currentUser) return;
    sendMessage(listing.seller_id, listing.id, listing.title, chatMessage.trim());
    setMessageSent(true);
    setTimeout(() => {
      setChatMessage('');
      setMessageSent(false);
      setShowInAppChat(false);
    }, 2000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleReport = () => {
    reportP2PListing(listing.id);
    setReportedToast(true);
    setTimeout(() => setReportedToast(false), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('marketplace')}
          className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-whatsapp-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to P2P Marketplace</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface font-semibold bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? 'Link Copied!' : 'Share Ad'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Photos & Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo */}
          <div className="aspect-4/3 rounded-lg overflow-hidden bg-surface-container-highest border border-outline-variant relative shadow-md">
            <img
              src={listing.images[activeImageIndex] || listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-primary/85 backdrop-blur-md text-on-primary text-xs font-bold px-3 py-1 rounded-lg">
              P2P Community Deal • {listing.condition}
            </div>
            <div className="absolute bottom-3 left-3 bg-primary/90 text-on-primary text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-whatsapp" />
              <span>{listing.seller_city}</span>
            </div>
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

          {/* Detailed Seller Description */}
          <div className="bg-surface-container-lowest rounded-lg p-6 sm:p-8 border border-outline-variant shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-on-surface font-display">
              Seller Description & Condition Notes
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant">
                <span className="text-on-surface-variant block text-[10px]">Original Charger</span>
                <span className="font-bold text-on-surface">
                  {listing.charger_included ? '✓ Included' : '✗ Not Included'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant">
                <span className="text-on-surface-variant block text-[10px]">Original Box</span>
                <span className="font-bold text-on-surface">
                  {listing.box_included ? '✓ Included' : '✗ No Box'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant">
                <span className="text-on-surface-variant block text-[10px]">Warranty</span>
                <span className="font-bold text-on-surface">
                  {listing.warranty_remaining || 'Checking on Spot'}
                </span>
              </div>
            </div>
          </div>

          {/* Specifications Table */}
          <div className="bg-surface-container-lowest rounded-lg p-6 sm:p-8 border border-outline-variant shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-on-surface font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-whatsapp-dark" />
              <span>Hardware Specifications</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-outline-variant">
                <span className="font-mono-spec text-[10px] uppercase text-outline tracking-wide">Processor:</span>
                <span className="font-bold text-on-surface">{listing.specs.cpu}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-outline-variant">
                <span className="font-mono-spec text-[10px] uppercase text-outline tracking-wide">RAM:</span>
                <span className="font-bold text-on-surface">{listing.specs.ram}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-outline-variant">
                <span className="font-mono-spec text-[10px] uppercase text-outline tracking-wide">Storage:</span>
                <span className="font-bold text-on-surface">{listing.specs.storage}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-outline-variant">
                <span className="font-mono-spec text-[10px] uppercase text-outline tracking-wide">Graphics GPU:</span>
                <span className="font-bold text-on-surface">{listing.specs.gpu}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-outline-variant">
                <span className="font-mono-spec text-[10px] uppercase text-outline tracking-wide">Screen Size:</span>
                <span className="font-bold text-on-surface">{listing.specs.screenSize}"</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-outline-variant">
                <span className="font-mono-spec text-[10px] uppercase text-outline tracking-wide">Battery Health:</span>
                <span className="font-bold text-on-surface">{listing.specs.batteryHealth || 'Good'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Seller Profile & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Price & Title Card */}
          <div className="bg-surface-container-lowest rounded-lg p-6 border border-outline-variant shadow-sm space-y-4">
            <div>
              <span className="text-xs text-outline block">Asking Price</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-deal font-display">
                {formatPKR(listing.asking_price)}
              </span>
              <span className="text-[11px] text-on-surface-variant block mt-0.5">
                Negotiable with seller on WhatsApp
              </span>
            </div>

            <h1 className="text-lg font-bold text-on-surface leading-snug">
              {listing.title}
            </h1>

            {/* CTAs */}
            <div className="space-y-2.5 pt-2">
              <a
                href={getP2PWhatsAppLink(listing, currentUser?.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-extrabold py-3 px-4 rounded flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{romanUrduMode ? 'Seller Se WhatsApp Par Baat Karein' : 'Chat on WhatsApp with Seller'}</span>
              </a>

              <button
                onClick={() => setShowInAppChat(!showInAppChat)}
                className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-bold py-2.5 rounded text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-on-surface-variant" />
                <span>Send In-App Message (Backup)</span>
              </button>
            </div>

            {/* In-app chat drawer */}
            {showInAppChat && (
              <div className="bg-surface-container-low p-4 rounded border border-outline-variant space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-on-surface">Message {listing.seller_name}</span>
                  <button onClick={() => setShowInAppChat(false)} className="text-xs text-outline">✕</button>
                </div>

                {messageSent ? (
                  <div className="text-center py-3 text-xs text-whatsapp-dark bg-whatsapp/10 rounded-xl font-semibold">
                    ✓ Message sent to seller's in-app inbox!
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <textarea
                      rows={3}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder={`Salam ${listing.seller_name}, is this laptop still available in ${listing.seller_city}?`}
                      required
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs focus:outline-none focus:border-whatsapp"
                    />
                    <button
                      type="submit"
                      disabled={!currentUser}
                      className="w-full bg-whatsapp hover:bg-whatsapp-dark disabled:opacity-50 text-white font-bold text-xs py-2 rounded-xl"
                    >
                      {currentUser ? 'Send Message' : 'Login required to message'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Seller Profile Card */}
          <div className="bg-surface-container-lowest rounded-lg p-6 border border-outline-variant shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-surface-container-low text-on-surface flex items-center justify-center font-bold text-lg">
                {listing.seller_name[0]}
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                  <span>{listing.seller_name}</span>
                  {listing.is_phone_verified && (
                    <span title="Verified Phone Number">
                      <CheckCircle2 className="w-4 h-4 text-whatsapp-dark" />
                    </span>
                  )}
                </h3>
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-whatsapp-dark" />
                  <span>{listing.seller_city}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant border-t border-outline-variant pt-3">
              <div>
                <span className="text-[10px] text-outline block">Phone Status</span>
                <span className="font-bold text-whatsapp-dark bg-whatsapp/10 rounded px-1 -mx-1 inline-block">✓ Verified OTP</span>
              </div>
              <div>
                <span className="text-[10px] text-outline block">Listing Status</span>
                <span className="font-bold text-on-surface">Active</span>
              </div>
            </div>

            <div className="text-outline text-[11px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Posted on {listing.created_at} • {listing.view_count} views</span>
            </div>
          </div>

          {/* Optional "Get it Verified by Apna Laptop" Feature Promotion */}
          <div className="bg-primary-container/5 rounded-lg p-5 border border-outline-variant text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-on-surface font-bold">
              <Sparkles className="w-4 h-4 text-whatsapp-dark" />
              <span>Want Physical Verification?</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              You can request Apna Laptop technicians in Lahore/Karachi to physically inspect this laptop's motherboard and battery before you pay the seller.
            </p>
            <a
              href={`https://wa.me/923001234567?text=${encodeURIComponent(`Hi Apna Laptop, I want to book a physical inspection service for P2P listing: ${listing.title} in ${listing.seller_city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-bold text-whatsapp-dark hover:text-whatsapp underline pt-1"
            >
              Ask about Verification Service →
            </a>
          </div>

          {/* Report Listing Button */}
          <div className="flex items-center justify-between text-xs text-outline pt-2">
            <span>Notice any fraud or spam?</span>
            <button
              onClick={handleReport}
              className="text-error hover:text-on-error-container font-semibold flex items-center gap-1"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report this Ad</span>
            </button>
          </div>

          {reportedToast && (
            <div className="bg-error-container border border-error/20 text-on-error-container p-2.5 rounded-xl text-xs font-semibold">
              Ad flagged for moderation review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
