import { useState, useEffect } from 'react';
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
  INITIAL_USERS,
  INITIAL_HUB_LISTINGS,
  INITIAL_P2P_LISTINGS,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
} from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'apna_laptop_users_v1',
  CURRENT_USER_ID: 'apna_laptop_current_user_v1',
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

  // Users & Auth
  const [users, setUsers] = useState<User[]>(() =>
    getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS)
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    getStored<string | null>(STORAGE_KEYS.CURRENT_USER_ID, 'user_1')
  );

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
    setStored(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    setStored(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

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

  // Derived current user
  const currentUser: User | null = users.find((u) => u.id === currentUserId) || null;

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

  const switchUser = (userId: string | null) => {
    setCurrentUserId(userId);
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

  // Hub inventory management (Admin)
  const addHubListing = (newListing: Omit<HubListing, 'id' | 'rating' | 'reviewCount'>): HubListing => {
    const id = `hub_${Date.now()}`;
    const listing: HubListing = {
      ...newListing,
      id,
      rating: 5.0,
      reviewCount: 0,
    };
    setHubListings((prev) => [listing, ...prev]);
    return listing;
  };

  const updateHubListing = (id: string, updates: Partial<HubListing>) => {
    setHubListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteHubListing = (id: string) => {
    setHubListings((prev) => prev.filter((item) => item.id !== id));
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

  // Reset demo data
  const resetDemoData = () => {
    setUsers(INITIAL_USERS);
    setHubListings(INITIAL_HUB_LISTINGS);
    setP2PListings(INITIAL_P2P_LISTINGS);
    setOrders(INITIAL_ORDERS);
    setReviews(INITIAL_REVIEWS);
    setCart([]);
    setWishlist(['hub_1', 'p2p_1']);
    setCurrentUserId('user_1');
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
    users,
    currentUser,
    currentUserId,
    hubListings,
    p2pListings,
    cart,
    wishlist,
    orders,
    reviews,
    messages,
    navigateTo,
    switchUser,
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
