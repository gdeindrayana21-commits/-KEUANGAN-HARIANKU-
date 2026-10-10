import React, { useState, useEffect } from 'react';
import { X, Landmark, ArrowUpRight, SlidersHorizontal, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Account } from '../types';
import { formatRupiah, formatRupiahInputDisplay, parseRupiahInput } from '../utils/currency';
import { getTodayString } from '../utils/date';

interface BankTopUpModalProps {
  isOpen: boolean;
  account: Account | null;
  onClose: () => void;
  onRecordBankIncome: (data: {
    accountId: string;
    accountName: string;
    amount: number;
    sourceLabel: string;
    date: string;
    description: string;
  }) => Promise<void>;
  onDirectAdjustBalance: (accountId: string, newCurrentBalance: number, note: string) => Promise<void>;
}

export const BankTopUpModal: React.FC<BankTopUpModalProps> = ({
  isOpen,
  account,
  onClose,
  onRecordBankIncome,
  onDirectAdjustBalance,
}) => {
  const [mode, setMode] = useState<'income' | 'adjust'>('income');
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [sourceLabel, setSourceLabel] = useState<string>('Gaji / Penghasilan');
  const [date, setDate] = useState<string>(getTodayString());
  const [description, setDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (account && isOpen) {
      setMode('income');
      setAmountRaw('');
      setSourceLabel('Gaji / Penghasilan');
      setDate(getTodayString());
      setDescription('');
      setErrorMessage('');
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  const parsedAmount = parseRupiahInput(amountRaw);
  const previewBalance =
    mode === 'income'
      ? account.currentBalance + (parsedAmount > 0 ? parsedAmount : 0)
      : parsedAmount;

  const handleModeChange = (newMode: 'income' | 'adjust') => {
    setMode(newMode);
    setErrorMessage('');
    if (newMode === 'adjust') {
      setAmountRaw(String(Math.max(0, account.currentBalance)));
    } else {
      setAmountRaw('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (mode === 'income') {
      if (parsedAmount <= 0) {
        setErrorMessage('Masukkan nominal dana masuk / gaji / transferan lebih dari Rp 0.');
        return;
      }
      setIsSubmitting(true);
      setErrorMessage('');
      try {
        await onRecordBankIncome({
          accountId: account.id,
          accountName: account.name,
          amount: parsedAmount,
          sourceLabel,
          date: date || getTodayString(),
          description:
            description.trim() || `${sourceLabel} masuk ke ${account.name}`,
        });
        onClose();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Gagal menyimpan dana masuk ke akun bank.'
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (amountRaw.trim() === '') {
        setErrorMessage('Masukkan nominal saldo aktual rekening bank.');
        return;
      }
      setIsSubmitting(true);
      setErrorMessage('');
      try {
        await onDirectAdjustBalance(
          account.id,
          parsedAmount,
          description.trim() || 'Penyesuaian saldo rekening bank'
        );
        onClose();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Gagal memperbarui saldo rekening bank.'
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const sourceOptions = [
    'Gaji / Penghasilan',
    'Transferan Masuk',
    'Bonus / Tunjangan',
    'Hasil Usaha / Bisnis',
    'Top Up / Setor Tunai',
    'Dana Masuk Lainnya',
  ];

  return (
    <div
      id="modal-bank-topup"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kelola Dana Rekening Bank
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                {account.name} · Saldo: {formatRupiah(account.currentBalance)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleModeChange('income')}
              className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'income'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+ Gaji / Transfer Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('adjust')}
              className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'adjust'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Edit Saldo Langsung</span>
            </button>
          </div>

          {mode === 'income' ? (
            <>
              {/* Jenis Dana Masuk */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Sumber Dana Masuk
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sourceOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSourceLabel(item)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-left transition-colors cursor-pointer truncate ${
                        sourceLabel === item
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nominal Dana Masuk */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nominal Dana Masuk / Gaji / Transferan (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 5.000.000"
                  value={amountRaw ? formatRupiahInputDisplay(amountRaw) : ''}
                  onChange={(e) => {
                    const clean = parseRupiahInput(e.target.value);
                    setAmountRaw(clean > 0 ? String(clean) : '');
                    setErrorMessage('');
                  }}
                  disabled={isSubmitting}
                  className="w-full text-xl font-bold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Tanggal Dana Masuk
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Saldo Aktual Rekening Bank Saat Ini (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 10.500.000"
                value={amountRaw ? formatRupiahInputDisplay(amountRaw) : '0'}
                onChange={(e) => {
                  const clean = parseRupiahInput(e.target.value);
                  setAmountRaw(String(clean));
                  setErrorMessage('');
                }}
                disabled={isSubmitting}
                className="w-full text-xl font-bold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-1">
                Ubah langsung nominal saldo bank agar sesuai dengan mutasi/saldo m-Banking Anda.
              </p>
            </div>
          )}

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Catatan / Keterangan (Opsional)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={
                  mode === 'income'
                    ? 'Contoh: Gaji bulan ini, Transfer dari klien'
                    : 'Contoh: Penyesuaian saldo m-Banking'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                maxLength={200}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Preview Saldo Akhir */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between">
            <span className="text-xs font-medium text-blue-900">
              Saldo Bank Setelah Disimpan:
            </span>
            <span className="text-base font-bold text-blue-700 tabular-nums">
              {formatRupiah(previewBalance)}
            </span>
          </div>

          {errorMessage && (
            <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? 'MENYIMPAN...'
                : mode === 'income'
                ? 'TAMBAH DANA KE BANK'
                : 'SIMPAN SALDO BANK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
