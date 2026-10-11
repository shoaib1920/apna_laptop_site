import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  BadgeCheck,
  MessageCircle,
  MapPin,
  Phone,
  Clock,
  ChevronDown,
  Send,
  PackageSearch,
} from 'lucide-react';
import { useShop } from '../services/store';
import { discountLabel } from '../services/discounts';
import { SERVICE_AREA_CITIES } from '../services/pricingEngine';
import { EXPRESS_DELIVERY_FEE, STORE_AREA, STORE_NAME, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../config';
import { formatPKR, getSupportWhatsAppLink, waLink } from '../utils/helpers';

export const AboutView: React.FC = () => {
  const { navigateTo, hubListings } = useShop();
  const points = [
    {
      icon: BadgeCheck,
      title: 'Every laptop is checked',
      text: 'Motherboard, screen, keyboard, battery and ports are tested before a laptop is listed. What you see in the spec sheet is what you get.',
    },
    {
      icon: ShieldCheck,
      title: '7-day checking warranty',
      text: 'Use the laptop for 7 days. If a hardware fault shows up, bring it back and we fix it or replace it.',
    },
    {
      icon: Truck,
      title: 'Local delivery, cash on delivery',
      text: `Free next-day delivery in ${SERVICE_AREA_CITIES.join(', ')}. Open the parcel and check the laptop before you pay.`,
    },
    {
      icon: MessageCircle,
      title: 'Real people on WhatsApp',
      text: 'Ask for live photos or a testing video of the exact unit before you order.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-3">
        <h1 className="text-display-2 font-extrabold font-display text-on-surface">About {STORE_NAME}</h1>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {STORE_NAME} is a laptop store in {STORE_AREA} for people who want a fair, fixed price and a laptop they can
          trust. We bring in verified stock, test each unit ourselves and deliver it to your door in {STORE_AREA} and
          nearby towns. There are currently {hubListings.length} laptops in our Hub.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {points.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 space-y-2">
            <Icon className="w-6 h-6 text-copper-dark" />
            <h2 className="font-bold text-on-surface text-sm">{title}</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigateTo('hub')}
          className="bg-steel hover:bg-steel-dark text-white font-bold text-sm px-6 py-3 rounded"
        >
          Browse the Laptop Hub
        </button>
        <a
          href={getSupportWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-sm px-6 py-3 rounded flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
        </a>
      </div>
    </div>
  );
};

export const ContactView: React.FC = () => {
  const { navigateTo, featuredDiscount } = useShop();
  const [open, setOpen] = useState<number | null>(0);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const faqs = [
    {
      q: 'How do I order?',
      a: 'Add a laptop to your bag and check out, tap "Order on WhatsApp" on any laptop, or use "Order with AI" and order by chatting. All three give you an Order ID and a receipt.',
    },
    {
      q: 'Where do you deliver and what does it cost?',
      a: `We deliver to ${SERVICE_AREA_CITIES.join(', ')}. Standard next-day delivery is free. Same-day delivery inside ${STORE_AREA} city is ${formatPKR(EXPRESS_DELIVERY_FEE)}.`,
    },
    {
      q: 'How do I pay?',
      a: 'Cash on Delivery: you can open the parcel and check the laptop before paying the rider. Bank transfer / Raast is also available; we send the account details on WhatsApp after you order.',
    },
    {
      q: 'What is the 7-day checking warranty?',
      a: 'For 7 days after delivery, if the laptop has a hardware fault we repair or replace it. Keep your Order ID or receipt.',
    },
    {
      q: 'How do I track my order?',
      a: 'Open "Track Order" and enter your Order ID. On the phone you ordered from, your latest order is shown automatically.',
    },
    ...(featuredDiscount
      ? [
          {
            q: 'Is there a discount code?',
            a: `Yes. Use code ${featuredDiscount.code} in your bag for ${discountLabel(featuredDiscount)}.`,
          },
        ]
      : []),
    {
      q: 'Do I earn anything for buying?',
      a: 'Yes. When your order is delivered you earn reward points on your phone number (1 point = Rs. 1), which you can use on your next order.',
    },
  ];

  // Sends the message on WhatsApp - that is where the store actually reads it.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    window.open(
      waLink(WHATSAPP_NUMBER, `Salam ${STORE_NAME}!${name.trim() ? ` This is ${name.trim()}.` : ''} ${message.trim()}`),
      '_blank',
      'noopener'
    );
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-display-2 font-extrabold font-display text-on-surface">Help & FAQs</h1>
        <p className="text-sm text-on-surface-variant">Delivery, payment, warranty and order questions.</p>
      </div>

      <a
        href={getSupportWhatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-4 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-lg p-5"
      >
        <div>
          <div className="font-extrabold font-display">Fastest help: WhatsApp</div>
          <div className="text-xs opacity-90">{WHATSAPP_DISPLAY} · we usually reply within minutes</div>
        </div>
        <MessageCircle className="w-8 h-8 shrink-0" />
      </a>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-1">
          <Phone className="w-5 h-5 text-steel-dark" />
          <div className="font-bold text-on-surface">Call / WhatsApp</div>
          <div className="text-on-surface-variant">{WHATSAPP_DISPLAY}</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-1">
          <MapPin className="w-5 h-5 text-steel-dark" />
          <div className="font-bold text-on-surface">Pickup point</div>
          <div className="text-on-surface-variant">{STORE_AREA}, Punjab</div>
        </div>
        <button
          onClick={() => navigateTo('track')}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-1 text-left hover:bg-surface-container-low"
        >
          <PackageSearch className="w-5 h-5 text-steel-dark" />
          <div className="font-bold text-on-surface">Track an order</div>
          <div className="text-on-surface-variant">Enter your Order ID</div>
        </button>
      </div>

      <section className="space-y-2">
        <h2 className="text-heading-1 font-extrabold font-display text-on-surface">Frequently asked questions</h2>
        {faqs.map((faq, i) => (
          <div key={faq.q} className="bg-surface-container-lowest border border-outline-variant rounded-lg">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-on-surface"
              aria-expanded={open === i}
            >
              <span>{faq.q}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-4 pb-4 text-xs text-on-surface-variant leading-relaxed">{faq.a}</p>}
          </div>
        ))}
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 space-y-3">
        <h2 className="text-heading-2 font-extrabold font-display text-on-surface">Send us a message</h2>
        <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Your message opens in WhatsApp, ready to send to our team.
        </p>
        <form onSubmit={submit} className="space-y-3 text-xs">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            placeholder="How can we help?"
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5"
          />
          <button
            type="submit"
            className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold px-5 py-2.5 rounded flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Send on WhatsApp
          </button>
        </form>
      </section>
    </div>
  );
};
