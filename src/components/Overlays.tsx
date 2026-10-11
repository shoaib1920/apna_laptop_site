import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  BellRing,
  MessageCircle,
  ShoppingCart,
  Heart,
  Send,
  Tag,
  Copy,
} from 'lucide-react';
import { useShop } from '../services/store';
import { discountLabel } from '../services/discounts';
import { STORE_NAME, WHATSAPP_NUMBER } from '../config';
import { PHONE_HINT, toPhoneKey } from '../utils/phone';
import { formatPKR, isOutOfStock, optimizeImage, waLink } from '../utils/helpers';

// Small site-wide overlays: toasts, restock request, quick view, floating
// WhatsApp help and the featured-offer popup.

export const Toasts: React.FC = () => {
  const { toasts } = useShop();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 w-[min(92vw,360px)] print:hidden">
      {toasts.map((t) => {
        const Icon = t.kind === 'error' ? AlertCircle : t.kind === 'info' ? Info : CheckCircle2;
        return (
          <div
            key={t.id}
            role="status"
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold ${
              t.kind === 'error' ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{t.text}</span>
          </div>
        );
      })}
    </div>
  );
};

/** "Notify me when it is back": saves a WhatsApp number against the laptop. */
export const RestockModal: React.FC = () => {
  const { restockFor, setRestockFor, requestRestock, notify } = useShop();
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!restockFor) return null;
  const close = () => {
    setRestockFor(null);
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toPhoneKey(contact)) {
      setError(PHONE_HINT);
      return;
    }
    setSaving(true);
    try {
      await requestRestock(restockFor, contact);
      notify('We will message you on WhatsApp when it is available');
      setContact('');
      close();
    } catch (err) {
      console.error('Failed to save restock request:', err);
      setError('Could not save your request. Please message us on WhatsApp instead.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-lg p-6 max-w-sm w-full border border-outline-variant shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-on-surface text-sm flex items-center gap-2">
            <BellRing className="w-4 h-4 text-copper-dark" />
            <span>Tell me when it is available</span>
          </h3>
          <button onClick={close} aria-label="Close">
            <X className="w-4 h-4 text-outline" />
          </button>
        </div>
        <p className="text-xs text-on-surface-variant">
          <strong className="text-on-surface">{restockFor.title}</strong> - leave your WhatsApp number and we will
          message you when this or a similar laptop is in stock.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="tel"
            value={contact}
            onChange={(e) => {
              setContact(e.target.value);
              setError('');
            }}
            placeholder="03001234567"
            required
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm font-semibold"
          />
          {error && <p className="text-[11px] text-error font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-steel hover:bg-steel-dark text-white font-bold text-xs py-3 rounded disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Notify me on WhatsApp'}
          </button>
        </form>
      </div>
    </div>
  );
};

/** Quick look at a laptop without leaving the list. */
export const QuickViewModal: React.FC = () => {
  const shop = useShop();
  const listing = shop.hubListings.find((l) => l.id === shop.quickViewId);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => setImageIndex(0), [shop.quickViewId]);
  if (!listing) return null;

  const close = () => shop.setQuickViewId(null);
  const soldOut = isOutOfStock(listing);
  const saved = shop.wishlist.includes(listing.id);

  return (
    <div className="fixed inset-0 bg-primary/60 z-[70] flex items-center justify-center p-4" onClick={close}>
      <div
        className="bg-surface-container-lowest rounded-lg max-w-2xl w-full border border-outline-variant shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-2">
          <button onClick={close} className="p-1.5 rounded hover:bg-surface-container-low" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-5 pb-5">
          <div className="space-y-2">
            <div className="aspect-4/3 bg-white border border-outline-variant rounded overflow-hidden">
              <img
                src={optimizeImage(listing.images[imageIndex] || listing.images[0], 600)}
                alt={listing.title}
                className="w-full h-full object-contain p-3"
              />
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`w-12 h-10 rounded border-2 bg-white shrink-0 overflow-hidden ${
                      i === imageIndex ? 'border-steel' : 'border-outline-variant opacity-70'
                    }`}
                  >
                    <img src={optimizeImage(img, 120)} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <span className="bg-copper-tint text-copper-dark text-[10px] font-bold px-2 py-0.5 rounded">
              {listing.condition}
            </span>
            <h3 className="text-base font-extrabold font-display text-on-surface leading-snug">{listing.title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="price text-xl">{formatPKR(listing.sale_price)}</span>
              {listing.original_price && listing.original_price > listing.sale_price && (
                <span className="text-on-surface-variant line-through">{formatPKR(listing.original_price)}</span>
              )}
            </div>
            <ul className="font-mono-spec text-[11px] text-on-surface-variant space-y-0.5">
              <li>{listing.specs.cpu}</li>
              <li>
                {listing.specs.ram} · {listing.specs.storage}
              </li>
              <li>
                {listing.specs.screenSize}" · {listing.specs.gpu}
              </li>
            </ul>
            <p className="text-on-surface-variant">{listing.shortDescription}</p>

            {soldOut ? (
              <button
                onClick={() => {
                  close();
                  shop.setRestockFor(listing);
                }}
                className="w-full bg-primary text-on-primary font-bold py-2.5 rounded flex items-center justify-center gap-2"
              >
                <BellRing className="w-4 h-4" /> Notify me when available
              </button>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <button
                    onClick={() => {
                      shop.addToCart(listing);
                      shop.notify('Added to bag');
                      close();
                      shop.setCartOpen(true);
                    }}
                    className="bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Bag
                  </button>
                  <button
                    onClick={() => shop.toggleWishlist(listing.id)}
                    className="px-3 border border-outline-variant rounded"
                    aria-label="Save"
                  >
                    <Heart className={`w-4 h-4 ${saved ? 'text-error fill-error' : 'text-on-surface-variant'}`} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    close();
                    shop.orderOnWhatsApp(listing);
                  }}
                  className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-2.5 rounded flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Order on WhatsApp
                </button>
              </div>
            )}
            <button
              onClick={() => {
                close();
                shop.navigateTo('hub_detail', { hubId: listing.id });
              }}
              className="text-steel-dark font-bold underline"
            >
              View full details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Row of the last laptops this visitor opened (saved on the device). */
