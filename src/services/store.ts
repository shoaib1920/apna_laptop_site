import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  User,
  HubListing,
  P2PListing,
  CartItem,
  Order,
  Review,
  InAppMessage,
  LaptopCondition,
} from '../types';
import {
  INITIAL_HUB_LISTINGS,
  INITIAL_P2P_LISTINGS,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
} from '../data/mockData';
import { auth, isFirebaseConfigured } from './firebase';
import {
  subscribeHubListings,
  subscribeOrders,
  subscribeReviews,
  seedHubListingsIfEmpty,
  seedReviewsIfEmpty,
  addHubListingFS,
  updateHubListingFS,
  deleteHubListingFS,
  createOrderFS,
  updateOrderStatusFS,
  addReviewFS,
} from './firestoreData';
import {
  checkIsAdmin,
  getCustomerProfile,
  signUpCustomer,
  signInCustomer,
  logoutUser,
} from './auth';

const STORAGE_KEYS = {
  HUB_LISTINGS: 'apna_laptop_hub_listings_v1',
  P2P_LISTINGS: 'apna_laptop_p2p_listings_v1',
  CART: 'apna_laptop_cart_v1',
  WISHLIST: 'apna_laptop_wishlist_v1',
  ORDERS: 'apna_laptop_orders_v1',
  REVIEWS: 'apna_laptop_reviews_v1',
  MESSAGES: 'apna_laptop_messages_v1',
  ROMAN_URDU: 'apna_laptop_roman_urdu_v1',
};

// Helper for safe localStorage
function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('Error reading localStorage key:', key, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing to localStorage key:', key, e);
  }
}

