import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Transaction, TransactionType } from '../types';
import { recalculateAccountBalance } from './accountService';

export function subscribeTransactions(
  userId: string,
  onData: (transactions: Transaction[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/transactions`;
  const txRef = collection(db, 'users', userId, 'transactions');

  const unsubscribe = onSnapshot(
    txRef,
    (snapshot) => {
      const items: Transaction[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Transaction, 'id'>),
      }));

      // Sort descending by date, then by time, then by createdAt
      items.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        const timeCompare = (b.time || '').localeCompare(a.time || '');
        if (timeCompare !== 0) return timeCompare;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
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

export async function createTransaction(
  userId: string,
  data: {
    type: TransactionType;
    amount: number;
    categoryId?: string;
    categoryName?: string;
    accountId: string;
    accountName: string;
    toAccountId?: string;
    toAccountName?: string;
    date: string;
    time: string;
    description?: string;
  }
): Promise<string> {
  const path = `users/${userId}/transactions`;
  try {
    const txRef = collection(db, 'users', userId, 'transactions');
    const docRef = doc(txRef);
    const now = new Date().toISOString();
    const cleanAmount = Math.round(Math.abs(Number(data.amount)));

    if (cleanAmount <= 0) {
      throw new Error('Nominal transaksi harus lebih besar dari 0.');
    }

    if (data.type === 'transfer' && data.accountId === data.toAccountId) {
      throw new Error('Akun tujuan tidak boleh sama dengan akun asal.');
    }

    const newTx: Transaction = {
      id: docRef.id,
      userId,
      type: data.type,
      amount: cleanAmount,
      categoryId: data.categoryId || '',
      categoryName: data.categoryName || '',
      accountId: data.accountId,
      accountName: data.accountName,
      ...(data.toAccountId ? { toAccountId: data.toAccountId } : {}),
      ...(data.toAccountName ? { toAccountName: data.toAccountName } : {}),
      date: data.date,
      time: data.time,
      description: data.description?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, newTx);

    // Automatically recalculate account balance safely
    await recalculateAccountBalance(userId, data.accountId);
    if (data.toAccountId) {
      await recalculateAccountBalance(userId, data.toAccountId);
    }

    return docRef.id;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Nominal transaksi') || error.message.includes('Akun tujuan'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  oldTx: Transaction,
  data: {
    type: TransactionType;
    amount: number;
    categoryId?: string;
    categoryName?: string;
    accountId: string;
    accountName: string;
    toAccountId?: string;
    toAccountName?: string;
    date: string;
    time: string;
    description?: string;
  }
): Promise<void> {
  const path = `users/${userId}/transactions/${transactionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', transactionId);
    const now = new Date().toISOString();
    const cleanAmount = Math.round(Math.abs(Number(data.amount)));

    if (cleanAmount <= 0) {
      throw new Error('Nominal transaksi harus lebih besar dari 0.');
    }

    if (data.type === 'transfer' && data.accountId === data.toAccountId) {
      throw new Error('Akun tujuan tidak boleh sama dengan akun asal.');
    }

    const updatePayload: Record<string, any> = {
      type: data.type,
      amount: cleanAmount,
      categoryId: data.categoryId || '',
      categoryName: data.categoryName || '',
      accountId: data.accountId,
      accountName: data.accountName,
      date: data.date,
      time: data.time,
      description: data.description?.trim() || '',
      updatedAt: now,
    };

    if (data.toAccountId) {
      updatePayload.toAccountId = data.toAccountId;
    }
    if (data.toAccountName) {
      updatePayload.toAccountName = data.toAccountName;
    }

    await updateDoc(docRef, updatePayload);

    // Recalculate new account balances
    await recalculateAccountBalance(userId, data.accountId);
    if (data.toAccountId) {
      await recalculateAccountBalance(userId, data.toAccountId);
    }

    // If account was changed, also recalculate the previous account balance!
    if (oldTx.accountId !== data.accountId) {
      await recalculateAccountBalance(userId, oldTx.accountId);
    }
    if (oldTx.toAccountId && oldTx.toAccountId !== data.toAccountId) {
      await recalculateAccountBalance(userId, oldTx.toAccountId);
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Nominal transaksi') || error.message.includes('Akun tujuan'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTransaction(
  userId: string,
  transactionId: string,
  accountId: string,
  toAccountId?: string
): Promise<void> {
  const path = `users/${userId}/transactions/${transactionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(docRef);

    // Recalculate account balance
    await recalculateAccountBalance(userId, accountId);
    if (toAccountId) {
      await recalculateAccountBalance(userId, toAccountId);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
