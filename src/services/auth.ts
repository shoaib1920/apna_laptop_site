import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface CustomerProfile {
  name: string;
  phone: string;
  city: string;
  joined_at: string;
}

/** A user is an admin only if a doc exists at admins/{uid} - added manually
 * by the site owner via the Firebase Console, never by the app itself. Falls
 * back to false on any read error (e.g. rules not yet updated to allow this
 * self-check) rather than throwing, so a rules mismatch can't wedge the
 * whole login flow. */
export async function checkIsAdmin(uid: string): Promise<boolean> {
  if (!db) return false;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch (e) {
    console.error('Failed to check admin status:', e);
    return false;
  }
}

export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'customers', uid));
    return snap.exists() ? (snap.data() as CustomerProfile) : null;
  } catch (e) {
    console.error('Failed to load customer profile:', e);
    return null;
  }
}

export async function signUpCustomer(
  email: string,
  password: string,
  name: string,
  phone: string,
  city: string
): Promise<FirebaseUser> {
  if (!auth || !db) throw new Error('Firebase is not configured');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  const profile: CustomerProfile = { name, phone, city, joined_at: new Date().toISOString() };
  await setDoc(doc(db, 'customers', credential.user.uid), profile);
  return credential.user;
}

export async function signInCustomer(email: string, password: string): Promise<FirebaseUser> {
  if (!auth) throw new Error('Firebase is not configured');
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}