export function useAppStore() {
  // Navigation & Routing state
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [selectedP2PId, setSelectedP2PId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [prefilledSellSpecs, setPrefilledSellSpecs] = useState<any | null>(null);

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Roman Urdu Trust Mode
  const [romanUrduMode, setRomanUrduMode] = useState<boolean>(() =>
    getStored<boolean>(STORAGE_KEYS.ROMAN_URDU, true)
  );

  // Real auth: a signed-in Firebase user is either a customer or an admin
  // (decided by whether an admins/{uid} doc exists - see auth.ts). Accounts
  // are optional - guests can browse and check out without signing in.
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(!isFirebaseConfigured);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerCity, setCustomerCity] = useState<string>('Nankana Sahib');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setIsAdmin(false);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerCity('Nankana Sahib');
        setAuthChecked(true);
        return;
      }
      const [admin, profile] = await Promise.all([
        checkIsAdmin(user.uid),
        getCustomerProfile(user.uid),
      ]);
      setIsAdmin(admin);
      setCustomerName(profile?.name || user.displayName || '');
      setCustomerPhone(profile?.phone || '');
      setCustomerCity(profile?.city || 'Nankana Sahib');
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, name: string, phone: string, city: string) => {
    setAuthError(null);
    try {
      await signUpCustomer(email, password, name, phone, city);
      // The onAuthStateChanged listener fires as soon as the account is
      // created (before the profile doc write above finishes) and can read
      // a stale/empty profile - set what we already know locally so the
      // name typed at signup shows immediately instead of an email prefix.
      setCustomerName(name);
      setCustomerPhone(phone);
      setCustomerCity(city);
    } catch (e: any) {
      setAuthError(e?.message || 'Could not create account');
      throw e;
    }
  };

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInCustomer(email, password);
    } catch (e: any) {
      setAuthError(e?.message || 'Invalid email or password');
      throw e;
    }
  };

  const logout = () => logoutUser();

  // Listings
  const [hubListings, setHubListings] = useState<HubListing[]>(() =>
    getStored<HubListing[]>(STORAGE_KEYS.HUB_LISTINGS, INITIAL_HUB_LISTINGS)
  );
  const [p2pListings, setP2PListings] = useState<P2PListing[]>(() =>
    getStored<P2PListing[]>(STORAGE_KEYS.P2P_LISTINGS, INITIAL_P2P_LISTINGS)
  );

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>(() =>
    getStored<CartItem[]>(STORAGE_KEYS.CART, [])
  );
  const [wishlist, setWishlist] = useState<string[]>(() =>
    getStored<string[]>(STORAGE_KEYS.WISHLIST, ['hub_1', 'p2p_1'])
  );

  // Orders & Reviews & Messages
  const [orders, setOrders] = useState<Order[]>(() =>
    getStored<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );
  const [reviews, setReviews] = useState<Review[]>(() =>
    getStored<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS)
  );
  const [messages, setMessages] = useState<InAppMessage[]>(() =>
    getStored<InAppMessage[]>(STORAGE_KEYS.MESSAGES, [])
  );

  // Sync to localStorage
  useEffect(() => {
    setStored(STORAGE_KEYS.ROMAN_URDU, romanUrduMode);
  }, [romanUrduMode]);

  useEffect(() => {
    setStored(STORAGE_KEYS.HUB_LISTINGS, hubListings);
  }, [hubListings]);

  useEffect(() => {
    setStored(STORAGE_KEYS.P2P_LISTINGS, p2pListings);
  }, [p2pListings]);

  useEffect(() => {
    setStored(STORAGE_KEYS.CART, cart);
  }, [cart]);

  useEffect(() => {
    setStored(STORAGE_KEYS.WISHLIST, wishlist);
  }, [wishlist]);

  useEffect(() => {
    setStored(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  useEffect(() => {
    setStored(STORAGE_KEYS.REVIEWS, reviews);
  }, [reviews]);

  useEffect(() => {
    setStored(STORAGE_KEYS.MESSAGES, messages);
  }, [messages]);

  // When Firebase is configured, Hub inventory & orders become shared,
  // realtime state across every visitor/admin instead of per-device
  // localStorage. Catalog reads are public, so any visitor can subscribe;
  // seeding is a write, which Firestore rules only allow for a signed-in
  // admin, so it only runs once the admin is actually logged in.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = subscribeHubListings(setHubListings);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !isAdmin) return;
    seedHubListingsIfEmpty(INITIAL_HUB_LISTINGS).catch((e) =>
      console.error('Failed to seed hub listings:', e)
    );
  }, [isAdmin]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = subscribeOrders(setOrders);
    return unsubscribe;
  }, []);

  // Reviews are publicly readable/writable (anyone can leave one, same as
  // the existing review form), so unlike hub_listings the seed doesn't need
  // to wait for an admin - it can run on any visitor's first load.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    seedReviewsIfEmpty(INITIAL_REVIEWS).catch((e) =>
      console.error('Failed to seed reviews:', e)
    );
    const unsubscribe = subscribeReviews(setReviews);
    return unsubscribe;
  }, []);

  // Derived current user: real Firebase account (customer or admin), or
  // null for a guest. Guests can still browse, add to cart, and check out.
  const currentUser: User | null = firebaseUser
    ? {
        id: firebaseUser.uid,
        name: customerName || firebaseUser.email?.split('@')[0] || 'Customer',
        email: firebaseUser.email || '',
        phone: customerPhone,
        whatsapp_number: customerPhone,
        city: customerCity,
        role: isAdmin ? 'admin' : 'user',
        is_phone_verified: false,
        joined_at: firebaseUser.metadata.creationTime || new Date().toISOString(),
        rating_avg: 0,
        total_listings_count: 0,
      }
    : null;

  // Actions
  const navigateTo = (
    route: string,
    params?: { hubId?: string; p2pId?: string; orderId?: string; sellSpecs?: any }
  ) => {
    if (params?.hubId) setSelectedHubId(params.hubId);
    if (params?.p2pId) setSelectedP2PId(params.p2pId);
    if (params?.orderId) setSelectedOrderId(params.orderId);
    if (params?.sellSpecs) setPrefilledSellSpecs(params.sellSpecs);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addToCart = (
    listing: HubListing,
    selectedRamUpgrade?: { label: string; price: number; ramAdded: string },
    selectedStorageUpgrade?: { label: string; price: number; storageAdded: string }
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.listing.id === listing.id &&
          item.selectedRamUpgrade?.label === selectedRamUpgrade?.label &&
          item.selectedStorageUpgrade?.label === selectedStorageUpgrade?.label
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          listing,
          quantity: 1,
          selectedRamUpgrade,
          selectedStorageUpgrade,
        },
      ];
    });
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCart((prev) => {
        const updated = [...prev];
        updated[index].quantity = quantity;
        return updated;
      });
    }
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  // P2P Listing management
  const addP2PListing = (newListing: Omit<P2PListing, 'id' | 'created_at' | 'view_count' | 'reports_count' | 'status'>): P2PListing => {
    const id = `p2p_${Date.now()}`;
    const listing: P2PListing = {
      ...newListing,
      id,
      created_at: new Date().toISOString().split('T')[0],
      view_count: 1,
      reports_count: 0,
      status: 'active',
    };
    setP2PListings((prev) => [listing, ...prev]);
    return listing;
  };

  const updateP2PListing = (id: string, updates: Partial<P2PListing>) => {
    setP2PListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteP2PListing = (id: string) => {
    setP2PListings((prev) => prev.filter((item) => item.id !== id));
  };

  const reportP2PListing = (id: string) => {
    setP2PListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, reports_count: item.reports_count + 1 } : item
      )
    );
  };

  const incrementP2PViewCount = (id: string) => {
    setP2PListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, view_count: item.view_count + 1 } : item
      )
    );
  };

  // Hub inventory management (Admin). Updates local state immediately for a
  // snappy UI; when Firebase is configured the write also goes to Firestore
  // so every visitor/admin sees the same shared inventory in realtime (the
  // subscription above then reconciles local state with the server copy).
  const addHubListing = (newListing: Omit<HubListing, 'id' | 'rating' | 'reviewCount'>): HubListing => {
    const id = `hub_${Date.now()}`;
    const listing: HubListing = {
      ...newListing,
      id,
      rating: 5.0,
      reviewCount: 0,
    };
    setHubListings((prev) => [listing, ...prev]);
    if (isFirebaseConfigured) {
      addHubListingFS(listing).catch((e) => console.error('Failed to add hub listing:', e));
    }
    return listing;
  };

  const updateHubListing = (id: string, updates: Partial<HubListing>) => {
    setHubListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    if (isFirebaseConfigured) {
      updateHubListingFS(id, updates).catch((e) => console.error('Failed to update hub listing:', e));
    }
  };

  const deleteHubListing = (id: string) => {
    setHubListings((prev) => prev.filter((item) => item.id !== id));
    if (isFirebaseConfigured) {
      deleteHubListingFS(id).catch((e) => console.error('Failed to delete hub listing:', e));
    }
  };

  // Order management
  const createOrder = (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'status'>): Order => {
    const id = `ord_${Date.now()}`;
    const order_number = `AL-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      ...orderData,
      id,
      order_number,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'pending',
    };
    setOrders((prev) => [newOrder, ...prev]);
    if (isFirebaseConfigured) {
      createOrderFS(newOrder).catch((e) => console.error('Failed to save order:', e));
    }

    // Decrement stock for every purchased listing - without this, sold-out
    // units keep showing as available to the next buyer.
    newOrder.items.forEach((item) => {
      const listing = hubListings.find((h) => h.id === item.listing_id);
      if (!listing) return;
      const newQty = Math.max(0, listing.stock_qty - item.qty);
      const newStatus: HubListing['status'] =
        newQty <= 0 ? 'out_of_stock' : newQty <= 2 ? 'low_stock' : 'in_stock';
      updateHubListing(listing.id, { stock_qty: newQty, status: newStatus });
    });

    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status'], courierName?: string, trackingNumber?: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              ...(courierName ? { courier_name: courierName } : {}),
              ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
            }
          : order
      )
    );
    if (isFirebaseConfigured) {
      updateOrderStatusFS(orderId, status, courierName, trackingNumber).catch((e) =>
        console.error('Failed to update order status:', e)
      );
    }
  };

  // Reviews
  const addReview = (newReview: Omit<Review, 'id' | 'created_at'>) => {
    const id = `rev_${Date.now()}`;
    const review: Review = {
      ...newReview,
      id,
      created_at: new Date().toISOString().split('T')[0],
    };
    setReviews((prev) => [review, ...prev]);
    if (isFirebaseConfigured) {
      addReviewFS(review).catch((e) => console.error('Failed to save review:', e));
    }
  };

  // Messages
  const sendMessage = (receiverId: string, listingId: string, listingTitle: string, text: string) => {
    if (!currentUser) return;
    const newMsg: InAppMessage = {
      id: `msg_${Date.now()}`,
      listing_id: listingId,
      listing_title: listingTitle,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      receiver_id: receiverId,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Reset demo data (only meaningful in local/non-Firebase mode)
  const resetDemoData = () => {
    setHubListings(INITIAL_HUB_LISTINGS);
    setP2PListings(INITIAL_P2P_LISTINGS);
    setOrders(INITIAL_ORDERS);
    setReviews(INITIAL_REVIEWS);
    setCart([]);
    setWishlist(['hub_1', 'p2p_1']);
  };

  return {
    currentRoute,
    selectedHubId,
    selectedP2PId,
    selectedOrderId,
    prefilledSellSpecs,
    globalSearchQuery,
    setGlobalSearchQuery,
    romanUrduMode,
    setRomanUrduMode,
    currentUser,
    isAdmin,
    authChecked,
    authError,
    signUp,
    signIn,
    logout,
    hubListings,
    p2pListings,
    cart,
    wishlist,
    orders,
    reviews,
    messages,
    navigateTo,
    toggleWishlist,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    clearCart,
    addP2PListing,
    updateP2PListing,
    deleteP2PListing,
    reportP2PListing,
    incrementP2PViewCount,
    addHubListing,
    updateHubListing,
    deleteHubListing,
    createOrder,
    updateOrderStatus,
    addReview,
    sendMessage,
    resetDemoData,
  };
}
