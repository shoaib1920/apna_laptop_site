import { HubListing, Order, OrderStatus } from '../../types';
import { LOW_STOCK_THRESHOLD, STORE_NAME, UNCONFIRMED_ALERT_HOURS } from '../../config';
import { toPhoneKey } from '../../utils/phone';
import { formatPKR, isOutOfStock, paymentLabel, trackUrl, waLink } from '../../utils/helpers';

export const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  packed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-200 text-gray-700',
};

export const isCountedSale = (o: Order) => o.status !== 'cancelled' && o.status !== 'returned';

export const orderDate = (o: Order) => new Date(o.created_at.includes('T') ? o.created_at : o.created_at.replace(' ', 'T'));

/** Local calendar day (not UTC), so "today" matches the shop's day. */
export const localDayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 0300-1234567 / +92 300 1234567 / 3001234567 -> 923001234567
export const toWhatsAppNumber = (phone: string) => toPhoneKey(phone) || phone.replace(/\D/g, '');

export const customerWhatsAppLink = (phone: string, text: string) => waLink(toWhatsAppNumber(phone), text);

// Orders are dispatched only once the customer confirms.
export const isStaleUnconfirmed = (order: Order) =>
  order.status === 'pending' && Date.now() - orderDate(order).getTime() > UNCONFIRMED_ALERT_HOURS * 3600e3;

// Ready-made message to the customer for the order's current status.
// Plain text only: emojis and *bold* markers break on some devices.
const statusMessageBody = (order: Order) => {
  const name = order.buyer_name.split(' ')[0] || order.buyer_name;
  const id = order.order_number;
  const total = formatPKR(order.total_price);
  const items = order.items.map((i) => `${i.qty} x ${i.title}`).join(', ');
  const cod = order.payment_method === 'cod';
  switch (order.status) {
    case 'pending':
      return cod
        ? `Assalam o Alaikum ${name}! ${STORE_NAME} here. We received your order ${id}: ${items} - total ${total} (Cash on Delivery) to ${order.buyer_address}, ${order.buyer_city}.

Please reply YES to confirm so we can dispatch it. Order confirm karne ke liye YES likh kar reply karein. Shukriya!`
        : `Assalam o Alaikum ${name}! ${STORE_NAME} here. We received your order ${id}: ${items} - total ${total} (${paymentLabel(order)}) to ${order.buyer_address}, ${order.buyer_city}.

Please send ${total} to the account below and share the payment screenshot here so we can dispatch it.
[account details]`;
    case 'confirmed':
      return `Assalam o Alaikum ${name}! Your ${STORE_NAME} order ${id} (${total}) is confirmed. We will dispatch it soon. Shukriya!`;
    case 'packed':
      return `Assalam o Alaikum ${name}! Your order ${id} is tested, packed and will be handed to the rider shortly.`;
    case 'shipped':
      return `Assalam o Alaikum ${name}! Your order ${id} has been dispatched${order.courier_name ? ` with ${order.courier_name}` : ''}${order.tracking_number ? ` (tracking # ${order.tracking_number})` : ''}.${cod ? ` Please keep ${total} ready for Cash on Delivery.` : ''}`;
    case 'out_for_delivery':
      return `Assalam o Alaikum ${name}! Your order ${id} is out for delivery today.${cod ? ` Please keep ${total} ready.` : ''} The rider will call you.`;
    case 'delivered':
      return `Assalam o Alaikum ${name}! Your order ${id} has been delivered. Your 7-day checking warranty starts today. Shukriya for shopping with ${STORE_NAME}! We would love your feedback.`;
    case 'cancelled':
      return `Assalam o Alaikum ${name}. Your order ${id} has been cancelled. Please message us if you have any questions.`;
    case 'returned':
      return `Assalam o Alaikum ${name}. Your order ${id} has been marked as returned. Please message us if you have any questions.`;
  }
};

export const statusMessage = (order: Order) => `${statusMessageBody(order)}

Track your order: ${trackUrl(order.order_number)}`;

/** Address block for booking a rider / courier. */
export const courierAddressText = (order: Order) =>
  [
    order.buyer_name,
    order.buyer_phone,
    `${order.buyer_address}, ${order.buyer_city}`,
    order.buyer_landmark ? `Landmark / instructions: ${order.buyer_landmark}` : '',
    `Order ${order.order_number}`,
    order.payment_method === 'cod' ? `Collect: ${formatPKR(order.total_price)} (Cash on Delivery)` : `Payment: ${paymentLabel(order)}`,
  ]
    .filter(Boolean)
    .join('\n');

export const downloadCsv = (filename: string, rows: (string | number)[][]) => {
  const escape = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  // The BOM makes Excel read the file as UTF-8.
  const csv = '﻿' + rows.map((r) => r.map(escape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const isLowStock = (l: HubListing) => !isOutOfStock(l) && l.stock_qty <= LOW_STOCK_THRESHOLD;
