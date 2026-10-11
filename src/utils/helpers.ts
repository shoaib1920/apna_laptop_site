import { CartItem, HubListing, Order, P2PListing } from '../types';
import { PAYMENT_LABELS, STORE_NAME, WHATSAPP_NUMBER } from '../config';

/**
 * Formats a number into PKR standard currency format (e.g. Rs. 65,000)
 */
export function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

/** Firestore rejects `undefined` values - strip them before saving. */
export const stripUndefined = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** e.g. "12 Oct 2026, 3:45 pm". Accepts ISO or the older "YYYY-MM-DD HH:MM". */
export function formatDateTime(value: string): string {
  const d = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ---------- WhatsApp ----------
// Pre-filled messages stay plain text: no emojis and no *bold* markers
// (emojis arrive as "?" boxes on some devices).

export const waLink = (number: string, text?: string) =>
  `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/**
 * Creates WhatsApp deep link for Hub laptop purchase/inquiry
 */
export function getHubWhatsAppLink(listing: HubListing): string {
  const text = `Assalam o Alaikum ${STORE_NAME} Team!
I have a question about this laptop:
${listing.title}
Price: ${formatPKR(listing.sale_price)}
Condition: ${listing.condition}
Specs: ${listing.specs.cpu} | ${listing.specs.ram} | ${listing.specs.storage}
${productUrl(listing)}`;

  return waLink(WHATSAPP_NUMBER, text);
}

/**
 * Creates WhatsApp deep link for P2P seller contact
 */
export function getP2PWhatsAppLink(listing: P2PListing, buyerName?: string): string {
  const cleanPhone = listing.seller_whatsapp.replace(/[^0-9]/g, '');
  const text = `Assalam o Alaikum ${listing.seller_name}!
I saw your laptop listing on ${STORE_NAME}:
${listing.title} (${listing.seller_city})
Asking Price: ${formatPKR(listing.asking_price)}

Is this still available? I would like to inspect and discuss the deal.
From: ${buyerName || 'Interested Buyer'}`;

  return waLink(cleanPhone, text);
}

/**
 * Creates general Apna Laptop Support WhatsApp link
 */
export function getSupportWhatsAppLink(customQuery?: string): string {
  const text =
    customQuery ||
    `Assalam o Alaikum ${STORE_NAME}! I need help finding the right laptop or have a question about your verified stock.`;
  return waLink(WHATSAPP_NUMBER, text);
}

// ---------- Product addresses ----------

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

// One slug per listing, memoised per catalogue array. If two listings share
// a title, the last 5 characters of the id are appended to both.
// (api/render.ts and api/sitemap.ts repeat this rule - keep them in sync.)
const slugCache = new WeakMap<HubListing[], Map<string, string>>();
const slugMap = (all: HubListing[]) => {
  let map = slugCache.get(all);
  if (!map) {
    const counts = new Map<string, number>();
    all.forEach((l) => counts.set(slugify(l.title), (counts.get(slugify(l.title)) || 0) + 1));
    map = new Map(
      all.map((l) => {
        const base = slugify(l.title) || 'laptop';
        return [l.id, (counts.get(slugify(l.title)) || 0) > 1 ? `${base}-${l.id.slice(-5).toLowerCase()}` : base];
      })
    );
    slugCache.set(all, map);
  }
  return map;
};

let catalogue: HubListing[] = [];
/** The store keeps this pointed at the live catalogue so links can be built anywhere. */
export const setSlugCatalogue = (all: HubListing[]) => {
  catalogue = all;
};

export const productSlug = (listing: HubListing) =>
  slugMap(catalogue).get(listing.id) || slugify(listing.title) || listing.id;

export const findListingBySlug = (slug: string, all: HubListing[]) => {
  const map = slugMap(all);
  return all.find((l) => map.get(l.id) === slug) || all.find((l) => slugify(l.title) === slug || l.id === slug);
};

export const siteUrl = () => (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || window.location.origin;
export const productPath = (listing: HubListing) => `/product/${productSlug(listing)}`;
export const productUrl = (listing: HubListing) => `${siteUrl()}${productPath(listing)}`;
export const trackUrl = (orderId: string) => `${siteUrl()}/track/${orderId}`;

// ---------- Images ----------

/** Asks Cloudinary for a right-sized, automatically compressed version of a
 * photo. Other image URLs are returned unchanged. */
export function optimizeImage(url: string | undefined, width: number): string {
  if (!url) return '';
  const marker = '/image/upload/';
  const at = url.indexOf(marker);
  if (!url.includes('res.cloudinary.com') || at === -1) return url;
  const rest = url.slice(at + marker.length);
  // Already transformed (e.g. "f_auto,..." or "w_400/") - leave as is.
  if (/^[a-z]{1,3}_[^/]+\//.test(rest)) return url;
  return `${url.slice(0, at + marker.length)}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}

// ---------- Stock ----------

export const isOutOfStock = (l: HubListing) => l.status === 'out_of_stock' || l.stock_qty <= 0;

// ---------- Bag and order text ----------

export const cartItemUnitPrice = (item: CartItem) =>
  item.listing.sale_price + (item.selectedRamUpgrade?.price || 0) + (item.selectedStorageUpgrade?.price || 0);

export const cartSubtotal = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + cartItemUnitPrice(item) * item.quantity, 0);

export const paymentLabel = (order: Pick<Order, 'payment_method'>) =>
  PAYMENT_LABELS[order.payment_method] || order.payment_method;

/** Plain-text receipt used inside WhatsApp messages. */
export function receiptText(order: Order): string {
  const lines = [
    `${STORE_NAME} - Order ${order.order_number}`,
    `Date: ${formatDateTime(order.created_at)}`,
    '',
    ...order.items.map(
      (i) =>
        `${i.qty} x ${i.title}${i.upgrade_details ? ` (${i.upgrade_details})` : ''} - ${formatPKR(i.item_total)}`
    ),
    '',
    `Subtotal: ${formatPKR(order.subtotal)}`,
  ];
  if (order.discount) lines.push(`Discount${order.discount_code ? ` (${order.discount_code})` : ''}: -${formatPKR(order.discount)}`);
  if (order.points_discount) lines.push(`Points used: -${formatPKR(order.points_discount)}`);
  lines.push(`Delivery: ${order.delivery_fee ? formatPKR(order.delivery_fee) : 'FREE'}`);
  lines.push(`Total: ${formatPKR(order.total_price)}`);
  lines.push(`Payment: ${paymentLabel(order)}`);
  lines.push('');
  lines.push(`Name: ${order.buyer_name}`);
  lines.push(`Phone: ${order.buyer_phone}`);
  lines.push(`Address: ${order.buyer_address}, ${order.buyer_city}`);
  if (order.buyer_landmark) lines.push(`Landmark / instructions: ${order.buyer_landmark}`);
  return lines.join('\n');
}

/** The message a customer sends the store right after ordering. */
export function orderWhatsAppLink(order: Order): string {
  const text = `Salam ${STORE_NAME}! I just placed order ${order.order_number} for ${formatPKR(order.total_price)} (${paymentLabel(order)}). Please confirm it.

${receiptText(order)}

Track: ${trackUrl(order.order_number)}`;
  return waLink(WHATSAPP_NUMBER, text);
}
