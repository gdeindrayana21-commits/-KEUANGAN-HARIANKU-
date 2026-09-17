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
import { Debt, DebtPayment } from '../types';

export function subscribeDebts(
  userId: string,
  onData: (debts: Debt[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/debts`;
  const debtsRef = collection(db, 'users', userId, 'debts');

  const unsubscribe = onSnapshot(
    debtsRef,
    (snapshot) => {
      const items: Debt[] = snapshot.docs.map((d) => ({
        id: d.id,
        payments: [],
        ...(d.data() as Omit<Debt, 'id'>),
      }));

      // Sort: unpaid / partially_paid first, then by dueDate
      items.sort((a, b) => {
        if (a.status === 'paid' && b.status !== 'paid') return 1;
        if (a.status !== 'paid' && b.status === 'paid') return -1;
        return a.dueDate.localeCompare(b.dueDate);
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

export async function createDebt(
  userId: string,
  data: {
    personName: string;
    totalAmount: number;
    paidAmount?: number;
    dueDate: string;
    notes?: string;
  }
): Promise<string> {
  const path = `users/${userId}/debts`;
  try {
    const debtsRef = collection(db, 'users', userId, 'debts');
    const docRef = doc(debtsRef);
    const now = new Date().toISOString();
    const total = Math.round(Math.abs(Number(data.totalAmount)));
    const paid = Math.round(Math.abs(Number(data.paidAmount || 0)));

    if (total <= 0) {
      throw new Error('Nominal hutang harus lebih dari 0.');
    }

    const status: Debt['status'] =
      paid >= total ? 'paid' : paid > 0 ? 'partially_paid' : 'unpaid';

    const newDebt: Debt = {
      id: docRef.id,
      userId,
      personName: data.personName.trim(),
      totalAmount: total,
      paidAmount: paid,
      dueDate: data.dueDate,
      status,
      notes: data.notes?.trim() || '',
      payments: paid > 0 ? [{
        id: 'init-pay',
        amount: paid,
        date: data.dueDate,
        note: 'Pembayaran awal saat pencatatan',
        createdAt: now,
      }] : [],
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, newDebt);
    return docRef.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominal hutang')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDebt(
  userId: string,
  debtId: string,
  data: {
    personName: string;
    totalAmount: number;
    dueDate: string;
    notes?: string;
  }
): Promise<void> {
  const path = `users/${userId}/debts/${debtId}`;
  try {
    const docRef = doc(db, 'users', userId, 'debts', debtId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const existing = snap.data() as Debt;
    const now = new Date().toISOString();
    const total = Math.round(Math.abs(Number(data.totalAmount)));
    const paid = existing.paidAmount || 0;

    if (total <= 0) {
      throw new Error('Nominal hutang harus lebih dari 0.');
    }

    const status: Debt['status'] =
      paid >= total ? 'paid' : paid > 0 ? 'partially_paid' : 'unpaid';

    await updateDoc(docRef, {
      personName: data.personName.trim(),
      totalAmount: total,
      dueDate: data.dueDate,
      status,
      notes: data.notes?.trim() || '',
      updatedAt: now,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominal hutang')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addDebtPayment(
  userId: string,
  debtId: string,
  paymentData: {
    amount: number;
    date: string;
    note?: string;
    accountId?: string;
    accountName?: string;
  }
): Promise<void> {
  const path = `users/${userId}/debts/${debtId}`;
  try {
    const docRef = doc(db, 'users', userId, 'debts', debtId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const debt = snap.data() as Debt;
    const now = new Date().toISOString();
    const payAmt = Math.round(Math.abs(Number(paymentData.amount)));

    if (payAmt <= 0) {
      throw new Error('Nominal pembayaran harus lebih dari 0.');
    }

    const currentPayments = Array.isArray(debt.payments) ? debt.payments : [];
    const newPayment: DebtPayment = {
      id: `pay-${Date.now()}`,
      amount: payAmt,
      date: paymentData.date,
      note: paymentData.note?.trim() || '',
      accountId: paymentData.accountId,
      accountName: paymentData.accountName,
      createdAt: now,
    };

    const updatedPayments = [...currentPayments, newPayment];
    const newPaidAmount = updatedPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const newStatus: Debt['status'] =
      newPaidAmount >= debt.totalAmount ? 'paid' : newPaidAmount > 0 ? 'partially_paid' : 'unpaid';

    await updateDoc(docRef, {
      payments: updatedPayments,
      paidAmount: newPaidAmount,
      status: newStatus,
      updatedAt: now,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominal pembayaran')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDebt(userId: string, debtId: string): Promise<void> {
  const path = `users/${userId}/debts/${debtId}`;
  try {
    const docRef = doc(db, 'users', userId, 'debts', debtId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
