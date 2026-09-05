import React, { useState } from 'react';
import {
  ShieldAlert,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Truck,
  LogOut,
  UploadCloud,
} from 'lucide-react';
import { HubListing, LaptopCondition, Order, OrderStatus, User } from '../types';
import { formatPKR } from '../utils/helpers';
import { BulkImportModal } from './BulkImportModal';

interface AdminDashboardViewProps {
  hubListings: HubListing[];
  orders: Order[];
  createHubListing: (listing: Omit<HubListing, 'id' | 'rating' | 'reviewCount'>) => HubListing;
  updateHubListing: (id: string, updates: Partial<HubListing>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, courierName?: string, trackingNumber?: string) => void;
  deleteHubListing: (id: string) => void;
  navigateTo: (route: string, params?: any) => void;
  currentUser: User | null;
  onLogout?: () => void;
}

const LAPTOP_CONDITIONS: LaptopCondition[] = [
  'Brand New',
  'Like New (Open Box)',
  'Used - Excellent (Grade A+)',
  'Used - Good (Grade A)',
  'Used - Fair (Grade B)',
];

const conditionBadgeClasses = (condition: string) => {
  if (condition === 'Brand New') return 'bg-primary text-on-primary';
  if (condition === 'Like New (Open Box)') return 'bg-surface-container-low text-on-surface border border-outline-variant';
  return 'bg-copper-tint text-copper-dark';
};

