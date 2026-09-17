import React, { useState } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { BackupData, Account, Category, Transaction, Budget, SavingsGoal, Debt, Receivable, RecurringTransaction } from '../types';
import { exportAllData, restoreAllData } from '../services/backupService';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface BackupRestoreProps {
  userId: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  receivables: Receivable[];
  recurringTransactions: RecurringTransaction[];
  onDataRestored?: () => void;
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({
  userId,
  accounts,
  categories,
  transactions,
  budgets,
  savingsGoals,
  debts,
  receivables,
  recurringTransactions,
  onDataRestored,
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [parsedBackup, setParsedBackup] = useState<BackupData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState<boolean>(false);

  // Handle Export to JSON
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const backup = await exportAllData(userId);
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `keuangan_harianku_backup_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage('Data berhasil diexport dan diunduh ke file JSON.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal mengekspor data backup.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Selection for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as BackupData;

        if (!data.version || !data.data) {
          throw new Error('Format file backup tidak valid. Pastikan file berasal dari aplikasi ini.');
        }

        setParsedBackup(data);
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Gagal membaca file JSON backup.'
        );
        setParsedBackup(null);
      }
    };
    reader.readAsText(file);
  };

  // Perform Restore
  const handleConfirmRestore = async () => {
    if (!parsedBackup) return;
    try {
      setIsRestoring(true);
      setErrorMessage(null);
      await restoreAllData(userId, parsedBackup, restoreMode);
      setSuccessMessage(
        `Restorasi data berhasil! Mode: ${
          restoreMode === 'overwrite' ? 'Ganti Total (Overwrite)' : 'Gabung (Merge)'
        }. Data telah tersinkronisasi ke Firestore.`
      );
      setParsedBackup(null);
      setIsConfirmRestoreOpen(false);
      if (onDataRestored) onDataRestored();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal memulihkan data dari backup.'
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Cadangkan & Pulihkan Data (Backup & Restore)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Simpan seluruh data keuangan Anda ke file lokal atau pulihkan data kapan saja dengan aman
        </p>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-sm text-emerald-800 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-sm text-rose-800 font-medium">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Summary of Current Data in Database */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Status Data Saat Ini</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500">Akun Keuangan</span>
            <div className="text-lg font-bold text-slate-900 mt-1">{accounts.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500">Kategori</span>
            <div className="text-lg font-bold text-slate-900 mt-1">{categories.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500">Transaksi</span>
            <div className="text-lg font-bold text-slate-900 mt-1">{transactions.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500">Anggaran Bulanan</span>
            <div className="text-lg font-bold text-slate-900 mt-1">{budgets.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500">Target Tabungan</span>
            <div className="text-lg font-bold text-slate-900 mt-1">{savingsGoals.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500">Hutang</span>
            <div className="text-lg font-bold text-slate-900 mt-1">{debts.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500">Piutang</span>
            <div className="text-lg font-bold text-slate-900 mt-1">{receivables.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500">Transaksi Rutin</span>
            <div className="text-lg font-bold text-slate-900 mt-1">{recurringTransactions.length}</div>
          </div>
        </div>
      </div>

      {/* Export & Import Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cadangkan Data (Backup)</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Unduh seluruh salinan data akun, transaksi, kategori, anggaran, tabungan, hutang/piutang, dan jadwal rutin Anda dalam format file JSON. File ini dapat disimpan di komputer/HP Anda sebagai arsip aman.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              id="btn-export-backup"
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Mengekspor Data...' : 'Unduh Backup (.json)'}</span>
            </button>
          </div>
        </div>

        {/* Import / Restore Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Pulihkan Data (Restore)</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Pilih file cadangan JSON yang pernah Anda unduh untuk mengembalikan data keuangan Anda ke sistem.
            </p>

            {/* Mode selection */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-500">Mode Pemulihan:</span>
              <div className="flex items-center space-x-4 text-xs font-medium">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="merge"
                    checked={restoreMode === 'merge'}
                    onChange={() => setRestoreMode('merge')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Gabungkan Data (Merge)</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="overwrite"
                    checked={restoreMode === 'overwrite'}
                    onChange={() => setRestoreMode('overwrite')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-rose-600 font-semibold">Ganti Total (Overwrite)</span>
                </label>
              </div>
            </div>

            {/* File Input */}
            <div className="mt-4">
              <label
                htmlFor="input-backup-file"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-indigo-400 cursor-pointer transition-colors bg-slate-50/50"
              >
                <FileJson className="w-8 h-8 text-indigo-500 mb-1" />
                <span className="text-xs font-semibold text-slate-700">
                  {parsedBackup ? 'File Siap: ' + parsedBackup.version : 'Pilih File JSON Cadangan'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Klik untuk memilih file</span>
                <input
                  id="input-backup-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview of Parsed Backup */}
            {parsedBackup && (
              <div className="mt-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-indigo-900">Isi File Cadangan:</div>
                <div className="text-slate-600">
                  • Akun: {parsedBackup.data.accounts?.length || 0}
                  {' | '}Kategori: {parsedBackup.data.categories?.length || 0}
                  {' | '}Transaksi: {parsedBackup.data.transactions?.length || 0}
                </div>
                <div className="text-slate-600">
                  • Anggaran: {parsedBackup.data.budgets?.length || 0}
                  {' | '}Tabungan: {parsedBackup.data.savingsGoals?.length || 0}
                  {' | '}Hutang: {parsedBackup.data.debts?.length || 0}
                  {' | '}Piutang: {parsedBackup.data.receivables?.length || 0}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              id="btn-start-restore"
              type="button"
              disabled={!parsedBackup || isRestoring}
              onClick={() => setIsConfirmRestoreOpen(true)}
              className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isRestoring ? 'Memulihkan Data...' : 'Mulai Pulihkan Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      <ConfirmDialog
        isOpen={isConfirmRestoreOpen}
        title="KONFIRMASI RESTORE DATA"
        message={
          restoreMode === 'overwrite'
            ? 'PERINGATAN: Mode "Ganti Total" akan MENGHAPUS data yang ada saat ini dan menggantikannya dengan isi file cadangan. Tindakan ini tidak dapat dibatalkan. Lanjutkan?'
            : 'Data dari file cadangan akan digabungkan ke akun Anda. Lanjutkan proses pemulihan?'
        }
        confirmLabel={restoreMode === 'overwrite' ? 'Ya, Ganti Total' : 'Ya, Pulihkan'}
        confirmVariant={restoreMode === 'overwrite' ? 'danger' : 'primary'}
        isLoading={isRestoring}
        onConfirm={handleConfirmRestore}
        onClose={() => setIsConfirmRestoreOpen(false)}
      />
    </div>
  );
};
