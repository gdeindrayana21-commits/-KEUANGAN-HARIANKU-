import React, { useState, useMemo } from 'react';
import {
  Plus,
  RefreshCw,
  Calendar,
  Wallet,
  Play,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Power,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { RecurringTransaction, Category, Account, RecurringFrequency } from '../types';
import { formatRupiah } from '../utils/currency';
import { formatTanggalIndonesia, getTodayString } from '../utils/date';
import { RecurringForm } from '../components/RecurringForm';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface RecurringTransactionsProps {
  recurringTransactions: RecurringTransaction[];
  categories: Category[];
  accounts: Account[];
  onCreateRecurring: (data: {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    categoryName: string;
    accountId: string;
    accountName: string;
    description: string;
    frequency: RecurringFrequency;
    startDate: string;
    nextExecutionDate: string;
    isActive: boolean;
  }) => Promise<void>;
  onUpdateRecurring: (
    id: string,
    data: {
      type: 'income' | 'expense';
      amount: number;
      categoryId: string;
      categoryName: string;
      accountId: string;
      accountName: string;
      description: string;
      frequency: RecurringFrequency;
      startDate: string;
      nextExecutionDate: string;
      isActive: boolean;
    }
  ) => Promise<void>;
  onExecuteRecurring: (recurring: RecurringTransaction) => Promise<void>;
  onToggleActive: (id: string, currentActive: boolean) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
}

export const RecurringTransactions: React.FC<RecurringTransactionsProps> = ({
  recurringTransactions,
  categories,
  accounts,
  onCreateRecurring,
  onUpdateRecurring,
  onExecuteRecurring,
  onToggleActive,
  onDeleteRecurring,
}) => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [deletingItem, setDeletingItem] = useState<RecurringTransaction | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const todayStr = getTodayString();

  // Summary of monthly expense commitment
  const totalMonthlyCommitment = useMemo(() => {
    return recurringTransactions
      .filter((r) => r.isActive && r.type === 'expense')
      .reduce((sum, r) => {
        let monthlyAmount = r.amount;
        if (r.frequency === 'daily') monthlyAmount = r.amount * 30;
        else if (r.frequency === 'weekly') monthlyAmount = r.amount * 4;
        else if (r.frequency === 'yearly') monthlyAmount = r.amount / 12;
        return sum + monthlyAmount;
      }, 0);
  }, [recurringTransactions]);

  const activeCount = useMemo(() => {
    return recurringTransactions.filter((r) => r.isActive).length;
  }, [recurringTransactions]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: RecurringTransaction) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleExecute = async (r: RecurringTransaction) => {
    try {
      setExecutingId(r.id);
      await onExecuteRecurring(r);
      setFeedbackMessage(`Transaksi "${r.description || r.categoryName}" berhasil diposting ke riwayat transaksi!`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      await onDeleteRecurring(deletingItem.id);
      setDeletingItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getFrequencyLabel = (freq: RecurringFrequency) => {
    switch (freq) {
      case 'daily':
        return 'Harian';
      case 'weekly':
        return 'Mingguan';
      case 'monthly':
        return 'Bulanan';
      case 'yearly':
        return 'Tahunan';
      default:
        return freq;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Transaksi Rutin & Berulang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Otomatisasi pencatatan tagihan langganan, sewa, gaji, atau cicilan rutin
          </p>
        </div>

        <button
          id="btn-add-recurring"
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Jadwal Rutin</span>
        </button>
      </div>

      {feedbackMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-sm text-emerald-800 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Estimasi Pengeluaran Rutin / Bulan
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-2">
            {formatRupiah(Math.round(totalMonthlyCommitment))}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Dari {recurringTransactions.filter((r) => r.type === 'expense' && r.isActive).length} tagihan rutin aktif
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Jadwal Rutin Aktif
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {activeCount} / {recurringTransactions.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Jadwal pengulangan otomatis aktif
          </div>
        </div>
      </div>

      {/* Recurring Cards */}
      {recurringTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Belum ada jadwal transaksi rutin
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tambahkan tagihan bulanan seperti internet, listrik, BPJS, atau gaji untuk kemudahan pembukuan.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Jadwal Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurringTransactions.map((item) => {
            const isIncome = item.type === 'income';
            const isDueOrPast = item.nextExecutionDate <= todayStr;

            return (
              <div
                key={item.id}
                id={`recurring-card-${item.id}`}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between ${
                  !item.isActive
                    ? 'opacity-60 border-slate-200 bg-slate-50/40'
                    : isDueOrPast
                    ? 'border-indigo-300 ring-1 ring-indigo-200'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isIncome ? 'PEMASUKAN' : 'PENGELUARAN'}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                          {getFrequencyLabel(item.frequency)}
                        </span>
                        {isDueOrPast && item.isActive && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            SIAP DIPOSTING
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {item.description || item.categoryName}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                        <span>{item.categoryName}</span>
                        <span>•</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                          {item.accountName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => onToggleActive(item.id, item.isActive)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.isActive
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={item.isActive ? 'Nonaktifkan Jadwal' : 'Aktifkan Jadwal'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Jadwal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Nominal & Execution Info */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Nominal Rutin:</span>
                      <span
                        className={`text-lg font-extrabold ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatRupiah(item.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Jadwal Berikutnya:</span>
                      </span>
                      <span className={`font-semibold ${isDueOrPast ? 'text-amber-600' : 'text-slate-800'}`}>
                        {formatTanggalIndonesia(item.nextExecutionDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action: Posting Sekarang */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Mulai: {formatTanggalIndonesia(item.startDate)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleExecute(item)}
                    disabled={executingId === item.id || !item.isActive}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      {executingId === item.id ? 'Memposting...' : 'Posting Transaksi Sekarang'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <RecurringForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        categories={categories}
        accounts={accounts}
        initialData={editingItem}
        onSubmit={async (data) => {
          if (editingItem) {
            await onUpdateRecurring(editingItem.id, data);
          } else {
            await onCreateRecurring(data);
          }
        }}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        title="HAPUS TRANSAKSI RUTIN"
        message={`Apakah Anda yakin ingin menghapus jadwal transaksi rutin "${deletingItem?.description || deletingItem?.categoryName}"?`}
        confirmLabel="Hapus Jadwal"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
};
