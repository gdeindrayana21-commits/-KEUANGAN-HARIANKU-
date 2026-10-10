import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  db,
  safeGetDoc,
  safeWrite,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { Receivable, DebtPayment } from '../types';

export function subscribeReceivables(
  userId: string,
  onData: (receivables: Receivable[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/receivables`;
  const recRef = collection(db, 'users', userId, 'receivables');

  const unsubscribe = onSnapshot(
    recRef,
    (snapshot) => {
      const items: Receivable[] = snapshot.docs.map((d) => ({
        id: d.id,
        payments: [],
        ...(d.data() as Omit<Receivable, 'id'>),
      }));

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

export async function createReceivable(
  userId: string,
  data: {
    personName: string;
    totalAmount: number;
    receivedAmount?: number;
    dueDate: string;
    notes?: string;
  }
): Promise<string> {
  const path = `users/${userId}/receivables`;
  try {
    const recRef = collection(db, 'users', userId, 'receivables');
    const docRef = doc(recRef);
    const now = new Date().toISOString();
    const total = Math.round(Math.abs(Number(data.totalAmount)));
    const received = Math.round(Math.abs(Number(data.receivedAmount || 0)));

    if (total <= 0) {
      throw new Error('Nominal piutang harus lebih dari 0.');
    }

    const status: Receivable['status'] =
      received >= total ? 'paid' : received > 0 ? 'partially_paid' : 'unpaid';

    const newRec: Receivable = {
      id: docRef.id,
      userId,
      personName: data.personName.trim(),
      totalAmount: total,
      receivedAmount: received,
      dueDate: data.dueDate,
      status,
      notes: data.notes?.trim() || '',
      payments:
        received > 0
          ? [
              {
                id: 'init-rcv',
                amount: received,
                date: data.dueDate,
                note: 'Penerimaan awal saat pencatatan',
                createdAt: now,
              },
            ]
          : [],
      createdAt: now,
      updatedAt: now,
    };

    await safeWrite(setDoc(docRef, newRec));
    return docRef.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominal piutang')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export async function updateReceivable(
  userId: string,
  receivableId: string,
  data: {
    personName: string;
    totalAmount: number;
    dueDate: string;
    notes?: string;
  }
): Promise<void> {
  const path = `users/${userId}/receivables/${receivableId}`;
  try {
    const docRef = doc(db, 'users', userId, 'receivables', receivableId);
    const snap = await safeGetDoc(docRef);
    if (!snap || !snap.exists()) return;

    const existing = snap.data() as Receivable;
    const now = new Date().toISOString();
    const total = Math.round(Math.abs(Number(data.totalAmount)));
    const received = existing.receivedAmount || 0;

    if (total <= 0) {
      throw new Error('Nominal piutang harus lebih dari 0.');
    }

    const status: Receivable['status'] =
      received >= total ? 'paid' : received > 0 ? 'partially_paid' : 'unpaid';

    await safeWrite(
      updateDoc(docRef, {
        personName: data.personName.trim(),
        totalAmount: total,
        dueDate: data.dueDate,
        status,
        notes: data.notes?.trim() || '',
        updatedAt: now,
      })
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominal piutang')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addReceivablePayment(
  userId: string,
  receivableId: string,
  paymentData: {
    amount: number;
    date: string;
    note?: string;
    accountId?: string;
    accountName?: string;
  }
): Promise<void> {
  const path = `users/${userId}/receivables/${receivableId}`;
  try {
    const docRef = doc(db, 'users', userId, 'receivables', receivableId);
    const snap = await safeGetDoc(docRef);
    if (!snap || !snap.exists()) return;

    const rec = snap.data() as Receivable;
    const now = new Date().toISOString();
    const payAmt = Math.round(Math.abs(Number(paymentData.amount)));

    if (payAmt <= 0) {
      throw new Error('Nominal penerimaan harus lebih dari 0.');
    }

    const currentPayments = Array.isArray(rec.payments) ? rec.payments : [];
    const newPayment: DebtPayment = {
      id: `rcv-${Date.now()}`,
      amount: payAmt,
      date: paymentData.date,
      note: paymentData.note?.trim() || '',
      accountId: paymentData.accountId,
      accountName: paymentData.accountName,
      createdAt: now,
    };

    const updatedPayments = [...currentPayments, newPayment];
    const newReceivedAmount = updatedPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const newStatus: Receivable['status'] =
      newReceivedAmount >= rec.totalAmount
        ? 'paid'
        : newReceivedAmount > 0
        ? 'partially_paid'
        : 'unpaid';

    await safeWrite(
      updateDoc(docRef, {
        payments: updatedPayments,
        receivedAmount: newReceivedAmount,
        status: newStatus,
        updatedAt: now,
      })
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominal penerimaan')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReceivable(userId: string, receivableId: string): Promise<void> {
  const path = `users/${userId}/receivables/${receivableId}`;
  try {
    const docRef = doc(db, 'users', userId, 'receivables', receivableId);
    await safeWrite(deleteDoc(docRef));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