export const RecentlyViewed: React.FC<{ excludeId?: string }> = ({ excludeId }) => {
  const { recentlyViewed, hubListings, navigateTo } = useShop();
  const items = recentlyViewed
    .filter((id) => id !== excludeId)
    .map((id) => hubListings.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-extrabold text-on-surface font-display">Recently Viewed</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((l) => (
          <button
            key={l.id}
            onClick={() => navigateTo('hub_detail', { hubId: l.id })}
            className="w-40 shrink-0 bg-surface-container-lowest border border-outline-variant rounded p-2.5 text-left hover:shadow-card-hover transition-shadow"
          >
            <div className="aspect-4/3 bg-white rounded overflow-hidden">
              <img
                src={optimizeImage(l.images[0], 320)}
                alt={l.title}
                loading="lazy"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="text-[11px] font-semibold text-on-surface line-clamp-2 mt-1.5">{l.title}</div>
            <div className="price text-xs mt-0.5">{formatPKR(l.sale_price)}</div>
          </button>
        ))}
      </div>
    </section>
  );
};

const QUICK_PROMPTS = [
  'Which laptop is best for a student?',
  'Do you deliver to my town?',
  'I want to know about the checking warranty',
  'I need help with my order',
];

/** Floating WhatsApp help: quick questions plus a free-text box. This is for
 * questions only - ordering goes through checkout so the order is saved. */
