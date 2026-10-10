import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, safeWrite, handleFirestoreError, OperationType } from './firebase';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '../types';
import { createTransaction } from './transactionService';
import { getTodayString, parseLocalDate, toDateString } from '../utils/date';

export function calculateNextDate(currentDateStr: string, frequency: RecurringFrequency): string {
  const date = parseLocalDate(currentDateStr);
  if (frequency === 'daily') {
    date.setDate(date.getDate() + 1);
  } else if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  }
  return toDateString(date);
}

export function subscribeRecurringTransactions(
  userId: string,
  onData: (items: RecurringTransaction[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/recurringTransactions`;
  const recurRef = collection(db, 'users', userId, 'recurringTransactions');

  const unsubscribe = onSnapshot(
    recurRef,
    (snapshot) => {
      const items: RecurringTransaction[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RecurringTransaction, 'id'>),
      }));

      items.sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.nextExecutionDate.localeCompare(b.nextExecutionDate);
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

export async function createRecurringTransaction(
  userId: string,
  data: {
    title?: string;
    type: TransactionType;
    amount: number;
    categoryId?: string;
    categoryName?: string;
    accountId: string;
    accountName: string;
    toAccountId?: string;
    toAccountName?: string;
    frequency: RecurringFrequency;
    startDate?: string;
    nextExecutionDate: string;
    autoExecute?: boolean;
    isActive?: boolean;
    description?: string;
  }
): Promise<string> {
  const path = `users/${userId}/recurringTransactions`;
  try {
    const recurRef = collection(db, 'users', userId, 'recurringTransactions');
    const docRef = doc(recurRef);
    const now = new Date().toISOString();
    const cleanAmount = Math.round(Math.abs(Number(data.amount)));

    if (cleanAmount <= 0) {
      throw new Error('Nominal transaksi harus lebih dari 0.');
    }

    const defaultTitle =
      data.title?.trim() || data.description?.trim() || data.categoryName || 'Transaksi Rutin';

    const item: RecurringTransaction = {
      id: docRef.id,
      userId,
      title: defaultTitle,
      type: data.type,
      amount: cleanAmount,
      categoryId: data.categoryId || '',
      categoryName: data.categoryName || '',
      accountId: data.accountId,
      accountName: data.accountName,
      toAccountId: data.toAccountId || '',
      toAccountName: data.toAccountName || '',
      frequency: data.frequency,
      startDate: data.startDate || data.nextExecutionDate,
      nextExecutionDate: data.nextExecutionDate,
      autoExecute: !!data.autoExecute,
      isActive: data.isActive !== undefined ? data.isActive : true,
      description: data.description?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    await safeWrite(setDoc(docRef, item));
    return docRef.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominal transaksi')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export async function updateRecurringTransaction(
  userId: string,
  recurringId: string,
  data: {
    title?: string;
    type?: TransactionType;
    amount?: number;
    categoryId?: string;
    categoryName?: string;
    accountId?: string;
    accountName?: string;
    toAccountId?: string;
    toAccountName?: string;
    frequency?: RecurringFrequency;
    startDate?: string;
    nextExecutionDate?: string;
    autoExecute?: boolean;
    isActive?: boolean;
    description?: string;
  }
): Promise<void> {
  const path = `users/${userId}/recurringTransactions/${recurringId}`;
  try {
    const docRef = doc(db, 'users', userId, 'recurringTransactions', recurringId);
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      updatedAt: now,
    };
    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.amount !== undefined) {
      const cleanAmount = Math.round(Math.abs(Number(data.amount)));
      if (cleanAmount <= 0) throw new Error('Nominal transaksi harus lebih dari 0.');
      updatePayload.amount = cleanAmount;
    }
    if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId;
    if (data.categoryName !== undefined) updatePayload.categoryName = data.categoryName;
    if (data.accountId !== undefined) updatePayload.accountId = data.accountId;
    if (data.accountName !== undefined) updatePayload.accountName = data.accountName;
    if (data.toAccountId !== undefined) updatePayload.toAccountId = data.toAccountId;
    if (data.toAccountName !== undefined) updatePayload.toAccountName = data.toAccountName;
    if (data.frequency !== undefined) updatePayload.frequency = data.frequency;
    if (data.startDate !== undefined) updatePayload.startDate = data.startDate;
    if (data.nextExecutionDate !== undefined)
      updatePayload.nextExecutionDate = data.nextExecutionDate;
    if (data.autoExecute !== undefined) updatePayload.autoExecute = !!data.autoExecute;
    if (data.isActive !== undefined) updatePayload.isActive = !!data.isActive;
    if (data.description !== undefined) updatePayload.description = data.description.trim();

    await safeWrite(updateDoc(docRef, updatePayload));
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominal transaksi')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleRecurringActive(
  userId: string,
  recurringId: string,
  isActive: boolean
): Promise<void> {
  const path = `users/${userId}/recurringTransactions/${recurringId}`;
  try {
    const docRef = doc(db, 'users', userId, 'recurringTransactions', recurringId);
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

export async function executeRecurringTransaction(
  userId: string,
  recurring: RecurringTransaction
): Promise<void> {
  const path = `users/${userId}/recurringTransactions/${recurring.id}`;
  try {
    const now = new Date();
    const executionDate = recurring.nextExecutionDate || getTodayString();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    await createTransaction(userId, {
      type: recurring.type,
      amount: recurring.amount,
      categoryId: recurring.categoryId,
      categoryName: recurring.categoryName,
      accountId: recurring.accountId,
      accountName: recurring.accountName,
      toAccountId: recurring.toAccountId,
      toAccountName: recurring.toAccountName,
      date: executionDate,
      time: timeStr,
      description: `[Rutin] ${recurring.title}${
        recurring.description ? ' - ' + recurring.description : ''
      }`,
    });

    const nextDate = calculateNextDate(executionDate, recurring.frequency);
    const docRef = doc(db, 'users', userId, 'recurringTransactions', recurring.id);
    await safeWrite(
      updateDoc(docRef, {
        lastExecutedDate: executionDate,
        nextExecutionDate: nextDate,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRecurringTransaction(
  userId: string,
  recurringId: string
): Promise<void> {
  const path = `users/${userId}/recurringTransactions/${recurringId}`;
  try {
    const docRef = doc(db, 'users', userId, 'recurringTransactions', recurringId);
    await safeWrite(deleteDoc(docRef));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
