import React, { useEffect, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import 'driver.js/dist/driver.css';
import { useShop } from '../services/store';

// Guided "How to order" tour. Four short tours (browsing, product page, bag,
// checkout), each shown once, every step in English with a Roman Urdu line.
// The "How to order?" button replays the tour for the current screen.

type TourName = 'browse' | 'product' | 'bag' | 'checkout';

interface Step {
  element: string;
  title: string;
  en: string;
  ur: string;
}

const TOURS: Record<TourName, Step[]> = {
  browse: [
    {
      element: '#global-search-input',
      title: 'Search',
      en: 'Type a brand, model or spec to find a laptop.',
      ur: 'Yahan brand ya model likh kar laptop dhoondein.',
    },
    {
      element: '#nav-hub-btn',
      title: 'Laptop Hub',
      en: 'See every verified laptop with fixed prices.',
      ur: 'Tamam verified laptops aur un ki fixed qeemat yahan hain.',
    },
    {
      element: '#ai-chat-btn',
      title: 'Order with AI',
      en: 'Chat in any language and the assistant takes your order.',
      ur: 'Apni zaban mein baat karein, assistant aap ka order le lega.',
    },
    {
      element: '#cart-header-btn',
      title: 'Your bag',
      en: 'Laptops you add are kept here until you check out.',
      ur: 'Jo laptop aap add karein ge wo yahan rahe ga.',
    },
    {
      element: '#track-link',
      title: 'Track order',
      en: 'After ordering, follow your parcel with your Order ID.',
      ur: 'Order ke baad apne Order ID se parcel track karein.',
    },
    {
      element: '#floating-whatsapp-widget',
      title: 'Need help?',
      en: 'Ask us anything on WhatsApp.',
      ur: 'Koi sawal ho to WhatsApp par poochein.',
    },
  ],
  product: [
    {
      element: '#add-to-cart-btn',
      title: 'Add to Cart',
      en: 'Put this laptop in your bag and keep browsing.',
      ur: 'Laptop bag mein daal kar mazeed dekh sakte hain.',
    },
    {
      element: '#buy-now-cod-btn',
      title: 'Order with Cash on Delivery',
      en: 'Go straight to checkout. You pay when the laptop arrives.',
      ur: 'Seedha checkout par jayein. Paise laptop milne par dein.',
    },
    {
      element: '#whatsapp-buy-btn',
      title: 'Order on WhatsApp',
      en: 'Fill a short form and your order opens in WhatsApp, ready to send.',
      ur: 'Chhota form bharein, order WhatsApp mein tayyar khul jaye ga.',
    },
  ],
  bag: [
    {
      element: '#cart-drawer',
      title: 'Your bag',
      en: 'Check your laptops, change quantity or add a discount code.',
      ur: 'Apne laptops check karein, quantity badlein ya discount code lagayein.',
    },
    {
      element: '#cart-checkout-btn',
      title: 'Checkout',
      en: 'Enter your delivery details to place the order.',
      ur: 'Delivery ki maloomat likh kar order place karein.',
    },
    {
      element: '#cart-whatsapp-btn',
      title: 'Or order on WhatsApp',
      en: 'Same form, then the order is sent to us on WhatsApp.',
      ur: 'Wohi form, phir order WhatsApp par humein bhej dein.',
    },
  ],
  checkout: [
    {
      element: '#checkout-form',
      title: 'Delivery details',
      en: 'Enter your name, WhatsApp number, town and address.',
      ur: 'Apna naam, WhatsApp number, shehar aur address likhein.',
    },
    {
      element: '#place-cod-order-btn',
      title: 'Confirm order',
      en: 'Tap here. You get an Order ID and a receipt straight away.',
      ur: 'Yahan dabayein. Order ID aur receipt foran mil jaye gi.',
    },
  ],
};

const STORAGE_KEY = 'apna_laptop_tour_v1';
const readSeen = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};
const markSeen = (name: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSeen(), [name]: true }));
  } catch {
    // storage unavailable - the tour may simply show again
  }
};

const isVisible = (selector: string) => {
  const el = document.querySelector<HTMLElement>(selector);
  return Boolean(el && el.offsetParent !== null);
};

const runTour = async (name: TourName) => {
  const steps = TOURS[name].filter((s) => isVisible(s.element));
  if (steps.length === 0) return;
  const { driver } = await import('driver.js');
  driver({
    showProgress: steps.length > 1,
    popoverClass: 'apna-tour',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Got it',
    steps: steps.map((s) => ({
      element: s.element,
      popover: { title: s.title, description: `${s.en}<span class="apna-tour-ur">${s.ur}</span>` },
    })),
  }).drive();
};

export const GuidedTour: React.FC = () => {
  const { currentRoute, cartOpen, chatOpen } = useShop();
  const [showWelcome, setShowWelcome] = useState(false);

  const screen: TourName | null = cartOpen
    ? 'bag'
    : currentRoute === 'checkout'
    ? 'checkout'
    : currentRoute === 'hub_detail'
    ? 'product'
    : currentRoute === 'home' || currentRoute === 'hub'
    ? 'browse'
    : null;

  // First visit: offer the browsing tour. Other tours start by themselves
  // the first time their screen opens.
  useEffect(() => {
    if (!screen || chatOpen) return;
    const seen = readSeen();
    if (screen === 'browse') {
      if (seen.welcome) return;
      const timer = setTimeout(() => setShowWelcome(true), 2500);
      return () => clearTimeout(timer);
    }
    if (seen[screen]) return;
    const timer = setTimeout(() => {
      markSeen(screen);
      runTour(screen);
    }, 900);
    return () => clearTimeout(timer);
  }, [screen, chatOpen]);

  if (currentRoute === 'admin') return null;

  const dismissWelcome = (start: boolean) => {
    markSeen('welcome');
    setShowWelcome(false);
    if (start) {
      markSeen('browse');
      runTour('browse');
    }
  };

  return (
    <>
      {screen && !cartOpen && !chatOpen && (
        <button
          onClick={() => runTour(screen)}
          className="fixed bottom-24 lg:bottom-6 left-4 z-30 flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface text-[11px] font-bold px-3 py-2 rounded-full shadow-md print:hidden"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How to order?</span>
        </button>
      )}

      {showWelcome && screen === 'browse' && (
        <div className="tour-welcome fixed bottom-36 lg:bottom-20 left-4 z-40 w-72 bg-primary text-on-primary rounded-lg shadow-2xl p-4 space-y-3 print:hidden">
          <button onClick={() => dismissWelcome(false)} className="absolute top-2.5 right-2.5" aria-label="Close">
            <X className="w-4 h-4 text-on-primary-container" />
          </button>
          <div>
            <p className="text-sm font-bold">Pehli dafa aaye hain?</p>
            <p className="text-xs text-on-primary-container mt-1">
              Let us show you how to order in 30 seconds.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => dismissWelcome(true)}
              className="flex-1 bg-copper hover:bg-copper-dark text-white text-xs font-bold py-2 rounded"
            >
              Show me
            </button>
            <button
              onClick={() => dismissWelcome(false)}
              className="px-3 text-xs font-bold text-on-primary-container"
            >
              No thanks
            </button>
          </div>
        </div>
      )}
    </>
  );
};
