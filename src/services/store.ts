import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  User,
  HubListing,
  P2PListing,
  CartItem,
  Order,
  Review,
  InAppMessage,
  OrderStatus,
  DiscountCode,
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
  subscribeReviews,
  seedHubListingsIfEmpty,
  seedReviewsIfEmpty,
  addHubListingFS,
  updateHubListingFS,
  deleteHubListingFS,
  adjustHubStockFS,
  addReviewFS,
} from './firestoreData';
import {
  OrderLimitError,
  createOrderRemote,
  deleteOrderRemote,
  generateOrderId,
  getOrderRemote,
  subscribeAllOrders,
  subscribeMyOrders,
  updateOrderRemote,
} from './orders';
import {
  CartDraft,
  adjustPointsRemote,
  createBackInStockRemote,
  getPointsRemote,
  saveAbandonedCartRemote,
} from './customers';
import {
  discountProblem,
  getDiscount,
  incrementDiscountUsage,
  subscribeFeaturedDiscount,
} from './discounts';
import { LOW_STOCK_THRESHOLD, ORDER_STATUS_FLOW, POINTS_EARN_RATE } from '../config';
import { PHONE_HINT, toPhoneKey } from '../utils/phone';
import { cartSubtotal, formatPKR, setSlugCatalogue } from '../utils/helpers';
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
  MY_ORDERS: 'apna_laptop_my_orders_v1',
  DISCOUNT: 'apna_laptop_discount_v1',
  RECENT: 'apna_laptop_recently_viewed_v1',
};

export interface Toast {
  id: number;
  text: string;
  kind: 'success' | 'error' | 'info';
}

/** What checkout / the AI assistant hand over; the store fills in the rest. */
export type NewOrderInput = Omit<Order, 'id' | 'order_number' | 'created_at' | 'status'>;

/** Thrown when confirming an order whose customer no longer has the points
 * they redeemed - the admin decides whether to continue anyway. */
export class LowPointsError extends Error {
  constructor(public balance: number, public needed: number) {
    super(`Customer has ${balance} points but redeemed ${needed}.`);
    this.name = 'LowPointsError';
  }
}

