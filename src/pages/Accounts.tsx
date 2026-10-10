import React, { useState } from 'react';
import {
  Plus,
  Wallet,
  Landmark,
  Banknote,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { Account, AccountType, Transaction } from '../types';
import { formatRupiah } from '../utils/currency';
import { AccountForm } from '../components/AccountForm';
import { BankTopUpModal } from '../components/BankTopUpModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface AccountsPageProps {
  accounts: Account[];
  transactions?: Transaction[];
  onCreateAccount: (data: {
    name: string;
    type: AccountType;
    initialBalance: number;
    description: string;
  }) => Promise<void>;
  onUpdateAccount: (
    accountId: string,
    data: {
      name: string;
      type: AccountType;
      initialBalance: number;
      targetCurrentBalance?: number;
      description: string;
    }
  ) => Promise<void>;
  onRecordBankIncome?: (data: {
    accountId: string;
    accountName: string;
    amount: number;
    sourceLabel: string;
    date: string;
    description: string;
  }) => Promise<void>;
  onDirectAdjustBalance?: (
    accountId: string,
    newCurrentBalance: number,
    note: string
  ) => Promise<void>;
  onToggleAccountActive: (accountId: string, isActive: boolean) => Promise<void>;
  onDeleteAccount: (accountId: string) => Promise<void>;
  onRecalculateAll: () => Promise<void>;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  transactions = [],
  onCreateAccount,
  onUpdateAccount,
  onRecordBankIncome,
  onDirectAdjustBalance,
  onToggleAccountActive,
  onDeleteAccount,
  onRecalculateAll,
}) => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [defaultFormType, setDefaultFormType] = useState<AccountType>('Cash');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [topUpBankAccount, setTopUpBankAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [alertError, setAlertError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Separate Cash vs Bank accounts clearly
  const cashAccounts = accounts.filter((a) => a.type === 'Cash');
  const bankAccounts = accounts.filter((a) => a.type !== 'Cash');

  const totalCashBalance = cashAccounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalBankBalance = bankAccounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalActiveBalance = totalCashBalance + totalBankBalance;

  const handleOpenCreate = (preferredType: AccountType = 'Cash') => {
    setEditingAccount(null);
    setDefaultFormType(preferredType);
    setIsFormOpen(true);
    setAlertError('');
    setSuccessMessage('');
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setDefaultFormType(acc.type);
    setIsFormOpen(true);
    setAlertError('');
    setSuccessMessage('');
  };

  const handleFormSubmit = async (data: {
    name: string;
    type: AccountType;
    initialBalance: number;
    targetCurrentBalance?: number;
    description: string;
  }) => {
    if (editingAccount) {
      await onUpdateAccount(editingAccount.id, data);
      setSuccessMessage(`Akun "${data.name}" berhasil diperbarui.`);
    } else {
      await onCreateAccount(data);
      setSuccessMessage(`Akun "${data.name}" (${data.type}) berhasil ditambahkan.`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);
    setAlertError('');
    try {
      const deletedName = deletingAccount.name;
      await onDeleteAccount(deletingAccount.id);
      setDeletingAccount(null);
      setSuccessMessage(`Akun "${deletedName}" beserta riwayat terkait berhasil dihapus.`);
    } catch (err) {
      setDeletingAccount(null);
      setAlertError(
        err instanceof Error ? err.message : 'Gagal menghapus akun keuangan.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setAlertError('');
    setSuccessMessage('');
    try {
      await onRecalculateAll();
      setSuccessMessage('Seluruh saldo Akun Cash dan Rekening Bank berhasil disinkronkan.');
    } catch {
      setAlertError('Gagal melakukan sinkronisasi saldo.');
    } finally {
      setIsRecalculating(false);
    }
  };

  const getAccountStats = (accountId: string) => {
    let income = 0;
    let expense = 0;
    let count = 0;
    for (const tx of transactions) {
      if (tx.accountId === accountId) {
        count++;
        if (tx.type === 'income') income += tx.amount;
        else if (tx.type === 'expense') expense += tx.amount;
        else if (tx.type === 'transfer') expense += tx.amount;
      } else if (tx.toAccountId === accountId && tx.type === 'transfer') {
        count++;
        income += tx.amount;
      }
    }
    return { income, expense, count };
  };

  const renderAccountCard = (acc: Account) => {
    const isBank = acc.type !== 'Cash';
    const stats = getAccountStats(acc.id);

    return (
      <div
        key={acc.id}
        id={`account-card-${acc.id}`}
        className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
          acc.isActive
            ? isBank
              ? 'border-blue-200/90 shadow-xs hover:border-blue-300'
              : 'border-emerald-200/90 shadow-xs hover:border-emerald-300'
            : 'border-slate-200/60 bg-slate-50/60 opacity-75'
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isBank
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {isBank ? (
                  <Landmark className="w-5 h-5" />
                ) : (
                  <Banknote className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <span
                    className={`font-semibold ${
                      isBank ? 'text-blue-700' : 'text-emerald-700'
                    }`}
                  >
                    {isBank ? 'Rekening Bank' : 'Akun Cash (Tunai)'}
                  </span>
                  <span>·</span>
                  <span>{acc.isActive ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {acc.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Saldo Saat Ini */}
          <div
            className={`my-3 p-3.5 rounded-xl border ${
              isBank
                ? 'bg-blue-50/40 border-blue-100'
                : 'bg-emerald-50/40 border-emerald-100'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-500 block">
              {isBank ? 'Saldo Rekening Bank Saat Ini' : 'Saldo Uang Tunai (Cash) Saat Ini'}
            </span>
            <div
              className={`text-2xl font-bold tracking-tight tabular-nums mt-0.5 ${
                acc.currentBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatRupiah(acc.currentBalance)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60 tabular-nums">
              <span>Masuk: +{formatRupiah(stats.income)}</span>
              <span>Keluar: -{formatRupiah(stats.expense)}</span>
            </div>
          </div>

          {/* Info Behavior */}
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
            {isBank
              ? 'Saldo otomatis berkurang saat ada pengeluaran Bank. Klik tombol di bawah setiap ada dana masuk, gaji, atau transferan.'
              : 'Menampung seluruh pemasukan tunai & hanya berkurang saat ada pengeluaran Cash (tidak mengurangi saldo Bank).'}
          </p>

          {acc.description && (
            <p className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg mb-3">
              Catatan: {acc.description}
            </p>
          )}

          {/* Special Quick Button for Bank: Dana Masuk / Gaji / Edit Saldo */}
          {isBank && onRecordBankIncome && onDirectAdjustBalance && (
            <button
              type="button"
              onClick={() => setTopUpBankAccount(acc)}
              className="w-full mb-3 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Dana Masuk / Gaji / Edit Saldo Bank</span>
            </button>
          )}
        </div>

        {/* Action Buttons: Edit, Nonaktifkan, Hapus */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
          <button
            id={`btn-toggle-account-${acc.id}`}
            type="button"
            onClick={() => onToggleAccountActive(acc.id, !acc.isActive)}
            className="flex items-center space-x-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{acc.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
          </button>

          <div className="flex items-center space-x-1.5">
            <button
              id={`btn-edit-account-${acc.id}`}
              type="button"
              onClick={() => handleOpenEdit(acc)}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              id={`btn-delete-account-${acc.id}`}
              type="button"
              onClick={() => setDeletingAccount(acc)}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Ringkasan Terpisah: Saldo Cash vs Saldo Bank */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Manajemen Akun Cash & Rekening Bank
              </h2>
              <p className="text-xs text-slate-500">
                Saldo Akun Cash dan Akun Bank terpisah otomatis sesuai transaksi masing-masing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-recalculate-all"
              type="button"
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span>Sinkronkan Saldo</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreate('Cash')}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Akun Cash</span>
            </button>

            <button
              id="btn-add-account-top"
              type="button"
              onClick={() => handleOpenCreate('Bank')}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Akun Bank</span>
            </button>
          </div>
        </div>

        {/* 3 Comparison Summary Boxes: Cash, Bank, Total */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Total Saldo Akun Cash (Tunai)</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {formatRupiah(totalCashBalance)}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Bertambah saat ada pemasukan & berkurang saat pengeluaran tunai
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80">
            <div className="flex items-center space-x-2 text-blue-800 text-xs font-bold">
              <Landmark className="w-4 h-4 text-blue-600" />
              <span>Total Saldo Rekening Bank</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {formatRupiah(totalBankBalance)}
            </div>
            <p className="text-[11px] text-blue-700 mt-1">
              Berkurang saat transaksi Bank & bisa diedit saat ada gaji/transfer
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center space-x-2 text-slate-700 text-xs font-bold">
              <Wallet className="w-4 h-4 text-slate-500" />
              <span>Total Gabungan (Cash + Bank)</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {formatRupiah(totalActiveBalance)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {cashAccounts.length} Akun Cash · {bankAccounts.length} Rekening Bank
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {alertError && (
        <div
          id="alert-account-error"
          className="flex items-start space-x-2.5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">{alertError}</div>
          <button
            type="button"
            onClick={() => setAlertError('')}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div
          id="alert-account-success"
          className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: AKUN CASH (UANG TUNAI & PEMASUKAN) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              1. Akun Cash / Uang Tunai (Pusat Pemasukan & Kas Harian)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => handleOpenCreate('Cash')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            + Tambah Akun Cash
          </button>
        </div>

        {cashAccounts.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-dashed border-emerald-200 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Belum ada Akun Cash (Tunai)
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Buat Akun Cash untuk menampung seluruh pemasukan tunai dan mencatat pengeluaran uang tunai tanpa memengaruhi saldo Bank Anda.
            </p>
            <button
              type="button"
              onClick={() => handleOpenCreate('Cash')}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Akun Cash Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashAccounts.map(renderAccountCard)}
          </div>
        )}
      </div>

      {/* SECTION 2: REKENING BANK */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              2. Akun Rekening Bank (Gaji, Transferan & Transaksi Bank)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => handleOpenCreate('Bank')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            + Tambah Rekening Bank
          </button>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-dashed border-blue-200 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Belum ada Akun Rekening Bank
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tambahkan rekening bank Anda. Saldo bank otomatis berkurang saat terjadi pengeluaran bank, dan dapat diedit setiap ada gaji atau transferan masuk.
            </p>
            <button
              type="button"
              onClick={() => handleOpenCreate('Bank')}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Rekening Bank Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(renderAccountCard)}
          </div>
        )}
      </div>

      {/* Account Modal Form */}
      <AccountForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingAccount}
        defaultType={defaultFormType}
        onSubmit={handleFormSubmit}
      />

      {/* Bank Top-Up / Salary / Balance Edit Modal */}
      {onRecordBankIncome && onDirectAdjustBalance && (
        <BankTopUpModal
          isOpen={!!topUpBankAccount}
          account={topUpBankAccount}
          onClose={() => setTopUpBankAccount(null)}
          onRecordBankIncome={async (payload) => {
            await onRecordBankIncome(payload);
            setSuccessMessage(
              `Dana masuk (${payload.sourceLabel}) sebesar ${formatRupiah(payload.amount)} berhasil ditambahkan ke ${payload.accountName}.`
            );
          }}
          onDirectAdjustBalance={async (accountId, newBalance, note) => {
            await onDirectAdjustBalance(accountId, newBalance, note);
            setSuccessMessage(
              `Saldo rekening bank berhasil diperbarui menjadi ${formatRupiah(newBalance)}.`
            );
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingAccount}
        title="Hapus Akun Keuangan?"
        message={`Apakah Anda yakin ingin menghapus akun "${deletingAccount?.name}" (${deletingAccount?.type})? Akun ini beserta riwayat transaksinya akan dihapus secara permanen.`}
        confirmText="HAPUS AKUN"
        cancelText="BATAL"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingAccount(null)}
      />
    </div>
  );
};
