import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAppStore, ShopContext, Shop } from './services/store';
import { parsePath, pathFor, RouteState } from './services/router';
import { applyPageSeo, seoForRoute } from './services/seo';
import { initAnalytics, trackPageView } from './services/analytics';
import { findListingBySlug, slugify } from './utils/helpers';
import { HubListing } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { HubView } from './components/HubView';
import { HubDetailView } from './components/HubDetailView';
import { PriceCalculatorView } from './components/PriceCalculatorView';
import { UpgradeAdvisorView } from './components/UpgradeAdvisorView';
import { LaptopFinderView } from './components/LaptopFinderView';
import { CheckoutView } from './components/CheckoutView';
import { AdminLoginView } from './components/AdminLoginView';
import { AccountView } from './components/AccountView';
import { WishlistView } from './components/WishlistView';
import { UserDashboardView } from './components/UserDashboardView';
import { AccessDenied } from './components/AccessDenied';
import { BottomNav } from './components/BottomNav';
import { TrackView } from './components/TrackView';
import { AboutView, ContactView } from './components/InfoViews';
import { CartDrawer } from './components/CartDrawer';
import { AiChatAssistant } from './components/AiChatAssistant';
import { GuidedTour } from './components/GuidedTour';
import { Toasts, RestockModal, QuickViewModal, FloatingWhatsApp, PromoPopup } from './components/Overlays';
import { ArrowUp, Loader2 } from 'lucide-react';

// The admin panel is loaded only when /admin is opened, so the store stays fast.
const AdminDashboardView = lazy(() =>
  import('./components/AdminDashboardView').then((m) => ({ default: m.AdminDashboardView }))
);

const HIDE_BOTTOM_NAV_ROUTES = ['hub_detail', 'checkout', 'calculator', 'advisor', 'admin', 'account'];

