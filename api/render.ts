// Serves the app's index.html with page-specific SEO for product, brand and
// info pages (rewritten here in vercel.json). Search engines and link
// previews (WhatsApp, Facebook) then see the right title, description,
// image, price and readable content without running JavaScript. The browser
// app takes over as usual.
// Self-contained on purpose (see api/chat.ts).

const STORE = 'Apna Laptop';
const AREA = 'Nankana Sahib';

interface SeoListing {
  id: string;
  title: string;
  brand: string;
  condition: string;
  price: number;
  originalPrice?: number;
  images: string[];
  inStock: boolean;
  specs: string;
  description: string;
}

const fieldValue = (v: any): any => {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fieldValue);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fieldValue(x)]));
  return undefined;
};

const fetchListings = async (): Promise<SeoListing[]> => {
  const project = process.env.VITE_FIREBASE_PROJECT_ID;
  const key = process.env.VITE_FIREBASE_API_KEY;
  if (!project || !key) return [];
  const listings: SeoListing[] = [];
  let pageToken = '';
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/hub_listings?key=${key}&pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data: any = await res.json();
    for (const doc of data.documents || []) {
      const f = doc.fields || {};
      const specs = fieldValue(f.specs) || {};
      const stock = Number(fieldValue(f.stock_qty)) || 0;
      listings.push({
        id: doc.name.split('/').pop(),
        title: fieldValue(f.title) || '',
        brand: fieldValue(f.brand) || '',
        condition: fieldValue(f.condition) || '',
        price: Number(fieldValue(f.sale_price)) || 0,
        originalPrice: Number(fieldValue(f.original_price)) || undefined,
        images: fieldValue(f.images) || [],
        inStock: fieldValue(f.status) !== 'out_of_stock' && stock > 0,
        specs: [specs.cpu, specs.ram, specs.storage, specs.screenSize ? `${specs.screenSize}" screen` : '']
          .filter(Boolean)
          .join(', '),
        description: fieldValue(f.fullDescription) || fieldValue(f.shortDescription) || '',
      });
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return listings.filter((l) => l.title);
};

// Must match slugify() / productSlug() in src/utils/helpers.ts.
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
const productKey = (l: SeoListing, all: SeoListing[]) => {
  const base = slugify(l.title) || 'laptop';
  return all.some((x) => x.id !== l.id && slugify(x.title) === slugify(l.title))
    ? `${base}-${l.id.slice(-5).toLowerCase()}`
    : base;
};

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}...` : s);
const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString('en-PK')}`;

// Link previews (WhatsApp ignores images over ~300 KB): ask Cloudinary for a compressed JPEG.
const previewImage = (url: string | undefined, fallback: string) => {
  if (!url) return fallback;
  const marker = '/image/upload/';
  const at = url.indexOf(marker);
  if (!url.includes('res.cloudinary.com') || at === -1) return url;
  return `${url.slice(0, at + marker.length)}c_limit,w_1200,q_auto:good,f_jpg/${url.slice(at + marker.length)}`;
};

interface PageSeo {
  title: string;
  description: string;
  path: string;
  image: string;
  type: 'website' | 'product';
  bodyHtml: string;
  jsonLd?: object;
  notFound?: boolean;
}

const productLinks = (list: SeoListing[], all: SeoListing[]) =>
  `<ul>${list
    .map((l) => `<li><a href="/product/${encodeURIComponent(productKey(l, all))}">${esc(l.title)}</a> - ${rs(l.price)}</li>`)
    .join('')}</ul>`;

const NAV = `<nav><a href="/shop">Laptop Hub</a> · <a href="/finder">Laptop Finder</a> · <a href="/contact">Help &amp; FAQs</a> · <a href="/about">About</a></nav>`;

const INFO_PAGES: Record<string, { title: string; heading: string; description: string }> = {
  shop: {
    title: `Buy Laptops in ${AREA} - Verified Stock, Fixed Prices | ${STORE}`,
    heading: 'Laptop Hub - Verified Stock',
    description: `Browse verified new and used laptops in ${AREA}: Dell, HP, Lenovo, Apple and more. Fixed prices, 7-day checking warranty, cash on delivery.`,
  },
  about: {
    title: `About ${STORE} - Verified Laptop Store in ${AREA}`,
    heading: `About ${STORE}`,
    description: `${STORE} sells checked, fixed-price laptops in ${AREA} and nearby towns with a 7-day checking warranty and cash on delivery.`,
  },
  contact: {
    title: `Help & FAQs - Delivery, Warranty & Orders | ${STORE}`,
    heading: 'Help & FAQs',
    description: `Questions about delivery, cash on delivery, the checking warranty or your order? Contact ${STORE} on WhatsApp.`,
  },
};

