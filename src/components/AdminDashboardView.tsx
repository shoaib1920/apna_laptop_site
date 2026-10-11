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
  X,
  Loader2,
  ImagePlus,
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  BellRing,
  Tag,
  ArrowLeft,
  ArrowRight,
  Link2,
} from 'lucide-react';
import { HubListing, LaptopCondition, Order, User } from '../types';
import { formatPKR, optimizeImage } from '../utils/helpers';
import { BulkImportModal } from './BulkImportModal';
import { uploadHubListingImage } from '../services/imageUpload';
import { useShop } from '../services/store';
import { AdminOrders } from './admin/AdminOrders';
import {
  AdminAbandonedCarts,
  AdminCustomers,
  AdminDiscounts,
  AdminInventory,
  AdminOverview,
  AdminRestock,
  useOpenRestockCount,
} from './admin/AdminTabs';
import { ImageEditorModal } from './admin/ImageEditorModal';
import { isCountedSale } from './admin/adminUtils';

type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'carts'
  | 'restock'
  | 'discounts'
  | 'analytics';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80';

interface AdminDashboardViewProps {
  hubListings: HubListing[];
  orders: Order[];
  createHubListing: (listing: Omit<HubListing, 'id' | 'rating' | 'reviewCount'>) => HubListing;
  updateHubListing: (id: string, updates: Partial<HubListing>) => void;
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
  supplierNote: 'Direct partnership with our verified supplier.',
  status: 'in_stock' as HubListing['status'],
};

const STATUS_OPTIONS: { value: HubListing['status']; label: string }[] = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock / Sold' },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  hubListings = [],
  orders = [],
  createHubListing,
  updateHubListing,
  deleteHubListing,
  navigateTo,
  currentUser,
  onLogout,
}) => {
  const { notify } = useShop();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const openRestockCount = useOpenRestockCount();
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  // Photos waiting to go through the editor, one at a time.
  const [editQueue, setEditQueue] = useState<File[]>([]);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showBulkImport, setShowBulkImport] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Revenue stats — tied to real order/listing data, not a phantom field.
  // Cancelled and returned orders are not sales.
  const soldOrders = orders.filter(isCountedSale);
  const totalSalesGMV = soldOrders.reduce((sum, o) => sum + o.total_price, 0);
  const totalMarginFromOrders = soldOrders.reduce((sum, order) => {
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
    setImages([]);
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
      status: item.status,
    });
    setImages(item.images || []);
    setShowModal(true);
  };

  // Each picked photo passes through the editor (crop, rotate, adjust)
  // before it is uploaded.
  const handleImageFilesPicked = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setEditQueue((prev) => [...prev, ...Array.from(fileList)]);
  };

  const uploadEditedImage = async (file: File) => {
    setUploadingImages(true);
    try {
      const url = await uploadHubListingImage(file);
      setImages((prev) => [...prev, url]);
      setEditQueue((prev) => prev.slice(1));
    } finally {
      setUploadingImages(false);
    }
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addImageUrl = () => {
    const url = imageUrlDraft.trim();
    if (!/^https?:\/\//i.test(url)) {
      notify('Paste a full image link starting with https://', 'error');
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrlDraft('');
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
      images: images.length > 0 ? images : [PLACEHOLDER_IMAGE],
      shortDescription: form.shortDescription,
      fullDescription: form.fullDescription,
      warrantyMonths: Number(form.warrantyMonths),
      isFeatured: true,
      supplierNote: form.supplierNote,
      status: form.status,
    };

    if (editingId) {
      updateHubListing(editingId, payload);
    } else {
      createHubListing(payload);
    }

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setImages([]);
  };

  const tabs: { id: AdminTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, count: pendingCount },
    { id: 'products', label: `Products (${hubListings.length})`, icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'carts', label: 'Abandoned Carts', icon: ShoppingBag },
    { id: 'restock', label: 'Restock', icon: BellRing, count: openRestockCount },
    { id: 'discounts', label: 'Discounts', icon: Tag },
    { id: 'analytics', label: 'Finances & Margin', icon: TrendingUp },
  ];

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

        {onLogout && (
          <button
            onClick={onLogout}
            title="Log out"
            className="shrink-0 self-start md:self-auto h-9 px-3 rounded-lg bg-primary text-on-primary-container hover:text-on-primary flex items-center gap-1.5 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        )}
      </div>

      {/* Tab Controls */}
      <div className="flex bg-primary p-1.5 rounded-lg overflow-x-auto text-xs gap-1">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-3.5 py-2 rounded-md font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === id ? 'bg-steel text-white shadow' : 'text-on-primary-container hover:text-on-primary'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {!!count && (
              <span className="bg-copper text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && <AdminOverview onOpenOrders={() => setActiveTab('orders')} />}
      {activeTab === 'orders' && <AdminOrders />}
      {activeTab === 'inventory' && <AdminInventory />}
      {activeTab === 'customers' && <AdminCustomers />}
      {activeTab === 'carts' && <AdminAbandonedCarts />}
      {activeTab === 'restock' && <AdminRestock />}
      {activeTab === 'discounts' && <AdminDiscounts />}

      {/* TAB 1: HUB INVENTORY MANAGER */}
      {activeTab === 'products' && (
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
                            onClick={() => window.confirm(`Delete "${item.title}"?`) && deleteHubListing(item.id)}
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
              <span className="text-[11px] text-on-surface-variant">Sale price − supplier cost + upgrades, excluding cancelled / returned</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-1">
              <span className="text-xs text-on-surface-variant font-semibold">Total Customer Orders</span>
              <div className="text-2xl font-extrabold text-on-surface font-display">{soldOrders.length}</div>
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
                <label className="font-bold text-on-surface-variant block mb-1">Photos</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {images.map((url, i) => (
                    <div key={url + i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant bg-surface-container-low shrink-0">
                      <img src={optimizeImage(url, 160)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-0.5 left-0.5 bg-copper text-white text-[8px] font-bold px-1 rounded">MAIN</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        title="Remove photo"
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary/80 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 flex justify-between bg-primary/70 text-white">
                        <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} title="Move earlier" className="p-0.5 disabled:opacity-30">
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} title="Move later" className="p-0.5 disabled:opacity-30">
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-low shrink-0 text-on-surface-variant">
                    {uploadingImages ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImagePlus className="w-5 h-5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingImages}
                      onChange={(e) => {
                        handleImageFilesPicked(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="url"
                      value={imageUrlDraft}
                      onChange={(e) => setImageUrlDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addImageUrl();
                        }
                      }}
                      placeholder="or paste an image link"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-8 pr-3 py-2"
                    />
                  </div>
                  <button type="button" onClick={addImageUrl} className="px-3 bg-surface-container text-on-surface rounded-lg font-bold">
                    Add
                  </button>
                </div>
                {images.length === 0 && (
                  <p className="text-[10px] text-on-surface-variant">
                    No photos added yet - a placeholder image will be used until you upload one.
                  </p>
                )}
              </div>

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
                    <option value="Microsoft">Microsoft</option>
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

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as HubListing['status'] }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
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

      {editQueue.length > 0 && (
        <ImageEditorModal
          key={editQueue[0].name + editQueue[0].size + editQueue.length}
          file={editQueue[0]}
          remaining={editQueue.length - 1}
          onCancel={() => setEditQueue((prev) => prev.slice(1))}
          onApply={uploadEditedImage}
        />
      )}

      {showBulkImport && (
        <BulkImportModal onClose={() => setShowBulkImport(false)} createHubListing={createHubListing} />
      )}
    </div>
  );
};
