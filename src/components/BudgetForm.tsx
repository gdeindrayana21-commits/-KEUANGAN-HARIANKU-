import React, { useState, useEffect } from 'react';
import { X, PieChart, Calendar, AlertCircle } from 'lucide-react';
import { Budget, Category } from '../types';
import { formatRupiahInputDisplay, parseRupiahInput } from '../utils/currency';

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialData?: Budget | null;
  defaultMonth?: string; // YYYY-MM
  onSubmit: (data: {
    categoryId: string;
    categoryName: string;
    periodMonth: string;
    amount: number;
  }) => Promise<void>;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  isOpen,
  onClose,
  categories,
  initialData,
  defaultMonth,
  onSubmit,
}) => {
  const currentMonthStr = defaultMonth || new Date().toISOString().slice(0, 7);
  const [categoryId, setCategoryId] = useState<string>('');
  const [periodMonth, setPeriodMonth] = useState<string>(currentMonthStr);
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense' && c.isActive);

  useEffect(() => {
    if (initialData) {
      setCategoryId(initialData.categoryId);
      setPeriodMonth(initialData.periodMonth);
      setAmountRaw(String(initialData.amount));
    } else {
      setCategoryId(expenseCategories.length > 0 ? expenseCategories[0].id : '');
      setPeriodMonth(currentMonthStr);
      setAmountRaw('');
    }
    setErrorMessage('');
  }, [initialData, isOpen, categories, defaultMonth]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleanNumber = parseRupiahInput(raw);
    setAmountRaw(cleanNumber > 0 ? String(cleanNumber) : '');
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanAmount = parseRupiahInput(amountRaw);
    if (!categoryId || !periodMonth || cleanAmount <= 0) {
      setErrorMessage('Lengkapi semua data anggaran.');
      return;
    }

    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) {
      setErrorMessage('Kategori tidak valid.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        categoryId,
        categoryName: cat.name,
        periodMonth,
        amount: cleanAmount,
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan anggaran.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-budget-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="modal-budget-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {initialData ? 'EDIT ANGGARAN' : 'TAMBAH ANGGARAN'}
            </h2>
          </div>
          <button
            id="btn-close-budget-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Bulan Periode */}
          <div>
            <label htmlFor="input-budget-month" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Bulan Anggaran <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-budget-month"
                type="month"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-900"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Kategori Pengeluaran */}
          <div>
            <label htmlFor="select-budget-category" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Kategori Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-budget-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-900"
            >
              <option value="">-- Pilih Kategori --</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {expenseCategories.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Belum ada kategori pengeluaran aktif. Buat di menu Kategori.
              </p>
            )}
          </div>

          {/* Batas Nominal Anggaran */}
          <div>
            <label htmlFor="input-budget-amount" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Batas Maksimal Anggaran (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-budget-amount"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 1.500.000"
              value={amountRaw ? formatRupiahInputDisplay(amountRaw) : ''}
              onChange={handleAmountChange}
              disabled={isSubmitting}
              className="w-full text-lg font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          {errorMessage && (
            <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              id="btn-cancel-budget-form"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              BATAL
            </button>
            <button
              id="btn-submit-budget-form"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN ANGGARAN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