export default function App() {
  const store = useAppStore();

  // The address bar is the source of truth for which page is open.
  const [{ route: currentRoute, params: routeParams }, setRouteState] = useState<RouteState>(() =>
    parsePath(window.location.pathname)
  );
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const navigateTo = (route: string, params: any = {}) => {
    // "cart" is the slide-in bag, not a page.
    if (route === 'cart') {
      store.setCartOpen(true);
      return;
    }
    if (route !== 'checkout') store.setWhatsappCheckout(false);
    const path = pathFor(route, params, store.hubListings);
    if (path !== window.location.pathname) window.history.pushState({}, '', path);
    setRouteState({ route, params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const orderOnWhatsApp = (listing?: HubListing) => {
    if (listing && !store.cart.some((c) => c.listing.id === listing.id)) store.addToCart(listing);
    store.setCartOpen(false);
    store.setWhatsappCheckout(true);
    const path = pathFor('checkout', {}, store.hubListings);
    if (path !== window.location.pathname) window.history.pushState({}, '', path);
    setRouteState({ route: 'checkout', params: {} });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handlePopState = () => setRouteState(parsePath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // The open product: by id when navigated inside the app, by slug from a shared link.
  const detailListing =
    currentRoute === 'hub_detail'
      ? store.hubListings.find((l) => l.id === routeParams.hubId) ||
        (routeParams.hubSlug ? findListingBySlug(routeParams.hubSlug, store.hubListings) : undefined)
      : undefined;

  // /laptops/<brand> shows the Hub filtered to that brand.
  const brandFilter =
    currentRoute === 'hub' && routeParams.brand
      ? store.hubListings.find((l) => slugify(l.brand) === slugify(routeParams.brand))?.brand
      : undefined;

  const { markViewed } = store;
  useEffect(() => {
    if (detailListing) markViewed(detailListing.id);
  }, [detailListing?.id, markViewed]);

  // Keep title, description, canonical URL and social tags in step with the page.
  useEffect(() => {
    applyPageSeo(seoForRoute(currentRoute, window.location.pathname, detailListing, brandFilter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute, detailListing?.id, detailListing?.sale_price, detailListing?.status, brandFilter, routeParams.orderId]);

  useEffect(() => {
    initAnalytics();
  }, []);
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, [currentRoute, detailListing?.id, brandFilter]);

  const shop: Shop = { ...store, currentRoute, navigateTo, orderOnWhatsApp };
  const showBottomNav = !HIDE_BOTTOM_NAV_ROUTES.includes(currentRoute);

  return (
    <ShopContext.Provider value={shop}>
      <div className="min-h-screen flex flex-col bg-surface text-on-surface font-sans antialiased selection:bg-steel selection:text-white">
        {/* Top Navigation */}
        <Navbar
          currentRoute={currentRoute}
          navigateTo={navigateTo}
          currentUser={store.currentUser}
          onLogout={store.logout}
          cartCount={store.cart.reduce((sum, item) => sum + item.quantity, 0)}
          wishlistCount={store.wishlist.length}
          romanUrduMode={store.romanUrduMode}
          setRomanUrduMode={store.setRomanUrduMode}
          globalSearchQuery={globalSearchQuery}
          setGlobalSearchQuery={setGlobalSearchQuery}
          hubCount={store.hubListings.length}
        />

        {/* Main View Container */}
        <main className={`flex-1 ${showBottomNav ? 'pb-20 lg:pb-0' : ''}`}>
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
              key={brandFilter || 'all'}
              hubListings={store.hubListings}
              wishlist={store.wishlist}
              toggleWishlist={store.toggleWishlist}
              navigateTo={navigateTo}
              romanUrduMode={store.romanUrduMode}
              globalSearchQuery={globalSearchQuery}
              setGlobalSearchQuery={setGlobalSearchQuery}
              initialBrand={brandFilter}
            />
          )}

          {currentRoute === 'hub_detail' && (
            <HubDetailView
              key={detailListing?.id || 'none'}
              listing={detailListing}
              catalogLoaded={store.catalogLoaded}
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

          {currentRoute === 'checkout' && <CheckoutView />}

          {currentRoute === 'track' && <TrackView orderId={routeParams.orderId} />}

          {currentRoute === 'about' && <AboutView />}

          {currentRoute === 'contact' && <ContactView />}

          {currentRoute === 'admin' && (
            !store.authChecked ? null : store.isAdmin ? (
              <Suspense
                fallback={
                  <div className="py-24 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-outline" />
                  </div>
                }
              >
                <AdminDashboardView
                  hubListings={store.hubListings}
                  orders={store.orders}
                  createHubListing={store.addHubListing}
                  updateHubListing={store.updateHubListing}
                  deleteHubListing={store.deleteHubListing}
                  navigateTo={navigateTo}
                  currentUser={store.currentUser}
                  onLogout={store.logout}
                />
              </Suspense>
            ) : store.currentUser ? (
              <AccessDenied navigateTo={navigateTo} />
            ) : (
              <AdminLoginView navigateTo={navigateTo} />
            )
          )}

          {currentRoute === 'account' && (
            <AccountView
              currentUser={store.currentUser}
              authError={store.authError}
              signUp={store.signUp}
              signIn={store.signIn}
              logout={store.logout}
              navigateTo={navigateTo}
            />
          )}

          {currentRoute === 'dashboard' && (
            <UserDashboardView
              currentUser={store.currentUser}
              orders={store.myOrders}
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
        {showBottomNav && <BottomNav currentRoute={currentRoute} navigateTo={navigateTo} />}

        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-40 lg:bottom-24 right-4 sm:right-6 z-40 w-10 h-10 rounded-full bg-surface-container-lowest text-on-surface-variant shadow-md border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-all print:hidden"
            title="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}

        {currentRoute !== 'admin' && !store.chatOpen && <FloatingWhatsApp raised={showBottomNav || currentRoute === 'hub_detail'} />}

        <CartDrawer />
        <QuickViewModal />
        <RestockModal />
        <AiChatAssistant />
        <PromoPopup />
        <GuidedTour />
        <Toasts />

        {/* Footer */}
        <Footer navigateTo={navigateTo} romanUrduMode={store.romanUrduMode} currentUser={store.currentUser} />
      </div>
    </ShopContext.Provider>
  );
}
