import { OrderStatus } from './types';

// Business rules used in many places. Change a number here and it changes
// everywhere (checkout, admin, AI assistant, messages).

export const STORE_NAME = 'Apna Laptop';
export const STORE_AREA = 'Nankana Sahib';
export const WHATSAPP_NUMBER = '923016672356';
export const WHATSAPP_DISPLAY = '+92 301 6672356';

// Short, hard-to-guess order IDs: prefix + 7 characters with no 0/O/1/I.
// Random, not sequential, because anyone can read an order by its exact ID.
export const ORDER_ID_PREFIX = 'AL-';
export const ORDER_ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

// Delivery: free standard (next day, local rider), paid same-day express.
export const EXPRESS_DELIVERY_FEE = 500;
export const DELIVERY_TIME_TEXT = 'Next-day delivery in Nankana Sahib & nearby towns';
export const WARRANTY_TEXT = '7-day checking warranty';

// Per-town delivery estimate shown on the product page.
export const CITY_DELIVERY: Record<string, { days: string; express: boolean }> = {
  'Nankana Sahib': { days: 'Same day or next day', express: true },
  Shahkot: { days: 'Next day', express: false },
  Manawala: { days: 'Next day', express: false },
  'Mor Khunda': { days: 'Next day', express: false },
  Bachyana: { days: '1-2 days', express: false },
  Buchaki: { days: '1-2 days', express: false },
};

// Order spam limit (also enforced in firestore.rules).
export const MAX_ORDERS_PER_PHONE_PER_DAY = 3;

// Loyalty points: 1 point = Rs. 1. Earned on the item subtotal when an order
// is delivered; points may cover at most this share of an order.
export const POINTS_EARN_RATE = 0.01;
export const POINTS_MAX_SHARE = 0.05;

// Laptops sell in ones and twos, so "low" starts at 2 units.
export const LOW_STOCK_THRESHOLD = 2;

// A pending order older than this is flagged in the admin panel.
export const UNCONFIRMED_ALERT_HOURS = 24;

// A saved checkout draft counts as abandoned after this long without an order.
export const ABANDONED_AFTER_MINUTES = 30;

// The normal forward path an order moves through (cancelled/returned are side exits).
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const COURIERS = [
  'Local rider',
  'Self delivery',
  'TCS',
  'Leopards Courier',
  'Trax',
  'PostEx',
  'M&P',
  'Call Courier',
  'Pakistan Post',
];

export const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  bank_transfer: 'Bank Transfer / Raast',
  jazzcash_easypaisa: 'JazzCash / Easypaisa',
};
