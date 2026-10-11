// Google Analytics and Meta Pixel page-view tracking. Each loads only when
// its ID is set (VITE_GA_ID / VITE_META_PIXEL_ID), so no placeholder IDs
// ever ship. Both IDs are public by nature.

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: any;
    _fbq?: any;
  }
}

const loadScript = (src: string) => {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
};

let started = false;

export function initAnalytics() {
  if (started) return;
  started = true;

  if (GA_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag.js reads the raw arguments object from the data layer.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: false });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
  }

  if (PIXEL_ID) {
    const fbq: any = function (...args: unknown[]) {
      fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID);
  }
}

export function trackPageView(path: string) {
  if (GA_ID) window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href });
  if (PIXEL_ID) window.fbq?.('track', 'PageView');
}
