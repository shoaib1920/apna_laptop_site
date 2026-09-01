# Apna Laptop

Pakistan's laptop marketplace: a curated **Hub** of verified supplier stock (fixed price, admin-managed inventory) plus a zero-commission **P2P classifieds marketplace** for used laptops — with a price valuation calculator, a laptop finder wizard, an upgrade advisor, and an admin panel that manages inventory and orders like a CRM.

## Tech stack

- React 19 + TypeScript, built with Vite 6
- Tailwind CSS v4 (CSS-first `@theme` config in `src/index.css`)
- [lucide-react](https://lucide.dev/) for icons

## Architecture note: client-only by design

This app has **no backend**. All data — listings, orders, users, messages — lives in the browser's `localStorage` via the `useAppStore()` hook in `src/services/store.ts`, seeded from `src/data/mockData.ts` on first load. That means:

- Data is per-browser, not shared between users or devices. An admin adding a product on one machine won't appear for a visitor on another.
- The "Admin" role gate is a UI convenience for demoing the CRM panel, not real authentication — anyone can switch roles via the profile menu's demo role-switcher.
- Deploying this app is just deploying a static site (see below) — there's no database or API to provision.

If you outgrow this (real multi-device inventory, real auth), the natural next step is swapping `src/services/store.ts`'s localStorage calls for a real backend (e.g. Supabase) behind the same function signatures — the rest of the app is already organized around that store's API.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev
```

Then open the printed local URL. Use the profile menu in the top-right to switch between the demo Guest / User / Admin accounts — the Admin account unlocks the `/admin` CRM panel (Hub inventory, order dispatch tracking, P2P moderation, margin analytics).

To reset all demo data back to the seeded starting point, call `resetDemoData()` from `useAppStore()` (wire it to a settings button, or run it from the browser console via React DevTools) — or just clear the site's localStorage.

## Build & deploy

```bash
npm run build    # outputs static files to dist/
npm run preview  # serve the production build locally to sanity-check it
```

`dist/` is a fully static site — deploy it to any static host (Vercel, Netlify, GitHub Pages, S3 + CloudFront, etc.) with no server-side configuration needed. The app doesn't use URL-based routing (navigation is in-memory React state), so no rewrite/redirect rules are required either — every visitor simply loads `index.html`.

## Type checking

```bash
npm run lint    # tsc --noEmit
```