const buildSeo = (page: string, key: string, listings: SeoListing[], site: string): PageSeo => {
  const defaultImage = `${site}/og-image.png`;

  if (page === 'product') {
    const listing = listings.find((l) => productKey(l, listings) === key) || listings.find((l) => slugify(l.title) === key);
    if (!listing) {
      return {
        title: `Laptop not found | ${STORE}`,
        description: `This laptop is no longer listed. Browse verified laptops in stock at ${STORE}.`,
        path: `/product/${key}`,
        image: defaultImage,
        type: 'website',
        bodyHtml: `<h1>Laptop not found</h1><p><a href="/shop">Browse all laptops</a></p>`,
        notFound: true,
      };
    }
    const path = `/product/${encodeURIComponent(productKey(listing, listings))}`;
    const related = listings.filter((l) => l.id !== listing.id && l.brand === listing.brand && l.inStock).slice(0, 8);
    return {
      title: `${clip(listing.title, 48)} - ${rs(listing.price)} | ${STORE}`,
      description: clip(
        `${listing.title} - ${rs(listing.price)}${listing.originalPrice && listing.originalPrice > listing.price ? ` (was ${rs(listing.originalPrice)})` : ''}. ${listing.specs}. ${listing.condition}. 7-day checking warranty and cash on delivery from ${STORE}.`,
        160
      ),
      path,
      image: previewImage(listing.images[0], defaultImage),
      type: 'product',
      bodyHtml: `<h1>${esc(listing.title)}</h1>
        ${listing.images[0] ? `<img src="${esc(listing.images[0])}" alt="${esc(listing.title)}" width="400" />` : ''}
        <p><strong>${rs(listing.price)}</strong>${listing.inStock ? ' - In stock' : ' - Out of stock'} · ${esc(listing.condition)} · Cash on Delivery in ${AREA} &amp; nearby</p>
        <p>${esc(listing.specs)}</p>
        ${listing.description ? `<p>${esc(listing.description)}</p>` : ''}
        ${related.length ? `<h2>More ${esc(listing.brand)} laptops</h2>${productLinks(related, listings)}` : ''}
        ${NAV}`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: listing.title,
        description: listing.description || listing.specs,
        image: listing.images.slice(0, 5),
        sku: listing.id,
        category: 'Laptop',
        brand: { '@type': 'Brand', name: listing.brand },
        url: `${site}${path}`,
        offers: {
          '@type': 'Offer',
          url: `${site}${path}`,
          priceCurrency: 'PKR',
          price: listing.price,
          availability: listing.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition:
            listing.condition === 'Brand New' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
          seller: { '@type': 'Organization', name: STORE },
        },
      },
    };
  }

  let info = INFO_PAGES[page] || INFO_PAGES.shop;
  let path = `/${INFO_PAGES[page] ? page : 'shop'}`;
  let list: SeoListing[] = page === 'shop' || !INFO_PAGES[page] ? listings : [];

  if (page === 'brand') {
    const brand = listings.find((l) => slugify(l.brand) === key)?.brand;
    if (brand) {
      info = {
        title: `${brand} Laptops in ${AREA} - Verified Stock | ${STORE}`,
        heading: `${brand} Laptops`,
        description: `Shop verified ${brand} laptops in ${AREA} at fixed prices with a 7-day checking warranty and cash on delivery.`,
      };
      path = `/laptops/${key}`;
      list = listings.filter((l) => l.brand === brand);
    }
  }

  return {
    title: info.title,
    description: info.description,
    path,
    image: previewImage(list[0]?.images[0], defaultImage),
    type: 'website',
    bodyHtml: `<h1>${esc(info.heading)}</h1><p>${esc(info.description)}</p>${list.length ? productLinks(list, listings) : ''}${NAV}`,
    jsonLd: list.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: info.heading,
          itemListElement: list.slice(0, 50).map((l, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${site}/product/${encodeURIComponent(productKey(l, listings))}`,
            name: l.title,
          })),
        }
      : undefined,
  };
};

const setMeta = (html: string, pattern: RegExp, replacement: string) =>
  pattern.test(html) ? html.replace(pattern, () => replacement) : html;

export const injectSeo = (html: string, seo: PageSeo, site: string) => {
  const url = `${site}${seo.path}`;
  let out = html;
  out = setMeta(out, /<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`);
  out = setMeta(out, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(seo.description)}" />`);
  out = setMeta(out, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(url)}" />`);
  out = setMeta(out, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${seo.type}" />`);
  out = setMeta(out, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(url)}" />`);
  out = setMeta(out, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(seo.title)}" />`);
  out = setMeta(out, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(seo.description)}" />`);
  out = setMeta(out, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(seo.image)}" />`);
  out = setMeta(out, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(seo.title)}" />`);
  out = setMeta(out, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(seo.description)}" />`);
  out = setMeta(out, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(seo.image)}" />`);
  if (seo.notFound) {
    out = setMeta(out, /<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow" />');
  }
  if (seo.jsonLd) {
    const json = JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c');
    out = out.replace('</head>', () => `    <script type="application/ld+json" id="ld-page">${json}</script>\n  </head>`);
  }
  out = setMeta(
    out,
    /<div id="seo-fallback"([^>]*)>[\s\S]*?<\/div>\s*<\/div>/,
    `<div id="seo-fallback" style="max-width:720px;margin:0 auto;padding:24px 16px;font-family:sans-serif">${seo.bodyHtml}</div>\n    </div>`
  );
  return out;
};

export default async function handler(req: any, res: any) {
  const page = String(req.query?.page || 'shop').toLowerCase();
  const key = String(req.query?.key || '').toLowerCase();
  const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '');
  const site = `https://${host}`;

  let html = '';
  try {
    const indexRes = await fetch(`${site}/index.html`);
    if (!indexRes.ok) throw new Error(`index.html returned ${indexRes.status}`);
    html = await indexRes.text();
  } catch (err) {
    console.error('SEO render: could not load index.html', err);
    res.statusCode = 302;
    res.setHeader('Location', '/');
    res.end();
    return;
  }

  let status = 200;
  try {
    const listings = await fetchListings();
    const seo = buildSeo(page, key, listings, site);
    if (seo.notFound && listings.length > 0) status = 404;
    html = injectSeo(html, seo, site);
  } catch (err) {
    // Never break the page: fall back to the plain app shell.
    console.error('SEO render failed', err);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.status(status).send(html);
}
