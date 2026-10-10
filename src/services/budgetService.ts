import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, safeWrite, handleFirestoreError, OperationType } from './firebase';
import { Budget } from '../types';

export function subscribeBudgets(
  userId: string,
  onData: (budgets: Budget[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/budgets`;
  const budgetsRef = collection(db, 'users', userId, 'budgets');

  const unsubscribe = onSnapshot(
    budgetsRef,
    (snapshot) => {
      const items: Budget[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Budget, 'id'>),
      }));

      items.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

export async function createBudget(
  userId: string,
  data: {
    categoryId: string;
    categoryName: string;
    periodMonth: string; // YYYY-MM
    amount: number;
  }
): Promise<string> {
  const path = `users/${userId}/budgets`;
  try {
    const budgetsRef = collection(db, 'users', userId, 'budgets');
    const docRef = doc(budgetsRef);
    const now = new Date().toISOString();
    const cleanAmount = Math.round(Math.abs(Number(data.amount)));

    if (cleanAmount <= 0) {
      throw new Error('Nominal anggaran harus lebih dari 0.');
    }

    const newBudget: Budget = {
      id: docRef.id,
      userId,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      periodMonth: data.periodMonth,
      amount: cleanAmount,
      createdAt: now,
      updatedAt: now,
    };

    await safeWrite(setDoc(docRef, newBudget));
    return docRef.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominal anggaran')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export async function updateBudget(
  userId: string,
  budgetId: string,
  data: {
    categoryId: string;
    categoryName: string;
    periodMonth: string;
    amount: number;
  }
): Promise<void> {
  const path = `users/${userId}/budgets/${budgetId}`;
  try {
    const docRef = doc(db, 'users', userId, 'budgets', budgetId);
    const now = new Date().toISOString();
    const cleanAmount = Math.round(Math.abs(Number(data.amount)));

    if (cleanAmount <= 0) {
      throw new Error('Nominal anggaran harus lebih dari 0.');
    }

    await safeWrite(
      updateDoc(docRef, {
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        periodMonth: data.periodMonth,
        amount: cleanAmount,
        updatedAt: now,
      })
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominal anggaran')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
  const path = `users/${userId}/budgets/${budgetId}`;
  try {
    const docRef = doc(db, 'users', userId, 'budgets', budgetId);
    await safeWrite(deleteDoc(docRef));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
