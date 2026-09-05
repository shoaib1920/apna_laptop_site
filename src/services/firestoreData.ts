import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  orderBy,
  query,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { HubListing, Order } from '../types';

const HUB_COLLECTION = 'hub_listings';
const ORDERS_COLLECTION = 'orders';

/** Live-subscribes to the Hub inventory collection. Every admin edit shows up
 * for every visitor immediately — this is the whole point of moving off
 * localStorage. Returns an unsubscribe function. */
export function subscribeHubListings(callback: (listings: HubListing[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, HUB_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const listings = snapshot.docs.map((d) => ({ ...(d.data() as HubListing), id: d.id }));
    callback(listings);
  });
}

/** Writes with a caller-supplied id (rather than addDoc's auto-id) so the
 * doc id always matches the id used in the optimistic local state update —
 * no flicker/mismatch once the realtime listener catches up. */
export async function addHubListingFS(listing: HubListing): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const { id, ...rest } = listing;
  await setDoc(doc(db, HUB_COLLECTION, id), rest);
}

export async function updateHubListingFS(id: string, updates: Partial<HubListing>): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  await updateDoc(doc(db, HUB_COLLECTION, id), updates as Record<string, unknown>);
}

/** Uploads one product photo to Storage and returns its public download URL. */
export async function uploadHubListingImage(file: File): Promise<string> {
  if (!storage) throw new Error('Firebase Storage is not configured');
  const path = `hub_listings/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteHubListingFS(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  await deleteDoc(doc(db, HUB_COLLECTION, id));
}

/** One-time seed: if the Hub collection is empty (fresh Firebase project),
 * push the demo catalog in so the site isn't blank on first launch. Safe to
 * call on every app load — it's a no-op once the collection has data. */
export async function seedHubListingsIfEmpty(initialListings: HubListing[]): Promise<void> {
  if (!db) return;
  const snapshot = await getDocs(collection(db, HUB_COLLECTION));
  if (!snapshot.empty) return;
  const batch = writeBatch(db);
  initialListings.forEach((listing) => {
    const { id, ...rest } = listing;
    batch.set(doc(db, HUB_COLLECTION, id), rest);
  });
  await batch.commit();
}

/** Live-subscribes to all orders, newest first — the admin CRM view. */
export function subscribeOrders(callback: (orders: Order[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((d) => ({ ...(d.data() as Order), id: d.id }));
    callback(orders);
  });
}

export async function createOrderFS(order: Order): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const { id, ...rest } = order;
  await setDoc(doc(db, ORDERS_COLLECTION, id), rest);
}

export async function updateOrderStatusFS(
  id: string,
  status: Order['status'],
  courierName?: string,
  trackingNumber?: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const updates: Record<string, unknown> = { status };
  if (courierName) updates.courier_name = courierName;
  if (trackingNumber) updates.tracking_number = trackingNumber;
  await updateDoc(doc(db, ORDERS_COLLECTION, id), updates);
}
