import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Download,
  X,
  MessageCircle,
  Copy,
  Printer,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Save,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { LowPointsError, useShop } from '../../services/store';
import { COURIERS, ORDER_STATUS_FLOW, STATUS_LABELS } from '../../config';
import { PHONE_HINT, toPhoneKey } from '../../utils/phone';
import { formatDateTime, formatPKR, paymentLabel } from '../../utils/helpers';
import { OrderReceipt } from '../OrderReceipt';
import {
  STATUS_STYLES,
  courierAddressText,
  customerWhatsAppLink,
  downloadCsv,
  isStaleUnconfirmed,
  localDayKey,
  orderDate,
  statusMessage,
} from './adminUtils';

type StatusFilter = OrderStatus | 'all';
type DateFilter = 'all' | 'today' | '7d' | '30d';

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled', 'returned'];

const inDateRange = (order: Order, filter: DateFilter) => {
  if (filter === 'all') return true;
  const d = orderDate(order);
  if (filter === 'today') return localDayKey(d) === localDayKey(new Date());
  return Date.now() - d.getTime() <= (filter === '7d' ? 7 : 30) * 86400e3;
};

export const AdminOrders: React.FC = () => {
  const shop = useShop();
  const { orders, notify } = shop;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  // Toast when a new order arrives while the panel is open.
  const knownIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (knownIds.current === null) {
      // First non-empty snapshot is the existing list, not news.
      if (orders.length > 0) knownIds.current = new Set(orders.map((o) => o.id));
      return;
    }
    const fresh = orders.filter((o) => !knownIds.current!.has(o.id));
    fresh.forEach((o) => {
      knownIds.current!.add(o.id);
      notify(`New order ${o.order_number} from ${o.buyer_name} - ${formatPKR(o.total_price)}`, 'info');
    });
  }, [orders, notify]);

  const dateFiltered = useMemo(() => orders.filter((o) => inDateRange(o, dateFilter)), [orders, dateFilter]);
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: dateFiltered.length };
    dateFiltered.forEach((o) => (map[o.status] = (map[o.status] || 0) + 1));
    return map;
  }, [dateFiltered]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dateFiltered.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      return [o.order_number, o.buyer_name, o.buyer_phone, o.buyer_city, o.tracking_number || '', ...o.items.map((i) => i.title)]
        .some((f) => f.toLowerCase().includes(q));
    });
  }, [dateFiltered, statusFilter, search]);

  const exportCsv = () =>
    downloadCsv(`orders-${localDayKey(new Date())}.csv`, [
      ['Order ID', 'Date', 'Status', 'Source', 'Customer', 'Phone', 'City', 'Address', 'Items', 'Subtotal', 'Discount', 'Code', 'Points', 'Delivery', 'Total', 'Payment', 'Courier', 'Tracking #', 'Notes'],
      ...visible.map((o) => [
        o.order_number,
        formatDateTime(o.created_at),
        STATUS_LABELS[o.status] || o.status,
        o.source || 'website',
        o.buyer_name,
        o.buyer_phone,
        o.buyer_city,
        o.buyer_address,
        o.items.map((i) => `${i.qty} x ${i.title}${i.upgrade_details ? ` (${i.upgrade_details})` : ''}`).join('; '),
        o.subtotal,
        o.discount || 0,
        o.discount_code || '',
        o.points_discount || 0,
        o.delivery_fee,
        o.total_price,
        paymentLabel(o),
        o.courier_name || '',
        o.tracking_number || '',
        o.admin_notes || '',
      ]),
    ]);

  const open = orders.find((o) => o.id === openId) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-on-surface font-display">Customer Orders</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ID, name, phone, city, laptop"
              className="bg-surface-container-lowest border border-outline-variant rounded-lg pl-8 pr-3 py-2 w-60"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-2 font-semibold"
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button
            onClick={exportCsv}
            className="bg-surface-container-low border border-outline-variant font-bold px-3 py-2 rounded-lg flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        {(['all', ...ALL_STATUSES] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg font-bold ${
              statusFilter === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]} ({counts[s] || 0})
          </button>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-bold">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {visible.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setOpenId(order.id)}
                  className="hover:bg-surface-container-low cursor-pointer align-top"
                >
                  <td className="p-3">
                    <span className="font-mono-spec font-bold text-on-surface flex items-center gap-1">
                      {order.order_number}
                      {order.source === 'ai-chat' && <Sparkles className="w-3 h-3 text-copper" aria-label="AI chat order" />}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">{formatDateTime(order.created_at)}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-on-surface block">{order.buyer_name}</span>
                    <span className="text-[11px] text-on-surface-variant">
                      {order.buyer_phone} · {order.buyer_city}
                    </span>
                  </td>
                  <td className="p-3 text-on-surface-variant max-w-xs truncate">
                    {order.items.map((i) => `${i.title} (x${i.qty})`).join(', ')}
                  </td>
                  <td className="p-3 price text-xs">{formatPKR(order.total_price)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase ${STATUS_STYLES[order.status] || ''}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    {isStaleUnconfirmed(order) && (
                      <span className="flex items-center gap-1 text-[10px] text-error font-bold mt-1">
                        <AlertTriangle className="w-3 h-3" /> Unconfirmed 24h+
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-outline">
                    <ChevronRight className="w-4 h-4" />
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-on-surface-variant">
                    No orders match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && <OrderDetail order={open} onClose={() => setOpenId(null)} />}
    </div>
  );
};

