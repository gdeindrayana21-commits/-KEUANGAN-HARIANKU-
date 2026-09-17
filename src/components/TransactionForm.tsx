import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Calendar, Clock, Tag, Wallet, FileText, AlertCircle } from 'lucide-react';
import { Account, Category, Transaction, TransactionType } from '../types';
import { formatRupiahInputDisplay, parseRupiahInput } from '../utils/currency';
import { getTodayString, getCurrentTimeString } from '../utils/date';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  initialData?: Transaction | null;
  onSubmit: (data: {
    type: TransactionType;
    amount: number;
    categoryId: string;
    categoryName: string;
    accountId: string;
    accountName: string;
    toAccountId?: string;
    toAccountName?: string;
    date: string;
    time: string;
    description: string;
  }) => Promise<void>;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  initialData,
  onSubmit,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [description, setDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or reset form state when opened or initialData changes
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountRaw(String(initialData.amount));
      setCategoryId(initialData.categoryId || '');
      setAccountId(initialData.accountId);
      setToAccountId(initialData.toAccountId || '');
      setDate(initialData.date);
      setTime(initialData.time || getCurrentTimeString());
      setDescription(initialData.description || '');
    } else {
      setType('expense');
      setAmountRaw('');
      setDate(getTodayString());
      setTime(getCurrentTimeString());
      setDescription('');
      
      // Default to first active account
      const active = accounts.filter((a) => a.isActive);
      if (active.length > 0) {
        setAccountId(active[0].id);
        if (active.length > 1) {
          setToAccountId(active[1].id);
        } else {
          setToAccountId('');
        }
      } else {
        setAccountId('');
        setToAccountId('');
      }

      // Default to first matching category
      const matchingCats = categories.filter((c) => c.type === 'expense' && c.isActive);
      if (matchingCats.length > 0) {
        setCategoryId(matchingCats[0].id);
      } else {
        setCategoryId('');
      }
    }
    setErrorMessage('');
  }, [initialData, isOpen, accounts, categories]);

  // When type changes in create mode, auto-select the first valid category of that type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'transfer') {
      setCategoryId('');
      const active = accounts.filter((a) => a.isActive);
      if (active.length > 1 && accountId === toAccountId) {
        const alt = active.find((a) => a.id !== accountId);
        if (alt) setToAccountId(alt.id);
      }
    } else {
      const matching = categories.filter((c) => c.type === newType && c.isActive);
      if (matching.length > 0) {
        setCategoryId(matching[0].id);
      } else {
        setCategoryId('');
      }
    }
  };

  if (!isOpen) return null;

  const activeAccounts = accounts.filter((a) => a.isActive);
  const filteredCategories = categories.filter((c) => c.type === (type === 'transfer' ? 'expense' : type) && c.isActive);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleanNumber = parseRupiahInput(raw);
    setAmountRaw(cleanNumber > 0 ? String(cleanNumber) : '');
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submit

    const cleanAmount = parseRupiahInput(amountRaw);
    if (!type || !date || cleanAmount <= 0 || !accountId) {
      setErrorMessage('Lengkapi data transaksi terlebih dahulu.');
      return;
    }

    const selectedAccount = accounts.find((a) => a.id === accountId);
    if (!selectedAccount) {
      setErrorMessage('Akun asal tidak ditemukan.');
      return;
    }

    let selectedCategory = categories.find((c) => c.id === categoryId);
    let destinationAccount = accounts.find((a) => a.id === toAccountId);

    if (type === 'transfer') {
      if (!toAccountId) {
        setErrorMessage('Pilih akun tujuan transfer.');
        return;
      }
      if (accountId === toAccountId) {
        setErrorMessage('Akun tujuan tidak boleh sama dengan akun asal.');
        return;
      }
      if (!destinationAccount) {
        setErrorMessage('Akun tujuan tidak ditemukan.');
        return;
      }
    } else {
      if (!categoryId) {
        setErrorMessage('Pilih kategori transaksi.');
        return;
      }
      if (!selectedCategory) {
        setErrorMessage('Kategori tidak ditemukan.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        type,
        amount: cleanAmount,
        categoryId: type === 'transfer' ? 'transfer' : categoryId,
        categoryName: type === 'transfer' ? 'Transfer Antar Akun' : (selectedCategory?.name || ''),
        accountId,
        accountName: selectedAccount.name,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        toAccountName: type === 'transfer' ? destinationAccount?.name : undefined,
        date,
        time: time || getCurrentTimeString(),
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Transaksi belum berhasil disimpan. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!initialData;

  return (
    <div
      id="modal-transaction-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="modal-transaction-card"
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditMode ? 'EDIT TRANSAKSI' : 'TAMBAH TRANSAKSI'}
          </h2>
          <button
            id="btn-close-transaction-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Segmented Control / Type Selector (3 options: Pengeluaran, Pemasukan, Transfer) */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                id="btn-type-expense"
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  type === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs border border-rose-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 mr-1" />
                PENGELUARAN
              </button>
              <button
                id="btn-type-income"
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  type === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                PEMASUKAN
              </button>
              <button
                id="btn-type-transfer"
                type="button"
                onClick={() => handleTypeChange('transfer')}
                className={`flex items-center justify-center py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  type === 'transfer'
                    ? 'bg-white text-blue-600 shadow-xs border border-blue-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
                TRANSFER
              </button>
            </div>
          </div>

          {/* Nominal Input */}
          <div>
            <label htmlFor="input-tx-amount" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Nominal (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-tx-amount"
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 50.000"
                value={amountRaw ? formatRupiahInputDisplay(amountRaw) : ''}
                onChange={handleAmountChange}
                disabled={isSubmitting}
                className="w-full text-xl font-bold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:text-base"
              />
            </div>
            {amountRaw && (
              <p className="text-xs text-slate-500 mt-1">
                Tersimpan sebagai: {parseRupiahInput(amountRaw)}
              </p>
            )}
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-tx-date" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="input-tx-time" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Waktu
              </label>
              <div className="relative">
                <input
                  id="input-tx-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Akun & Kategori or Transfer destination */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
              <div>
                <label htmlFor="select-tx-account-from" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  Dari Akun <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="select-tx-account-from"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 appearance-none"
                  >
                    <option value="">-- Pilih Akun Asal --</option>
                    {activeAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                  <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="select-tx-account-to" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  Ke Akun Tujuan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="select-tx-account-to"
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 appearance-none"
                  >
                    <option value="">-- Pilih Akun Tujuan --</option>
                    {activeAccounts
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.type})
                        </option>
                      ))}
                  </select>
                  <Wallet className="w-4 h-4 text-blue-500 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="select-tx-category" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="select-tx-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 appearance-none"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
                {filteredCategories.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Belum ada kategori {type === 'income' ? 'pemasukan' : 'pengeluaran'}. Buat di menu Kategori.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="select-tx-account" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  Akun Keuangan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="select-tx-account"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 appearance-none"
                  >
                    <option value="">-- Pilih Akun --</option>
                    {activeAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                  <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
                {activeAccounts.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Belum ada akun aktif. Buat di menu Akun Keuangan.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Keterangan */}
          <div>
            <label htmlFor="input-tx-desc" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Keterangan
            </label>
            <div className="relative">
              <input
                id="input-tx-desc"
                type="text"
                placeholder={type === 'transfer' ? 'Contoh: Top up e-wallet, Pindah saldo' : 'Contoh: Makan siang, Bensin, Gaji bulanan'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                maxLength={300}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div
              id="alert-tx-error"
              className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              id="btn-cancel-tx-form"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              BATAL
            </button>
            <button
              id="btn-submit-tx-form"
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all disabled:opacity-60 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : type === 'transfer'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
              }`}
            >
              {isSubmitting ? 'MENYIMPAN...' : type === 'transfer' ? 'SIMPAN TRANSFER' : 'SIMPAN TRANSAKSI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
