import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { AbandonedCart, BackInStockRequest } from '../types';
import { stripUndefined } from '../utils/helpers';

const tsToIso = (value: any) => (value?.toDate ? value.toDate().toISOString() : value || new Date(0).toISOString());

// ---------- Loyalty points (loyalty/{phoneKey}) ----------
// Kept separate from customers/{uid} (account profiles): points belong to a
// phone number, so guests earn them too.

export async function getPointsRemote(phoneKey: string): Promise<number> {
  if (!isFirebaseConfigured || !db) return 0;
  const snapshot = await getDoc(doc(db, 'loyalty', phoneKey));
  return snapshot.exists() ? Math.max(0, Number(snapshot.data().points) || 0) : 0;
}

/** Admin only. Positive delta adds points, negative removes them. */
export async function adjustPointsRemote(phoneKey: string, delta: number): Promise<void> {
  if (!isFirebaseConfigured || !db || !delta) return;
  await setDoc(
    doc(db, 'loyalty', phoneKey),
    { phoneKey, points: increment(delta), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ---------- Back-in-stock requests (backInStock/{id}) ----------

export async function createBackInStockRemote(request: BackInStockRequest): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await setDoc(doc(db, 'backInStock', request.id), stripUndefined(request));
}

export function subscribeBackInStock(
  onChange: (list: BackInStockRequest[]) => void,
  onError?: (e: Error) => void
): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(
    collection(db, 'backInStock'),
    (snap) =>
      onChange(
        snap.docs.map((d) => d.data() as BackInStockRequest).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      ),
    (e) => onError?.(e)
  );
}

export async function updateBackInStockRemote(id: string, patch: Partial<BackInStockRequest>): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, 'backInStock', id), stripUndefined(patch) as Record<string, unknown>);
}

export async function deleteBackInStockRemote(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, 'backInStock', id));
}

// ---------- Abandoned carts (abandonedCarts/{phoneKey}) ----------

export type CartDraft = Omit<AbandonedCart, 'updatedAt' | 'contacted'>;

export async function saveAbandonedCartRemote(cart: CartDraft): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await setDoc(doc(db, 'abandonedCarts', cart.phoneKey), { ...stripUndefined(cart), updatedAt: serverTimestamp() });
}

export function subscribeAbandonedCarts(
  onChange: (list: AbandonedCart[]) => void,
  onError?: (e: Error) => void
): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(
    collection(db, 'abandonedCarts'),
    (snap) =>
      onChange(
        snap.docs
          .map((d) => ({ ...(d.data() as AbandonedCart), updatedAt: tsToIso(d.data().updatedAt) }))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      ),
    (e) => onError?.(e)
  );
}

export async function updateAbandonedCartRemote(phoneKey: string, patch: Partial<AbandonedCart>): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, 'abandonedCarts', phoneKey), stripUndefined(patch) as Record<string, unknown>);
}

export async function deleteAbandonedCartRemote(phoneKey: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, 'abandonedCarts', phoneKey));
}
