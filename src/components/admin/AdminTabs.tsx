import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  MessageCircle,
  Search,
  Trash2,
  Check,
  Star,
  Plus,
  Edit2,
} from 'lucide-react';
import { AbandonedCart, BackInStockRequest, DiscountCode, HubListing, Order } from '../../types';
import { useShop } from '../../services/store';
import {
  deleteAbandonedCartRemote,
  deleteBackInStockRemote,
  subscribeAbandonedCarts,
  subscribeBackInStock,
  updateAbandonedCartRemote,
  updateBackInStockRemote,
} from '../../services/customers';
import {
  deleteDiscount,
  discountLabel,
  discountProblem,
  normalizeCode,
  saveDiscount,
  subscribeAllDiscounts,
} from '../../services/discounts';
import { ABANDONED_AFTER_MINUTES, STATUS_LABELS, STORE_NAME } from '../../config';
import { toPhoneKey } from '../../utils/phone';
import { formatDateTime, formatPKR, isOutOfStock, optimizeImage, productUrl } from '../../utils/helpers';
import {
  STATUS_STYLES,
  customerWhatsAppLink,
  downloadCsv,
  isCountedSale,
  isLowStock,
  isStaleUnconfirmed,
  localDayKey,
  orderDate,
} from './adminUtils';

const card = 'bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm';
const th = 'p-3 font-bold text-on-surface-variant';

// ---------------------------------------------------------------- Dashboard

