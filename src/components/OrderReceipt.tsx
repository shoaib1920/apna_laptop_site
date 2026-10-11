import React from 'react';
import { Order } from '../types';
import { STORE_AREA, STORE_NAME, WHATSAPP_DISPLAY } from '../config';
import { formatDateTime, formatPKR, paymentLabel } from '../utils/helpers';

interface OrderReceiptProps {
  order: Order;
}

/** The receipt card. Printing shows only this card (see .print-receipt in
 * index.css), so "Print / Save PDF" gives a clean invoice. */
export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order }) => {
  return (
    <div className="print-receipt bg-surface-container-lowest rounded-lg border border-outline-variant p-5 sm:p-6 text-xs text-on-surface space-y-4 text-left">
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant pb-3">
        <div>
          <div className="text-lg font-black tracking-tighter font-display text-primary leading-none">
            {STORE_NAME.toUpperCase()}
          </div>
          <div className="text-[10px] text-on-surface-variant mt-1">
            Verified Laptop Hub, {STORE_AREA} · WhatsApp {WHATSAPP_DISPLAY}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono-spec font-bold text-sm">{order.order_number}</div>
          <div className="text-[10px] text-on-surface-variant">{formatDateTime(order.created_at)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wide font-bold text-on-surface-variant mb-1">Bill to</div>
          <div className="font-bold">{order.buyer_name}</div>
          <div>{order.buyer_phone}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide font-bold text-on-surface-variant mb-1">Deliver to</div>
          <div>{order.buyer_address}</div>
          <div>{order.buyer_city}</div>
          {order.buyer_landmark && <div className="text-on-surface-variant">{order.buyer_landmark}</div>}
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant text-[10px] uppercase tracking-wide text-on-surface-variant">
            <th className="text-left font-bold py-1.5">Item</th>
            <th className="text-center font-bold py-1.5 w-10">Qty</th>
            <th className="text-right font-bold py-1.5 w-24">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i} className="border-b border-outline-variant/50 align-top">
              <td className="py-2 pr-2">
                <div className="font-semibold">{item.title}</div>
                {item.upgrade_details && (
                  <div className="text-[10px] text-on-surface-variant">Upgrades: {item.upgrade_details}</div>
                )}
              </td>
              <td className="py-2 text-center">{item.qty}</td>
              <td className="py-2 text-right font-mono-spec">{formatPKR(item.item_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 ml-auto max-w-[240px]">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Subtotal</span>
          <span className="font-mono-spec">{formatPKR(order.subtotal)}</span>
        </div>
        {!!order.discount && (
          <div className="flex justify-between">
            <span className="text-on-surface-variant">
              Discount{order.discount_code ? ` (${order.discount_code})` : ''}
            </span>
            <span className="font-mono-spec">-{formatPKR(order.discount)}</span>
          </div>
        )}
        {!!order.points_discount && (
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Points used</span>
            <span className="font-mono-spec">-{formatPKR(order.points_discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-on-surface-variant">
            Delivery{order.delivery_type === 'express' ? ' (same-day)' : ''}
          </span>
          <span className="font-mono-spec">{order.delivery_fee ? formatPKR(order.delivery_fee) : 'FREE'}</span>
        </div>
        <div className="flex justify-between border-t border-outline-variant pt-1.5 font-extrabold text-sm">
          <span>Total</span>
          <span className="price">{formatPKR(order.total_price)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-on-surface-variant">Payment</span>
          <span className="font-semibold">{paymentLabel(order)}</span>
        </div>
      </div>

      <p className="text-[10px] text-on-surface-variant border-t border-outline-variant pt-3">
        7-day checking warranty from the day of delivery. Keep this receipt and your Order ID for any claim.
      </p>
    </div>
  );
};