const stockStatusFor = (qty: number): HubListing['status'] =>
  qty <= 0 ? 'out_of_stock' : qty <= LOW_STOCK_THRESHOLD ? 'low_stock' : 'in_stock';

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
  // False until the first live catalogue snapshot arrives, so a shared
  // product link can wait instead of flashing "not found".
  const [catalogLoaded, setCatalogLoaded] = useState<boolean>(!isFirebaseConfigured);
  setSlugCatalogue(hubListings);
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
  // `orders` is the admin's full list (live from Firestore), or the local
  // demo list when Firebase isn't configured. Customers never get this list:
  // they see `myOrders` - orders placed on this device plus, when signed in,
  // the ones on their account.
  const [orders, setOrders] = useState<Order[]>(() =>
    isFirebaseConfigured ? [] : getStored<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );
  const [deviceOrders, setDeviceOrders] = useState<Order[]>(() =>
    getStored<Order[]>(STORAGE_KEYS.MY_ORDERS, [])
  );
  const [accountOrders, setAccountOrders] = useState<Order[]>([]);

  // Discounts
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(() =>
    getStored<DiscountCode | null>(STORAGE_KEYS.DISCOUNT, null)
  );
  const [featuredDiscount, setFeaturedDiscount] = useState<DiscountCode | null>(null);

  // Recently viewed (last 8 listing ids)
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() =>
    getStored<string[]>(STORAGE_KEYS.RECENT, [])
  );

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const notify = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // Overlays any component may open
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [restockFor, setRestockFor] = useState<HubListing | null>(null);
  // True when checkout was opened from an "Order on WhatsApp" button.
  const [whatsappCheckout, setWhatsappCheckout] = useState(false);
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
    // The full order list is only kept on the device in demo mode. Earlier
    // versions cached every customer's order in each visitor's browser -
    // clear that copy.
    if (isFirebaseConfigured) {
      try {
        localStorage.removeItem(STORAGE_KEYS.ORDERS);
      } catch {
        // storage unavailable - nothing to clear
      }
      return;
    }
    setStored(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  useEffect(() => {
    setStored(STORAGE_KEYS.MY_ORDERS, deviceOrders);
  }, [deviceOrders]);

  useEffect(() => {
    setStored(STORAGE_KEYS.DISCOUNT, appliedDiscount);
  }, [appliedDiscount]);

  useEffect(() => {
    setStored(STORAGE_KEYS.RECENT, recentlyViewed);
  }, [recentlyViewed]);

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
    const unsubscribe = subscribeHubListings((listings) => {
      setHubListings(listings);
      setCatalogLoaded(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !isAdmin) return;
    seedHubListingsIfEmpty(INITIAL_HUB_LISTINGS).catch((e) =>
      console.error('Failed to seed hub listings:', e)
    );
  }, [isAdmin]);

  // Admin: the full live order list. Signed-in customer: their own orders.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (isAdmin) {
      return subscribeAllOrders(setOrders, (e) => console.error('Failed to load orders:', e));
    }
    setOrders([]);
    if (firebaseUser) return subscribeMyOrders(firebaseUser.uid, setAccountOrders);
    setAccountOrders([]);
  }, [isAdmin, firebaseUser]);

  // Refresh the status of orders placed on this device (each read is by
  // exact ID, which is all a customer is allowed to do).
  useEffect(() => {
    if (!isFirebaseConfigured || deviceOrders.length === 0) return;
    let cancelled = false;
    Promise.all(deviceOrders.slice(0, 10).map((o) => getOrderRemote(o.id).catch(() => null))).then((fresh) => {
      if (cancelled) return;
      const byId = new Map<string, Order>();
      fresh.forEach((o) => o && byId.set(o.id, o));
      if (byId.size === 0) return;
      setDeviceOrders((prev) => prev.map((o) => byId.get(o.id) || o));
    });
    return () => {
      cancelled = true;
    };
    // Runs once on load; later changes come from the customer's own actions.
  }, []);

  useEffect(() => subscribeFeaturedDiscount(setFeaturedDiscount), []);

  const myOrders: Order[] = [
    ...accountOrders,
    ...deviceOrders.filter((d) => !accountOrders.some((a) => a.id === d.id)),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

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

  const adjustStock = async (listingId: string, delta: number) => {
    const listing = hubListings.find((h) => h.id === listingId);
    if (!listing) return;
    const newQty = Math.max(0, listing.stock_qty + delta);
    const status = stockStatusFor(newQty);
    setHubListings((prev) => prev.map((h) => (h.id === listingId ? { ...h, stock_qty: newQty, status } : h)));
    if (isFirebaseConfigured) await adjustHubStockFS(listingId, newQty - listing.stock_qty, status);
  };

  // Discount codes
  const applyDiscountCode = async (code: string): Promise<string | null> => {
    let found: DiscountCode | null = null;
    try {
      found = await getDiscount(code);
    } catch (e) {
      console.error('Failed to check discount code:', e);
      return 'Could not check this code. Please try again.';
    }
    const problem = discountProblem(found);
    if (problem || !found) return problem || 'Invalid discount code.';
    const subtotal = cartSubtotal(cart);
    if (found.minSpend > 0 && subtotal < found.minSpend) {
      return `Add ${formatPKR(found.minSpend - subtotal)} more to use this code.`;
    }
    setAppliedDiscount(found);
    return null;
  };

  const removeDiscount = () => setAppliedDiscount(null);

  // Order management
  /** Saves a new order. Resolves with savedOnline=false when the online
   * save failed - the order is then kept on this device and the customer is
   * asked to send it on WhatsApp so the store still receives it. Throws
   * OrderLimitError when the phone number is over its daily limit. */
  const createOrder = async (
    orderData: NewOrderInput,
    draft?: CartDraft,
    // The AI assistant orders outside the bag, so it leaves the bag alone.
    options: { keepCart?: boolean } = {}
  ): Promise<{ order: Order; savedOnline: boolean }> => {
    const phoneKey = toPhoneKey(orderData.buyer_phone);
    if (!phoneKey) throw new Error(PHONE_HINT);
    const order_number = generateOrderId();
    const now = new Date().toISOString();
    const newOrder: Order = {
      ...orderData,
      id: order_number,
      order_number,
      created_at: now,
      status: 'pending',
      status_history: [{ status: 'pending', at: now }],
      source: orderData.source || 'website',
      phone_key: phoneKey,
    };

    let savedOnline = true;
    if (isFirebaseConfigured) {
      try {
        await createOrderRemote(newOrder);
      } catch (e) {
        if (e instanceof OrderLimitError) throw e;
        console.error('Failed to save order online:', e);
        savedOnline = false;
      }
    } else {
      setOrders((prev) => [newOrder, ...prev]);
    }
    setDeviceOrders((prev) => [newOrder, ...prev].slice(0, 30));

    if (newOrder.discount_code && newOrder.discount) {
      incrementDiscountUsage(newOrder.discount_code).catch((e) => console.error('Failed to count discount use:', e));
    }
    if (savedOnline && draft) {
      saveAbandonedCartRemote({ ...draft, converted: true, orderId: newOrder.id }).catch((e) =>
        console.error('Failed to mark cart converted:', e)
      );
    }

    if (!options.keepCart) {
      setAppliedDiscount(null);
      clearCart();
    }
    return { order: newOrder, savedOnline };
  };

  const patchOrderLocal = (id: string, patch: Partial<Order>) => {
    const apply = (list: Order[]) => list.map((o) => (o.id === id ? { ...o, ...patch } : o));
    setOrders(apply);
    setDeviceOrders(apply);
  };

  /** Admin: edit details, courier, notes. */
  const updateOrder = async (id: string, patch: Partial<Order>) => {
    patchOrderLocal(id, patch);
    await updateOrderRemote(id, patch);
  };

  /** Admin: an order that has moved stock or points must be cancelled first,
   * so both are returned before it disappears. */
  const deleteOrder = async (order: Order) => {
    if (order.stock_deducted || order.points_deducted || order.points_awarded) {
      throw new Error('Cancel this order first so its stock and points are returned.');
    }
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    await deleteOrderRemote(order.id);
  };

  /** Admin: move an order to a status. Stock and loyalty points change only
   * here, and every change is recorded on the order so it is reversed
   * exactly once:
   *   confirmed or later (first time) - items leave stock, redeemed points are deducted
   *   delivered                       - points are earned on the item subtotal
   *   cancelled / returned            - stock comes back, points are refunded / removed */
  const setOrderStatus = async (
    order: Order,
    status: OrderStatus,
    options: { note?: string; allowLowPoints?: boolean; extra?: Partial<Order> } = {}
  ) => {
    const patch: Partial<Order> = {
      ...options.extra,
      status,
      status_history: [
        ...(order.status_history || []),
        { status, at: new Date().toISOString(), ...(options.note ? { note: options.note } : {}) },
      ],
    };
    const isExit = status === 'cancelled' || status === 'returned';
    const confirmedOrLater = ORDER_STATUS_FLOW.indexOf(status) >= 1;
    const phoneKey = order.phone_key || toPhoneKey(order.buyer_phone);

    if (confirmedOrLater) {
      const redeemed = order.points_discount || 0;
      let pointsToDeduct = 0;
      if (redeemed > 0 && !order.points_deducted && phoneKey && isFirebaseConfigured) {
        const balance = await getPointsRemote(phoneKey);
        if (balance < redeemed && !options.allowLowPoints) throw new LowPointsError(balance, redeemed);
        pointsToDeduct = Math.min(balance, redeemed);
      }
      if (!order.stock_deducted) {
        for (const item of order.items) await adjustStock(item.listing_id, -item.qty);
        patch.stock_deducted = true;
      }
      if (pointsToDeduct > 0 && phoneKey) {
        await adjustPointsRemote(phoneKey, -pointsToDeduct);
        patch.points_deducted = pointsToDeduct;
      }
      if (status === 'delivered' && !order.points_awarded && phoneKey) {
        const earned = Math.round(order.subtotal * POINTS_EARN_RATE);
        if (earned > 0) {
          await adjustPointsRemote(phoneKey, earned);
          patch.points_awarded = earned;
        }
      }
    }

    if (isExit) {
      if (order.stock_deducted) {
        for (const item of order.items) await adjustStock(item.listing_id, item.qty);
        patch.stock_deducted = false;
      }
      if (phoneKey) {
        const delta = (order.points_deducted || 0) - (order.points_awarded || 0);
        if (delta) await adjustPointsRemote(phoneKey, delta);
      }
      if (order.points_deducted) patch.points_deducted = 0;
      if (order.points_awarded) patch.points_awarded = 0;
    }

    await updateOrder(order.id, patch);
  };

  // Restock ("notify me") requests
  const requestRestock = async (listing: HubListing, contact: string) => {
    const id = `bis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const phoneKey = toPhoneKey(contact) || undefined;
    await createBackInStockRemote({
      id,
      productId: listing.id,
      productName: listing.title,
      contact: contact.trim(),
      phoneKey,
      createdAt: new Date().toISOString(),
      notified: false,
    });
  };

  const markViewed = useCallback((id: string) => {
    setRecentlyViewed((prev) => (prev[0] === id ? prev : [id, ...prev.filter((x) => x !== id)].slice(0, 8)));
  }, []);

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
    catalogLoaded,
    orders,
    myOrders,
    reviews,
    messages,
    appliedDiscount,
    featuredDiscount,
    applyDiscountCode,
    removeDiscount,
    recentlyViewed,
    markViewed,
    toasts,
    notify,
    cartOpen,
    setCartOpen,
    chatOpen,
    setChatOpen,
    quickViewId,
    setQuickViewId,
    restockFor,
    setRestockFor,
    whatsappCheckout,
    setWhatsappCheckout,
    requestRestock,
    adjustStock,
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
    updateOrder,
    deleteOrder,
    setOrderStatus,
    addReview,
    sendMessage,
    resetDemoData,
  };
}

export type AppStore = ReturnType<typeof useAppStore>;

/** Everything in the store plus navigation, for components that are too deep
 * (or too many) to hand props down to. App.tsx provides it. */
export type Shop = AppStore & {
  currentRoute: string;
  navigateTo: (route: string, params?: any) => void;
  /** "Order on WhatsApp": puts the laptop in the bag if needed and opens
   * the same checkout form in WhatsApp mode, so the order is saved too. */
  orderOnWhatsApp: (listing?: HubListing) => void;
};

export const ShopContext = createContext<Shop | null>(null);

export const useShop = (): Shop => {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error('useShop must be used inside ShopContext.Provider');
  return shop;
};
