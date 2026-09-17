import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Calendar, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { RecurringTransaction, Category, Account, RecurringFrequency } from '../types';
import { formatRupiahInputDisplay, parseRupiahInput } from '../utils/currency';
import { getTodayString } from '../utils/date';

interface RecurringFormProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  initialData?: RecurringTransaction | null;
  onSubmit: (data: {
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
}

export const RecurringForm: React.FC<RecurringFormProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  initialData,
  onSubmit,
}) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState<string>(getTodayString());
  const [nextExecutionDate, setNextExecutionDate] = useState<string>(getTodayString());
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const filteredCategories = categories.filter(
    (c) => c.type === type && c.isActive
  );

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountRaw(String(initialData.amount));
      setCategoryId(initialData.categoryId);
      setAccountId(initialData.accountId);
      setDescription(initialData.description || '');
      setFrequency(initialData.frequency);
      setStartDate(initialData.startDate);
      setNextExecutionDate(initialData.nextExecutionDate);
      setIsActive(initialData.isActive);
    } else {
      setType('expense');
      setAmountRaw('');
      setDescription('');
      setFrequency('monthly');
      const today = getTodayString();
      setStartDate(today);
      setNextExecutionDate(today);
      setIsActive(true);
      if (accounts.length > 0) setAccountId(accounts[0].id);
    }
    setErrorMessage('');
  }, [initialData, isOpen, accounts]);

  // Keep category in sync with type
  useEffect(() => {
    if (!initialData && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const amt = parseRupiahInput(amountRaw);
    if (amt <= 0 || !categoryId || !accountId || !nextExecutionDate) {
      setErrorMessage('Lengkapi semua data transaksi rutin.');
      return;
    }

    const cat = categories.find((c) => c.id === categoryId);
    const acc = accounts.find((a) => a.id === accountId);

    if (!cat || !acc) {
      setErrorMessage('Kategori atau akun tidak valid.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        type,
        amount: amt,
        categoryId,
        categoryName: cat.name,
        accountId,
        accountName: acc.name,
        description: description.trim(),
        frequency,
        startDate,
        nextExecutionDate,
        isActive,
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan transaksi rutin.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-recurring-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="modal-recurring-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {initialData ? 'EDIT TRANSAKSI RUTIN' : 'TRANSAKSI RUTIN BARU'}
            </h2>
          </div>
          <button
            id="btn-close-recurring-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipe Transaksi: Pengeluaran / Pemasukan */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs border border-rose-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 mr-1.5" />
              PENGELUARAN
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs border border-emerald-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
              PEMASUKAN
            </button>
          </div>

          {/* Nominal */}
          <div>
            <label htmlFor="input-recurring-amount" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Nominal Rutin (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-recurring-amount"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 350.000"
              value={amountRaw ? formatRupiahInputDisplay(amountRaw) : ''}
              onChange={(e) => setAmountRaw(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-lg font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Frekuensi Rutin */}
          <div>
            <label htmlFor="select-recurring-freq" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Frekuensi Pengulangan <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-recurring-freq"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-900"
            >
              <option value="daily">Setiap Hari (Harian)</option>
              <option value="weekly">Setiap Minggu (Mingguan)</option>
              <option value="monthly">Setiap Bulan (Bulanan)</option>
              <option value="yearly">Setiap Tahun (Tahunan)</option>
            </select>
          </div>

          {/* Kategori */}
          <div>
            <label htmlFor="select-recurring-cat" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Kategori <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-recurring-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-900"
            >
              <option value="">-- Pilih Kategori --</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Akun */}
          <div>
            <label htmlFor="select-recurring-acc" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Akun Pembayaran <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-recurring-acc"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-900"
            >
              <option value="">-- Pilih Akun --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal Eksekusi Berikutnya */}
          <div>
            <label htmlFor="input-recurring-next-date" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Tanggal Eksekusi Berikutnya <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-recurring-next-date"
                type="date"
                value={nextExecutionDate}
                onChange={(e) => setNextExecutionDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-900"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label htmlFor="input-recurring-desc" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Deskripsi (Contoh: Langganan WiFi IndiHome, Netflix, Kost)
            </label>
            <input
              id="input-recurring-desc"
              type="text"
              placeholder="Contoh: Tagihan WiFi bulanan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-900"
            />
          </div>

          {/* Status Aktif */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              id="checkbox-recurring-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="checkbox-recurring-active" className="text-xs font-medium text-slate-700">
              Jadwal rutin aktif (otomatis diingatkan / diproses)
            </label>
          </div>

          {errorMessage && (
            <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              id="btn-cancel-recurring-form"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              BATAL
            </button>
            <button
              id="btn-submit-recurring-form"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN JADWAL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
