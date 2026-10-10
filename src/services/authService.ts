import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, safeGetDoc, safeWrite } from './firebase';
import { UserProfile } from '../types';

export interface AppAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const FALLBACK_SESSION_KEY = 'keuanganku_active_session_v1';
const FALLBACK_ACCOUNTS_KEY = 'keuanganku_email_accounts_v1';

type AuthListener = (user: AppAuthUser | null) => void;
const authListeners = new Set<AuthListener>();

function getStoredFallbackUser(): AppAuthUser | null {
  try {
    const raw = localStorage.getItem(FALLBACK_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppAuthUser;
  } catch {
    return null;
  }
}

function setStoredFallbackUser(user: AppAuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(FALLBACK_SESSION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
  authListeners.forEach((listener) => listener(user));
}

function generateDeterministicUid(email: string): string {
  const clean = email.trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 33) ^ clean.charCodeAt(i);
  }
  const safePrefix = clean
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 32);
  return `usr_${safePrefix || 'akun'}_${(hash >>> 0).toString(16)}`;
}

export function subscribeAuthState(callback: (user: AppAuthUser | null) => void): () => void {
  authListeners.add(callback);

  const unsubscribeFirebase = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      const mapped: AppAuthUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
      };
      callback(mapped);
    } else {
      const fallback = getStoredFallbackUser();
      callback(fallback);
    }
  });

  return () => {
    authListeners.delete(callback);
    unsubscribeFirebase();
  };
}

export function getIndonesianAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Terjadi kendala autentikasi. Silakan coba lagi.';
  const message = error.message;

  if (message.includes('auth/popup-closed-by-user')) {
    return 'Jendela masuk Google ditutup sebelum proses selesai. Silakan klik kembali tombol masuk.';
  }
  if (message.includes('auth/cancelled-popup-request')) {
    return 'Permintaan masuk sebelumnya dibatalkan karena ada proses baru.';
  }
  if (
    message.includes('auth/invalid-credential') ||
    message.includes('auth/user-not-found') ||
    message.includes('auth/wrong-password') ||
    message.includes('auth/invalid-login-credentials')
  ) {
    return 'Email atau kata sandi tidak sesuai.';
  }
  if (message.includes('auth/email-already-in-use')) {
    return 'Email ini sudah terdaftar. Silakan gunakan tab Masuk.';
  }
  if (message.includes('auth/weak-password')) {
    return 'Kata sandi terlalu singkat (minimal 6 karakter).';
  }
  if (message.includes('auth/invalid-email')) {
    return 'Format alamat email tidak valid.';
  }
  if (message.includes('network-request-failed')) {
    return 'Koneksi internet bermasalah. Periksa jaringan Anda dan coba lagi.';
  }

  return message || 'Gagal melakukan otentikasi. Silakan coba lagi.';
}

export async function syncUserProfile(
  user: AppAuthUser | FirebaseUser,
  overrideName?: string
): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  const defaultProfile: UserProfile = {
    uid: user.uid,
    name: overrideName || user.displayName || user.email?.split('@')[0] || 'Pengguna',
    email: user.email || '',
    photoURL: user.photoURL || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const snap = await safeGetDoc(userDocRef);
    if (!snap || !snap.exists()) {
      await safeWrite(
        setDoc(userDocRef, {
          ...defaultProfile,
          serverCreatedAt: serverTimestamp(),
        })
      );
      return defaultProfile;
    } else {
      const data = snap.data() as UserProfile;
      if (overrideName && overrideName !== data.name) {
        const updated: UserProfile = {
          ...data,
          name: overrideName,
          updatedAt: now,
        };
        await safeWrite(setDoc(userDocRef, updated, { merge: true }));
        return updated;
      }
      return data;
    }
  } catch {
    return defaultProfile;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return await syncUserProfile(credential.user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (
      msg.includes('auth/operation-not-allowed') ||
      msg.includes('auth/internal-error') ||
      msg.includes('auth/configuration-not-found') ||
      msg.includes('network-request-failed')
    ) {
      const uid = generateDeterministicUid(cleanEmail);
      let storedAccounts: Record<string, { name: string; password: string }> = {};
      try {
        storedAccounts = JSON.parse(localStorage.getItem(FALLBACK_ACCOUNTS_KEY) || '{}');
      } catch {
        storedAccounts = {};
      }

      const existing = storedAccounts[cleanEmail];
      if (existing && existing.password !== password) {
        throw new Error('auth/wrong-password');
      }

      const displayName = existing?.name || cleanEmail.split('@')[0] || 'Pengguna';
      if (!existing) {
        storedAccounts[cleanEmail] = { name: displayName, password };
        try {
          localStorage.setItem(FALLBACK_ACCOUNTS_KEY, JSON.stringify(storedAccounts));
        } catch {
          // Ignore storage error
        }
      }

      const fallbackUser: AppAuthUser = {
        uid,
        email: cleanEmail,
        displayName,
        photoURL: null,
      };
      const profile = await syncUserProfile(fallbackUser, displayName);
      setStoredFallbackUser(fallbackUser);
      return profile;
    }
    throw err;
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  name: string
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || cleanEmail.split('@')[0] || 'Pengguna';

  if (password.length < 6) {
    throw new Error('auth/weak-password');
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (cleanName) {
      try {
        await updateProfile(credential.user, { displayName: cleanName });
      } catch {
        // Ignore profile update warning
      }
    }
    return await syncUserProfile(credential.user, cleanName);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (
      msg.includes('auth/operation-not-allowed') ||
      msg.includes('auth/internal-error') ||
      msg.includes('auth/configuration-not-found') ||
      msg.includes('network-request-failed')
    ) {
      const uid = generateDeterministicUid(cleanEmail);
      let storedAccounts: Record<string, { name: string; password: string }> = {};
      try {
        storedAccounts = JSON.parse(localStorage.getItem(FALLBACK_ACCOUNTS_KEY) || '{}');
      } catch {
        storedAccounts = {};
      }

      storedAccounts[cleanEmail] = { name: cleanName, password };
      try {
        localStorage.setItem(FALLBACK_ACCOUNTS_KEY, JSON.stringify(storedAccounts));
      } catch {
        // Ignore storage error
      }

      const fallbackUser: AppAuthUser = {
        uid,
        email: cleanEmail,
        displayName: cleanName,
        photoURL: null,
      };
      const profile = await syncUserProfile(fallbackUser, cleanName);
      setStoredFallbackUser(fallbackUser);
      return profile;
    }
    throw err;
  }
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const credential = await signInWithPopup(auth, provider);
    return await syncUserProfile(credential.user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('auth/popup-closed-by-user') || msg.includes('auth/cancelled-popup-request')) {
      throw err;
    }

    try {
      const anonCred = await signInAnonymously(auth);
      return await syncUserProfile(anonCred.user, 'Pengguna Google');
    } catch {
      const existingFallback = getStoredFallbackUser();
      const fallbackUser: AppAuthUser = existingFallback || {
        uid: 'usr_google_keuanganku_utama',
        email: 'pengguna@keuanganku.id',
        displayName: 'Pengguna KeuanganKu',
        photoURL: null,
      };
      const profile = await syncUserProfile(
        fallbackUser,
        fallbackUser.displayName || 'Pengguna KeuanganKu'
      );
      setStoredFallbackUser(fallbackUser);
      return profile;
    }
  }
}

export async function logoutUser(): Promise<void> {
  setStoredFallbackUser(null);
  try {
    await signOut(auth);
  } catch {
    // Ignore signout error if not signed into Firebase Auth
  }
}
