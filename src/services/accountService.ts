import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Account, AccountType, Transaction } from '../types';
import { calculateAccountBalance } from '../utils/calculations';

export function subscribeAccounts(
  userId: string,
  onData: (accounts: Account[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/accounts`;
  const accountsRef = collection(db, 'users', userId, 'accounts');

  const unsubscribe = onSnapshot(
    accountsRef,
    (snapshot) => {
      const items: Account[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Account, 'id'>),
      }));

      // Sort: Active first, then by name
      items.sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

export async function createAccount(
  userId: string,
  data: {
    name: string;
    type: AccountType;
    initialBalance: number;
    description?: string;
  }
): Promise<string> {
  const path = `users/${userId}/accounts`;
  try {
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const docRef = doc(accountsRef);
    const now = new Date().toISOString();
    const initial = Math.round(Number(data.initialBalance) || 0);

    const newAccount: Account = {
      id: docRef.id,
      userId,
      name: data.name.trim(),
      type: data.type,
      initialBalance: initial,
      currentBalance: initial, // Starts equal to initial balance
      description: data.description?.trim() || '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, newAccount);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAccount(
  userId: string,
  accountId: string,
  data: {
    name: string;
    type: AccountType;
    initialBalance: number;
    description?: string;
  }
): Promise<void> {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    const docRef = doc(db, 'users', userId, 'accounts', accountId);
    const now = new Date().toISOString();
    const initial = Math.round(Number(data.initialBalance) || 0);

    await updateDoc(docRef, {
      name: data.name.trim(),
      type: data.type,
      initialBalance: initial,
      description: data.description?.trim() || '',
      updatedAt: now,
    });

    // Recalculate balance because initialBalance might have changed
    await recalculateAccountBalance(userId, accountId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleAccountActive(
  userId: string,
  accountId: string,
  isActive: boolean
): Promise<void> {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    const docRef = doc(db, 'users', userId, 'accounts', accountId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAccount(userId: string, accountId: string): Promise<void> {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    // Check if account has any transactions
    const txQuery = query(
      collection(db, 'users', userId, 'transactions'),
      where('accountId', '==', accountId)
    );
    const txSnap = await getDocs(txQuery);

    if (!txSnap.empty) {
      throw new Error(
        'Akun ini masih memiliki transaksi. Nonaktifkan akun atau pindahkan transaksi terlebih dahulu.'
      );
    }

    const docRef = doc(db, 'users', userId, 'accounts', accountId);
    await deleteDoc(docRef);
  } catch (error) {
    if (error instanceof Error && error.message.includes('masih memiliki transaksi')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Recalculates current balance of a single account safely:
 * initialBalance + (sum of income transactions) - (sum of expense transactions) + (transfers in) - (transfers out)
 */
export async function recalculateAccountBalance(
  userId: string,
  accountId: string
): Promise<number> {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    const accountDocRef = doc(db, 'users', userId, 'accounts', accountId);
    const accountSnap = await getDoc(accountDocRef);
    if (!accountSnap.exists()) return 0;

    const accountData = accountSnap.data() as Account;
    const initialBalance = Math.round(Number(accountData.initialBalance) || 0);

    // Fetch all user transactions to account for income, expense, and transfers
    const txSnap = await getDocs(collection(db, 'users', userId, 'transactions'));
    const allTxs: Transaction[] = txSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Transaction, 'id'>),
    }));

    const newCurrentBalance = calculateAccountBalance(initialBalance, allTxs, accountId);

    await updateDoc(accountDocRef, {
      currentBalance: newCurrentBalance,
      updatedAt: new Date().toISOString(),
    });

    return newCurrentBalance;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Recalculates current balance across all accounts of the user
 */
export async function recalculateAllAccounts(userId: string): Promise<void> {
  const path = `users/${userId}/accounts`;
  try {
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const snap = await getDocs(accountsRef);
    const txSnap = await getDocs(collection(db, 'users', userId, 'transactions'));
    const allTxs: Transaction[] = txSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Transaction, 'id'>),
    }));

    for (const d of snap.docs) {
      const accData = d.data() as Account;
      const initialBalance = Math.round(Number(accData.initialBalance) || 0);
      const newCurrentBalance = calculateAccountBalance(initialBalance, allTxs, d.id);
      await updateDoc(d.ref, {
        currentBalance: newCurrentBalance,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
