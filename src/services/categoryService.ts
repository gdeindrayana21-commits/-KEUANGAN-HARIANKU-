import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  db,
  safeGetDocs,
  safeWrite,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { Category, CategoryType } from '../types';

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Gaji', icon: 'Briefcase' },
  { name: 'Honor', icon: 'Award' },
  { name: 'Bonus', icon: 'Gift' },
  { name: 'Usaha', icon: 'TrendingUp' },
  { name: 'Penjualan', icon: 'ShoppingBag' },
  { name: 'Hadiah', icon: 'Smile' },
  { name: 'Lainnya', icon: 'CircleEllipsis' },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Makanan', icon: 'Utensils' },
  { name: 'Transportasi', icon: 'Car' },
  { name: 'Belanja', icon: 'ShoppingCart' },
  { name: 'Rumah', icon: 'Home' },
  { name: 'Pendidikan', icon: 'GraduationCap' },
  { name: 'Kesehatan', icon: 'HeartPulse' },
  { name: 'Hiburan', icon: 'Film' },
  { name: 'Pulsa & Internet', icon: 'Wifi' },
  { name: 'Tagihan', icon: 'Receipt' },
  { name: 'Cicilan', icon: 'CreditCard' },
  { name: 'Sosial', icon: 'Users' },
  { name: 'Lainnya', icon: 'CircleEllipsis' },
];

export function subscribeCategories(
  userId: string,
  onData: (categories: Category[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/categories`;
  const categoriesRef = collection(db, 'users', userId, 'categories');

  const unsubscribe = onSnapshot(
    categoriesRef,
    (snapshot) => {
      const items: Category[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Category, 'id'>),
      }));

      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

export async function seedDefaultCategoriesIfEmpty(userId: string): Promise<void> {
  const path = `users/${userId}/categories`;
  const seedKey = `keuanganku_seeded_categories_${userId}`;
  try {
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const existingSnap = await safeGetDocs(categoriesRef);
    if (existingSnap && !existingSnap.empty) {
      try {
        localStorage.setItem(seedKey, '1');
      } catch {
        // Ignore storage error
      }
      return;
    }

    if (localStorage.getItem(seedKey) === '1') {
      return;
    }

    const now = new Date().toISOString();
    const batchPromises: Promise<void>[] = [];

    for (let i = 0; i < DEFAULT_INCOME_CATEGORIES.length; i++) {
      const cat = DEFAULT_INCOME_CATEGORIES[i];
      const docRef = doc(categoriesRef, `inc_${i + 1}`);
      const catData: Category = {
        id: docRef.id,
        userId,
        name: cat.name,
        type: 'income',
        icon: cat.icon,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      batchPromises.push(setDoc(docRef, catData));
    }

    for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
      const cat = DEFAULT_EXPENSE_CATEGORIES[i];
      const docRef = doc(categoriesRef, `exp_${i + 1}`);
      const catData: Category = {
        id: docRef.id,
        userId,
        name: cat.name,
        type: 'expense',
        icon: cat.icon,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      batchPromises.push(setDoc(docRef, catData));
    }

    await safeWrite(Promise.all(batchPromises));
    try {
      localStorage.setItem(seedKey, '1');
    } catch {
      // Ignore storage error
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createCategory(
  userId: string,
  data: { name: string; type: CategoryType; icon?: string }
): Promise<string> {
  const path = `users/${userId}/categories`;
  try {
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const docRef = doc(categoriesRef);
    const now = new Date().toISOString();

    const category: Category = {
      id: docRef.id,
      userId,
      name: data.name.trim(),
      type: data.type,
      icon: data.icon || 'Tag',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await safeWrite(setDoc(docRef, category));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  data: { name: string; icon?: string }
): Promise<void> {
  const path = `users/${userId}/categories/${categoryId}`;
  try {
    const docRef = doc(db, 'users', userId, 'categories', categoryId);
    const now = new Date().toISOString();
    await safeWrite(
      updateDoc(docRef, {
        name: data.name.trim(),
        icon: data.icon || 'Tag',
        updatedAt: now,
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleCategoryActive(
  userId: string,
  categoryId: string,
  isActive: boolean
): Promise<void> {
  const path = `users/${userId}/categories/${categoryId}`;
  try {
    const docRef = doc(db, 'users', userId, 'categories', categoryId);
    await safeWrite(
      updateDoc(docRef, {
        isActive,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  const path = `users/${userId}/categories/${categoryId}`;
  try {
    const txQuery = query(
      collection(db, 'users', userId, 'transactions'),
      where('categoryId', '==', categoryId)
    );
    const txSnap = await safeGetDocs(txQuery);
    if (txSnap && !txSnap.empty) {
      throw new Error(
        `Kategori ini masih digunakan oleh ${txSnap.size} transaksi. Silakan nonaktifkan kategori ini atau ubah transaksi terkait terlebih dahulu.`
      );
    }

    const docRef = doc(db, 'users', userId, 'categories', categoryId);
    await safeWrite(deleteDoc(docRef));
  } catch (error) {
    if (error instanceof Error && error.message.includes('masih digunakan')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
