import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { DiscountCode } from '../types';
import { formatPKR, stripUndefined } from '../utils/helpers';

const COLLECTION = 'discounts';
// Demo mode (no Firebase): codes live on this device only.
const LOCAL_KEY = 'apna_laptop_discounts_v1';

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, '');

/** "5% off" / "Rs. 2,000 off" (+ minimum spend when there is one). */
export const discountLabel = (d: Pick<DiscountCode, 'type' | 'value' | 'minSpend'>, withMinSpend = true) => {
  const off = d.type === 'percent' ? `${d.value}% off` : `${formatPKR(d.value)} off`;
  return withMinSpend && d.minSpend > 0 ? `${off} on orders over ${formatPKR(d.minSpend)}` : off;
};

/** Why a code can't be used right now (null = usable). */
export const discountProblem = (d: DiscountCode | null): string | null => {
  if (!d || !d.active) return 'Invalid discount code.';
  if (d.expiresAt && new Date(d.expiresAt).getTime() < Date.now()) return 'This code has expired.';
  if (d.usageLimit && d.usedCount >= d.usageLimit) return 'This code has reached its usage limit.';
  return null;
};

/** Rupees off for a subtotal. Zero while the bag is under the minimum spend,
 * so a discount stops applying if items are removed later. */
export const discountAmountFor = (d: DiscountCode | null, subtotal: number): number => {
  if (!d || subtotal <= 0 || subtotal < (d.minSpend || 0)) return 0;
  const amount = d.type === 'percent' ? Math.round((subtotal * d.value) / 100) : d.value;
  return Math.max(0, Math.min(amount, subtotal));
};

const readLocal = (): DiscountCode[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
};
const writeLocal = (list: DiscountCode[]) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('apna-discounts-changed'));
};
const subscribeLocal = (onChange: (list: DiscountCode[]) => void) => {
  const emit = () => onChange(readLocal());
  emit();
  window.addEventListener('apna-discounts-changed', emit);
  return () => window.removeEventListener('apna-discounts-changed', emit);
};

/** Customers can only read the exact code they type, never the full list. */
export async function getDiscount(code: string): Promise<DiscountCode | null> {
  const id = normalizeCode(code);
  if (!id) return null;
  if (!isFirebaseConfigured || !db) return readLocal().find((d) => d.code === id) || null;
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  return snapshot.exists() ? (snapshot.data() as DiscountCode) : null;
}

/** The advertised code (rules allow listing only documents with featured == true). */
export function subscribeFeaturedDiscount(onChange: (d: DiscountCode | null) => void): () => void {
  const pick = (list: DiscountCode[]) => onChange(list.find((d) => d.featured && !discountProblem(d)) || null);
  if (!isFirebaseConfigured || !db) return subscribeLocal(pick);
  return onSnapshot(
    query(collection(db, COLLECTION), where('featured', '==', true)),
    (snapshot) => pick(snapshot.docs.map((d) => d.data() as DiscountCode)),
    () => onChange(null)
  );
}

/** Admin only. */
export function subscribeAllDiscounts(
  onChange: (list: DiscountCode[]) => void,
  onError?: (e: Error) => void
): () => void {
  if (!isFirebaseConfigured || !db) return subscribeLocal(onChange);
  return onSnapshot(
    collection(db, COLLECTION),
    (snapshot) => onChange(snapshot.docs.map((d) => d.data() as DiscountCode)),
    (e) => onError?.(e)
  );
}

export async function saveDiscount(d: DiscountCode): Promise<void> {
  const clean = { ...d, code: normalizeCode(d.code) };
  if (!isFirebaseConfigured || !db) {
    writeLocal([...readLocal().filter((x) => x.code !== clean.code), clean]);
    return;
  }
  await setDoc(doc(db, COLLECTION, clean.code), stripUndefined(clean));
}

export async function deleteDiscount(code: string): Promise<void> {
  const id = normalizeCode(code);
  if (!isFirebaseConfigured || !db) {
    writeLocal(readLocal().filter((x) => x.code !== id));
    return;
  }
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Called after an order uses a code (rules only allow +1 on usedCount). */
export async function incrementDiscountUsage(code: string): Promise<void> {
  const id = normalizeCode(code);
  if (!isFirebaseConfigured || !db) {
    writeLocal(readLocal().map((x) => (x.code === id ? { ...x, usedCount: x.usedCount + 1 } : x)));
    return;
  }
  await updateDoc(doc(db, COLLECTION, id), { usedCount: increment(1) });
}
