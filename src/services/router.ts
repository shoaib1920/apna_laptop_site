import { HubListing } from '../types';
import { productPath, slugify } from '../utils/helpers';

// Every page has a real address so links can be shared and the browser's
// back button works. Routes keep the names the app already used internally.

export interface RouteState {
  route: string;
  params: Record<string, any>;
}

const STATIC_PATHS: Record<string, string> = {
  home: '/',
  hub: '/shop',
  calculator: '/calculator',
  advisor: '/upgrade-advisor',
  finder: '/finder',
  checkout: '/checkout',
  admin: '/admin',
  account: '/account',
  dashboard: '/my-orders',
  wishlist: '/wishlist',
  track: '/track',
  about: '/about',
  contact: '/contact',
};

export const brandPath = (brand: string) => `/laptops/${slugify(brand)}`;

export function pathFor(route: string, params: Record<string, any>, listings: HubListing[]): string {
  if (route === 'hub_detail') {
    const listing = listings.find((l) => l.id === params.hubId);
    return listing ? productPath(listing) : params.hubSlug ? `/product/${params.hubSlug}` : '/shop';
  }
  if (route === 'hub' && params.brand) return brandPath(params.brand);
  if (route === 'track' && params.orderId) return `/track/${encodeURIComponent(params.orderId)}`;
  return STATIC_PATHS[route] || '/';
}

export function parsePath(pathname: string): RouteState {
  const path = decodeURIComponent(pathname.replace(/\/+$/, '') || '/');
  const [, first, second] = path.split('/');
  if (first === 'product' && second) return { route: 'hub_detail', params: { hubSlug: second } };
  if (first === 'laptops' && second) return { route: 'hub', params: { brand: second } };
  if (first === 'track') return { route: 'track', params: second ? { orderId: second.toUpperCase() } : {} };
  const match = Object.entries(STATIC_PATHS).find(([, p]) => p === path);
  return { route: match ? match[0] : 'home', params: {} };
}
