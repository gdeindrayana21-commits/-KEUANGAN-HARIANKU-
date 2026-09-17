import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { SavingsGoal } from '../types';

export function subscribeSavingsGoals(
  userId: string,
  onData: (goals: SavingsGoal[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/savingsGoals`;
  const goalsRef = collection(db, 'users', userId, 'savingsGoals');

  const unsubscribe = onSnapshot(
    goalsRef,
    (snapshot) => {
      const items: SavingsGoal[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SavingsGoal, 'id'>),
      }));

      // Sort: in_progress first, then by targetDate ascending
      items.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'in_progress' ? -1 : 1;
        return a.targetDate.localeCompare(b.targetDate);
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

export async function createSavingsGoal(
  userId: string,
  data: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate: string;
    accountId?: string;
    accountName?: string;
    notes?: string;
  }
): Promise<string> {
  const path = `users/${userId}/savingsGoals`;
  try {
    const goalsRef = collection(db, 'users', userId, 'savingsGoals');
    const docRef = doc(goalsRef);
    const now = new Date().toISOString();
    const target = Math.round(Math.abs(Number(data.targetAmount)));
    const current = Math.round(Math.abs(Number(data.currentAmount || 0)));

    if (target <= 0) {
      throw new Error('Target nominal tabungan harus lebih dari 0.');
    }

    const newGoal: SavingsGoal = {
      id: docRef.id,
      userId,
      name: data.name.trim(),
      targetAmount: target,
      currentAmount: current,
      targetDate: data.targetDate,
      accountId: data.accountId || '',
      accountName: data.accountName || '',
      status: current >= target ? 'achieved' : 'in_progress',
      notes: data.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, newGoal);
    return docRef.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Target nominal')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSavingsGoal(
  userId: string,
  goalId: string,
  data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    accountId?: string;
    accountName?: string;
    notes?: string;
  }
): Promise<void> {
  const path = `users/${userId}/savingsGoals/${goalId}`;
  try {
    const docRef = doc(db, 'users', userId, 'savingsGoals', goalId);
    const now = new Date().toISOString();
    const target = Math.round(Math.abs(Number(data.targetAmount)));
    const current = Math.round(Math.abs(Number(data.currentAmount)));

    if (target <= 0) {
      throw new Error('Target nominal tabungan harus lebih dari 0.');
    }

    await updateDoc(docRef, {
      name: data.name.trim(),
      targetAmount: target,
      currentAmount: current,
      targetDate: data.targetDate,
      accountId: data.accountId || '',
      accountName: data.accountName || '',
      status: current >= target ? 'achieved' : 'in_progress',
      notes: data.notes?.trim() || '',
      updatedAt: now,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Target nominal')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adjustSavingsAmount(
  userId: string,
  goalId: string,
  deltaAmount: number
): Promise<void> {
  const path = `users/${userId}/savingsGoals/${goalId}`;
  try {
    const docRef = doc(db, 'users', userId, 'savingsGoals', goalId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data() as SavingsGoal;
    const newAmount = Math.max(0, Math.round(data.currentAmount + deltaAmount));
    const now = new Date().toISOString();

    await updateDoc(docRef, {
      currentAmount: newAmount,
      status: newAmount >= data.targetAmount ? 'achieved' : 'in_progress',
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export const adjustSavingsGoalAmount = adjustSavingsAmount;

export async function deleteSavingsGoal(userId: string, goalId: string): Promise<void> {
  const path = `users/${userId}/savingsGoals/${goalId}`;
  try {
    const docRef = doc(db, 'users', userId, 'savingsGoals', goalId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