export const FloatingWhatsApp: React.FC<{ raised: boolean }> = ({ raised }) => {
  const { romanUrduMode } = useShop();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const send = (message: string) => {
    if (!message.trim()) return;
    window.open(waLink(WHATSAPP_NUMBER, `Salam ${STORE_NAME}! ${message.trim()}`), '_blank', 'noopener');
    setText('');
    setOpen(false);
  };

  return (
    <aside
      id="floating-whatsapp-widget"
      className={`fixed ${raised ? 'bottom-24' : 'bottom-6'} lg:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2 print:hidden`}
      aria-label="Apna Laptop WhatsApp Help"
    >
      {open && (
        <div className="w-72 bg-surface-container-lowest rounded-lg shadow-2xl border border-outline-variant overflow-hidden">
          <div className="bg-whatsapp-dark text-white px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">{STORE_NAME} Help</div>
              <div className="text-[10px] opacity-90">We usually reply within minutes</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 space-y-1.5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="w-full text-left text-xs bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface"
              >
                {q}
              </button>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(text);
              }}
              className="flex gap-1.5 pt-1"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-xs"
              />
              <button type="submit" className="bg-whatsapp text-white px-3 rounded" aria-label="Send on WhatsApp">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2.5 bg-whatsapp hover:bg-whatsapp-dark text-white px-4 py-3 rounded-full shadow-2xl shadow-whatsapp/40 transition-all hover:scale-105"
      >
        <MessageCircle className="w-5 h-5 fill-white text-whatsapp shrink-0" />
        <span className="text-xs font-bold font-display hidden sm:inline whitespace-nowrap">
          {romanUrduMode ? 'WhatsApp Par Rabta Karein' : 'Chat on WhatsApp'}
        </span>
      </button>
    </aside>
  );
};

const PROMO_SEEN_KEY = 'apna_laptop_promo_seen';

/** Shows the featured discount code once per browser session, about 10
 * seconds in. Never over the bag, checkout, chat or the guided tour, and
 * not at all when no code is featured. */
export const PromoPopup: React.FC = () => {
  const shop = useShop();
  const { featuredDiscount, currentRoute, cartOpen, chatOpen } = shop;
  const [show, setShow] = useState(false);
  const busy =
    cartOpen || chatOpen || ['checkout', 'admin', 'track', 'account'].includes(currentRoute) || Boolean(shop.quickViewId);

  useEffect(() => {
    if (!featuredDiscount || show) return;
    if (sessionStorage.getItem(PROMO_SEEN_KEY)) return;
    const timer = setTimeout(() => {
      // Wait until the customer is not busy (and no tour bubble is open).
      if (busy || document.querySelector('.driver-popover, .tour-welcome')) return;
      sessionStorage.setItem(PROMO_SEEN_KEY, '1');
      setShow(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [featuredDiscount, busy, show, currentRoute]);

  if (!show || !featuredDiscount || busy) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(featuredDiscount.code);
    } catch {
      // clipboard unavailable - the code is still applied below
    }
    await shop.applyDiscountCode(featuredDiscount.code);
    shop.notify(`Code ${featuredDiscount.code} copied`);
    setShow(false);
  };

  return (
    <div className="fixed inset-0 bg-primary/50 z-[65] flex items-center justify-center p-4 print:hidden">
      <div className="bg-surface-container-lowest rounded-lg max-w-sm w-full border border-outline-variant shadow-2xl p-6 text-center space-y-4 relative">
        <button onClick={() => setShow(false)} className="absolute top-3 right-3" aria-label="Close">
          <X className="w-4 h-4 text-outline" />
        </button>
        <div className="w-12 h-12 bg-copper-tint text-copper-dark rounded-lg flex items-center justify-center mx-auto">
          <Tag className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold font-display text-on-surface">{discountLabel(featuredDiscount)}</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {featuredDiscount.description || 'Use this code in your bag before checkout.'}
          </p>
        </div>
        <button
          onClick={copy}
          className="w-full border-2 border-dashed border-copper text-copper-dark font-mono-spec font-bold text-base py-3 rounded flex items-center justify-center gap-2"
        >
          <span>{featuredDiscount.code}</span>
          <Copy className="w-4 h-4" />
        </button>
        <p className="text-[10px] text-on-surface-variant">Tap the code to copy it and apply it to your bag.</p>
      </div>
    </div>
  );
};
