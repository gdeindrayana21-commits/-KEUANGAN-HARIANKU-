import React, { useState, useEffect } from 'react';
import { X, Wallet, Landmark, Banknote, FileText, AlertCircle } from 'lucide-react';
import { Account, AccountType } from '../types';
import { formatRupiah, formatRupiahInputDisplay, parseRupiahInput } from '../utils/currency';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Account | null;
  defaultType?: AccountType;
  onSubmit: (data: {
    name: string;
    type: AccountType;
    initialBalance: number;
    targetCurrentBalance?: number;
    description: string;
  }) => Promise<void>;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  isOpen,
  onClose,
  initialData,
  defaultType = 'Cash',
  onSubmit,
}) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<AccountType>('Cash');
  const [balanceMode, setBalanceMode] = useState<'current' | 'add_funds' | 'initial'>('current');
  const [balanceInputRaw, setBalanceInputRaw] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setBalanceMode('current');
      setBalanceInputRaw(String(Math.max(0, initialData.currentBalance)));
      setDescription(initialData.description || '');
    } else {
      setName(defaultType === 'Bank' ? '' : '');
      setType(defaultType);
      setBalanceMode('initial');
      setBalanceInputRaw('0');
      setDescription('');
    }
    setErrorMessage('');
  }, [initialData, defaultType, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!initialData;
  const parsedInput = parseRupiahInput(balanceInputRaw);

  const computedTargetCurrentBalance = (): number | undefined => {
    if (!isEditMode || !initialData) return undefined;
    if (balanceMode === 'current') {
      return parsedInput;
    }
    if (balanceMode === 'add_funds') {
      return initialData.currentBalance + parsedInput;
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama akun wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const targetCurrent = computedTargetCurrentBalance();
      await onSubmit({
        name: name.trim(),
        type,
        initialBalance:
          isEditMode && balanceMode !== 'initial' && initialData
            ? initialData.initialBalance
            : parsedInput,
        ...(typeof targetCurrent === 'number' ? { targetCurrentBalance: targetCurrent } : {}),
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan data akun. Coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-account-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="modal-account-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                type === 'Bank'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {type === 'Bank' ? (
                <Landmark className="w-5 h-5" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditMode ? 'EDIT AKUN & SALDO' : 'TAMBAH AKUN KEUANGAN'}
              </h2>
              <p className="text-xs text-slate-500">
                {type === 'Bank'
                  ? 'Rekening Bank (Dana Masuk / Gaji / Transaksi Bank)'
                  : 'Akun Cash / Tunai (Pemasukan & Pengeluaran Tunai)'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-account-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Jenis Akun: Pilih Cash atau Bank */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Kategori Akun Keuangan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('Cash')}
                disabled={isSubmitting}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  type === 'Cash'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Banknote
                    className={`w-4 h-4 ${
                      type === 'Cash' ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold">Akun Cash (Tunai)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Menampung pemasukan & pengeluaran tunai tanpa mengurangi Bank.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setType('Bank')}
                disabled={isSubmitting}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  type === 'Bank'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Landmark
                    className={`w-4 h-4 ${
                      type === 'Bank' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold">Rekening Bank</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Bisa diedit saat ada gaji/transfer masuk & otomatis berkurang saat transaksi.
                </p>
              </button>
            </div>
          </div>

          {/* Nama Akun */}
          <div>
            <label
              htmlFor="input-acc-name"
              className="block text-xs font-semibold uppercase text-slate-500 mb-1.5"
            >
              Nama Akun <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-acc-name"
              type="text"
              placeholder={
                type === 'Bank'
                  ? 'Contoh: Bank BCA, Bank Mandiri, BRI Gaji'
                  : 'Contoh: Dompet Cash (Tunai), Kas Harian'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              maxLength={100}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Pengaturan Saldo */}
          {isEditMode && initialData ? (
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Saldo Saat Ini:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatRupiah(initialData.currentBalance)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setBalanceMode('current');
                    setBalanceInputRaw(String(Math.max(0, initialData.currentBalance)));
                  }}
                  className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    balanceMode === 'current'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ubah Saldo Saat Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBalanceMode('add_funds');
                    setBalanceInputRaw('');
                  }}
                  className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    balanceMode === 'add_funds'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Tambah Gaji / Transfer
                </button>
              </div>

              <div>
                <label
                  htmlFor="input-acc-initial"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  {balanceMode === 'add_funds'
                    ? 'Nominal Dana Masuk / Gaji / Transferan (Rp)'
                    : 'Nominal Saldo Baru (Rp)'}
                </label>
                <input
                  id="input-acc-initial"
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 2.500.000"
                  value={balanceInputRaw ? formatRupiahInputDisplay(balanceInputRaw) : ''}
                  onChange={(e) => setBalanceInputRaw(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full text-lg font-bold px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
                {balanceMode === 'add_funds' && (
                  <p className="text-xs text-blue-700 font-medium mt-1.5">
                    Saldo setelah ditambah:{' '}
                    <strong>
                      {formatRupiah(initialData.currentBalance + parsedInput)}
                    </strong>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="input-acc-initial"
                className="block text-xs font-semibold uppercase text-slate-500 mb-1.5"
              >
                Saldo Awal (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-acc-initial"
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 1.000.000"
                value={balanceInputRaw ? formatRupiahInputDisplay(balanceInputRaw) : ''}
                onChange={(e) => setBalanceInputRaw(e.target.value)}
                disabled={isSubmitting}
                className="w-full text-lg font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                {type === 'Bank'
                  ? 'Saldo rekening bank saat ini (dapat diedit kapan saja saat ada gaji/transfer masuk).'
                  : 'Saldo uang tunai di tangan saat ini.'}
              </p>
            </div>
          )}

          {/* Deskripsi */}
          <div>
            <label
              htmlFor="input-acc-desc"
              className="block text-xs font-semibold uppercase text-slate-500 mb-1.5"
            >
              Catatan / Keterangan (Opsional)
            </label>
            <div className="relative">
              <input
                id="input-acc-desc"
                type="text"
                placeholder={
                  type === 'Bank'
                    ? 'Contoh: Rekening gaji bulanan / transferan'
                    : 'Contoh: Uang tunai pegangan harian'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                maxLength={250}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              id="btn-cancel-acc-form"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              BATAL
            </button>
            <button
              id="btn-submit-acc-form"
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer ${
                type === 'Bank'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting
                ? 'MENYIMPAN...'
                : isEditMode
                ? 'SIMPAN PERUBAHAN'
                : 'SIMPAN AKUN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
