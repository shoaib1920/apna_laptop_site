// /sitemap.xml (rewritten here in vercel.json): every public page, one entry
// per brand and one per laptop, read live from Firestore so new laptops
// appear automatically. Self-contained on purpose (see api/chat.ts).

interface SitemapListing {
  id: string;
  title: string;
  brand: string;
  images: string[];
  updateTime: string;
}

const fieldValue = (v: any): any => {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fieldValue);
  return undefined;
};

const fetchListings = async (): Promise<SitemapListing[]> => {
  const project = process.env.VITE_FIREBASE_PROJECT_ID;
  const key = process.env.VITE_FIREBASE_API_KEY;
  if (!project || !key) return [];
  const listings: SitemapListing[] = [];
  let pageToken = '';
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/hub_listings?key=${key}&pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data: any = await res.json();
    for (const doc of data.documents || []) {
      const f = doc.fields || {};
      listings.push({
        id: doc.name.split('/').pop(),
        title: fieldValue(f.title) || '',
        brand: fieldValue(f.brand) || '',
        images: fieldValue(f.images) || [],
        updateTime: doc.updateTime,
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
const productKey = (l: SitemapListing, all: SitemapListing[]) => {
  const base = slugify(l.title) || 'laptop';
  return all.some((x) => x.id !== l.id && slugify(x.title) === slugify(l.title))
    ? `${base}-${l.id.slice(-5).toLowerCase()}`
    : base;
};

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default async function handler(req: any, res: any) {
  const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '');
  const site = `https://${host}`;

  let listings: SitemapListing[] = [];
  try {
    listings = await fetchListings();
  } catch (err) {
    console.error('Sitemap: could not load listings', err);
  }

  const today = new Date().toISOString().slice(0, 10);
  const brands = Array.from(new Set(listings.map((l) => slugify(l.brand)).filter(Boolean)));
  const pages = [
    { loc: '/', priority: '1.0', freq: 'daily' },
    { loc: '/shop', priority: '0.9', freq: 'daily' },
    ...brands.map((b) => ({ loc: `/laptops/${b}`, priority: '0.8', freq: 'daily' })),
    { loc: '/finder', priority: '0.6', freq: 'monthly' },
    { loc: '/calculator', priority: '0.6', freq: 'monthly' },
    { loc: '/upgrade-advisor', priority: '0.5', freq: 'monthly' },
    { loc: '/about', priority: '0.5', freq: 'monthly' },
    { loc: '/contact', priority: '0.5', freq: 'monthly' },
  ];

  const urls = [
    ...pages.map(
      (p) => `  <url><loc>${site}${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`
    ),
    ...listings.map((l) => {
      const images = l.images
        .filter(Boolean)
        .slice(0, 5)
        .map((img) => `<image:image><image:loc>${xml(img)}</image:loc><image:title>${xml(l.title)}</image:title></image:image>`)
        .join('');
      return `  <url><loc>${site}/product/${encodeURIComponent(productKey(l, listings))}</loc><lastmod>${(l.updateTime || today).slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority>${images}</url>`;
    }),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(body);
}
