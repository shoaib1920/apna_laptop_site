import React, { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Tag, MessageCircle, ArrowRight, Truck } from 'lucide-react';
import { useShop } from '../services/store';
import { discountAmountFor, discountLabel } from '../services/discounts';
import { cartItemUnitPrice, cartSubtotal, formatPKR, optimizeImage } from '../utils/helpers';

/** Slide-in bag: items, discount code, totals, and the two ways to check out. */
export const CartDrawer: React.FC = () => {
  const shop = useShop();
  const { cart, appliedDiscount, featuredDiscount } = shop;
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [checking, setChecking] = useState(false);

  if (!shop.cartOpen) return null;

  const subtotal = cartSubtotal(cart);
  const discount = discountAmountFor(appliedDiscount, subtotal);
  const total = subtotal - discount;
  const close = () => shop.setCartOpen(false);

  const apply = async (value: string) => {
    if (!value.trim()) return;
    setChecking(true);
    const error = await shop.applyDiscountCode(value);
    setChecking(false);
    setCodeError(error || '');
    if (!error) {
      setCode('');
      shop.notify('Discount code applied');
    }
  };

  const goCheckout = (viaWhatsApp: boolean) => {
    close();
    if (viaWhatsApp) shop.orderOnWhatsApp();
    else {
      shop.setWhatsappCheckout(false);
      shop.navigateTo('checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Your bag">
      <div className="absolute inset-0 bg-primary/50" onClick={close} />
      <aside
        id="cart-drawer"
        className="absolute right-0 top-0 h-full w-full max-w-md bg-surface shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h2 className="font-extrabold font-display text-on-surface flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-steel-dark" />
            <span>Your Bag ({cart.reduce((n, i) => n + i.quantity, 0)})</span>
          </h2>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-surface-container-low" aria-label="Close bag">
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingCart className="w-12 h-12 text-outline" />
            <p className="font-bold text-on-surface">Your bag is empty</p>
            <p className="text-xs text-on-surface-variant">Browse the Laptop Hub to find a verified laptop.</p>
            <button
              onClick={() => {
                close();
                shop.navigateTo('hub');
              }}
              className="bg-steel hover:bg-steel-dark text-white text-xs font-bold px-6 py-2.5 rounded-lg"
            >
              Browse Laptop Hub
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <div className="flex items-center gap-2 bg-steel-tint text-steel-dark text-[11px] font-semibold px-3 py-2 rounded">
                <Truck className="w-4 h-4 shrink-0" />
                <span>Free next-day delivery in Nankana Sahib & nearby towns</span>
              </div>

              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 bg-surface-container-lowest rounded border border-outline-variant text-xs"
                >
                  <img
                    src={optimizeImage(item.listing.images[0], 160)}
                    alt={item.listing.title}
                    className="w-16 h-16 rounded object-contain bg-white border border-outline-variant shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-bold text-on-surface line-clamp-2">{item.listing.title}</h4>
                    {(item.selectedRamUpgrade || item.selectedStorageUpgrade) && (
                      <div className="text-[10px] text-steel-dark bg-steel-tint px-1.5 py-0.5 rounded inline-block">
                        {item.selectedRamUpgrade?.label && `+${item.selectedRamUpgrade.label} `}
                        {item.selectedStorageUpgrade?.label && `+${item.selectedStorageUpgrade.label}`}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="price text-sm">{formatPKR(cartItemUnitPrice(item) * item.quantity)}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded-lg px-1.5 py-0.5">
                          <button
                            onClick={() => shop.updateCartQuantity(idx, item.quantity - 1)}
                            className="text-outline hover:text-on-surface p-0.5"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-[11px] px-1">{item.quantity}</span>
                          <button
                            onClick={() => shop.updateCartQuantity(idx, item.quantity + 1)}
                            disabled={item.quantity >= item.listing.stock_qty}
                            className="text-outline hover:text-on-surface p-0.5 disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => shop.removeCartItem(idx)}
                          className="text-error p-1"
                          aria-label="Remove from bag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Discount code */}
              <div className="space-y-1.5 pt-1">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-copper-tint text-copper-dark text-xs font-semibold px-3 py-2 rounded">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {appliedDiscount.code} · {discountLabel(appliedDiscount)}
                    </span>
                    <button onClick={shop.removeDiscount} className="underline font-bold">
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        apply(code);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.toUpperCase());
                          setCodeError('');
                        }}
                        placeholder="Discount code"
                        className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs font-semibold uppercase"
                      />
                      <button
                        type="submit"
                        disabled={checking || !code.trim()}
                        className="bg-primary text-on-primary text-xs font-bold px-4 rounded-lg disabled:opacity-50"
                      >
                        {checking ? '...' : 'Apply'}
                      </button>
                    </form>
                    {featuredDiscount && (
                      <button
                        onClick={() => apply(featuredDiscount.code)}
                        className="text-[11px] text-copper-dark font-semibold underline"
                      >
                        Use {featuredDiscount.code} for {discountLabel(featuredDiscount)}
                      </button>
                    )}
                  </>
                )}
                {codeError && <p className="text-[11px] text-error font-semibold">{codeError}</p>}
                {appliedDiscount && discount === 0 && (
                  <p className="text-[11px] text-error font-semibold">
                    Add {formatPKR(appliedDiscount.minSpend - subtotal)} more for this code to apply.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-outline-variant px-5 py-4 space-y-3 bg-surface-container-lowest">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="font-mono-spec">{formatPKR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Discount</span>
                    <span className="font-mono-spec">-{formatPKR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-on-surface-variant">
                  <span>Delivery</span>
                  <span className="font-mono-spec">FREE</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-on-surface pt-1 border-t border-outline-variant">
                  <span>Total</span>
                  <span className="price text-base">{formatPKR(total)}</span>
                </div>
              </div>

              <button
                id="cart-checkout-btn"
                onClick={() => goCheckout(false)}
                className="w-full bg-steel hover:bg-steel-dark text-white font-extrabold py-3 rounded text-sm flex items-center justify-center gap-2"
              >
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                id="cart-whatsapp-btn"
                onClick={() => goCheckout(true)}
                className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-2.5 rounded text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order on WhatsApp</span>
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};
