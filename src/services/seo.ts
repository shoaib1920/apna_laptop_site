import { HubListing } from '../types';
import { STORE_NAME } from '../config';
import { formatPKR, isOutOfStock, optimizeImage, productPath, siteUrl } from '../utils/helpers';
import { brandPath } from './router';

// Keeps the page's SEO tags in sync while customers move around the app.
// (Product and brand pages also get these tags from the server - see api/render.ts.)

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: object | null;
}

const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
};

export function applyPageSeo({ title, description, path, image, noindex, jsonLd }: PageSeo) {
  const url = `${siteUrl()}${path}`;
  const img = image || `${siteUrl()}/og-image.png`;
  document.title = title;

  setMeta('name', 'description', description);
  setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:image', img);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', img);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;

  // Page-specific structured data (product details).
  document.getElementById('ld-page')?.remove();
  if (jsonLd) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'ld-page';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}...` : s);

export const conditionSchema = (condition: string) =>
  condition === 'Brand New' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition';

const AREA = 'Nankana Sahib';
const DEFAULT_DESCRIPTION = `${AREA}'s verified laptop store - fixed-price, checked laptops with 7-day checking warranty, WhatsApp support and cash on delivery.`;

const PAGES: Record<string, { title: string; description: string; noindex?: boolean }> = {
  home: { title: `${STORE_NAME} - Verified Laptop Hub for ${AREA}`, description: DEFAULT_DESCRIPTION },
  hub: {
    title: `Buy Laptops in ${AREA} - Verified Stock, Fixed Prices | ${STORE_NAME}`,
    description: `Browse verified new and used laptops in ${AREA}: Dell, HP, Lenovo, Apple and more. Fixed prices, 7-day checking warranty, cash on delivery.`,
  },
  calculator: {
    title: `Laptop Price Calculator - What Is Your Laptop Worth? | ${STORE_NAME}`,
    description: 'Estimate the fair market value of a used laptop in Pakistan from its specs and condition.',
  },
  finder: {
    title: `Laptop Finder - Find the Right Laptop for You | ${STORE_NAME}`,
    description: 'Answer a few questions about budget and use and get matched with laptops from our verified stock.',
  },
  advisor: {
    title: `Laptop Upgrade Advisor - RAM & SSD Upgrades | ${STORE_NAME}`,
    description: 'See which RAM and SSD upgrades give your laptop the biggest speed boost for the money.',
  },
  about: {
    title: `About ${STORE_NAME} - Verified Laptop Store in ${AREA}`,
    description: `${STORE_NAME} sells checked, fixed-price laptops in ${AREA} and nearby towns with a 7-day checking warranty and cash on delivery.`,
  },
  contact: {
    title: `Help & FAQs - Delivery, Warranty & Orders | ${STORE_NAME}`,
    description: `Questions about delivery, cash on delivery, the checking warranty or your order? Contact ${STORE_NAME} on WhatsApp.`,
  },
  wishlist: { title: `Saved Laptops | ${STORE_NAME}`, description: DEFAULT_DESCRIPTION, noindex: true },
  track: { title: `Track Your Order | ${STORE_NAME}`, description: DEFAULT_DESCRIPTION, noindex: true },
  checkout: { title: `Checkout | ${STORE_NAME}`, description: DEFAULT_DESCRIPTION, noindex: true },
  account: { title: `Your Account | ${STORE_NAME}`, description: DEFAULT_DESCRIPTION, noindex: true },
  dashboard: { title: `My Orders | ${STORE_NAME}`, description: DEFAULT_DESCRIPTION, noindex: true },
  admin: { title: `Admin | ${STORE_NAME}`, description: DEFAULT_DESCRIPTION, noindex: true },
};

/** SEO for the current route. `listing` is the open product, if any. */
export function seoForRoute(route: string, path: string, listing?: HubListing, brand?: string): PageSeo {
  if (route === 'hub_detail' && listing) {
    const productUrl = `${siteUrl()}${productPath(listing)}`;
    return {
      title: `${clip(listing.title, 48)} - ${formatPKR(listing.sale_price)} | ${STORE_NAME}`,
      description: clip(
        `${listing.title} - ${formatPKR(listing.sale_price)}. ${listing.specs.cpu}, ${listing.specs.ram}, ${listing.specs.storage}. ${listing.condition}. 7-day checking warranty and cash on delivery from ${STORE_NAME}.`,
        160
      ),
      path: productPath(listing),
      image: optimizeImage(listing.images[0], 1200),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: listing.title,
        description: listing.fullDescription || listing.shortDescription,
        image: listing.images.slice(0, 5),
        sku: listing.id,
        category: 'Laptop',
        brand: { '@type': 'Brand', name: listing.brand },
        url: productUrl,
        offers: {
          '@type': 'Offer',
          url: productUrl,
          priceCurrency: 'PKR',
          price: listing.sale_price,
          availability: isOutOfStock(listing) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          itemCondition: conditionSchema(listing.condition),
          seller: { '@type': 'Organization', name: STORE_NAME },
        },
      },
    };
  }
  if (route === 'hub' && brand) {
    return {
      title: `${brand} Laptops in ${AREA} - Verified Stock | ${STORE_NAME}`,
      description: `Shop verified ${brand} laptops in ${AREA} at fixed prices with a 7-day checking warranty and cash on delivery.`,
      path: brandPath(brand),
    };
  }
  const page = PAGES[route] || PAGES.home;
  return { ...page, path };
}
