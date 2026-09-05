import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  PlusCircle,
  Calculator,
  Compass,
  Sliders,
  ShieldCheck,
  User as UserIcon,
  Store,
  Users,
  Menu,
  X,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentRoute: string;
  navigateTo: (route: string, params?: any) => void;
  currentUser: User | null;
  users: User[];
  switchUser: (id: string | null) => void;
  cartCount: number;
  wishlistCount: number;
  romanUrduMode: boolean;
  setRomanUrduMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  hubCount: number;
  p2pCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  navigateTo,
  currentUser,
  users,
  switchUser,
  cartCount,
  wishlistCount,
  romanUrduMode,
  setRomanUrduMode,
  globalSearchQuery,
  setGlobalSearchQuery,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (route: string) => {
    navigateTo(route);
    setMobileMenuOpen(false);
  };

  const navLinkClasses = (active: boolean) =>
    `px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition-all ${
      active
        ? 'text-secondary border-b-2 border-secondary pb-1'
        : 'text-on-surface-variant hover:text-secondary opacity-90'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-outline-variant shadow-sm">
      {/* Top Notice Bar with Roman Urdu Toggle & Pakistan WhatsApp Trust */}
      <div className="bg-primary text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-whatsapp animate-pulse"></span>
            {romanUrduMode ? (
              <span>🇵🇰 <strong>Apna Laptop:</strong> 100% Genuine Imported Lots • 7 Din Checking Warranty • Nankana Sahib & Nearby Free Delivery</span>
            ) : (
              <span>🇵🇰 <strong>Apna Laptop:</strong> Verified Supplier Stock • 7-Day Checking Warranty • Serving Nankana Sahib & Nearby Towns</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRomanUrduMode(!romanUrduMode)}
              className="flex items-center gap-1.5 bg-primary-container hover:opacity-90 px-2.5 py-0.5 rounded text-xs text-whatsapp transition-colors"
              title="Toggle Roman Urdu Trust Mode"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${romanUrduMode ? 'bg-whatsapp' : 'bg-white/40'}`} />
              <span>{romanUrduMode ? 'Roman Urdu ON' : 'English Base'}</span>
            </button>
            <a
              href="https://wa.me/923001234567"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-whatsapp text-white/80 flex items-center gap-1 font-semibold transition-colors"
            >
              WhatsApp: +92 300 1234567
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              id="brand-logo-btn"
              onClick={() => handleNav('home')}
              className="flex flex-col text-left group transition-transform"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tighter leading-none text-primary font-display group-hover:text-whatsapp-dark transition-colors">
                  APNA LAPTOP
                </span>
                <span className="bg-whatsapp/10 text-whatsapp-dark text-[10px] font-bold px-1.5 py-0.2 rounded">
                  .PK
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-whatsapp-dark font-bold mt-0.5">
                {romanUrduMode ? 'Yaqeeni Deal, Local Trust' : 'Curated Hub & P2P Marketplace'}
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-2 ml-4">
              <button id="nav-hub-btn" onClick={() => handleNav('hub')} className={navLinkClasses(currentRoute === 'hub' || currentRoute === 'hub_detail')}>
                <Store className="w-4 h-4" />
                <span>Laptop Hub</span>
                <span className="text-[9px] bg-whatsapp/10 text-whatsapp-dark px-1.5 py-0.2 rounded font-bold">
                  Verified
                </span>
              </button>

              <button id="nav-marketplace-btn" onClick={() => handleNav('marketplace')} className={navLinkClasses(currentRoute === 'marketplace' || currentRoute === 'marketplace_detail')}>
                <Users className="w-4 h-4" />
                <span>Marketplace</span>
              </button>

              <button id="nav-calculator-btn" onClick={() => handleNav('calculator')} className={navLinkClasses(currentRoute === 'calculator')}>
                <Calculator className="w-4 h-4" />
                <span>Calculator</span>
              </button>

              <button id="nav-finder-btn" onClick={() => handleNav('finder')} className={navLinkClasses(currentRoute === 'finder')}>
                <Compass className="w-4 h-4" />
                <span>Finder</span>
              </button>

              <button id="nav-advisor-btn" onClick={() => handleNav('advisor')} className={navLinkClasses(currentRoute === 'advisor')}>
                <Sliders className="w-4 h-4" />
                <span>Advisor</span>
              </button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xs relative">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                id="global-search-input"
                type="text"
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  if (e.target.value.trim() && currentRoute !== 'hub' && currentRoute !== 'marketplace') {
                    navigateTo('hub');
                  }
                }}
                placeholder="Search HP, Dell, MacBook..."
                className="w-full bg-surface-container-low text-xs text-on-surface pl-9 pr-4 py-2 rounded-full border border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary placeholder:text-outline transition-all"
              />
              {globalSearchQuery && (
                <button
                  onClick={() => setGlobalSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons & Auth / Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* WhatsApp Quick Help Button */}
            <a
              href="https://wa.me/923001234567?text=Salam%20Apna%20Laptop%20team,%20I%20have%20an%20inquiry"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-whatsapp hover:bg-whatsapp-dark px-3.5 py-2 rounded-lg flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </a>

            {/* Post Listing CTA */}
            <button
              id="sell-laptop-header-btn"
              onClick={() => handleNav('sell')}
              className="hidden sm:flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container text-whatsapp-dark font-bold px-3 py-2 rounded-lg text-xs border border-outline-variant transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Sell Laptop</span>
            </button>

            {/* Wishlist */}
            <button
              id="wishlist-btn"
              onClick={() => handleNav('wishlist')}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low relative transition-colors"
              title="Saved Laptops"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              id="cart-header-btn"
              onClick={() => handleNav('cart')}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low relative transition-colors"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-whatsapp text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User / Role Switcher Menu */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container px-2.5 py-1.5 rounded-xl border border-outline-variant text-xs text-on-surface transition-colors"
              >
                {currentUser ? (
                  <>
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                      alt={currentUser.name}
                      className="w-5 h-5 rounded-full object-cover border border-whatsapp"
                    />
                    <span className="font-semibold max-w-[80px] sm:max-w-[100px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    {currentUser.role === 'admin' && (
                      <span className="bg-primary text-white text-[9px] px-1 rounded font-bold">
                        Admin
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <UserIcon className="w-4 h-4 text-outline" />
                    <span>Guest</span>
                  </>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-outline" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant py-2 z-50 text-on-surface text-xs">
                  <div className="px-3 py-2 border-b border-outline-variant">
                    <p className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">
                      Current Profile
                    </p>
                    <p className="font-bold text-on-surface text-sm">
                      {currentUser ? currentUser.name : 'Browsing as Guest'}
                    </p>
                    {currentUser && (
                      <p className="text-on-surface-variant text-[11px]">{currentUser.city} • {currentUser.phone}</p>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleNav('dashboard');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-surface-container-low flex items-center gap-2 text-on-surface"
                    >
                      <UserIcon className="w-4 h-4 text-whatsapp-dark" />
                      <span>My Dashboard & Listings</span>
                    </button>

                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => {
                          handleNav('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-surface-container-low flex items-center gap-2 text-primary font-semibold"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Hub & Moderation</span>
                      </button>
                    )}
                  </div>

                  <div className="px-3 pt-2 pb-1 border-t border-outline-variant">
                    <p className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider mb-1.5">
                      Quick Demo Role Switcher:
                    </p>
                    <div className="space-y-1">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between ${
                            currentUser?.id === u.id
                              ? 'bg-whatsapp/10 text-whatsapp-dark font-bold'
                              : 'hover:bg-surface-container-low text-on-surface-variant'
                          }`}
                        >
                          <span>{u.name} ({u.role})</span>
                          {currentUser?.id === u.id && <CheckCircle2 className="w-3 h-3 text-whatsapp-dark" />}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          switchUser(null);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between ${
                          !currentUser
                            ? 'bg-whatsapp/10 text-whatsapp-dark font-bold'
                            : 'hover:bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        <span>Guest (Not logged in)</span>
                        {!currentUser && <CheckCircle2 className="w-3 h-3 text-whatsapp-dark" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container-low"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="pb-3 md:hidden">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                if (e.target.value.trim() && currentRoute !== 'hub' && currentRoute !== 'marketplace') {
                  navigateTo('hub');
                }
              }}
              placeholder="Search brand, model, specs..."
              className="w-full bg-surface-container-low text-sm text-on-surface pl-9 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-none focus:border-secondary placeholder:text-outline"
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container-lowest border-b border-outline-variant px-4 pt-2 pb-5 space-y-2">
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => handleNav('hub')}
              className={`p-3 rounded-xl text-left font-semibold text-xs flex flex-col gap-1 border ${
                currentRoute === 'hub' ? 'bg-whatsapp text-white border-whatsapp' : 'bg-surface-container-low text-on-surface border-outline-variant'
              }`}
            >
              <Store className="w-5 h-5" />
              <span>Laptop Hub (Store)</span>
              <span className="text-[10px] opacity-80">Verified Stock</span>
            </button>

            <button
              onClick={() => handleNav('marketplace')}
              className={`p-3 rounded-xl text-left font-semibold text-xs flex flex-col gap-1 border ${
                currentRoute === 'marketplace' ? 'bg-whatsapp text-white border-whatsapp' : 'bg-surface-container-low text-on-surface border-outline-variant'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>P2P Marketplace</span>
              <span className="text-[10px] opacity-80">Used Deals</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleNav('calculator')} className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-center text-xs text-on-surface flex flex-col items-center gap-1">
              <Calculator className="w-4 h-4" />
              <span className="leading-tight">Valuation Calc</span>
            </button>
            <button onClick={() => handleNav('finder')} className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-center text-xs text-on-surface flex flex-col items-center gap-1">
              <Compass className="w-4 h-4" />
              <span className="leading-tight">Finder Quiz</span>
            </button>
            <button onClick={() => handleNav('advisor')} className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-center text-xs text-on-surface flex flex-col items-center gap-1">
              <Sliders className="w-4 h-4" />
              <span className="leading-tight">Upgrade Tool</span>
            </button>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => handleNav('sell')}
              className="flex-1 bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{romanUrduMode ? 'Laptop Bechein (Free)' : 'Sell Laptop (Free)'}</span>
            </button>

            <button
              onClick={() => handleNav('dashboard')}
              className="px-4 bg-primary hover:opacity-90 text-white font-medium py-2.5 rounded-xl text-xs"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