const OrderDetail: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const shop = useShop();
  const { notify } = shop;
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState({
    buyer_name: order.buyer_name,
    buyer_phone: order.buyer_phone,
    buyer_city: order.buyer_city,
    buyer_address: order.buyer_address,
    buyer_landmark: order.buyer_landmark || '',
  });
  const [dispatch, setDispatch] = useState({
    courier_name: order.courier_name || '',
    tracking_number: order.tracking_number || '',
    admin_notes: order.admin_notes || '',
  });

  const flowIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  const nextStatus = flowIndex >= 0 && flowIndex < ORDER_STATUS_FLOW.length - 1 ? ORDER_STATUS_FLOW[flowIndex + 1] : null;
  // Once stock or points have moved, the phone number that owns them is locked.
  const locked = Boolean(order.stock_deducted || order.points_deducted || order.points_awarded);

  const run = async (action: () => Promise<void>, done?: string) => {
    setBusy(true);
    try {
      await action();
      if (done) notify(done);
    } catch (e: any) {
      console.error(e);
      notify(e?.message || 'Something went wrong', 'error');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (status: OrderStatus) =>
    run(async () => {
      try {
        await shop.setOrderStatus(order, status);
      } catch (e) {
        if (!(e instanceof LowPointsError)) throw e;
        const proceed = window.confirm(
          `This customer redeemed ${e.needed} points but now has only ${e.balance}. Continue and deduct ${e.balance}?`
        );
        if (!proceed) return;
        await shop.setOrderStatus(order, status, { allowLowPoints: true });
      }
      notify(`Order marked ${STATUS_LABELS[status]}`);
    });

  const saveDetails = () => {
    const phoneKey = toPhoneKey(details.buyer_phone);
    if (!phoneKey) {
      notify(PHONE_HINT, 'error');
      return;
    }
    run(
      () =>
        shop.updateOrder(order.id, {
          ...details,
          buyer_name: details.buyer_name.trim(),
          buyer_whatsapp: details.buyer_phone,
          // An empty value clears the field (Firestore rejects undefined).
          buyer_landmark: details.buyer_landmark.trim(),
          phone_key: phoneKey,
        }),
      'Customer details saved'
    );
  };

  const saveDispatch = () => run(() => shop.updateOrder(order.id, dispatch), 'Courier details saved');

  const openWhatsApp = () => {
    window.open(customerWhatsAppLink(order.buyer_phone, statusMessage(order)), '_blank', 'noopener');
    // Asking a customer to confirm is recorded on the order.
    if (order.status === 'pending') {
      shop
        .updateOrder(order.id, { confirmation_requested_at: new Date().toISOString() })
        .catch((e) => console.error('Failed to record confirmation request:', e));
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(courierAddressText(order));
      notify('Address copied');
    } catch {
      notify('Could not copy', 'error');
    }
  };

  const remove = () => {
    if (!window.confirm(`Delete order ${order.order_number}? This cannot be undone.`)) return;
    run(async () => {
      await shop.deleteOrder(order);
      onClose();
    }, 'Order deleted');
  };

  const inputClass = 'w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2';

  return (
    <div className="fixed inset-0 bg-primary/60 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-surface w-full max-w-2xl h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-surface-container-lowest border-b border-outline-variant px-5 py-3 flex items-center justify-between print:hidden">
          <div>
            <div className="font-mono-spec font-bold text-on-surface">{order.order_number}</div>
            <div className="text-[11px] text-on-surface-variant">
              {formatDateTime(order.created_at)} · {order.source === 'ai-chat' ? 'AI chat' : 'Website'} · {paymentLabel(order)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin text-outline" />}
            <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase ${STATUS_STYLES[order.status] || ''}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
            <button onClick={onClose} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {isStaleUnconfirmed(order) && (
            <div className="bg-error-container text-on-error-container rounded p-3 font-semibold flex gap-2 print:hidden">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Waiting over 24 hours for confirmation.
                {order.confirmation_requested_at
                  ? ` Last asked ${formatDateTime(order.confirmation_requested_at)}.`
                  : ' The customer has not been asked yet.'}
              </span>
            </div>
          )}

          {/* Status actions */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3 print:hidden">
            <div className="flex flex-wrap gap-2">
              {nextStatus && (
                <button
                  disabled={busy}
                  onClick={() => changeStatus(nextStatus)}
                  className="bg-steel hover:bg-steel-dark text-white font-bold px-4 py-2.5 rounded disabled:opacity-50"
                >
                  Mark as {STATUS_LABELS[nextStatus]}
                </button>
              )}
              <button
                onClick={openWhatsApp}
                className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold px-4 py-2.5 rounded flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                {order.status === 'pending' ? 'Ask to confirm' : `Send "${STATUS_LABELS[order.status]}" message`}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="font-bold text-on-surface-variant">Set status</label>
              <select
                value={order.status}
                disabled={busy}
                onChange={(e) => changeStatus(e.target.value as OrderStatus)}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1.5 font-semibold"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              {order.status !== 'cancelled' && (
                <button
                  disabled={busy}
                  onClick={() => window.confirm('Cancel this order?') && changeStatus('cancelled')}
                  className="text-error font-bold px-3 py-1.5 border border-outline-variant rounded-lg"
                >
                  Cancel order
                </button>
              )}
              <button
                disabled={busy || locked}
                onClick={remove}
                title={locked ? 'Cancel the order first so stock and points are returned' : 'Delete order'}
                className="text-error font-bold px-3 py-1.5 border border-outline-variant rounded-lg flex items-center gap-1 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
            <p className="text-[10px] text-on-surface-variant">
              Stock: {order.stock_deducted ? 'taken out' : 'not taken yet (happens on Confirmed)'}
              {order.points_deducted ? ` · ${order.points_deducted} points deducted` : ''}
              {order.points_awarded ? ` · ${order.points_awarded} points awarded` : ''}
            </p>
          </section>

          {/* Customer */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-on-surface text-sm">Customer</h3>
              <button onClick={copyAddress} className="flex items-center gap-1 font-bold text-steel-dark">
                <Copy className="w-3.5 h-3.5" /> Copy address for courier
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={details.buyer_name}
                onChange={(e) => setDetails({ ...details, buyer_name: e.target.value })}
                placeholder="Name"
                className={inputClass}
              />
              <input
                value={details.buyer_phone}
                disabled={locked}
                title={locked ? 'Locked: stock or points have moved for this number' : ''}
                onChange={(e) => setDetails({ ...details, buyer_phone: e.target.value })}
                placeholder="Phone"
                className={`${inputClass} disabled:opacity-60`}
              />
              <input
                value={details.buyer_city}
                onChange={(e) => setDetails({ ...details, buyer_city: e.target.value })}
                placeholder="City"
                className={inputClass}
              />
              <input
                value={details.buyer_landmark}
                onChange={(e) => setDetails({ ...details, buyer_landmark: e.target.value })}
                placeholder="Landmark / instructions"
                className={inputClass}
              />
              <input
                value={details.buyer_address}
                onChange={(e) => setDetails({ ...details, buyer_address: e.target.value })}
                placeholder="Address"
                className={`${inputClass} sm:col-span-2`}
              />
            </div>
            <button
              disabled={busy}
              onClick={saveDetails}
              className="bg-primary text-on-primary font-bold px-4 py-2 rounded flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Save customer details
            </button>
          </section>

          {/* Courier */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3 print:hidden">
            <h3 className="font-bold text-on-surface text-sm">Courier, tracking and notes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={dispatch.courier_name}
                onChange={(e) => setDispatch({ ...dispatch, courier_name: e.target.value })}
                className={inputClass}
              >
                <option value="">Choose courier</option>
                {COURIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                value={dispatch.tracking_number}
                onChange={(e) => setDispatch({ ...dispatch, tracking_number: e.target.value })}
                placeholder="Tracking number"
                className={inputClass}
              />
              <textarea
                value={dispatch.admin_notes}
                onChange={(e) => setDispatch({ ...dispatch, admin_notes: e.target.value })}
                placeholder="Internal notes (not shown to the customer)"
                rows={2}
                className={`${inputClass} sm:col-span-2`}
              />
            </div>
            <button
              disabled={busy}
              onClick={saveDispatch}
              className="bg-primary text-on-primary font-bold px-4 py-2 rounded flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </section>

          {/* History */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-2 print:hidden">
            <h3 className="font-bold text-on-surface text-sm">Status history</h3>
            {(order.status_history || []).length === 0 ? (
              <p className="text-on-surface-variant">No history recorded (older order).</p>
            ) : (
              <ul className="space-y-1">
                {order.status_history!.map((e, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="font-semibold">{STATUS_LABELS[e.status] || e.status}</span>
                    <span className="text-on-surface-variant">{formatDateTime(e.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex justify-end print:hidden">
            <button
              onClick={() => window.print()}
              className="bg-surface-container-low border border-outline-variant font-bold px-4 py-2 rounded flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print receipt
            </button>
          </div>
          <OrderReceipt order={order} />
        </div>
      </div>
    </div>
  );
};
