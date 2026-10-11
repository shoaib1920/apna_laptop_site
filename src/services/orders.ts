import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Order } from '../types';
import { MAX_ORDERS_PER_PHONE_PER_DAY, ORDER_ID_ALPHABET, ORDER_ID_PREFIX } from '../config';
import { stripUndefined } from '../utils/helpers';

const COLLECTION = 'orders';
const DAY_MS = 24 * 60 * 60 * 1000;

export const generateOrderId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  return ORDER_ID_PREFIX + Array.from(bytes, (b) => ORDER_ID_ALPHABET[b % ORDER_ID_ALPHABET.length]).join('');
};

export class OrderLimitError extends Error {
  constructor() {
    super(
      `This number has already placed ${MAX_ORDERS_PER_PHONE_PER_DAY} orders today. Please message us on WhatsApp to order more.`
    );
    this.name = 'OrderLimitError';
  }
}

/** Saves the order together with that phone number's daily order counter in
 * one batch - firestore.rules reject the order if the counter isn't updated
 * in the same write, which is what enforces the 3-per-24-hours limit. */
export async function createOrderRemote(order: Order): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  if (!order.phone_key) throw new Error('A valid Pakistani mobile number is required.');

  const limitRef = doc(db, 'phoneLimits', order.phone_key);
  const limitSnap = await getDoc(limitRef);
  const batch = writeBatch(db);
  const { id, ...rest } = order;
  batch.set(doc(db, COLLECTION, id), stripUndefined(rest));

  if (!limitSnap.exists()) {
    batch.set(limitRef, { count: 1, windowStart: serverTimestamp(), lastOrderId: id });
  } else {
    const data = limitSnap.data() as { count: number; windowStart: Timestamp };
    const windowOpen = Date.now() - data.windowStart.toMillis() < DAY_MS;
    if (windowOpen && data.count >= MAX_ORDERS_PER_PHONE_PER_DAY) throw new OrderLimitError();
    batch.update(
      limitRef,
      windowOpen
        ? { count: data.count + 1, lastOrderId: id }
        : { count: 1, windowStart: serverTimestamp(), lastOrderId: id }
    );
  }
  await batch.commit();
}

/** Anyone may read one order by its exact ID (that's how tracking works). */
export async function getOrderRemote(orderId: string): Promise<Order | null> {
  if (!isFirebaseConfigured || !db) return null;
  const snapshot = await getDoc(doc(db, COLLECTION, orderId));
  return snapshot.exists() ? ({ ...(snapshot.data() as Order), id: snapshot.id }) : null;
}

/** Admin only (rules refuse listing orders for anyone else). */
export function subscribeAllOrders(
  onChange: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(
    query(collection(db, COLLECTION), orderBy('created_at', 'desc')),
    (snapshot) => onChange(snapshot.docs.map((d) => ({ ...(d.data() as Order), id: d.id }))),
    (error) => onError?.(error)
  );
}

/** A signed-in customer's own orders (rules allow listing only where
 * buyer_id is their own uid). */
export function subscribeMyOrders(uid: string, onChange: (orders: Order[]) => void): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(
    query(collection(db, COLLECTION), where('buyer_id', '==', uid)),
    (snapshot) => onChange(snapshot.docs.map((d) => ({ ...(d.data() as Order), id: d.id }))),
    (error) => console.error('Failed to load your orders:', error)
  );
}

export async function updateOrderRemote(id: string, patch: Partial<Order>): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, COLLECTION, id), stripUndefined(patch) as Record<string, unknown>);
}

export async function deleteOrderRemote(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, COLLECTION, id));
}
