import React, { useEffect, useRef, useState } from 'react';
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  CreditCard,
  Building,
  MapPin,
  AlertCircle,
  Package,
  Zap,
  Banknote,
  Printer,
  Search,
  Gift,
  Loader2,
} from 'lucide-react';
import { CartItem, Order, OrderItem, PaymentMethod } from '../types';
import { SERVICE_AREA_CITIES } from '../services/pricingEngine';
import { useShop } from '../services/store';
import { OrderLimitError } from '../services/orders';
import { CartDraft, getPointsRemote, saveAbandonedCartRemote } from '../services/customers';
import { discountAmountFor } from '../services/discounts';
import { EXPRESS_DELIVERY_FEE, POINTS_MAX_SHARE } from '../config';
import { PHONE_HINT, toPhoneKey } from '../utils/phone';
import { cartItemUnitPrice, cartSubtotal, formatPKR, optimizeImage, orderWhatsAppLink } from '../utils/helpers';
import { OrderReceipt } from './OrderReceipt';

const EXPRESS_CITY = 'Nankana Sahib';

const toOrderItems = (cart: CartItem[]): OrderItem[] =>
  cart.map((c) => {
    const upgradesTotal = (c.selectedRamUpgrade?.price || 0) + (c.selectedStorageUpgrade?.price || 0);
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
      item_total: cartItemUnitPrice(c) * c.quantity,
    };
  });

