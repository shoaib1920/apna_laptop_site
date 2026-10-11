import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, Loader2, MessageCircle, CheckCircle2 } from 'lucide-react';
import type { ChatMessage, ChatOrder, ChatReply } from '../../api/chat';
import { Order, OrderItem } from '../types';
import { useShop } from '../services/store';
import { OrderLimitError } from '../services/orders';
import { SERVICE_AREA_CITIES } from '../services/pricingEngine';
import { STORE_NAME } from '../config';
import { PHONE_HINT, toPhoneKey } from '../utils/phone';
import { formatPKR, isOutOfStock, orderWhatsAppLink } from '../utils/helpers';

const GREETING: ChatMessage = {
  role: 'model',
  text: `Assalam o Alaikum! Main ${STORE_NAME} ka assistant hoon. Aap Roman Urdu, Urdu ya English mein baat kar sakte hain. Kis kaam ke liye laptop chahiye aur budget kya hai?`,
};

/** Chat window where a customer orders by conversation. The assistant only
 * knows the live catalogue; totals are calculated here from that catalogue,
 * never taken from the AI. */
export const AiChatAssistant: React.FC = () => {
  const shop = useShop();
  const { hubListings, currentUser } = shop;
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [readyOrder, setReadyOrder] = useState<ChatOrder | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, readyOrder, placed]);

  if (!shop.chatOpen) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const history: ChatMessage[] = [...messages, { role: 'user', text }];
    setMessages(history);
    setInput('');
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // The greeting is ours, not the model's; the history must start with the customer.
          messages: history.slice(1),
          catalog: hubListings.map((l) => ({
            name: l.title,
            price: l.sale_price,
            category: l.brand,
            inStock: !isOutOfStock(l),
            tagline: `${l.condition}; ${l.specs.cpu}; ${l.specs.ram}; ${l.specs.storage}; ${l.specs.screenSize}"`,
          })),
        }),
      });
      const data = (await res.json()) as ChatReply | { error: string };
      if (!res.ok || 'error' in data) throw new Error('error' in data ? data.error : 'Request failed');
      setMessages([...history, { role: 'model', text: data.reply }]);
      setReadyOrder(data.orderReady ? data.order : null);
    } catch (err: any) {
      console.error('AI chat failed:', err);
      setError(err?.message || 'The assistant is unavailable right now. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Build the order from the live catalogue; reject anything that doesn't match.
  const buildOrder = (chat: ChatOrder) => {
    const items: OrderItem[] = [];
    for (const line of chat.items || []) {
      const listing = hubListings.find((l) => l.title.trim().toLowerCase() === line.product.trim().toLowerCase());
      if (!listing) return { error: `"${line.product}" is not in our catalogue any more. Please ask the assistant again.` };
      if (isOutOfStock(listing)) return { error: `${listing.title} is out of stock.` };
      const qty = Math.max(1, Math.min(Math.floor(Number(line.quantity) || 1), listing.stock_qty));
      items.push({
        listing_id: listing.id,
        title: listing.title,
        brand: listing.brand,
        model: listing.model,
        image: listing.images[0],
        unit_price: listing.sale_price,
        qty,
        upgrades_total: 0,
        item_total: listing.sale_price * qty,
      });
    }
    if (items.length === 0) return { error: 'No laptop was selected. Please tell the assistant which laptop you want.' };
    if (!toPhoneKey(chat.phone)) return { error: PHONE_HINT };
    const city = SERVICE_AREA_CITIES.find((c) => c.toLowerCase() === (chat.city || '').trim().toLowerCase());
    if (!city) return { error: `We deliver only to: ${SERVICE_AREA_CITIES.join(', ')}.` };
    if (!chat.customerName.trim() || !chat.address.trim()) return { error: 'Name and address are required.' };
    const subtotal = items.reduce((sum, i) => sum + i.item_total, 0);
    return { items, city, subtotal };
  };

  const preview = readyOrder ? buildOrder(readyOrder) : null;

  const placeOrder = async () => {
    if (!readyOrder || !preview || 'error' in preview || placing) return;
    // Opened at the click so it isn't blocked as a pop-up; see CheckoutView.
    const waTab = window.open('', '_blank');
    setPlacing(true);
    setError('');
    try {
      const { order } = await shop.createOrder({
        buyer_id: currentUser?.id || `guest_${Date.now()}`,
        buyer_name: readyOrder.customerName.trim(),
        buyer_phone: readyOrder.phone.trim(),
        buyer_whatsapp: readyOrder.phone.trim(),
        buyer_city: preview.city,
        buyer_address: readyOrder.address.trim(),
        buyer_landmark: readyOrder.notes?.trim() || undefined,
        items: preview.items,
        subtotal: preview.subtotal,
        discount: 0,
        points_discount: 0,
        delivery_fee: 0,
        delivery_type: 'standard',
        total_price: preview.subtotal,
        payment_method: 'cod',
        source: 'ai-chat',
      }, undefined, { keepCart: true });
      setPlaced(order);
      setReadyOrder(null);
      if (waTab) waTab.location.href = orderWhatsAppLink(order);
    } catch (err: any) {
      waTab?.close();
      setError(err instanceof OrderLimitError ? err.message : err?.message || 'Could not place the order.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[75] sm:w-[380px] sm:h-[560px] bg-surface-container-lowest sm:rounded-lg shadow-2xl border border-outline-variant flex flex-col print:hidden">
      <div className="bg-primary text-on-primary px-4 py-3 flex items-center justify-between sm:rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-copper" />
          <div>
            <div className="text-sm font-bold">Order with AI</div>
            <div className="text-[10px] text-on-primary-container">Roman Urdu, Urdu, English</div>
          </div>
        </div>
        <button onClick={() => shop.setChatOpen(false)} aria-label="Close chat">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-surface">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-steel text-white rounded-br-sm'
                  : 'bg-surface-container-lowest border border-outline-variant text-on-surface rounded-bl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-surface-container-lowest border border-outline-variant px-3 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-outline" />
            </div>
          </div>
        )}

        {readyOrder && preview && !placed && (
          <div className="bg-copper-tint border border-copper/40 rounded-lg p-3 text-xs space-y-2">
            {'error' in preview ? (
              <p className="text-error font-semibold">{preview.error}</p>
            ) : (
              <>
                <div className="font-bold text-on-surface">Your order</div>
                {preview.items.map((i) => (
                  <div key={i.listing_id} className="flex justify-between gap-2">
                    <span>
                      {i.qty} x {i.title}
                    </span>
                    <span className="font-mono-spec shrink-0">{formatPKR(i.item_total)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-copper/30 pt-1.5 font-bold">
                  <span>Total (free delivery, Cash on Delivery)</span>
                  <span className="price">{formatPKR(preview.subtotal)}</span>
                </div>
                <div className="text-on-surface-variant">
                  {readyOrder.customerName} · {readyOrder.phone}
                  <br />
                  {readyOrder.address}, {preview.city}
                </div>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-2.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                  <span>Place order & send on WhatsApp</span>
                </button>
              </>
            )}
          </div>
        )}

        {placed && (
          <div className="bg-steel-tint border border-steel/30 rounded-lg p-3 text-xs space-y-2">
            <div className="font-bold text-steel-dark flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Order saved: {placed.order_number}</span>
            </div>
            <p className="text-on-surface">
              WhatsApp has opened with your receipt. Send it to confirm your order.
            </p>
            <div className="flex gap-2">
              <a
                href={orderWhatsAppLink(placed)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-whatsapp text-white font-bold py-2 rounded text-center"
              >
                Open WhatsApp
              </a>
              <button
                onClick={() => {
                  shop.setChatOpen(false);
                  shop.navigateTo('track', { orderId: placed.order_number });
                }}
                className="flex-1 bg-primary text-on-primary font-bold py-2 rounded"
              >
                Track order
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-[11px] text-error font-semibold px-1">{error}</p>}
      </div>

      <form onSubmit={send} className="p-3 border-t border-outline-variant flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1500}
          placeholder="Type your message..."
          className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-steel hover:bg-steel-dark text-white px-4 rounded-lg disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