export const AdminOverview: React.FC<{ onOpenOrders: () => void }> = ({ onOpenOrders }) => {
  const { orders, hubListings } = useShop();

  const stats = useMemo(() => {
    const today = localDayKey(new Date());
    const monthPrefix = today.slice(0, 7);
    const sales = orders.filter(isCountedSale);
    const todays = sales.filter((o) => localDayKey(orderDate(o)) === today);
    const months = sales.filter((o) => localDayKey(orderDate(o)).startsWith(monthPrefix));
    const pending = orders.filter((o) => o.status === 'pending');
    const codToCollect = sales
      .filter((o) => o.payment_method === 'cod' && o.status !== 'delivered' && o.status !== 'pending')
      .reduce((sum, o) => sum + o.total_price, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = localDayKey(d);
      const list = sales.filter((o) => localDayKey(orderDate(o)) === key);
      return {
        label: d.toLocaleDateString('en-PK', { weekday: 'short' }),
        revenue: list.reduce((sum, o) => sum + o.total_price, 0),
        count: list.length,
      };
    });

    const productTotals = new Map<string, { title: string; qty: number; revenue: number }>();
    sales.forEach((o) =>
      o.items.forEach((i) => {
        const row = productTotals.get(i.listing_id) || { title: i.title, qty: 0, revenue: 0 };
        row.qty += i.qty;
        row.revenue += i.item_total;
        productTotals.set(i.listing_id, row);
      })
    );

    return {
      todayRevenue: todays.reduce((sum, o) => sum + o.total_price, 0),
      todayCount: todays.length,
      monthRevenue: months.reduce((sum, o) => sum + o.total_price, 0),
      monthCount: months.length,
      pending,
      stale: pending.filter(isStaleUnconfirmed).length,
      codToCollect,
      averageOrder: sales.length ? sales.reduce((sum, o) => sum + o.total_price, 0) / sales.length : 0,
      days,
      topProducts: [...productTotals.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
    };
  }, [orders]);

  const maxRevenue = Math.max(1, ...stats.days.map((d) => d.revenue));
  const lowStock = hubListings.filter(isLowStock);
  const outOfStock = hubListings.filter(isOutOfStock);

  const tiles = [
    { label: "Today's revenue", value: formatPKR(stats.todayRevenue), note: `${stats.todayCount} order(s) today` },
    { label: 'This month', value: formatPKR(stats.monthRevenue), note: `${stats.monthCount} order(s)` },
    {
      label: 'Need confirmation',
      value: String(stats.pending.length),
      note: stats.stale ? `${stats.stale} waiting over 24 hours` : 'None overdue',
      alert: stats.stale > 0,
    },
    { label: 'COD still to collect', value: formatPKR(stats.codToCollect), note: 'Confirmed, not yet delivered' },
    { label: 'Average order value', value: formatPKR(stats.averageOrder), note: 'Excludes cancelled / returned' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className={`${card} p-4 space-y-1`}>
            <span className="text-[11px] text-on-surface-variant font-semibold">{t.label}</span>
            <div className="text-lg font-extrabold font-display text-on-surface">{t.value}</div>
            <span className={`text-[10px] font-semibold ${t.alert ? 'text-error' : 'text-on-surface-variant'}`}>{t.note}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} p-5 lg:col-span-2`}>
          <h3 className="font-bold text-on-surface text-sm mb-4">Revenue, last 7 days</h3>
          <div className="flex items-end gap-2 h-40">
            {stats.days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[9px] text-on-surface-variant font-mono-spec">
                  {d.revenue ? `${Math.round(d.revenue / 1000)}k` : ''}
                </span>
                <div
                  title={`${formatPKR(d.revenue)} from ${d.count} order(s)`}
                  className="w-full max-w-10 bg-steel rounded-t"
                  style={{ height: `${Math.max(d.revenue ? 4 : 1, (d.revenue / maxRevenue) * 100)}%` }}
                />
                <span className="text-[10px] text-on-surface-variant">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${card} p-5 space-y-3`}>
          <h3 className="font-bold text-on-surface text-sm">Stock alerts</h3>
          {lowStock.length === 0 && outOfStock.length === 0 && (
            <p className="text-xs text-on-surface-variant">All laptops are well stocked.</p>
          )}
          <ul className="space-y-1.5 text-xs max-h-40 overflow-y-auto">
            {outOfStock.map((l) => (
              <li key={l.id} className="flex justify-between gap-2">
                <span className="truncate">{l.title}</span>
                <span className="text-error font-bold shrink-0">Out</span>
              </li>
            ))}
            {lowStock.map((l) => (
              <li key={l.id} className="flex justify-between gap-2">
                <span className="truncate">{l.title}</span>
                <span className="text-copper-dark font-bold shrink-0">{l.stock_qty} left</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} p-5 lg:col-span-2 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-on-surface text-sm">Recent orders</h3>
            <button onClick={onOpenOrders} className="text-xs font-bold text-steel-dark underline">
              All orders
            </button>
          </div>
          <ul className="divide-y divide-outline-variant/50 text-xs">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="py-2 flex items-center justify-between gap-3">
                <span className="font-mono-spec font-bold">{o.order_number}</span>
                <span className="truncate flex-1 text-on-surface-variant">{o.buyer_name}</span>
                <span className="price">{formatPKR(o.total_price)}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_STYLES[o.status] || ''}`}>
                  {STATUS_LABELS[o.status] || o.status}
                </span>
              </li>
            ))}
            {orders.length === 0 && <li className="py-4 text-on-surface-variant">No orders yet.</li>}
          </ul>
        </div>

        <div className={`${card} p-5 space-y-3`}>
          <h3 className="font-bold text-on-surface text-sm">Top laptops</h3>
          <ul className="space-y-1.5 text-xs">
            {stats.topProducts.map((p) => (
              <li key={p.title} className="flex justify-between gap-2">
                <span className="truncate">{p.title}</span>
                <span className="font-bold shrink-0">{p.qty} sold</span>
              </li>
            ))}
            {stats.topProducts.length === 0 && <li className="text-on-surface-variant">No sales yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Inventory

export const AdminInventory: React.FC = () => {
  const { hubListings, updateHubListing, notify } = useShop();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [drafts, setDrafts] = useState<Record<string, { stock?: string; price?: string }>>({});

  const visible = hubListings.filter((l) => {
    if (filter === 'low' && !isLowStock(l)) return false;
    if (filter === 'out' && !isOutOfStock(l)) return false;
    return !search.trim() || `${l.title} ${l.brand}`.toLowerCase().includes(search.trim().toLowerCase());
  });
  const stockValue = hubListings.reduce((sum, l) => sum + l.stock_qty * l.sale_price, 0);

  const commit = (l: HubListing) => {
    const d = drafts[l.id];
    if (!d) return;
    const updates: Partial<HubListing> = {};
    if (d.stock !== undefined && d.stock !== '') {
      const qty = Math.max(0, Math.floor(Number(d.stock)));
      if (!isNaN(qty) && qty !== l.stock_qty) {
        updates.stock_qty = qty;
        updates.status = qty <= 0 ? 'out_of_stock' : isOutOfStock(l) ? 'in_stock' : l.status;
      }
    }
    if (d.price !== undefined && d.price !== '') {
      const price = Math.max(0, Math.round(Number(d.price)));
      if (!isNaN(price) && price !== l.sale_price) updates.sale_price = price;
    }
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[l.id];
      return next;
    });
    if (Object.keys(updates).length > 0) {
      updateHubListing(l.id, updates);
      notify('Saved');
    }
  };

  const exportCsv = () =>
    downloadCsv(`inventory-${localDayKey(new Date())}.csv`, [
      ['Laptop', 'Brand', 'Condition', 'Stock', 'Status', 'Cost', 'Sale price', 'Stock value'],
      ...visible.map((l) => [l.title, l.brand, l.condition, l.stock_qty, l.status, l.cost_price, l.sale_price, l.stock_qty * l.sale_price]),
    ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-on-surface font-display">Inventory</h2>
          <p className="text-xs text-on-surface-variant">Total stock value at sale price: {formatPKR(stockValue)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search laptops"
              className="bg-surface-container-lowest border border-outline-variant rounded-lg pl-8 pr-3 py-2"
            />
          </div>
          {(['all', 'low', 'out'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg font-bold ${filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            >
              {f === 'all' ? 'All' : f === 'low' ? 'Low stock' : 'Out of stock'}
            </button>
          ))}
          <button onClick={exportCsv} className="bg-surface-container-low border border-outline-variant font-bold px-3 py-2 rounded-lg flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className={th}>Laptop</th>
                <th className={th}>Stock</th>
                <th className={th}>Sale price</th>
                <th className={th}>Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {visible.map((l) => {
                const out = isOutOfStock(l);
                return (
                  <tr key={l.id}>
                    <td className="p-3 flex items-center gap-3">
                      <img src={optimizeImage(l.images[0], 80)} alt="" className="w-9 h-9 rounded object-contain bg-white border border-outline-variant" />
                      <div>
                        <span className="font-bold text-on-surface block">{l.title}</span>
                        {isLowStock(l) && <span className="text-[10px] text-copper-dark font-bold">Low stock</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        value={drafts[l.id]?.stock ?? l.stock_qty}
                        onChange={(e) => setDrafts((p) => ({ ...p, [l.id]: { ...p[l.id], stock: e.target.value } }))}
                        onBlur={() => commit(l)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        className="w-20 bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1.5 font-bold"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        value={drafts[l.id]?.price ?? l.sale_price}
                        onChange={(e) => setDrafts((p) => ({ ...p, [l.id]: { ...p[l.id], price: e.target.value } }))}
                        onBlur={() => commit(l)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        className="w-28 bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1.5 font-mono-spec"
                      />
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          updateHubListing(l.id, { status: l.status === 'out_of_stock' ? 'in_stock' : 'out_of_stock' })
                        }
                        disabled={l.stock_qty <= 0}
                        title={l.stock_qty <= 0 ? 'Add stock first' : ''}
                        className={`px-3 py-1.5 rounded-lg font-bold disabled:opacity-50 ${
                          out ? 'bg-error-container text-on-error-container' : 'bg-steel-tint text-steel-dark'
                        }`}
                      >
                        {out ? 'Sold out' : 'Available'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Customers

export const AdminCustomers: React.FC = () => {
  const { orders } = useShop();
  const [search, setSearch] = useState('');

  const customers = useMemo(() => {
    const map = new Map<string, { key: string; name: string; phone: string; city: string; count: number; spent: number; last: string }>();
    // Orders arrive newest first, so the first one seen has the latest details.
    orders.forEach((o: Order) => {
      const key = o.phone_key || toPhoneKey(o.buyer_phone) || o.buyer_phone;
      const row = map.get(key) || { key, name: o.buyer_name, phone: o.buyer_phone, city: o.buyer_city, count: 0, spent: 0, last: o.created_at };
      row.count += 1;
      if (isCountedSale(o)) row.spent += o.total_price;
      map.set(key, row);
    });
    return [...map.values()].sort((a, b) => b.spent - a.spent);
  }, [orders]);

  const q = search.trim().toLowerCase();
  const visible = customers.filter((c) => !q || `${c.name} ${c.phone} ${c.city}`.toLowerCase().includes(q));

  const exportCsv = () =>
    downloadCsv(`customers-${localDayKey(new Date())}.csv`, [
      ['Name', 'Phone', 'City', 'Orders', 'Total spent', 'Last order'],
      ...visible.map((c) => [c.name, c.phone, c.city, c.count, c.spent, formatDateTime(c.last)]),
    ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-on-surface font-display">Customers ({customers.length})</h2>
        <div className="flex items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, phone, city"
              className="bg-surface-container-lowest border border-outline-variant rounded-lg pl-8 pr-3 py-2"
            />
          </div>
          <button onClick={exportCsv} className="bg-surface-container-low border border-outline-variant font-bold px-3 py-2 rounded-lg flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>
      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className={th}>Customer</th>
                <th className={th}>City</th>
                <th className={th}>Orders</th>
                <th className={th}>Total spent</th>
                <th className={th}>Last order</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {visible.map((c) => (
                <tr key={c.key}>
                  <td className="p-3">
                    <span className="font-bold text-on-surface block">{c.name}</span>
                    <span className="text-on-surface-variant">{c.phone}</span>
                  </td>
                  <td className="p-3">{c.city}</td>
                  <td className="p-3">
                    {c.count}
                    {c.count > 1 && <span className="ml-1.5 bg-copper-tint text-copper-dark text-[10px] font-bold px-1.5 py-0.5 rounded">Repeat</span>}
                  </td>
                  <td className="p-3 price text-xs">{formatPKR(c.spent)}</td>
                  <td className="p-3 text-on-surface-variant">{formatDateTime(c.last)}</td>
                  <td className="p-3">
                    <a
                      href={customerWhatsAppLink(c.phone, `Assalam o Alaikum ${c.name.split(' ')[0]}! ${STORE_NAME} here.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-whatsapp text-white font-bold px-2.5 py-1.5 rounded inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-on-surface-variant">No customers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Abandoned carts

export const AdminAbandonedCarts: React.FC = () => {
  const { orders, notify } = useShop();
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [error, setError] = useState('');

  useEffect(() => subscribeAbandonedCarts(setCarts, (e) => setError(e.message)), []);

  // A draft is abandoned after 30 minutes with no order from that phone since.
  const abandoned = carts.filter((c) => {
    if (c.converted) return false;
    const saved = new Date(c.updatedAt).getTime();
    if (Date.now() - saved < ABANDONED_AFTER_MINUTES * 60e3) return false;
    return !orders.some((o) => (o.phone_key || toPhoneKey(o.buyer_phone)) === c.phoneKey && orderDate(o).getTime() >= saved);
  });

  const reminder = (c: AbandonedCart) =>
    `Assalam o Alaikum ${c.name.split(' ')[0]}! ${STORE_NAME} here. You were looking at ${c.items.map((i) => i.name).join(', ')} on our website. It is still available. Would you like us to book it for you, or do you have any question? Shukriya!`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-on-surface font-display">Abandoned carts ({abandoned.length})</h2>
        <p className="text-xs text-on-surface-variant">
          Customers who typed their details at checkout over {ABANDONED_AFTER_MINUTES} minutes ago and have not ordered.
        </p>
      </div>
      {error && <p className="text-xs text-error font-semibold">{error}</p>}
      <div className="space-y-2">
        {abandoned.map((c) => (
          <div key={c.phoneKey} className={`${card} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
            <div className="space-y-0.5">
              <div className="font-bold text-on-surface">
                {c.name} · {c.phone} · {c.city}
                {c.contacted && <span className="ml-2 bg-steel-tint text-steel-dark text-[10px] font-bold px-1.5 py-0.5 rounded">Contacted</span>}
              </div>
              <div className="text-on-surface-variant">{c.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')}</div>
              <div className="text-on-surface-variant">
                <span className="price">{formatPKR(c.total)}</span> · {formatDateTime(c.updatedAt)}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={customerWhatsAppLink(c.phone, reminder(c))}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-whatsapp text-white font-bold px-3 py-2 rounded flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Remind
              </a>
              {!c.contacted && (
                <button
                  onClick={() => updateAbandonedCartRemote(c.phoneKey, { contacted: true }).catch((e) => notify(e.message, 'error'))}
                  className="border border-outline-variant font-bold px-3 py-2 rounded flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Contacted
                </button>
              )}
              <button
                onClick={() => deleteAbandonedCartRemote(c.phoneKey).catch((e) => notify(e.message, 'error'))}
                className="text-error border border-outline-variant p-2 rounded"
                aria-label="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {abandoned.length === 0 && <div className={`${card} p-10 text-center text-xs text-on-surface-variant`}>No abandoned carts right now.</div>}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Restock requests

export const useOpenRestockCount = () => {
  const [count, setCount] = useState(0);
  useEffect(() => subscribeBackInStock((list) => setCount(list.filter((r) => !r.notified).length)), []);
  return count;
};

export const AdminRestock: React.FC = () => {
  const { hubListings, notify } = useShop();
  const [requests, setRequests] = useState<BackInStockRequest[]>([]);
  const [error, setError] = useState('');

  useEffect(() => subscribeBackInStock(setRequests, (e) => setError(e.message)), []);

  const groups = useMemo(() => {
    const map = new Map<string, BackInStockRequest[]>();
    requests.forEach((r) => map.set(r.productId, [...(map.get(r.productId) || []), r]));
    return [...map.entries()]
      .map(([productId, list]) => {
        const listing = hubListings.find((l) => l.id === productId);
        return { productId, list, listing, backInStock: Boolean(listing && !isOutOfStock(listing)) };
      })
      // Laptops that are back in stock come first: those customers can be told now.
      .sort((a, b) => Number(b.backInStock) - Number(a.backInStock));
  }, [requests, hubListings]);

  const message = (r: BackInStockRequest, listing?: HubListing) =>
    listing && !isOutOfStock(listing)
      ? `Assalam o Alaikum! ${STORE_NAME} here. Good news: ${listing.title} is available again for ${formatPKR(listing.sale_price)}. Order here: ${productUrl(listing)}`
      : `Assalam o Alaikum! ${STORE_NAME} here. You asked about ${r.productName}. It is not back yet, but we have similar laptops in stock. Would you like to see them?`;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-on-surface font-display">Restock requests</h2>
      {error && <p className="text-xs text-error font-semibold">{error}</p>}
      {groups.map((g) => (
        <div key={g.productId} className={`${card} p-4 space-y-2 text-xs`}>
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-on-surface text-sm">{g.listing?.title || g.list[0].productName}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.backInStock ? 'bg-steel-tint text-steel-dark' : 'bg-surface-container text-on-surface-variant'}`}>
              {g.backInStock ? 'Back in stock' : 'Still out'}
            </span>
          </div>
          {g.list.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 border-t border-outline-variant/50 pt-2">
              <span>
                {r.contact} · <span className="text-on-surface-variant">{formatDateTime(r.createdAt)}</span>
                {r.notified && <span className="ml-2 text-steel-dark font-bold">Notified</span>}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={customerWhatsAppLink(r.contact, message(r, g.listing))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-whatsapp text-white font-bold px-2.5 py-1.5 rounded flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Message
                </a>
                {!r.notified && (
                  <button
                    onClick={() => updateBackInStockRemote(r.id, { notified: true }).catch((e) => notify(e.message, 'error'))}
                    className="border border-outline-variant font-bold px-2.5 py-1.5 rounded"
                  >
                    Mark notified
                  </button>
                )}
                <button
                  onClick={() => deleteBackInStockRemote(r.id).catch((e) => notify(e.message, 'error'))}
                  className="text-error border border-outline-variant p-1.5 rounded"
                  aria-label="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
      {groups.length === 0 && <div className={`${card} p-10 text-center text-xs text-on-surface-variant`}>No restock requests.</div>}
    </div>
  );
};

// ---------------------------------------------------------------- Discounts

const emptyDiscount = {
  code: '',
  type: 'percent' as DiscountCode['type'],
  value: '5',
  minSpend: '0',
  description: '',
  expiresAt: '',
  usageLimit: '',
  active: true,
  featured: false,
};

export const AdminDiscounts: React.FC = () => {
  const { notify } = useShop();
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyDiscount);
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => subscribeAllDiscounts(setDiscounts, (e) => setError(e.message)), []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyDiscount);
    setShowForm(true);
  };
  const openEdit = (d: DiscountCode) => {
    setEditing(d);
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      minSpend: String(d.minSpend || 0),
      description: d.description || '',
      expiresAt: d.expiresAt ? d.expiresAt.slice(0, 10) : '',
      usageLimit: d.usageLimit ? String(d.usageLimit) : '',
      active: d.active,
      featured: d.featured,
    });
    setShowForm(true);
  };

  // Only one code is featured at a time.
  const unfeatureOthers = async (code: string) => {
    await Promise.all(discounts.filter((d) => d.featured && d.code !== code).map((d) => saveDiscount({ ...d, featured: false })));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeCode(form.code);
    const value = Number(form.value);
    if (!code) return notify('Enter a code', 'error');
    if (!editing && discounts.some((d) => d.code === code)) return notify('That code already exists', 'error');
    if (!(value > 0) || (form.type === 'percent' && value > 90)) return notify('Enter a valid amount (percent 1-90)', 'error');
    const discount: DiscountCode = {
      code,
      type: form.type,
      value,
      minSpend: Math.max(0, Number(form.minSpend) || 0),
      description: form.description.trim(),
      active: form.active,
      featured: form.featured,
      // Valid until the end of the chosen day.
      expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : undefined,
      usageLimit: Number(form.usageLimit) > 0 ? Math.floor(Number(form.usageLimit)) : undefined,
      usedCount: editing?.usedCount || 0,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    try {
      if (discount.featured) await unfeatureOthers(code);
      await saveDiscount(discount);
      notify('Discount saved');
      setShowForm(false);
    } catch (err: any) {
      notify(err?.message || 'Could not save', 'error');
    }
  };

  const toggle = async (d: DiscountCode, patch: Partial<DiscountCode>) => {
    try {
      if (patch.featured) await unfeatureOthers(d.code);
      await saveDiscount({ ...d, ...patch });
    } catch (err: any) {
      notify(err?.message || 'Could not save', 'error');
    }
  };

  const inputClass = 'w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-on-surface font-display">Discount codes</h2>
          <p className="text-xs text-on-surface-variant">
            The featured code is advertised in the top bar, promo popup, bag, FAQ and footer. With none featured, those spots disappear.
          </p>
        </div>
        <button onClick={openNew} className="bg-steel hover:bg-steel-dark text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> New code
        </button>
      </div>
      {error && <p className="text-xs text-error font-semibold">{error}</p>}

      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className={th}>Code</th>
                <th className={th}>Offer</th>
                <th className={th}>Used</th>
                <th className={th}>Expires</th>
                <th className={th}>Status</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {discounts.map((d) => {
                const problem = discountProblem(d);
                return (
                  <tr key={d.code}>
                    <td className="p-3 font-mono-spec font-bold">{d.code}</td>
                    <td className="p-3">
                      {discountLabel(d)}
                      {d.description && <span className="block text-on-surface-variant">{d.description}</span>}
                    </td>
                    <td className="p-3">
                      {d.usedCount}
                      {d.usageLimit ? ` / ${d.usageLimit}` : ''}
                    </td>
                    <td className="p-3 text-on-surface-variant">{d.expiresAt ? d.expiresAt.slice(0, 10) : 'Never'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => toggle(d, { active: !d.active })}
                        className={`px-2 py-1 rounded font-bold ${d.active && !problem ? 'bg-steel-tint text-steel-dark' : 'bg-surface-container text-on-surface-variant'}`}
                      >
                        {!d.active ? 'Paused' : problem ? problem.replace('This code ', '').replace('.', '') : 'Active'}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => toggle(d, { featured: !d.featured })}
                          title={d.featured ? 'Stop advertising this code' : 'Advertise this code across the site'}
                          className={`p-1.5 rounded border border-outline-variant ${d.featured ? 'bg-copper-tint text-copper-dark' : 'text-on-surface-variant'}`}
                        >
                          <Star className={`w-3.5 h-3.5 ${d.featured ? 'fill-current' : ''}`} />
                        </button>
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded border border-outline-variant text-on-surface-variant" aria-label="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => window.confirm(`Delete code ${d.code}?`) && deleteDiscount(d.code).catch((e) => notify(e.message, 'error'))}
                          className="p-1.5 rounded border border-outline-variant text-error"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {discounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-on-surface-variant">
                    No discount codes yet. Create one and star it to advertise it across the site.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-primary/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-surface-container-lowest rounded-xl p-6 max-w-md w-full border border-outline-variant shadow-2xl space-y-3 text-xs">
            <h3 className="font-bold text-on-surface text-sm">{editing ? `Edit ${editing.code}` : 'New discount code'}</h3>
            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Code</label>
              <input
                value={form.code}
                disabled={Boolean(editing)}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. EID10"
                className={`${inputClass} font-mono-spec font-bold uppercase disabled:opacity-60`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DiscountCode['type'] })} className={inputClass}>
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed rupees off</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">{form.type === 'percent' ? 'Percent' : 'Rupees'}</label>
                <input type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Minimum spend (Rs.)</label>
                <input type="number" min={0} value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Usage limit (optional)</label>
                <input type="number" min={0} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className="font-bold text-on-surface-variant block mb-1">Expiry date (optional)</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className="font-bold text-on-surface-variant block mb-1">Description shown to customers</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
              </div>
            </div>
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
            </label>
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured (advertised across the site)
            </label>
            {form.type === 'percent' && Number(form.value) >= 10 && (
              <p className="flex items-start gap-1.5 text-copper-dark font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {form.value}% off a Rs. 60,000 laptop is {formatPKR((60000 * Number(form.value)) / 100)}. Check it against your margin.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-lg font-bold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-steel hover:bg-steel-dark text-white rounded-lg font-bold">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