export const CheckoutView: React.FC = () => {
  const shop = useShop();
  const { cart, currentUser, appliedDiscount, whatsappCheckout, navigateTo } = shop;

  const [customerName, setCustomerName] = useState<string>(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser?.phone || '');
  const [customerCity, setCustomerCity] = useState<string>(currentUser?.city || 'Nankana Sahib');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [deliveryType, setDeliveryType] = useState<'standard' | 'express'>('standard');
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Loyalty points for the typed phone number
  const [pointsBalance, setPointsBalance] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [placed, setPlaced] = useState<{ order: Order; savedOnline: boolean } | null>(null);

  const phoneKey = toPhoneKey(customerPhone);
  const expressAvailable = customerCity === EXPRESS_CITY;
  const effectiveDelivery = expressAvailable ? deliveryType : 'standard';

  const subtotal = cartSubtotal(cart);
  const discount = discountAmountFor(appliedDiscount, subtotal);
  const maxPoints = Math.floor((subtotal - discount) * POINTS_MAX_SHARE);
  const pointsDiscount = usePoints ? Math.min(pointsBalance, maxPoints) : 0;
  const deliveryFee = effectiveDelivery === 'express' ? EXPRESS_DELIVERY_FEE : 0;
  const grandTotal = subtotal - discount - pointsDiscount + deliveryFee;

  // Look up the points balance once a valid phone number is typed.
  useEffect(() => {
    setPointsBalance(0);
    setUsePoints(false);
    if (!phoneKey) return;
    let cancelled = false;
    getPointsRemote(phoneKey)
      .then((points) => !cancelled && setPointsBalance(points))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [phoneKey]);

  const draft: CartDraft | null =
    phoneKey && customerName.trim()
      ? {
          phoneKey,
          name: customerName.trim().slice(0, 100),
          phone: customerPhone.trim(),
          city: customerCity,
          items: cart.map((c) => ({ name: c.listing.title, quantity: c.quantity, price: cartItemUnitPrice(c) })),
          total: grandTotal,
          converted: false,
        }
      : null;

  // Once name and a valid phone are present, save a draft after 1.5s so the
  // store can follow up if checkout is never finished.
  const draftJson = draft ? JSON.stringify(draft) : '';
  const placedRef = useRef(false);
  useEffect(() => {
    if (!draftJson || cart.length === 0) return;
    const timer = setTimeout(() => {
      if (placedRef.current) return;
      saveAbandonedCartRemote(JSON.parse(draftJson)).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftJson]);

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || submitting) return;
    setPhoneTouched(true);
    setSubmitError('');
    if (!phoneKey) return;

    // Opened at the moment of the click (a tab opened after waiting for the
    // save would be blocked as a pop-up), then pointed at WhatsApp once the
    // order is saved, or closed if the save is refused.
    const waTab = window.open('', '_blank');
    setSubmitting(true);
    try {
      const result = await shop.createOrder(
        {
          buyer_id: currentUser?.id || `guest_${Date.now()}`,
          buyer_name: customerName.trim(),
          buyer_phone: customerPhone.trim(),
          buyer_whatsapp: customerPhone.trim(),
          buyer_city: customerCity,
          buyer_address: customerAddress.trim(),
          buyer_landmark: landmark.trim() || undefined,
          items: toOrderItems(cart),
          subtotal,
          discount,
          discount_code: discount > 0 ? appliedDiscount?.code : undefined,
          points_discount: pointsDiscount,
          delivery_fee: deliveryFee,
          delivery_type: effectiveDelivery,
          total_price: grandTotal,
          payment_method: paymentMethod,
          source: 'website',
        },
        draft || undefined
      );
      placedRef.current = true;
      setPlaced(result);
      shop.setWhatsappCheckout(false);
      if (waTab) waTab.location.href = orderWhatsAppLink(result.order);
      window.scrollTo({ top: 0 });
    } catch (err: any) {
      waTab?.close();
      setSubmitError(
        err instanceof OrderLimitError ? err.message : err?.message || 'Could not place the order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    const { order, savedOnline } = placed;
    const isCod = order.payment_method === 'cod';
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">
        <div className="text-center space-y-2 print:hidden">
          <div className="w-14 h-14 bg-steel-tint text-steel-dark rounded-lg flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface font-display">Shukriya! Order received</h1>
          <p className="text-sm text-on-surface-variant">
            Your Order ID is <strong className="font-mono-spec text-on-surface">{order.order_number}</strong>
          </p>
        </div>

        {!savedOnline && (
          <div className="bg-error-container text-on-error-container rounded p-4 text-xs flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong>We could not reach our server.</strong> Your order is saved on this device. Please tap the
              WhatsApp button below so the store receives it.
            </p>
          </div>
        )}

        <div className="bg-copper-tint border border-copper/30 rounded p-4 space-y-3 print:hidden">
          <div className="text-xs font-extrabold text-copper-dark uppercase tracking-wide">One last step</div>
          <p className="text-xs text-on-surface leading-relaxed">
            {isCod
              ? 'Confirm your order on WhatsApp. We dispatch Cash on Delivery orders only after you confirm.'
              : `Confirm your order on WhatsApp and we will send our bank / Raast details for ${formatPKR(order.total_price)}. We dispatch once the payment is received.`}
          </p>
          <a
            href={orderWhatsAppLink(order)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-extrabold text-sm px-6 py-3 rounded flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Confirm Order on WhatsApp</span>
          </a>
        </div>

        <OrderReceipt order={order} />

        <div className="flex flex-col sm:flex-row gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-xs px-4 py-3 rounded flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={() => navigateTo('track', { orderId: order.order_number })}
            className="flex-1 bg-primary text-on-primary font-bold text-xs px-4 py-3 rounded flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Track Order</span>
          </button>
          <button
            onClick={() => navigateTo('hub')}
            className="flex-1 bg-surface-container-low text-on-surface font-bold text-xs px-4 py-3 rounded"
          >
            Continue Shopping
          </button>
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
          className="bg-steel hover:bg-steel-dark text-white text-xs font-bold px-6 py-3 rounded-xl shadow"
        >
          Browse Laptop Hub
        </button>
      </div>
    );
  }

  const inputClass =
    'w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-on-surface';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface font-display flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-steel-dark" />
          <span>{whatsappCheckout ? 'Order on WhatsApp' : 'Checkout & Secure Order'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          {whatsappCheckout
            ? 'Fill in your delivery details. We save your order and open WhatsApp with it ready to send.'
            : 'Cash on Delivery with 7-Day Checking Warranty in Nankana Sahib & nearby towns.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Shipping & Payment Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form
            id="checkout-form"
            onSubmit={handleCompleteOrder}
            className="bg-surface-container-lowest rounded-lg p-6 sm:p-8 border border-outline-variant shadow-sm space-y-6"
          >
            {/* Step 1: Customer Info */}
            <div className="space-y-3">
              <h2 className="text-base font-extrabold text-on-surface font-display flex items-center gap-2">
                <MapPin className="w-4 h-4 text-steel-dark" />
                <span>1. Delivery Details</span>
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
                    maxLength={100}
                    placeholder="e.g. Bilal Ahmed"
                    className={`${inputClass} font-semibold`}
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">
                    WhatsApp Phone Number <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onBlur={() => setPhoneTouched(true)}
                    required
                    placeholder="03001234567"
                    className={`${inputClass} font-bold ${phoneTouched && !phoneKey ? 'border-error' : ''}`}
                  />
                  {phoneTouched && !phoneKey && (
                    <p className="text-[11px] text-error font-semibold mt-1">{PHONE_HINT}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-on-surface-variant block mb-1">
                    Destination City <span className="text-error">*</span>
                  </label>
                  <select
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className={`${inputClass} font-semibold`}
                  >
                    {SERVICE_AREA_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-on-surface-variant block mb-1">
                    Full Street Address <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                    maxLength={300}
                    placeholder="House / Flat No, Street, Mohalla / Area"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-on-surface-variant block mb-1">
                    Nearest Landmark / Delivery Instructions (optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    maxLength={300}
                    placeholder="e.g. Near Jamia Masjid, call before coming"
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant">
                We save these details as you type so our team can help on WhatsApp if your order is not completed.
              </p>
            </div>

            {/* Step 2: Shipping Speed */}
            <div className="space-y-3 border-t border-outline-variant pt-4">
              <h2 className="text-base font-extrabold text-on-surface font-display flex items-center gap-2">
                <Truck className="w-4 h-4 text-steel-dark" />
                <span>2. Delivery Speed</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setDeliveryType('standard')}
                  className={`p-3.5 rounded border text-left flex items-start gap-2.5 transition-all ${
                    effectiveDelivery === 'standard'
                      ? 'border-steel bg-steel-tint ring-2 ring-steel/20'
                      : 'border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <Package className="w-5 h-5 text-on-surface-variant shrink-0" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">Standard Delivery</span>
                      <span className="price">FREE</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">Next-day via local rider (Nankana Sahib & nearby)</span>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!expressAvailable}
                  onClick={() => setDeliveryType('express')}
                  className={`p-3.5 rounded border text-left flex items-start gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    effectiveDelivery === 'express'
                      ? 'border-steel bg-steel-tint ring-2 ring-steel/20'
                      : 'border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <Zap className="w-5 h-5 text-on-surface-variant shrink-0" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">Same-Day Express</span>
                      <span className="price">{formatPKR(EXPRESS_DELIVERY_FEE)}</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">Same-day, Nankana Sahib city only</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Loyalty points */}
            {pointsBalance > 0 && maxPoints > 0 && (
              <div className="border-t border-outline-variant pt-4">
                <label className="flex items-start gap-3 p-3.5 rounded border border-copper/40 bg-copper-tint cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="mt-0.5 accent-[#c17a3d]"
                  />
                  <div>
                    <span className="font-bold text-on-surface flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-copper-dark" />
                      Use {Math.min(pointsBalance, maxPoints).toLocaleString()} reward points (-
                      {formatPKR(Math.min(pointsBalance, maxPoints))})
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      This number has {pointsBalance.toLocaleString()} points. Points can cover up to{' '}
                      {Math.round(POINTS_MAX_SHARE * 100)}% of an order.
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Step 3: Payment Method */}
            <div className="space-y-3 border-t border-outline-variant pt-4">
              <h2 className="text-base font-extrabold text-on-surface font-display flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-steel-dark" />
                <span>3. Payment Method</span>
              </h2>

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full p-3.5 rounded border text-left flex items-center justify-between ${
                    paymentMethod === 'cod'
                      ? 'border-steel bg-steel-tint font-bold text-on-surface ring-2 ring-steel/20'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-on-surface-variant shrink-0" />
                    <div>
                      <span className="block font-bold">Cash on Delivery (Recommended)</span>
                      <span className="text-[11px] text-on-surface-variant font-normal">
                        Pay delivery courier after checking the package
                      </span>
                    </div>
                  </div>
                  <span className="bg-steel-tint text-steel-dark text-[10px] px-2 py-0.5 rounded font-bold">
                    Zero Risk
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`w-full p-3.5 rounded border text-left flex items-center justify-between ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-steel bg-steel-tint font-bold text-on-surface ring-2 ring-steel/20'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-on-surface-variant shrink-0" />
                    <div>
                      <span className="block font-bold">Direct Bank Transfer / Raast</span>
                      <span className="text-[11px] text-on-surface-variant font-normal">
                        Account details are sent on WhatsApp after you order
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {submitError && (
              <div className="bg-error-container text-on-error-container rounded p-3 text-xs font-semibold flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Order Button */}
            <div className="pt-2">
              <button
                id="place-cod-order-btn"
                type="submit"
                disabled={submitting}
                className={`w-full text-white font-extrabold py-4 px-6 rounded text-sm flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-[1.01] disabled:opacity-60 ${
                  whatsappCheckout ? 'bg-whatsapp hover:bg-whatsapp-dark' : 'bg-steel hover:bg-steel-dark'
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : whatsappCheckout ? (
                  <MessageCircle className="w-4 h-4" />
                ) : null}
                <span>
                  {whatsappCheckout ? 'Confirm & Send on WhatsApp' : 'Confirm Order'} ({formatPKR(grandTotal)})
                </span>
                {!submitting && !whatsappCheckout && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest rounded-lg p-6 border border-outline-variant shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-on-surface font-display border-b border-outline-variant pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <button onClick={() => shop.setCartOpen(true)} className="text-xs text-steel-dark font-bold underline">
                Edit bag ({cart.length})
              </button>
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-surface-container-low rounded border border-outline-variant text-xs">
                  <img
                    src={optimizeImage(item.listing.images[0], 160)}
                    alt={item.listing.title}
                    className="w-16 h-16 rounded-xl object-cover bg-surface-container shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-on-surface line-clamp-1">{item.listing.title}</h4>
                    {(item.selectedRamUpgrade || item.selectedStorageUpgrade) && (
                      <div className="text-[10px] text-steel-dark bg-steel-tint px-1.5 py-0.5 rounded inline-block">
                        {item.selectedRamUpgrade?.label && `+${item.selectedRamUpgrade.label} `}
                        {item.selectedStorageUpgrade?.label && `+${item.selectedStorageUpgrade.label}`}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-on-surface-variant">Qty {item.quantity}</span>
                      <span className="price text-sm">{formatPKR(cartItemUnitPrice(item) * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-outline-variant pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal:</span>
                <span className="price text-xs">{formatPKR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-on-surface-variant">
                  <span>Discount ({appliedDiscount?.code}):</span>
                  <span className="price text-xs">-{formatPKR(discount)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-on-surface-variant">
                  <span>Reward points:</span>
                  <span className="price text-xs">-{formatPKR(pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>Delivery:</span>
                <span className="price text-xs">{deliveryFee === 0 ? 'FREE' : formatPKR(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Checking Warranty (7 Days):</span>
                <span className="price text-xs">FREE</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 font-extrabold text-sm text-on-surface">
                <span>Total Amount:</span>
                <span className="price text-base">{formatPKR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="bg-primary text-on-primary rounded-lg p-5 border border-primary-container text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-copper">
              <ShieldCheck className="w-5 h-5" />
              <span>Apna Laptop Buyer Protection</span>
            </div>
            <ul className="text-on-primary-container text-[11px] space-y-1.5 list-disc pl-4">
              <li>100% Genuine imported lot stock</li>
              <li>Tested by our technicians in Nankana Sahib</li>
              <li>Open parcel inspection before payment</li>
              <li>Dedicated customer helpline on WhatsApp</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
