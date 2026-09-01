import React, { useState } from 'react';
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  ArrowRight,
  MessageCircle,
  CreditCard,
  Building,
  MapPin,
  Phone,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { CartItem, Order, OrderItem, PaymentMethod, User } from '../types';
import { PAKISTAN_CITIES } from '../services/pricingEngine';
import { formatPKR } from '../utils/helpers';

interface CheckoutViewProps {
  cart: CartItem[];
  currentUser: User | null;
  updateCartQuantity: (listingId: string, quantity: number) => void;
  removeFromCart: (listingId: string) => void;
  clearCart: () => void;
  placeOrder: (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'status'>) => Order;
  navigateTo: (route: string, params?: any) => void;
  romanUrduMode: boolean;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart = [],
  currentUser,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  placeOrder,
  navigateTo,
  romanUrduMode,
}) => {
  // Shipping Form State
  const [customerName, setCustomerName] = useState<string>(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser?.phone || '03001234567');
  const [customerCity, setCustomerCity] = useState<string>(currentUser?.city || 'Lahore');
  const [customerAddress, setCustomerAddress] = useState<string>(
    'House 14-B, Street 3, Sector G-11/2'
  );
  const [orderNotes, setOrderNotes] = useState<string>('Please call before delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [deliveryType, setDeliveryType] = useState<'standard' | 'express'>('standard');

  // Completed order
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Cart total calculations
  const calculateItemPrice = (item: CartItem) => {
    const ramP = item.selectedRamUpgrade?.price || 0;
    const ssdP = item.selectedStorageUpgrade?.price || 0;
    return item.listing.sale_price + ramP + ssdP;
  };

  const subtotal = cart.reduce((sum, item) => sum + calculateItemPrice(item) * item.quantity, 0);
  const deliveryFee = deliveryType === 'express' ? 500 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const orderItems: OrderItem[] = cart.map((c) => {
      const ramP = c.selectedRamUpgrade?.price || 0;
      const ssdP = c.selectedStorageUpgrade?.price || 0;
      const upgradesTotal = ramP + ssdP;
      const unitTotal = c.listing.sale_price + upgradesTotal;
      const upgradeDetails = [
        c.selectedRamUpgrade ? `+${c.selectedRamUpgrade.label}` : '',
        c.selectedStorageUpgrade ? `+${c.selectedStorageUpgrade.label}` : '',
      ]
        .filter(Boolean)
        .join(', ');

      return {
        listing_id: c.listing.id,
        title: c.listing.title,
        brand: c.listing.brand,
        model: c.listing.model,
        image: c.listing.images[0],
        unit_price: c.listing.sale_price,
        qty: c.quantity,
        upgrades_total: upgradesTotal,
        upgrade_details: upgradeDetails || undefined,
        item_total: unitTotal * c.quantity,
      };
    });

    const newOrder = placeOrder({
      buyer_id: currentUser?.id || `guest_${Date.now()}`,
      buyer_name: customerName.trim(),
      buyer_phone: customerPhone.trim(),
      buyer_whatsapp: customerPhone.trim(),
      buyer_city: customerCity,
      buyer_address: customerAddress.trim(),
      items: orderItems,
      subtotal,
      delivery_fee: deliveryFee,
      total_price: grandTotal,
      payment_method: paymentMethod,
      notes: orderNotes,
    });

    setPlacedOrder(newOrder);
  };

  if (placedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 animate-scale-up">
        <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-whatsapp/10 text-whatsapp-dark rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface font-display">
              Shukriya, Order Confirmed!
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Tracking Order Number: <strong className="text-whatsapp-dark font-mono text-sm">{placedOrder.order_number}</strong>
            </p>
          </div>

          {/* Summary Box */}
          <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant text-left text-xs space-y-2.5 max-w-lg mx-auto">
            <div className="flex justify-between font-semibold">
              <span className="text-on-surface-variant">Recipient Name:</span>
              <span className="text-on-surface">{placedOrder.buyer_name}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-on-surface-variant">Phone (WhatsApp):</span>
              <span className="text-on-surface">{placedOrder.buyer_phone}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-on-surface-variant">Shipping Address:</span>
              <span className="text-on-surface text-right">{placedOrder.buyer_address}, {placedOrder.buyer_city}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-on-surface-variant">Payment Mode:</span>
              <span className="text-on-surface uppercase">{placedOrder.payment_method}</span>
            </div>
            <div className="flex justify-between border-t border-outline-variant pt-2 font-bold text-sm">
              <span className="text-on-surface">Total Payable on Delivery:</span>
              <span className="text-whatsapp-dark font-display">{formatPKR(placedOrder.total_price)}</span>
            </div>
          </div>

          {/* Delivery Process Note */}
          <div className="bg-whatsapp/10 text-on-surface p-4 rounded-2xl border border-whatsapp/20 text-xs space-y-1 text-left max-w-lg mx-auto">
            <div className="flex items-center gap-1.5 font-bold text-whatsapp-dark">
              <ShieldCheck className="w-4 h-4 text-whatsapp-dark" />
              <span>What happens next?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Our dispatch manager will call you within 2 business hours to verify shipping and lot details. You have 7 days checking warranty upon receiving the parcel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a
              href={`https://wa.me/923001234567?text=${encodeURIComponent(`Salam Apna Laptop! I just placed order ${placedOrder.order_number} for total ${formatPKR(placedOrder.total_price)}. Please confirm dispatch.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Track on WhatsApp</span>
            </a>

            <button
              onClick={() => navigateTo('hub')}
              className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-6 py-3 rounded-xl transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingCart className="w-14 h-14 text-outline mx-auto" />
        <h2 className="text-xl font-bold text-on-surface font-display">Your Cart is Empty</h2>
        <p className="text-xs text-on-surface-variant">Explore our Laptop Hub to find verified laptops with warranty.</p>
        <button
          onClick={() => navigateTo('hub')}
          className="bg-whatsapp hover:bg-whatsapp-dark text-white text-xs font-bold px-6 py-3 rounded-xl shadow"
        >
          Browse Laptop Hub
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface font-display flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-whatsapp-dark" />
          <span>Checkout & Secure Order</span>
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Cash on Delivery with 7-Day Checking Warranty across Pakistan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Shipping & Payment Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCompleteOrder} className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant shadow-sm space-y-6">
            {/* Step 1: Customer Info */}
            <div className="space-y-3">
              <h2 className="text-base font-extrabold text-on-surface font-display flex items-center gap-2">
                <MapPin className="w-4 h-4 text-whatsapp-dark" />
                <span>1. Delivery Details (Pakistan)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="e.g. Bilal Ahmed"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 font-semibold text-on-surface"
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">
                    WhatsApp Phone Number <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    placeholder="03001234567"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 font-bold text-on-surface"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-on-surface-variant block mb-1">
                    Destination City <span className="text-error">*</span>
                  </label>
                  <select
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 font-semibold text-on-surface"
                  >
                    {PAKISTAN_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-on-surface-variant block mb-1">
                    Full Street Address & Landmark <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                    placeholder="House / Flat No, Street, Sector / Area, Landmark"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-on-surface"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Speed */}
            <div className="space-y-3 border-t border-outline-variant pt-4">
              <h2 className="text-base font-extrabold text-on-surface font-display flex items-center gap-2">
                <Truck className="w-4 h-4 text-whatsapp-dark" />
                <span>2. Delivery Speed</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setDeliveryType('standard')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                    deliveryType === 'standard'
                      ? 'border-whatsapp bg-whatsapp/10 ring-2 ring-whatsapp/20'
                      : 'border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="text-lg">📦</span>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">Standard Delivery</span>
                      <span className="font-bold text-whatsapp-dark">FREE</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">2-4 Business Days via TCS/Leopards</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('express')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                    deliveryType === 'express'
                      ? 'border-whatsapp bg-whatsapp/10 ring-2 ring-whatsapp/20'
                      : 'border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="text-lg">⚡</span>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">Same-Day Express</span>
                      <span className="font-bold text-on-surface">Rs. 500</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">Lahore & Karachi riders</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="space-y-3 border-t border-outline-variant pt-4">
              <h2 className="text-base font-extrabold text-on-surface font-display flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-whatsapp-dark" />
                <span>3. Payment Method</span>
              </h2>

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between ${
                    paymentMethod === 'cod'
                      ? 'border-whatsapp bg-whatsapp/10 font-bold text-on-surface ring-2 ring-whatsapp/20'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💵</span>
                    <div>
                      <span className="block font-bold">Cash on Delivery (Recommended)</span>
                      <span className="text-[11px] text-on-surface-variant font-normal">
                        Pay delivery courier after checking the package
                      </span>
                    </div>
                  </div>
                  <span className="bg-whatsapp/10 text-whatsapp-dark text-[10px] px-2 py-0.5 rounded font-bold">
                    Zero Risk
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-whatsapp bg-whatsapp/10 font-bold text-on-surface ring-2 ring-whatsapp/20'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏦</span>
                    <div>
                      <span className="block font-bold">Direct Bank Transfer / Raast</span>
                      <span className="text-[11px] text-on-surface-variant font-normal">Meezan Bank / HBL / Raast ID</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Order Button */}
            <div className="pt-2">
              <button
                id="place-cod-order-btn"
                type="submit"
                className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-extrabold py-4 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-whatsapp/25 transition-transform hover:scale-[1.01]"
              >
                <span>Confirm Order ({formatPKR(grandTotal)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary & Cart Items (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-on-surface font-display border-b border-outline-variant pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-outline font-medium">{cart.length} item(s)</span>
            </h2>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {cart.map((item, idx) => {
                const itemUnitP = calculateItemPrice(item);
                return (
                  <div key={idx} className="flex gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant text-xs">
                    <img
                      src={item.listing.images[0]}
                      alt={item.listing.title}
                      className="w-16 h-16 rounded-xl object-cover bg-surface-container shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-on-surface line-clamp-1">{item.listing.title}</h4>

                      {/* Upgrades */}
                      {(item.selectedRamUpgrade || item.selectedStorageUpgrade) && (
                        <div className="text-[10px] text-whatsapp-dark bg-whatsapp/10 px-1.5 py-0.5 rounded inline-block">
                          {item.selectedRamUpgrade?.label && `+${item.selectedRamUpgrade.label} `}
                          {item.selectedStorageUpgrade?.label && `+${item.selectedStorageUpgrade.label}`}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-extrabold text-on-surface">
                          {formatPKR(itemUnitP)}
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.listing.id, item.quantity - 1)}
                              className="text-outline hover:text-on-surface"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-[11px] px-1">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.listing.id, item.quantity + 1)}
                              className="text-outline hover:text-on-surface"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.listing.id)}
                            className="text-error hover:text-on-error-container p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-outline-variant pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal:</span>
                <span className="font-bold text-on-surface">{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Delivery:</span>
                <span className="font-bold text-whatsapp-dark">
                  {deliveryFee === 0 ? 'FREE' : formatPKR(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Checking Warranty (7 Days):</span>
                <span className="font-bold text-whatsapp-dark">FREE</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 font-extrabold text-sm text-on-surface">
                <span>Total Amount:</span>
                <span className="text-whatsapp-dark font-display text-base">{formatPKR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="bg-primary text-on-primary rounded-3xl p-5 border border-primary-container text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-whatsapp">
              <ShieldCheck className="w-5 h-5" />
              <span>Apna Laptop Buyer Protection</span>
            </div>
            <ul className="text-on-primary-container text-[11px] space-y-1.5 list-disc pl-4">
              <li>100% Genuine imported lot stock</li>
              <li>Tested by technicians in Lahore & Karachi</li>
              <li>Open parcel inspection before payment</li>
              <li>Dedicated customer helpline on WhatsApp</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
