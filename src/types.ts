export type UserRole = 'guest' | 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  city: string;
  role: UserRole;
  is_phone_verified: boolean;
  avatar?: string;
  joined_at: string;
  rating_avg: number;
  total_listings_count: number;
}

export type LaptopCondition = 
  | 'Brand New' 
  | 'Like New (Open Box)' 
  | 'Used - Excellent (Grade A+)' 
  | 'Used - Good (Grade A)' 
  | 'Used - Fair (Grade B)';

export interface LaptopSpecs {
  cpu: string;
  cpuGen?: string;
  ram: string;
  ramType?: 'DDR4' | 'DDR5' | 'LPDDR4x' | 'LPDDR5' | 'Unified Memory';
  storage: string;
  storageType?: 'NVMe SSD' | 'SATA SSD' | 'HDD' | 'SSD + HDD';
  gpu: string;
  screenSize: string;
  resolution?: string;
  refreshRate?: string;
  batteryHealth?: string;
  weightKg?: string;
  ports?: string[];
  releaseYear?: number;
}

export interface HubListing {
  id: string;
  brand: string;
  model: string;
  title: string;
  specs: LaptopSpecs;
  condition: LaptopCondition;
  cost_price: number; // admin internal
  sale_price: number;
  original_price?: number;
  images: string[];
  stock_qty: number;
  use_case_tags: string[]; // 'Gaming', 'Programming & Dev', 'Student', 'Office & Business', 'Video Editing'
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  warrantyMonths: number;
  isFeatured?: boolean;
  rating: number;
  reviewCount: number;
  supplierNote?: string;
  shortDescription: string;
  fullDescription: string;
  availableUpgrades?: {
    ramOptions?: { label: string; price: number; ramAdded: string }[];
    storageOptions?: { label: string; price: number; storageAdded: string }[];
  };
}

export interface P2PListing {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_phone: string;
  seller_whatsapp: string;
  seller_city: string;
  is_phone_verified: boolean;
  brand: string;
  model: string;
  title: string;
  specs: LaptopSpecs;
  condition: LaptopCondition;
  asking_price: number;
  images: string[];
  description: string;
  status: 'active' | 'sold' | 'under_review' | 'flagged';
  is_verified_badge?: boolean;
  is_featured?: boolean;
  created_at: string;
  view_count: number;
  reports_count: number;
  box_included: boolean;
  charger_included: boolean;
  warranty_remaining?: string;
}

export interface CartItem {
  listing: HubListing;
  quantity: number;
  selectedRamUpgrade?: { label: string; price: number; ramAdded: string };
  selectedStorageUpgrade?: { label: string; price: number; storageAdded: string };
}

export type PaymentMethod = 'cod' | 'bank_transfer' | 'jazzcash_easypaisa';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  listing_id: string;
  title: string;
  brand: string;
  model: string;
  image: string;
  unit_price: number;
  qty: number;
  upgrades_total: number;
  upgrade_details?: string;
  item_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_whatsapp: string;
  buyer_city: string;
  buyer_address: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total_price: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  payment_proof_url?: string;
  status: OrderStatus;
  courier_name?: string;
  tracking_number?: string;
  created_at: string;
  notes?: string;
}

export interface ValuationFormInputs {
  brand: string;
  seriesModel: string;
  cpuBrand: string;
  cpuGen: string;
  ram: string;
  storageType: string;
  storageSize: string;
  screenSize: string;
  screenCondition: 'flawless' | 'minor_scratches' | 'spots_lines' | 'cracked';
  batteryCondition: 'excellent_90_plus' | 'good_80_89' | 'moderate_60_79' | 'dead_plugged_only';
  bodyCondition: 'mint_like_new' | 'minor_wear' | 'visible_dents_scratches' | 'broken_hinges';
  boxAvailable: boolean;
  chargerOriginal: boolean;
  repairsDone: 'none' | 'screen_replaced' | 'battery_replaced' | 'motherboard_repaired';
  purchaseYear: number;
}

export interface ValuationResult {
  minPrice: number;
  maxPrice: number;
  fairValue: number;
  confidence: 'High' | 'Medium' | 'Estimated';
  positiveFactors: string[];
  negativeFactors: string[];
  marketDemandTier: 'Very High' | 'High' | 'Moderate' | 'Low';
  specsSummary: string;
}

export interface FinderQuizAnswers {
  primaryUseCase: string; // 'Study & Online Classes' | 'Office & Daily Work' | 'Programming & Dev' | 'Video & Graphic Editing' | 'Gaming' | 'Business & Frequent Travel'
  budgetTier: string; // 'under_50k' | '50k_80k' | '80k_130k' | '130k_200k' | '200k_plus'
  portability: string; // 'ultraportable' | 'standard' | 'desktop_replacement'
  batteryPriority: string; // 'all_day' | 'moderate' | 'plugged_mostly'
  conditionPref: string; // 'any' | 'new_or_openbox' | 'used_budget'
  brandPref?: string;
}

export interface FinderMatch {
  listing: HubListing | P2PListing;
  type: 'hub' | 'p2p';
  matchScore: number;
  reasons: string[];
  highlightBadge: string;
}

export interface UpgradePartOption {
  id: string;
  name: string;
  category: 'RAM' | 'SSD' | 'Thermal & Service';
  costPkr: number;
  perfScoreGain: number; // e.g. +25%
  description: string;
  compatibilityNote: string;
}

export interface Review {
  id: string;
  target_type: 'hub_order' | 'p2p_listing';
  target_id: string;
  reviewer_name: string;
  reviewer_city: string;
  is_verified_purchase: boolean;
  rating: number;
  comment: string;
  created_at: string;
}

export interface InAppMessage {
  id: string;
  listing_id: string;
  listing_title: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  text: string;
  timestamp: string;
  is_read: boolean;
}