const emptyForm = {
  title: '',
  brand: 'Lenovo',
  model: 'ThinkPad T14 Gen 2',
  condition: 'Used - Excellent (Grade A+)' as LaptopCondition,
  costPrice: 85000,
  salePrice: 98000,
  stockQty: 5,
  cpu: 'Intel Core i5-1135G7 (11th Gen)',
  ram: '16GB DDR4',
  storage: '512GB NVMe SSD',
  gpu: 'Intel Iris Xe Graphics',
  screenSize: '14.0',
  shortDescription: 'Verified lot imported from UK/Dubai. High durability commercial grade.',
  fullDescription: 'Strictly tested motherboard, keyboard backlight, and battery health.',
  warrantyMonths: 1,
  supplierNote: 'Direct partnership with our Nankana Sahib supplier partner.',
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  hubListings = [],
  orders = [],
  createHubListing,
  updateHubListing,
  updateOrderStatus,
  deleteHubListing,
  navigateTo,
  currentUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'analytics'>('inventory');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showBulkImport, setShowBulkImport] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [courierDrafts, setCourierDrafts] = useState<Record<string, { courier: string; tracking: string }>>({});

  // Revenue stats — tied to real order/listing data, not a phantom field
  const totalSalesGMV = orders.reduce((sum, o) => sum + o.total_price, 0);
  const totalMarginFromOrders = orders.reduce((sum, order) => {
    const orderMargin = order.items.reduce((itemSum, item) => {
      const hubListing = hubListings.find((h) => h.id === item.listing_id);
      const unitCost = hubListing?.cost_price ?? item.unit_price * 0.88;
      return itemSum + (item.unit_price - unitCost) * item.qty + item.upgrades_total;
    }, 0);
    return sum + orderMargin;
  }, 0);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (item: HubListing) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      brand: item.brand,
      model: item.model,
      condition: item.condition,
      costPrice: item.cost_price,
      salePrice: item.sale_price,
      stockQty: item.stock_qty,
      cpu: item.specs.cpu,
      ram: item.specs.ram,
      storage: item.specs.storage,
      gpu: item.specs.gpu,
      screenSize: item.specs.screenSize,
      shortDescription: item.shortDescription,
      fullDescription: item.fullDescription,
      warrantyMonths: item.warrantyMonths,
      supplierNote: item.supplierNote || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const payload = {
      title: form.title.trim(),
      brand: form.brand,
      model: form.model.trim(),
      condition: form.condition,
      cost_price: Number(form.costPrice),
      sale_price: Number(form.salePrice),
      stock_qty: Number(form.stockQty),
      specs: {
        cpu: form.cpu,
        ram: form.ram,
        storage: form.storage,
        gpu: form.gpu,
        screenSize: form.screenSize,
      },
      use_case_tags: ['Programming & Dev', 'Office & Business'],
      images: [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
      ],
      shortDescription: form.shortDescription,
      fullDescription: form.fullDescription,
      warrantyMonths: Number(form.warrantyMonths),
      isFeatured: true,
      supplierNote: form.supplierNote,
      status: (Number(form.stockQty) <= 0 ? 'out_of_stock' : Number(form.stockQty) <= 2 ? 'low_stock' : 'in_stock') as HubListing['status'],
    };

    if (editingId) {
      updateHubListing(editingId, payload);
    } else {
      createHubListing(payload);
    }

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    if (status === 'shipped') {
      setCourierDrafts((prev) => ({ ...prev, [orderId]: prev[orderId] || { courier: '', tracking: '' } }));
      return;
    }
    updateOrderStatus(orderId, status);
    setCourierDrafts((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
  };

  const handleSaveCourier = (orderId: string) => {
    const draft = courierDrafts[orderId];
    updateOrderStatus(orderId, 'shipped', draft?.courier, draft?.tracking);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-primary-container text-on-primary rounded-xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-steel flex items-center justify-center text-on-primary font-bold">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
              Apna Laptop <span className="text-steel">Admin Portal</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-on-primary-container mt-1">
            Manage Hub stock and dispatch customer orders like a CRM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Controls */}
          <div className="flex bg-primary p-1.5 rounded-lg overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-md font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'inventory' ? 'bg-steel text-white shadow' : 'text-on-primary-container hover:text-on-primary'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Hub Inventory ({hubListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-md font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'orders' ? 'bg-steel text-white shadow' : 'text-on-primary-container hover:text-on-primary'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'analytics' ? 'bg-steel text-white shadow' : 'text-on-primary-container hover:text-on-primary'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Finances & Margin</span>
          </button>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Log out"
              className="shrink-0 w-9 h-9 rounded-lg bg-primary text-on-primary-container hover:text-on-primary flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: HUB INVENTORY MANAGER */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface font-display">Verified Stock Lots & Margins</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkImport(true)}
                className="bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 border border-outline-variant"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Bulk Import</span>
              </button>
              <button
                onClick={openAddModal}
                className="bg-steel hover:bg-steel-dark text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Lot Product</span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-bold">
                  <tr>
                    <th className="p-4">Laptop & Model</th>
                    <th className="p-4">Specs Summary</th>
                    <th className="p-4">Supplier Cost</th>
                    <th className="p-4">Sale Price</th>
                    <th className="p-4">Our Margin</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {hubListings.map((item) => {
                    const margin = item.sale_price - item.cost_price;
                    return (
                      <tr key={item.id} className="hover:bg-surface-container-low">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-10 h-10 rounded object-contain bg-white border border-outline-variant p-0.5"
                          />
                          <div>
                            <span className="font-bold text-on-surface block">{item.title}</span>
                            <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${conditionBadgeClasses(item.condition)}`}>
                              {item.condition}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-on-surface-variant font-mono-spec text-[11px]">
                          {item.specs.cpu.split('(')[0]} • {item.specs.ram} • {item.specs.storage}
                        </td>
                        <td className="p-4 price text-[11px]">
                          {formatPKR(item.cost_price)}
                        </td>
                        <td className="p-4 price text-xs">
                          {formatPKR(item.sale_price)}
                        </td>
                        <td className="p-4 price text-xs">
                          +{formatPKR(margin)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.stock_qty > 0 ? 'bg-steel-tint text-steel-dark' : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            {item.stock_qty} pcs
                          </span>
                        </td>
                        <td className="p-4 flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-on-surface-variant hover:text-on-surface border border-outline-variant rounded-md p-1.5"
                            title="Edit listing"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteHubListing(item.id)}
                            className="text-error hover:bg-error-container border border-outline-variant hover:border-error rounded-md p-1.5"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* TAB 2: ORDERS MANAGEMENT (CRM) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface font-display">Customer Orders & COD Dispatch Tracker</h2>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-bold">
                  <tr>
                    <th className="p-4">Order #</th>
                    <th className="p-4">Customer & City</th>
                    <th className="p-4">Phone (WhatsApp)</th>
                    <th className="p-4">Items & Upgrades</th>
                    <th className="p-4">Payable Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Update / Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container-low align-top">
                      <td className="p-4 font-mono-spec font-bold text-on-surface">{order.order_number}</td>
                      <td className="p-4">
                        <span className="font-bold text-on-surface block">{order.buyer_name}</span>
                        <span className="text-[11px] text-on-surface-variant">{order.buyer_city}</span>
                      </td>
                      <td className="p-4">
                        <a
                          href={`https://wa.me/${order.buyer_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-whatsapp-dark hover:underline font-bold"
                        >
                          {order.buyer_phone}
                        </a>
                      </td>
                      <td className="p-4 text-on-surface-variant max-w-xs truncate">
                        {order.items.map((i) => `${i.title} (x${i.qty})`).join(', ')}
                      </td>
                      <td className="p-4 price text-xs">{formatPKR(order.total_price)}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                            order.status === 'delivered'
                              ? 'bg-steel-tint text-steel-dark'
                              : order.status === 'shipped'
                              ? 'bg-secondary-container/60 text-on-secondary-container'
                              : order.status === 'cancelled'
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {order.status}
                        </span>
                        {order.courier_name && (
                          <div className="text-[10px] text-on-surface-variant mt-1">
                            {order.courier_name} · {order.tracking_number}
                          </div>
                        )}
                      </td>
                      <td className="p-4 space-y-1.5">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="bg-surface-container-low border border-outline-variant rounded-md px-2 py-1 text-xs font-semibold text-on-surface"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {courierDrafts[order.id] && (
                          <div className="flex flex-col gap-1 pt-1 min-w-[160px]">
                            <input
                              type="text"
                              placeholder="Courier name"
                              value={courierDrafts[order.id].courier}
                              onChange={(e) =>
                                setCourierDrafts((prev) => ({
                                  ...prev,
                                  [order.id]: { ...prev[order.id], courier: e.target.value },
                                }))
                              }
                              className="bg-surface-container-low border border-outline-variant rounded-md px-2 py-1 text-[11px]"
                            />
                            <input
                              type="text"
                              placeholder="Tracking number"
                              value={courierDrafts[order.id].tracking}
                              onChange={(e) =>
                                setCourierDrafts((prev) => ({
                                  ...prev,
                                  [order.id]: { ...prev[order.id], tracking: e.target.value },
                                }))
                              }
                              className="bg-surface-container-low border border-outline-variant rounded-md px-2 py-1 text-[11px]"
                            />
                            <button
                              onClick={() => handleSaveCourier(order.id)}
                              className="flex items-center justify-center gap-1 bg-steel hover:bg-steel-dark text-white font-bold text-[11px] px-2 py-1 rounded-md"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Mark Shipped</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-1">
              <span className="text-xs text-on-surface-variant font-semibold">Total Gross Marketplace Volume</span>
              <div className="price text-2xl">{formatPKR(totalSalesGMV)}</div>
              <span className="text-[11px] text-steel-dark font-bold">100% Cash flow tracked</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-1">
              <span className="text-xs text-on-surface-variant font-semibold">Net Platform Margin (from orders)</span>
              <div className="price text-2xl">{formatPKR(totalMarginFromOrders)}</div>
              <span className="text-[11px] text-on-surface-variant">Sale price − supplier cost + upgrades, across all orders</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-1">
              <span className="text-xs text-on-surface-variant font-semibold">Total Customer Orders</span>
              <div className="text-2xl font-extrabold text-on-surface font-display">{orders.length}</div>
              <span className="text-[11px] text-on-surface-variant">
                {orders.filter((o) => o.status === 'delivered').length} delivered so far
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Hub Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 max-w-xl w-full border border-outline-variant shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <h3 className="font-bold text-on-surface text-sm">
                {editingId ? 'Edit Verified Laptop Lot' : 'Add New Verified Laptop Lot'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-xs text-on-surface-variant">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Product Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Lenovo ThinkPad T14 Gen 2 Core i5 11th Gen"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Brand</label>
                  <select
                    value={form.brand}
                    onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  >
                    <option value="Lenovo">Lenovo</option>
                    <option value="Dell">Dell</option>
                    <option value="HP">HP</option>
                    <option value="Apple">Apple</option>
                    <option value="Acer">Acer</option>
                    <option value="Asus">Asus</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Model Name</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value as LaptopCondition }))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                >
                  {LAPTOP_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Supplier Cost (PKR)</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm((f) => ({ ...f, costPrice: Number(e.target.value) }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Sale Price (PKR)</label>
                  <input
                    type="number"
                    value={form.salePrice}
                    onChange={(e) => setForm((f) => ({ ...f, salePrice: Number(e.target.value) }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={form.stockQty}
                    onChange={(e) => setForm((f) => ({ ...f, stockQty: Number(e.target.value) }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">CPU</label>
                  <input
                    type="text"
                    value={form.cpu}
                    onChange={(e) => setForm((f) => ({ ...f, cpu: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">RAM</label>
                  <input
                    type="text"
                    value={form.ram}
                    onChange={(e) => setForm((f) => ({ ...f, ram: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Storage</label>
                  <input
                    type="text"
                    value={form.storage}
                    onChange={(e) => setForm((f) => ({ ...f, storage: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-steel hover:bg-steel-dark text-white rounded-lg font-bold shadow"
                >
                  {editingId ? 'Save Changes' : 'Save to Hub Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkImport && (
        <BulkImportModal onClose={() => setShowBulkImport(false)} createHubListing={createHubListing} />
      )}
    </div>
  );
};
