import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  Clock,
  Tag,
  Wallet,
  Banknote,
  Landmark,
  FileText,
  AlertCircle,
  Camera,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Account, Category, Transaction, TransactionType } from '../types';
import { formatRupiah, formatRupiahInputDisplay, parseRupiahInput } from '../utils/currency';
import { getTodayString, getCurrentTimeString } from '../utils/date';
import { compressReceiptImage } from '../utils/imageCompression';

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
    receiptImageUrl?: string;
    receiptFileName?: string;
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
  const [receiptImageUrl, setReceiptImageUrl] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const cashAccounts = activeAccounts.filter((a) => a.type === 'Cash');
  const bankAccounts = activeAccounts.filter((a) => a.type !== 'Cash');

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
      setReceiptImageUrl(initialData.receiptImageUrl || '');
      setReceiptFileName(initialData.receiptFileName || '');
    } else {
      setType('expense');
      setAmountRaw('');
      setDate(getTodayString());
      setTime(getCurrentTimeString());
      setDescription('');
      setReceiptImageUrl('');
      setReceiptFileName('');

      // Default to first active Cash account if available, otherwise first active account
      const active = accounts.filter((a) => a.isActive);
      const firstCash = active.find((a) => a.type === 'Cash');
      if (firstCash) {
        setAccountId(firstCash.id);
      } else if (active.length > 0) {
        setAccountId(active[0].id);
      } else {
        setAccountId('');
      }

      if (active.length > 1) {
        const secondAcc = active.find((a) => a.id !== (firstCash?.id || active[0]?.id));
        setToAccountId(secondAcc ? secondAcc.id : '');
      } else {
        setToAccountId('');
      }

      const matchingCats = categories.filter((c) => c.type === 'expense' && c.isActive);
      setCategoryId(matchingCats.length > 0 ? matchingCats[0].id : '');
    }
    setErrorMessage('');
  }, [initialData, isOpen, accounts, categories]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'transfer') {
      setCategoryId('');
      if (activeAccounts.length > 1 && accountId === toAccountId) {
        const alt = activeAccounts.find((a) => a.id !== accountId);
        if (alt) setToAccountId(alt.id);
      }
    } else {
      const matching = categories.filter((c) => c.type === newType && c.isActive);
      setCategoryId(matching.length > 0 ? matching[0].id : '');

      // Rule: "akun pemasukan jadikan satu pada akun cash.. Yang nantinya ketika ada pemasukan akun cash akan bertambah"
      if (newType === 'income' && cashAccounts.length > 0) {
        setAccountId(cashAccounts[0].id);
      }
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    (c) => c.type === (type === 'transfer' ? 'expense' : type) && c.isActive
  );

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const cleanAmount = parseRupiahInput(amountRaw);

  // Calculate live balance impact preview
  const getProjectedBalance = (): number | null => {
    if (!selectedAccount) return null;
    const base = selectedAccount.currentBalance;
    if (type === 'income') return base + cleanAmount;
    if (type === 'expense' || type === 'transfer') return base - cleanAmount;
    return base;
  };

  const projectedBalance = getProjectedBalance();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleanNumber = parseRupiahInput(raw);
    setAmountRaw(cleanNumber > 0 ? String(cleanNumber) : '');
    if (errorMessage) setErrorMessage('');
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    setErrorMessage('');
    try {
      const compressed = await compressReceiptImage(file);
      setReceiptImageUrl(compressed.dataUrl);
      setReceiptFileName(compressed.fileName);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal memproses foto struk pembelanjaan.'
      );
    } finally {
      setIsCompressingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isCompressingPhoto) return;

    if (!type || !date || cleanAmount <= 0 || !accountId) {
      setErrorMessage('Lengkapi nominal, tanggal, dan akun transaksi terlebih dahulu.');
      return;
    }

    if (!selectedAccount) {
      setErrorMessage('Akun keuangan tidak ditemukan.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const destinationAccount = accounts.find((a) => a.id === toAccountId);

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
      if (!categoryId || !selectedCategory) {
        setErrorMessage('Pilih kategori transaksi.');
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
        categoryName:
          type === 'transfer' ? 'Transfer Antar Akun' : selectedCategory?.name || '',
        accountId,
        accountName: selectedAccount.name,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        toAccountName: type === 'transfer' ? destinationAccount?.name : undefined,
        date,
        time: time || getCurrentTimeString(),
        description: description.trim(),
        receiptImageUrl: receiptImageUrl || undefined,
        receiptFileName: receiptFileName || undefined,
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Transaksi belum berhasil disimpan. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!initialData;

  return (
    <div
      id="modal-transaction-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/55 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="modal-transaction-card"
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {isEditMode ? 'EDIT TRANSAKSI' : 'CATAT TRANSAKSI BARU'}
          </h2>
          <button
            id="btn-close-transaction-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* 1. Jenis Transaksi */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                id="btn-type-expense"
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs border border-rose-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>PENGELUARAN</span>
              </button>
              <button
                id="btn-type-income"
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>PEMASUKAN</span>
              </button>
              <button
                id="btn-type-transfer"
                type="button"
                onClick={() => handleTypeChange('transfer')}
                className={`flex items-center justify-center py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  type === 'transfer'
                    ? 'bg-white text-blue-600 shadow-xs border border-blue-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>TRANSFER</span>
              </button>
            </div>
          </div>

          {/* 2. Pemisahan Jelas Akun Cash vs Akun Bank */}
          {type === 'income' ? (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Banknote className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950">
                      Masuk ke Akun Cash (Pemasukan Dijadikan Satu)
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-snug">
                    Setiap ada pemasukan, saldo <strong>Akun Cash</strong> akan otomatis bertambah.
                  </p>
                </div>
              </div>

              {cashAccounts.length > 0 ? (
                <select
                  id="select-tx-account"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {cashAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — Saldo saat ini: {formatRupiah(a.currentBalance)}
                    </option>
                  ))}
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Rekening Bank) — Saldo: {formatRupiah(a.currentBalance)}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  id="select-tx-account"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-900"
                >
                  <option value="">-- Pilih Akun --</option>
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type}) — {formatRupiah(a.currentBalance)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : type === 'expense' ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Pilih Sumber Dana Pengeluaran (Cash vs Bank) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeAccounts.map((acc) => {
                  const isBank = acc.type !== 'Cash';
                  const isSelected = accountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccountId(acc.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? isBank
                            ? 'border-blue-600 bg-blue-50/70'
                            : 'border-emerald-600 bg-emerald-50/70'
                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          {isBank ? (
                            <Landmark
                              className={`w-4 h-4 ${
                                isSelected ? 'text-blue-600' : 'text-slate-400'
                              }`}
                            />
                          ) : (
                            <Banknote
                              className={`w-4 h-4 ${
                                isSelected ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            />
                          )}
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                            {acc.name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isBank
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isBank ? 'Bank' : 'Cash'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1 tabular-nums">
                        Saldo: {formatRupiah(acc.currentBalance)}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {isBank
                          ? 'Otomatis mengurangi saldo Bank ini'
                          : 'Mengurangi Cash (Saldo Bank tetap utuh)'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
              <div>
                <label
                  htmlFor="select-tx-account-from"
                  className="block text-xs font-semibold uppercase text-slate-500 mb-1.5"
                >
                  Dari Akun <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="select-tx-account-from"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="">-- Pilih Akun Asal --</option>
                    {activeAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                  <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="select-tx-account-to"
                  className="block text-xs font-semibold uppercase text-slate-500 mb-1.5"
                >
                  Ke Akun Tujuan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="select-tx-account-to"
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
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
                  <Wallet className="w-4 h-4 text-blue-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* 3. Nominal Input & Live Balance Preview */}
          <div>
            <label
              htmlFor="input-tx-amount"
              className="block text-xs font-semibold uppercase text-slate-500 mb-1.5"
            >
              Nominal (Rp) <span className="text-rose-500">*</span>
            </label>
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
            {selectedAccount && cleanAmount > 0 && projectedBalance !== null && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Estimasi Saldo <strong>{selectedAccount.name}</strong>:
                </span>
                <span
                  className={`font-bold tabular-nums ${
                    projectedBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
                  }`}
                >
                  {formatRupiah(selectedAccount.currentBalance)} &rarr;{' '}
                  {formatRupiah(projectedBalance)}
                </span>
              </div>
            )}
          </div>

          {/* 4. Kategori (if not transfer) */}
          {type !== 'transfer' && (
            <div>
              <label
                htmlFor="select-tx-category"
                className="block text-xs font-semibold uppercase text-slate-500 mb-1.5"
              >
                Kategori {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}{' '}
                <span className="text-rose-500">*</span>
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
            </div>
          )}

          {/* 5. Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="input-tx-date"
                className="block text-xs font-semibold uppercase text-slate-500 mb-1.5"
              >
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
              <label
                htmlFor="input-tx-time"
                className="block text-xs font-semibold uppercase text-slate-500 mb-1.5"
              >
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

          {/* 6. Keterangan */}
          <div>
            <label
              htmlFor="input-tx-desc"
              className="block text-xs font-semibold uppercase text-slate-500 mb-1.5"
            >
              Keterangan / Catatan
            </label>
            <div className="relative">
              <input
                id="input-tx-desc"
                type="text"
                placeholder={
                  type === 'transfer'
                    ? 'Contoh: Tarik tunai ATM ke Dompet Cash'
                    : type === 'income'
                    ? 'Contoh: Penjualan harian, Uang masuk tunai'
                    : 'Contoh: Belanja bulanan, Makan siang, Bensin'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                maxLength={300}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 7. Upload Foto Struk Pembelanjaan / Bukti Pembelanjaan */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Foto Struk / Bukti Pembelanjaan (Opsional)
            </label>

            <input
              ref={fileInputRef}
              id="input-tx-receipt-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {!receiptImageUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressingPhoto || isSubmitting}
                className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-xl flex items-center justify-center space-x-2.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>
                  {isCompressingPhoto
                    ? 'Memproses & Mengompres Foto Struk...'
                    : 'Ambil Foto Kamera / Upload Struk Pembelanjaan'}
                </span>
              </button>
            ) : (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={receiptImageUrl}
                    alt="Preview Struk"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-cover rounded-lg border border-emerald-300 shrink-0 bg-white"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Struk Siap Disimpan</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {receiptFileName || 'struk-belanja.jpg'}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline mt-1 cursor-pointer"
                    >
                      Ganti Foto
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReceiptImageUrl('');
                    setReceiptFileName('');
                  }}
                  title="Hapus foto struk"
                  className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
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
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              BATAL
            </button>
            <button
              id="btn-submit-tx-form"
              type="submit"
              disabled={isSubmitting || isCompressingPhoto}
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all disabled:opacity-60 cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : type === 'transfer'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
              }`}
            >
              {isSubmitting
                ? 'MENYIMPAN...'
                : type === 'transfer'
                ? 'SIMPAN TRANSFER'
                : 'SIMPAN TRANSAKSI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
