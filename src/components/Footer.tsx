import React from 'react';
import { Laptop, ShieldCheck, Truck, CheckCircle2, MessageCircle, Heart } from 'lucide-react';
import { SERVICE_AREA_CITIES } from '../services/pricingEngine';
import { User } from '../types';

interface FooterProps {
  navigateTo: (route: string) => void;
  romanUrduMode: boolean;
  currentUser?: User | null;
}

export const Footer: React.FC<FooterProps> = ({ navigateTo, romanUrduMode, currentUser }) => {
  return (
    <footer className="bg-primary-container text-on-primary-container border-t border-outline-variant text-sm mt-16">
      {/* Trust Highlights Section */}
      <div className="border-b border-white/10 bg-primary/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-md bg-steel-tint text-steel shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-on-primary font-bold text-sm">
                {romanUrduMode ? '100% Genuine Checking Warranty' : '7-Day Checking Warranty'}
              </h4>
              <p className="text-xs text-on-primary-container mt-0.5">
                {romanUrduMode
                  ? 'Har Hub laptop par 7 din checking warranty aur motherboard verification.'
                  : 'Full motherboard & physical inspection on all Hub inventory.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-md bg-steel-tint text-steel shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-on-primary font-bold text-sm">
                {romanUrduMode ? 'Direct WhatsApp Rabta' : 'WhatsApp First Commerce'}
              </h4>
              <p className="text-xs text-on-primary-container mt-0.5">
                {romanUrduMode
                  ? 'Real-time photos, live testing videos aur negotiation seedha WhatsApp par.'
                  : 'Direct chat with our Hub team with one-tap deep links.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-md bg-steel-tint text-steel shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-on-primary font-bold text-sm">
                {romanUrduMode ? 'Local Cash on Delivery' : 'Cash on Delivery (COD)'}
              </h4>
              <p className="text-xs text-on-primary-container mt-0.5">
                {romanUrduMode
                  ? 'Nankana Sahib aur nearby areas mein ghar bethe parcel receive karein.'
                  : 'Local rider dispatch across Nankana Sahib, Shahkot, Manawala & nearby towns.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-md bg-steel-tint text-steel shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-on-primary font-bold text-sm">
                {romanUrduMode ? 'Motherboard Verified' : 'Motherboard Verified'}
              </h4>
              <p className="text-xs text-on-primary-container mt-0.5">
                {romanUrduMode
                  ? 'Har laptop ki motherboard aur hardware physically check ki jati hai bechne se pehle.'
                  : 'Every laptop is physically inspected and hardware-tested before it goes up for sale.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-steel flex items-center justify-center text-white font-bold">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-on-primary font-display">
                Apna<span className="text-steel">Laptop</span>.pk
              </span>
            </div>
            <p className="text-xs text-on-primary-container leading-relaxed max-w-sm">
              Nankana Sahib's trusted laptop store for students, software engineers, gamers, and businesses — verified supplier stock, fixed prices, 7-day checking warranty.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://wa.me/923016672356"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Channel</span>
              </a>
              <span className="text-xs text-on-primary-container">Instagram: @apnalaptop.pk</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-on-primary font-bold text-xs uppercase tracking-wider mb-3">
              Explore Store
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigateTo('hub')} className="hover:text-steel transition-colors">
                  Laptop Hub (Verified Stock)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('wishlist')} className="hover:text-steel transition-colors">
                  Saved Laptops
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('dashboard')} className="hover:text-steel transition-colors">
                  My Orders
                </button>
              </li>
            </ul>
          </div>

          {/* Smart Decision Tools */}
          <div>
            <h5 className="text-on-primary font-bold text-xs uppercase tracking-wider mb-3">
              Smart Tools
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigateTo('calculator')} className="hover:text-steel transition-colors">
                  Laptop Price Calculator
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('finder')} className="hover:text-steel transition-colors">
                  Laptop Finder Wizard
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('advisor')} className="hover:text-steel transition-colors">
                  RAM & SSD Upgrade Advisor
                </button>
              </li>
              {currentUser?.role === 'admin' && (
                <li>
                  <button onClick={() => navigateTo('admin')} className="hover:text-steel transition-colors">
                    Supplier Admin Portal
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Service Area */}
          <div>
            <h5 className="text-on-primary font-bold text-xs uppercase tracking-wider mb-3">
              Areas We Serve
            </h5>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {SERVICE_AREA_CITIES.map((city) => (
                <span
                  key={city}
                  className="bg-primary/40 text-on-primary-container px-2 py-0.5 rounded border border-white/10"
                >
                  {city}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-on-primary-container mt-2">
              Pickup & drop-off point: Nankana Sahib.
            </p>
          </div>
        </div>

        {/* Professional Polish Trust Bar */}
        <div className="bg-primary/40 border border-white/10 rounded-xl px-6 py-3.5 my-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 sm:gap-8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-steel rounded-full"></span>
              <span className="text-[11px] font-bold text-on-primary-container uppercase tracking-wider">100+ Verified Units In Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-steel rounded-full"></span>
              <span className="text-[11px] font-bold text-on-primary-container uppercase tracking-wider">7-Day Replacement Policy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-steel rounded-full"></span>
              <span className="text-[11px] font-bold text-on-primary-container uppercase tracking-wider">Cash on Delivery in Nankana Sahib & Nearby</span>
            </div>
          </div>
          <div className="text-[11px] text-steel font-semibold tracking-wide uppercase">
            Apna Laptop © 2024 • Proudly Pakistani
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-primary-container">
          <p>© {new Date().getFullYear()} Apna Laptop Pakistan (Private). All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-error fill-error" /> for Pakistani tech enthusiasts.
          </p>
        </div>
      </div>
    </footer>
  );
};
