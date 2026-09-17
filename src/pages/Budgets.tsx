import React, { useState, useMemo } from 'react';
import {
  Plus,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import { formatRupiah } from '../utils/currency';
import { formatMonthYearIndonesia } from '../utils/date';
import { BudgetForm } from '../components/BudgetForm';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface BudgetsProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onCreateBudget: (data: {
    categoryId: string;
    categoryName: string;
    periodMonth: string;
    amount: number;
  }) => Promise<void>;
  onUpdateBudget: (
    budgetId: string,
    data: {
      categoryId: string;
      categoryName: string;
      periodMonth: string;
      amount: number;
    }
  ) => Promise<void>;
  onDeleteBudget: (budgetId: string) => Promise<void>;
}

export const Budgets: React.FC<BudgetsProps> = ({
  budgets,
  categories,
  transactions,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Navigate months
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(prevDate.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(nextDate.toISOString().slice(0, 7));
  };

  // Filter budgets for selected month
  const monthBudgets = useMemo(() => {
    return budgets.filter((b) => b.periodMonth === selectedMonth);
  }, [budgets, selectedMonth]);

  // Calculate actual spending per category in this month
  const categorySpendingMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.startsWith(selectedMonth)) {
        const current = map.get(tx.categoryId) || 0;
        map.set(tx.categoryId, current + tx.amount);
      }
    }
    return map;
  }, [transactions, selectedMonth]);

  // Overall calculations
  const totalBudget = useMemo(() => {
    return monthBudgets.reduce((sum, b) => sum + b.amount, 0);
  }, [monthBudgets]);

  const totalSpent = useMemo(() => {
    return monthBudgets.reduce((sum, b) => {
      const spent = categorySpendingMap.get(b.categoryId) || 0;
      return sum + spent;
    }, 0);
  }, [monthBudgets, categorySpendingMap]);

  const remainingBudget = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 999) : 0;

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBudget) return;
    try {
      setIsDeleting(true);
      await onDeleteBudget(deletingBudget.id);
      setDeletingBudget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Anggaran Bulanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kontrol dan pantau batas pengeluaran per kategori agar tidak boros
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Month selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-2xs p-1">
            <button
              id="btn-prev-budget-month"
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-semibold text-slate-800 whitespace-nowrap">
              {formatMonthYearIndonesia(selectedMonth)}
            </span>
            <button
              id="btn-next-budget-month"
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-add-budget"
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Anggaran</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Anggaran</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {formatRupiah(totalBudget)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {monthBudgets.length} kategori dianggarkan
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Realisasi Pengeluaran</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-2">
            {formatRupiah(totalSpent)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {overallPercentage}% dari total anggaran
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Sisa Anggaran</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              remainingBudget >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {remainingBudget >= 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-bold mt-2 ${
            remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {remainingBudget >= 0 ? formatRupiah(remainingBudget) : `Defisit ${formatRupiah(Math.abs(remainingBudget))}`}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {remainingBudget >= 0 ? 'Kondisi aman terkontrol' : 'Batas anggaran terlampaui!'}
          </div>
        </div>
      </div>

      {/* Budgets List */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          Daftar Anggaran Kategori ({formatMonthYearIndonesia(selectedMonth)})
        </h2>

        {monthBudgets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <PieChart className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Belum ada anggaran untuk bulan ini
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tentukan batas belanja untuk kategori makan, transportasi, hiburan, dan lainnya.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Anggaran Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monthBudgets.map((budget) => {
              const spent = categorySpendingMap.get(budget.categoryId) || 0;
              const remaining = budget.amount - spent;
              const percent = Math.min(Math.round((spent / budget.amount) * 100), 999);
              const isOver = spent > budget.amount;
              const isWarning = !isOver && percent >= 80;

              return (
                <div
                  key={budget.id}
                  id={`budget-card-${budget.id}`}
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                    isOver
                      ? 'border-rose-300 ring-1 ring-rose-200'
                      : isWarning
                      ? 'border-amber-300 ring-1 ring-amber-100'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {budget.categoryName}
                        </h3>
                        {isOver && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            <ShieldAlert className="w-3 h-3" />
                            <span>OVER BUDGET</span>
                          </span>
                        )}
                        {isWarning && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                            <AlertTriangle className="w-3 h-3" />
                            <span>MENDEKATI LIMIT</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Alokasi: {formatRupiah(budget.amount)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(budget)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Anggaran"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingBudget(budget)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Anggaran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">
                        Terpakai: {formatRupiah(spent)}
                      </span>
                      <span
                        className={
                          isOver
                            ? 'text-rose-600 font-bold'
                            : isWarning
                            ? 'text-amber-600 font-bold'
                            : 'text-slate-700'
                        }
                      >
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-50">
                    <span className="text-slate-400">
                      {isOver ? 'Kelebihan Pengeluaran:' : 'Sisa Kuota Anggaran:'}
                    </span>
                    <span
                      className={`font-semibold ${
                        isOver ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isOver
                        ? `+${formatRupiah(Math.abs(remaining))}`
                        : formatRupiah(remaining)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <BudgetForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        categories={categories}
        initialData={editingBudget}
        defaultMonth={selectedMonth}
        onSubmit={async (data) => {
          if (editingBudget) {
            await onUpdateBudget(editingBudget.id, data);
          } else {
            await onCreateBudget(data);
          }
        }}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingBudget}
        title="HAPUS ANGGARAN"
        message={`Apakah Anda yakin ingin menghapus anggaran untuk kategori "${deletingBudget?.categoryName}" bulan ${formatMonthYearIndonesia(
          deletingBudget?.periodMonth || selectedMonth
        )}?`}
        confirmLabel="Hapus Anggaran"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingBudget(null)}
      />
    </div>
  );
};
