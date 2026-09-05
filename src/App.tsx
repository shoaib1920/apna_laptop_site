import React, { useState, useEffect } from 'react';
import { useAppStore } from './services/store';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { HubView } from './components/HubView';
import { HubDetailView } from './components/HubDetailView';
import { PriceCalculatorView } from './components/PriceCalculatorView';
import { UpgradeAdvisorView } from './components/UpgradeAdvisorView';
import { LaptopFinderView } from './components/LaptopFinderView';
import { CheckoutView } from './components/CheckoutView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { WishlistView } from './components/WishlistView';
import { UserDashboardView } from './components/UserDashboardView';
import { AccessDenied } from './components/AccessDenied';
import { BottomNav } from './components/BottomNav';
import { MessageCircle, ArrowUp } from 'lucide-react';

const HIDE_BOTTOM_NAV_ROUTES = ['hub_detail', 'checkout', 'cart', 'calculator', 'advisor', 'admin'];

export default function App() {
  const store = useAppStore();

  // Navigation router state
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [routeParams, setRouteParams] = useState<any>({});
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const navigateTo = (route: string, params: any = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUpdateCartQuantity = (listingId: string, quantity: number) => {
    const itemIndex = store.cart.findIndex((i) => i.listing.id === listingId);
    if (itemIndex !== -1) {
      store.updateCartQuantity(itemIndex, quantity);
    }
  };

  const handleRemoveFromCart = (listingId: string) => {
    const itemIndex = store.cart.findIndex((i) => i.listing.id === listingId);
    if (itemIndex !== -1) {
      store.removeCartItem(itemIndex);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface font-sans antialiased selection:bg-steel selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentRoute={currentRoute}
        navigateTo={navigateTo}
        currentUser={store.currentUser}
        users={store.users}
        switchUser={store.switchUser}
        cartCount={store.cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={store.wishlist.length}
        romanUrduMode={store.romanUrduMode}
        setRomanUrduMode={store.setRomanUrduMode}
        globalSearchQuery={globalSearchQuery}
        setGlobalSearchQuery={setGlobalSearchQuery}
        hubCount={store.hubListings.length}
      />

      {/* Main View Container */}
      <main className={`flex-1 ${!HIDE_BOTTOM_NAV_ROUTES.includes(currentRoute) ? 'pb-20 lg:pb-0' : ''}`}>
        {currentRoute === 'home' && (
          <HomeView
            hubListings={store.hubListings}
            reviews={store.reviews}
            wishlist={store.wishlist}
            toggleWishlist={store.toggleWishlist}
            addToCart={store.addToCart}
            navigateTo={navigateTo}
            romanUrduMode={store.romanUrduMode}
            globalSearchQuery={globalSearchQuery}
            setGlobalSearchQuery={setGlobalSearchQuery}
          />
        )}

        {currentRoute === 'hub' && (
          <HubView
            hubListings={store.hubListings}
            wishlist={store.wishlist}
            toggleWishlist={store.toggleWishlist}
            navigateTo={navigateTo}
            romanUrduMode={store.romanUrduMode}
            globalSearchQuery={globalSearchQuery}
            setGlobalSearchQuery={setGlobalSearchQuery}
          />
        )}

        {currentRoute === 'hub_detail' && (
          <HubDetailView
            listingId={routeParams.hubId || store.hubListings[0]?.id}
            hubListings={store.hubListings}
            reviews={store.reviews}
            wishlist={store.wishlist}
            toggleWishlist={store.toggleWishlist}
            addToCart={store.addToCart}
            addReview={store.addReview}
            navigateTo={navigateTo}
            currentUser={store.currentUser}
            romanUrduMode={store.romanUrduMode}
          />
        )}

        {currentRoute === 'calculator' && (
          <PriceCalculatorView
            navigateTo={navigateTo}
            romanUrduMode={store.romanUrduMode}
          />
        )}

        {currentRoute === 'advisor' && (
          <UpgradeAdvisorView
            hubListings={store.hubListings}
            navigateTo={navigateTo}
            romanUrduMode={store.romanUrduMode}
          />
        )}

        {currentRoute === 'finder' && (
          <LaptopFinderView
            hubListings={store.hubListings}
            navigateTo={navigateTo}
            romanUrduMode={store.romanUrduMode}
          />
        )}

        {(currentRoute === 'checkout' || currentRoute === 'cart') && (
          <CheckoutView
            cart={store.cart}
            currentUser={store.currentUser}
            updateCartQuantity={handleUpdateCartQuantity}
            removeFromCart={handleRemoveFromCart}
            clearCart={store.clearCart}
            placeOrder={store.createOrder}
            navigateTo={navigateTo}
            romanUrduMode={store.romanUrduMode}
          />
        )}

        {currentRoute === 'admin' && (
          store.currentUser?.role === 'admin' ? (
            <AdminDashboardView
              hubListings={store.hubListings}
              orders={store.orders}
              createHubListing={store.addHubListing}
              updateHubListing={store.updateHubListing}
              updateOrderStatus={store.updateOrderStatus}
              deleteHubListing={store.deleteHubListing}
              navigateTo={navigateTo}
              currentUser={store.currentUser}
            />
          ) : (
            <AccessDenied navigateTo={navigateTo} />
          )
        )}

        {currentRoute === 'dashboard' && (
          <UserDashboardView
            currentUser={store.currentUser}
            orders={store.orders}
            navigateTo={navigateTo}
            romanUrduMode={store.romanUrduMode}
          />
        )}

        {currentRoute === 'wishlist' && (
          <WishlistView
            wishlist={store.wishlist}
            hubListings={store.hubListings}
            toggleWishlist={store.toggleWishlist}
            navigateTo={navigateTo}
          />
        )}
      </main>

      {/* Mobile bottom navigation */}
      {!HIDE_BOTTOM_NAV_ROUTES.includes(currentRoute) && (
        <BottomNav currentRoute={currentRoute} navigateTo={navigateTo} currentUser={store.currentUser} />
      )}

      {/* Persistent Floating WhatsApp Help Button (Deep-link) */}
      <aside
        id="floating-whatsapp-widget"
        className="fixed bottom-24 lg:bottom-6 right-6 z-40 flex flex-col items-end gap-2"
        aria-label="Apna Laptop WhatsApp Help"
      >
        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 rounded-full bg-surface-container-lowest text-on-surface-variant shadow-md border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-all"
            title="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}

        <a
          href="https://wa.me/923001234567?text=Salam%20Apna%20Laptop%20team,%20I%20need%20help%20choosing%20a%20laptop"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 bg-whatsapp hover:bg-whatsapp-dark text-white px-4 py-3 rounded-full shadow-2xl shadow-whatsapp/40 transition-all hover:scale-105"
        >
          <MessageCircle className="w-5 h-5 fill-white text-whatsapp shrink-0" />
          <span className="text-xs font-bold font-display hidden sm:inline whitespace-nowrap">
            {store.romanUrduMode ? 'WhatsApp Par Rabta Karein' : 'Chat on WhatsApp'}
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-white/70 animate-ping hidden sm:inline-block" />
        </a>
      </aside>

      {/* Footer */}
      <Footer navigateTo={navigateTo} romanUrduMode={store.romanUrduMode} currentUser={store.currentUser} />
    </div>
  );
}
