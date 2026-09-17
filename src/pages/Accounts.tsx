import React, { useState } from 'react';
import { Plus, Wallet, Edit2, Trash2, Power, RefreshCw, AlertCircle } from 'lucide-react';
import { Account, AccountType } from '../types';
import { formatRupiah } from '../utils/currency';
import { AccountForm } from '../components/AccountForm';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface AccountsPageProps {
  accounts: Account[];
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
      description: string;
    }
  ) => Promise<void>;
  onToggleAccountActive: (accountId: string, isActive: boolean) => Promise<void>;
  onDeleteAccount: (accountId: string) => Promise<void>;
  onRecalculateAll: () => Promise<void>;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  onCreateAccount,
  onUpdateAccount,
  onToggleAccountActive,
  onDeleteAccount,
  onRecalculateAll,
}) => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [alertError, setAlertError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const totalActiveBalance = accounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
    setAlertError('');
    setSuccessMessage('');
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setIsFormOpen(true);
    setAlertError('');
    setSuccessMessage('');
  };

  const handleFormSubmit = async (data: {
    name: string;
    type: AccountType;
    initialBalance: number;
    description: string;
  }) => {
    if (editingAccount) {
      await onUpdateAccount(editingAccount.id, data);
      setSuccessMessage('Akun keuangan berhasil diperbarui.');
    } else {
      await onCreateAccount(data);
      setSuccessMessage('Akun keuangan baru berhasil ditambahkan.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    try {
      await onDeleteAccount(deletingAccount.id);
      setDeletingAccount(null);
      setSuccessMessage('Akun keuangan berhasil dihapus.');
    } catch (err) {
      setDeletingAccount(null);
      setAlertError(
        err instanceof Error
          ? err.message
          : 'Akun ini masih memiliki transaksi. Nonaktifkan akun atau pindahkan transaksi terlebih dahulu.'
      );
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setAlertError('');
    setSuccessMessage('');
    try {
      await onRecalculateAll();
      setSuccessMessage('Seluruh saldo akun berhasil dihitung ulang dan disinkronkan.');
    } catch (err) {
      setAlertError('Gagal melakukan sinkronisasi saldo.');
    } finally {
      setIsRecalculating(false);
    }
  };

  const getBadgeColor = (type: AccountType) => {
    switch (type) {
      case 'Cash':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Bank':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'E-Wallet':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Total Saldo */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Akun Keuangan
              </h2>
              <p className="text-xs text-slate-500">
                Kelola dompet tunai, rekening bank, dan saldo e-wallet.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline space-x-2">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Total Saldo Seluruh Akun:
            </span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(totalActiveBalance)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-recalculate-all"
            type="button"
            onClick={handleRecalculate}
            disabled={isRecalculating}
            title="Hitung Ulang & Verifikasi Saldo dari Database"
            className="flex items-center space-x-1.5 px-3 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sinkronkan Saldo</span>
          </button>

          <button
            id="btn-add-account-top"
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Akun</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {alertError && (
        <div
          id="alert-account-error"
          className="flex items-start space-x-2.5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{alertError}</div>
          <button
            type="button"
            onClick={() => setAlertError('')}
            className="text-amber-500 hover:text-amber-700 text-xs font-bold"
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
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Accounts List / Cards Grid */}
      {accounts.length === 0 ? (
        <div
          id="empty-accounts-state"
          className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-slate-800">
            Belum ada akun keuangan.
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Tambahkan rekening atau dompet pertama Anda (misalnya Cash atau Rekening Bank) untuk mulai mencatat keuangan.
          </p>
          <button
            id="btn-empty-add-account"
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Akun</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              id={`account-card-${acc.id}`}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                acc.isActive
                  ? 'border-slate-200/80 shadow-xs hover:border-slate-300'
                  : 'border-slate-200/50 bg-slate-50/50 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span
                      className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${getBadgeColor(
                        acc.type
                      )}`}
                    >
                      {acc.type}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">
                      {acc.name}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      acc.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {acc.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                {/* Saldo Saat Ini */}
                <div className="my-3">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">
                    Saldo Terkini
                  </span>
                  <div
                    className={`text-2xl font-bold tracking-tight ${
                      acc.currentBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {formatRupiah(acc.currentBalance)}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Saldo awal: {formatRupiah(acc.initialBalance)}
                  </div>
                </div>

                {acc.description && (
                  <p className="text-xs text-slate-500 italic line-clamp-2 mb-3">
                    {acc.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  id={`btn-toggle-account-${acc.id}`}
                  type="button"
                  onClick={() => onToggleAccountActive(acc.id, !acc.isActive)}
                  title={acc.isActive ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                  className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    acc.isActive
                      ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                      : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{acc.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    id={`btn-edit-account-${acc.id}`}
                    type="button"
                    onClick={() => handleOpenEdit(acc)}
                    title="Edit akun"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`btn-delete-account-${acc.id}`}
                    type="button"
                    onClick={() => setDeletingAccount(acc)}
                    title="Hapus akun"
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account Modal Form */}
      <AccountForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingAccount}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingAccount}
        title="Hapus Akun Keuangan?"
        message={`Apakah Anda yakin ingin menghapus akun "${deletingAccount?.name}"? Akun yang masih memiliki transaksi tidak dapat dihapus langsung.`}
        confirmText="HAPUS AKUN"
        cancelText="BATAL"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingAccount(null)}
      />
    </div>
  );
};
