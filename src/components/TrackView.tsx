import React, { useEffect, useState } from 'react';
import {
  Search,
  PackageSearch,
  Check,
  Truck,
  MessageCircle,
  Printer,
  Share2,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { Order } from '../types';
import { useShop } from '../services/store';
import { getOrderRemote } from '../services/orders';
import { ORDER_ID_PREFIX, ORDER_STATUS_FLOW, STATUS_LABELS } from '../config';
import { toPhoneKey } from '../utils/phone';
import {
  formatDateTime,
  formatPKR,
  getSupportWhatsAppLink,
  orderWhatsAppLink,
  trackUrl,
} from '../utils/helpers';
import { OrderReceipt } from './OrderReceipt';

interface TrackViewProps {
  orderId?: string;
}

const STEP_LABELS: Record<string, string> = { ...STATUS_LABELS, pending: 'Received' };

export const TrackView: React.FC<TrackViewProps> = ({ orderId }) => {
  const { myOrders, navigateTo, notify } = useShop();
  const [query, setQuery] = useState(orderId || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setError('');
    const upper = value.toUpperCase();

    // On this device: by Order ID, courier tracking number, or phone number.
    const phoneKey = toPhoneKey(value);
    const local = myOrders.find(
      (o) =>
        o.order_number.toUpperCase() === upper ||
        (o.tracking_number && o.tracking_number.toUpperCase() === upper) ||
        (phoneKey && (o.phone_key || toPhoneKey(o.buyer_phone)) === phoneKey)
    );

    // Online: only by exact Order ID.
    const id = local?.id || (upper.startsWith(ORDER_ID_PREFIX) ? upper : '');
    if (id) {
      setLoading(true);
      try {
        const remote = await getOrderRemote(id);
        if (remote) {
          setOrder(remote);
          return;
        }
      } catch (e) {
        console.error('Failed to load order:', e);
      } finally {
        setLoading(false);
      }
    }
    if (local) {
      setOrder(local);
      return;
    }
    setOrder(null);
    setError(
      phoneKey
        ? 'No orders from this number were placed on this device. Please search by your Order ID instead.'
        : `We could not find that order. Check the Order ID (it looks like ${ORDER_ID_PREFIX}7K3M9QX) or ask us on WhatsApp.`
    );
  };

  // /track/<order id> opens that order; otherwise the most recent order on this device.
  useEffect(() => {
    if (orderId) {
      setQuery(orderId);
      lookup(orderId);
    } else if (myOrders[0]) {
      setOrder(myOrders[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const share = async () => {
    if (!order) return;
    const url = trackUrl(order.order_number);
    try {
      if (navigator.share) await navigator.share({ title: `Order ${order.order_number}`, url });
      else {
        await navigator.clipboard.writeText(url);
        notify('Tracking link copied');
      }
    } catch {
      // share sheet dismissed
    }
  };

  const isExit = order?.status === 'cancelled' || order?.status === 'returned';
  const currentStep = order ? ORDER_STATUS_FLOW.indexOf(order.status) : -1;
  const reachedAt = (status: string) =>
    [...(order?.status_history || [])].reverse().find((e) => e.status === status)?.at;
  const otherOrders = myOrders.filter((o) => o.id !== order?.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1 print:hidden">
        <h1 className="text-2xl font-extrabold text-on-surface font-display flex items-center gap-2">
          <PackageSearch className="w-6 h-6 text-steel-dark" />
          <span>Track Your Order</span>
        </h1>
        <p className="text-xs text-on-surface-variant">
          Enter your Order ID. On the phone or computer you ordered from, your phone number or courier tracking
          number works too.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(query);
        }}
        className="flex gap-2 print:hidden"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            id="track-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${ORDER_ID_PREFIX}7K3M9QX`}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-9 pr-3 py-3 text-sm font-semibold"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-steel hover:bg-steel-dark text-white font-bold text-sm px-5 rounded-lg flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>Track</span>
        </button>
      </form>

      {error && (
        <div className="bg-error-container text-on-error-container rounded p-4 text-xs font-semibold print:hidden">
          {error}
        </div>
      )}

      {order && (
        <div className="space-y-5">
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-5 space-y-5 print:hidden">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[10px] uppercase tracking-wide font-bold text-on-surface-variant">Order</div>
                <div className="font-mono-spec font-bold text-lg text-on-surface">{order.order_number}</div>
                <div className="text-[11px] text-on-surface-variant">Placed {formatDateTime(order.created_at)}</div>
              </div>
              <span
                className={`px-3 py-1.5 rounded text-xs font-extrabold uppercase ${
                  isExit
                    ? 'bg-error-container text-on-error-container'
                    : order.status === 'delivered'
                    ? 'bg-steel-tint text-steel-dark'
                    : 'bg-copper-tint text-copper-dark'
                }`}
              >
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            {order.status === 'pending' && (
              <div className="bg-copper-tint border border-copper/30 rounded p-4 space-y-2 text-xs">
                <div className="font-bold text-copper-dark flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>
                    {order.payment_method === 'cod' ? 'Waiting for your confirmation' : 'Waiting for your payment'}
                  </span>
                </div>
                <p className="text-on-surface">
                  {order.payment_method === 'cod'
                    ? 'Please confirm this order on WhatsApp so we can dispatch it.'
                    : `Please message us on WhatsApp for bank / Raast details and send ${formatPKR(order.total_price)}. We dispatch once the payment is received.`}
                </p>
                <a
                  href={orderWhatsAppLink(order)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-whatsapp hover:bg-whatsapp-dark text-white font-bold px-4 py-2 rounded"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Confirm on WhatsApp</span>
                </a>
              </div>
            )}

            {isExit ? (
              <div className="flex items-center gap-2 text-sm font-bold text-error">
                <XCircle className="w-5 h-5" />
                <span>
                  This order was {order.status}
                  {reachedAt(order.status) ? ` on ${formatDateTime(reachedAt(order.status)!)}` : ''}.
                </span>
              </div>
            ) : (
              <ol className="space-y-0">
                {ORDER_STATUS_FLOW.map((status, i) => {
                  const done = i <= currentStep;
                  const at = status === 'pending' ? order.created_at : reachedAt(status);
                  return (
                    <li key={status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            done ? 'bg-steel text-white' : 'bg-surface-container text-outline'
                          }`}
                        >
                          {done ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                        </span>
                        {i < ORDER_STATUS_FLOW.length - 1 && (
                          <span className={`w-0.5 flex-1 min-h-5 ${i < currentStep ? 'bg-steel' : 'bg-surface-container'}`} />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className={`text-sm font-bold ${done ? 'text-on-surface' : 'text-outline'}`}>
                          {STEP_LABELS[status]}
                        </div>
                        {done && at && <div className="text-[11px] text-on-surface-variant">{formatDateTime(at)}</div>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-outline-variant pt-4">
              <div>
                <div className="text-[10px] uppercase tracking-wide font-bold text-on-surface-variant mb-1">
                  Delivering to
                </div>
                <div className="font-bold text-on-surface">{order.buyer_name}</div>
                <div className="text-on-surface-variant">
                  {order.buyer_address}, {order.buyer_city}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide font-bold text-on-surface-variant mb-1">Courier</div>
                {order.courier_name ? (
                  <div className="flex items-center gap-1.5 font-bold text-on-surface">
                    <Truck className="w-4 h-4 text-steel-dark" />
                    <span>
                      {order.courier_name}
                      {order.tracking_number ? ` · ${order.tracking_number}` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="text-on-surface-variant">Added once your order is dispatched</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-bold bg-surface-container-low border border-outline-variant px-3 py-2 rounded"
              >
                <Printer className="w-3.5 h-3.5" /> Print receipt
              </button>
              <button
                onClick={share}
                className="flex items-center gap-1.5 text-xs font-bold bg-surface-container-low border border-outline-variant px-3 py-2 rounded"
              >
                <Share2 className="w-3.5 h-3.5" /> Share tracking link
              </button>
              <a
                href={getSupportWhatsAppLink(`Salam! I have a question about my order ${order.order_number}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold bg-whatsapp text-white px-3 py-2 rounded"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Help on WhatsApp
              </a>
            </div>
          </div>

          <OrderReceipt order={order} />
        </div>
      )}

      {!order && !error && !loading && (
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-10 text-center text-sm text-on-surface-variant print:hidden">
          Your Order ID is on your confirmation screen and in the WhatsApp message you sent us.
        </div>
      )}

      {otherOrders.length > 0 && (
        <div className="space-y-2 print:hidden">
          <h2 className="text-sm font-extrabold text-on-surface font-display">Your other orders on this device</h2>
          {otherOrders.map((o) => (
            <button
              key={o.id}
              onClick={() => navigateTo('track', { orderId: o.order_number })}
              className="w-full flex items-center justify-between bg-surface-container-lowest border border-outline-variant rounded p-3 text-xs hover:bg-surface-container-low"
            >
              <span className="font-mono-spec font-bold">{o.order_number}</span>
              <span className="text-on-surface-variant">{formatDateTime(o.created_at)}</span>
              <span className="price">{formatPKR(o.total_price)}</span>
              <span className="font-bold uppercase text-[10px]">{STATUS_LABELS[o.status] || o.status}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
