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
  safeGetDocs,
  safeWrite,
  handleFirestoreError,
  OperationType,
} from './firebase';
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

      // Sort: Active first, then Cash first, then Bank, then by name
      items.sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        const typeOrder = (t: AccountType) =>
          t === 'Cash' ? 0 : t === 'Bank' ? 1 : t === 'E-Wallet' ? 2 : 3;
        if (typeOrder(a.type) !== typeOrder(b.type)) {
          return typeOrder(a.type) - typeOrder(b.type);
        }
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

export async function seedDefaultAccountsIfEmpty(userId: string): Promise<void> {
  const path = `users/${userId}/accounts`;
  const seedKey = `keuanganku_seeded_accounts_${userId}`;
  try {
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const snap = await safeGetDocs(accountsRef);
    if (snap && !snap.empty) {
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

    const cashRef = doc(accountsRef, 'default_cash');
    const cashAccount: Account = {
      id: cashRef.id,
      userId,
      name: 'Dompet Cash (Tunai)',
      type: 'Cash',
      initialBalance: 0,
      currentBalance: 0,
      description: 'Akun utama uang tunai (Cash) untuk pemasukan & pengeluaran tunai',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const bankRef = doc(accountsRef, 'default_bank');
    const bankAccount: Account = {
      id: bankRef.id,
      userId,
      name: 'Rekening Bank Utama',
      type: 'Bank',
      initialBalance: 0,
      currentBalance: 0,
      description: 'Rekening bank untuk dana masuk, gaji, transferan & pengeluaran bank',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await safeWrite(Promise.all([setDoc(cashRef, cashAccount), setDoc(bankRef, bankAccount)]));
    try {
      localStorage.setItem(seedKey, '1');
    } catch {
      // Ignore storage error
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
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
      currentBalance: initial,
      description: data.description?.trim() || '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await safeWrite(setDoc(docRef, newAccount));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export async function updateAccount(
  userId: string,
  accountId: string,
  data: {
    name: string;
    type: AccountType;
    initialBalance: number;
    targetCurrentBalance?: number;
    description?: string;
  }
): Promise<void> {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    const docRef = doc(db, 'users', userId, 'accounts', accountId);
    const snap = await safeGetDoc(docRef);
    const now = new Date().toISOString();
    let initial = Math.round(Number(data.initialBalance) || 0);

    if (typeof data.targetCurrentBalance === 'number' && snap && snap.exists()) {
      const existingAcc = snap.data() as Account;
      const txSnap = await safeGetDocs(collection(db, 'users', userId, 'transactions'));
      const allTxs: Transaction[] = txSnap
        ? txSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Transaction, 'id'>),
          }))
        : [];
      const netFromTxs = calculateAccountBalance(0, allTxs, accountId);
      const desiredCurrent = Math.round(Number(data.targetCurrentBalance) || 0);
      initial = desiredCurrent - netFromTxs;

      await safeWrite(
        updateDoc(docRef, {
          name: data.name.trim(),
          type: data.type,
          initialBalance: initial,
          currentBalance: desiredCurrent,
          description: data.description?.trim() ?? existingAcc.description ?? '',
          updatedAt: now,
        })
      );
      return;
    }

    await safeWrite(
      updateDoc(docRef, {
        name: data.name.trim(),
        type: data.type,
        initialBalance: initial,
        description: data.description?.trim() || '',
        updatedAt: now,
      })
    );

    await recalculateAccountBalance(userId, accountId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adjustAccountCurrentBalance(
  userId: string,
  accountId: string,
  newCurrentBalance: number,
  note?: string
): Promise<void> {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    const docRef = doc(db, 'users', userId, 'accounts', accountId);
    const snap = await safeGetDoc(docRef);
    if (!snap || !snap.exists()) return;

    const txSnap = await safeGetDocs(collection(db, 'users', userId, 'transactions'));
    const allTxs: Transaction[] = txSnap
      ? txSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, 'id'>),
        }))
      : [];

    const netFromTxs = calculateAccountBalance(0, allTxs, accountId);
    const cleanTarget = Math.round(Number(newCurrentBalance) || 0);
    const adjustedInitial = cleanTarget - netFromTxs;

    await safeWrite(
      updateDoc(docRef, {
        initialBalance: adjustedInitial,
        currentBalance: cleanTarget,
        ...(note ? { description: note.slice(0, 250) } : {}),
        updatedAt: new Date().toISOString(),
      })
    );
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

export async function deleteAccount(
  userId: string,
  accountId: string,
  deleteAssociatedTransactions: boolean = true
): Promise<void> {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    if (deleteAssociatedTransactions) {
      const txSnap = await safeGetDocs(collection(db, 'users', userId, 'transactions'));
      const affectedOtherAccountIds = new Set<string>();

      if (txSnap) {
        const deletePromises: Promise<void>[] = [];
        for (const txDoc of txSnap.docs) {
          const tx = txDoc.data() as Transaction;
          if (tx.accountId === accountId || tx.toAccountId === accountId) {
            if (tx.accountId && tx.accountId !== accountId) {
              affectedOtherAccountIds.add(tx.accountId);
            }
            if (tx.toAccountId && tx.toAccountId !== accountId) {
              affectedOtherAccountIds.add(tx.toAccountId);
            }
            deletePromises.push(safeWrite(deleteDoc(txDoc.ref)));
          }
        }
        await Promise.all(deletePromises);
      }

      for (const otherId of affectedOtherAccountIds) {
        await recalculateAccountBalance(userId, otherId);
      }
    }

    const docRef = doc(db, 'users', userId, 'accounts', accountId);
    await safeWrite(deleteDoc(docRef));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function recalculateAccountBalance(
  userId: string,
  accountId: string
): Promise<number> {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    const accountDocRef = doc(db, 'users', userId, 'accounts', accountId);
    const accountSnap = await safeGetDoc(accountDocRef);
    if (!accountSnap || !accountSnap.exists()) return 0;

    const accountData = accountSnap.data() as Account;
    const initialBalance = Math.round(Number(accountData.initialBalance) || 0);

    const txSnap = await safeGetDocs(collection(db, 'users', userId, 'transactions'));
    const allTxs: Transaction[] = txSnap
      ? txSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, 'id'>),
        }))
      : [];

    const newCurrentBalance = calculateAccountBalance(initialBalance, allTxs, accountId);

    await safeWrite(
      updateDoc(accountDocRef, {
        currentBalance: newCurrentBalance,
        updatedAt: new Date().toISOString(),
      })
    );

    return newCurrentBalance;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return 0;
  }
}

export async function recalculateAllAccounts(userId: string): Promise<void> {
  const path = `users/${userId}/accounts`;
  try {
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const snap = await safeGetDocs(accountsRef);
    if (!snap) return;

    const txSnap = await safeGetDocs(collection(db, 'users', userId, 'transactions'));
    const allTxs: Transaction[] = txSnap
      ? txSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, 'id'>),
        }))
      : [];

    const updates: Promise<void>[] = [];
    for (const d of snap.docs) {
      const accData = d.data() as Account;
      const initialBalance = Math.round(Number(accData.initialBalance) || 0);
      const newCurrentBalance = calculateAccountBalance(initialBalance, allTxs, d.id);
      updates.push(
        safeWrite(
          updateDoc(d.ref, {
            currentBalance: newCurrentBalance,
            updatedAt: new Date().toISOString(),
          })
        )
      );
    }
    await Promise.all(updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
