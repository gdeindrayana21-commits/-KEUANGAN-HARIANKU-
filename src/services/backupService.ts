import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Account,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  Debt,
  Receivable,
  RecurringTransaction,
  BackupData,
} from '../types';
import { recalculateAllAccounts } from './accountService';

export async function exportAllUserData(userId: string): Promise<BackupData> {
  const path = `users/${userId}`;
  try {
    const fetchSubcollection = async <T>(subName: string): Promise<T[]> => {
      const snap = await getDocs(collection(db, 'users', userId, subName));
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
    };

    const [
      accounts,
      categories,
      transactions,
      budgets,
      savingsGoals,
      debts,
      receivables,
      recurringTransactions,
    ] = await Promise.all([
      fetchSubcollection<Account>('accounts'),
      fetchSubcollection<Category>('categories'),
      fetchSubcollection<Transaction>('transactions'),
      fetchSubcollection<Budget>('budgets'),
      fetchSubcollection<SavingsGoal>('savingsGoals'),
      fetchSubcollection<Debt>('debts'),
      fetchSubcollection<Receivable>('receivables'),
      fetchSubcollection<RecurringTransaction>('recurringTransactions'),
    ]);

    const backupData: BackupData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      appName: 'Keuangan Harianku',
      userId,
      data: {
        accounts,
        categories,
        transactions,
        budgets,
        savingsGoals,
        debts,
        receivables,
        recurringTransactions,
      },
    };

    return backupData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}

export function downloadBackupJson(backupData: BackupData): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const dateStr = new Date().toISOString().slice(0, 10);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `backup_keuangan_harianku_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export interface RestorePreview {
  valid: boolean;
  version: string;
  exportedAt: string;
  counts: {
    accounts: number;
    categories: number;
    transactions: number;
    budgets: number;
    savingsGoals: number;
    debts: number;
    receivables: number;
    recurringTransactions: number;
  };
  error?: string;
  rawBackup?: BackupData;
}

export function validateBackupFile(fileContent: string): RestorePreview {
  try {
    const parsed = JSON.parse(fileContent) as Partial<BackupData>;
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, version: '', exportedAt: '', counts: { accounts: 0, categories: 0, transactions: 0, budgets: 0, savingsGoals: 0, debts: 0, receivables: 0, recurringTransactions: 0 }, error: 'Format file tidak valid (bukan JSON objek).' };
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      return { valid: false, version: parsed.version || '', exportedAt: '', counts: { accounts: 0, categories: 0, transactions: 0, budgets: 0, savingsGoals: 0, debts: 0, receivables: 0, recurringTransactions: 0 }, error: 'Struktur data cadangan tidak ditemukan.' };
    }

    const { data } = parsed;
    const counts = {
      accounts: Array.isArray(data.accounts) ? data.accounts.length : 0,
      categories: Array.isArray(data.categories) ? data.categories.length : 0,
      transactions: Array.isArray(data.transactions) ? data.transactions.length : 0,
      budgets: Array.isArray(data.budgets) ? data.budgets.length : 0,
      savingsGoals: Array.isArray(data.savingsGoals) ? data.savingsGoals.length : 0,
      debts: Array.isArray(data.debts) ? data.debts.length : 0,
      receivables: Array.isArray(data.receivables) ? data.receivables.length : 0,
      recurringTransactions: Array.isArray(data.recurringTransactions) ? data.recurringTransactions.length : 0,
    };

    return {
      valid: true,
      version: parsed.version || '1.0',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      counts,
      rawBackup: parsed as BackupData,
    };
  } catch (err) {
    return {
      valid: false,
      version: '',
      exportedAt: '',
      counts: { accounts: 0, categories: 0, transactions: 0, budgets: 0, savingsGoals: 0, debts: 0, receivables: 0, recurringTransactions: 0 },
      error: 'Gagal membaca file JSON. Pastikan file tidak rusak.',
    };
  }
}

export async function restoreUserData(
  userId: string,
  backup: BackupData,
  mode: 'merge' | 'replace' = 'merge'
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const collectionsToProcess = [
      { name: 'accounts', items: backup.data.accounts || [] },
      { name: 'categories', items: backup.data.categories || [] },
      { name: 'transactions', items: backup.data.transactions || [] },
      { name: 'budgets', items: backup.data.budgets || [] },
      { name: 'savingsGoals', items: backup.data.savingsGoals || [] },
      { name: 'debts', items: backup.data.debts || [] },
      { name: 'receivables', items: backup.data.receivables || [] },
      { name: 'recurringTransactions', items: backup.data.recurringTransactions || [] },
    ];

    // If replace mode, first clear existing documents in subcollections
    if (mode === 'replace') {
      for (const col of collectionsToProcess) {
        const snap = await getDocs(collection(db, 'users', userId, col.name));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      }
    }

    // Write / Merge items with user's current userId
    for (const col of collectionsToProcess) {
      for (const item of col.items) {
        if (!item.id) continue;
        const cleanItem = {
          ...item,
          userId, // ensure user isolation matches currently logged in user
        };
        const docRef = doc(db, 'users', userId, col.name, item.id);
        await setDoc(docRef, cleanItem, { merge: true });
      }
    }

    // Recalculate balances after all accounts and transactions are restored
    await recalculateAllAccounts(userId);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export const exportAllData = exportAllUserData;

export async function restoreAllData(
  userId: string,
  backup: BackupData,
  mode: 'merge' | 'overwrite' = 'merge'
): Promise<void> {
  return restoreUserData(userId, backup, mode === 'overwrite' ? 'replace' : 'merge');
}
