import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from '../types';

export function getIndonesianAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Terjadi kendala autentikasi. Silakan coba lagi.';
  const message = error.message;

  if (message.includes('auth/popup-closed-by-user')) {
    return 'Jendela masuk Google ditutup sebelum proses selesai. Silakan klik "Masuk dengan Google" kembali.';
  }
  if (message.includes('auth/popup-blocked')) {
    return 'Jendela pop-up Google diblokir oleh browser. Izinkan jendela pop-up untuk situs ini lalu coba lagi.';
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
    return 'Email atau password tidak sesuai.';
  }
  if (message.includes('auth/email-already-in-use')) {
    return 'Email ini sudah terdaftar. Silakan gunakan Masuk dengan Google atau email lain.';
  }
  if (message.includes('auth/weak-password')) {
    return 'Kata sandi terlalu singkat (minimal 6 karakter).';
  }
  if (message.includes('auth/invalid-email')) {
    return 'Format alamat email tidak valid.';
  }
  if (message.includes('auth/operation-not-allowed')) {
    return 'Metode login Email/Sandi belum diaktifkan di Firebase Console. Silakan gunakan tombol "Masuk dengan Google" yang sudah aktif dan siap digunakan.';
  }
  if (message.includes('network-request-failed')) {
    return 'Koneksi internet bermasalah. Periksa jaringan Anda dan coba lagi.';
  }

  return 'Gagal melakukan otentikasi. Silakan gunakan tombol Masuk dengan Google.';
}

export async function syncUserProfile(user: FirebaseUser, overrideName?: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  try {
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        name: overrideName || user.displayName || user.email?.split('@')[0] || 'Pengguna',
        email: user.email || '',
        photoURL: user.photoURL || '',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userDocRef, {
        ...newProfile,
        serverCreatedAt: serverTimestamp(),
      });
      return newProfile;
    } else {
      const data = snap.data() as UserProfile;
      return data;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return await syncUserProfile(credential.user);
}

export async function registerWithEmail(
  email: string,
  password: string,
  name: string
): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) {
    try {
      await updateProfile(credential.user, { displayName: name.trim() });
    } catch (e) {
      console.warn('Could not update profile name', e);
    }
  }
  return await syncUserProfile(credential.user, name.trim());
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  return await syncUserProfile(credential.user);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
