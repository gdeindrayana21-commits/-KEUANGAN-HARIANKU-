import React, { useState, useEffect } from 'react';
import { X, Wallet, FileText, AlertCircle } from 'lucide-react';
import { Account, AccountType } from '../types';
import { formatRupiahInputDisplay, parseRupiahInput } from '../utils/currency';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Account | null;
  onSubmit: (data: {
    name: string;
    type: AccountType;
    initialBalance: number;
    description: string;
  }) => Promise<void>;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
}) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<AccountType>('Cash');
  const [initialBalanceRaw, setInitialBalanceRaw] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setInitialBalanceRaw(String(initialData.initialBalance));
      setDescription(initialData.description || '');
    } else {
      setName('');
      setType('Cash');
      setInitialBalanceRaw('0');
      setDescription('');
    }
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama akun wajib diisi.');
      return;
    }

    const cleanInitial = parseRupiahInput(initialBalanceRaw);

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        name: name.trim(),
        type,
        initialBalance: cleanInitial,
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

  const isEditMode = !!initialData;

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
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {isEditMode ? 'EDIT AKUN KEUANGAN' : 'TAMBAH AKUN KEUANGAN'}
            </h2>
          </div>
          <button
            id="btn-close-account-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nama Akun */}
          <div>
            <label htmlFor="input-acc-name" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Nama Akun <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-acc-name"
              type="text"
              placeholder="Contoh: Dompet Utama, Bank BCA, DANA"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              maxLength={100}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Jenis Akun */}
          <div>
            <label htmlFor="select-acc-type" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Jenis Akun <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-acc-type"
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900"
            >
              <option value="Cash">Cash (Uang Tunai)</option>
              <option value="Bank">Bank (Rekening Bank)</option>
              <option value="E-Wallet">E-Wallet (Dompet Digital)</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Saldo Awal */}
          <div>
            <label htmlFor="input-acc-initial" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Saldo Awal (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-acc-initial"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 500.000"
              value={initialBalanceRaw ? formatRupiahInputDisplay(initialBalanceRaw) : ''}
              onChange={(e) => setInitialBalanceRaw(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-lg font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              Saldo awal saat akun pertama kali dibuka.
            </p>
          </div>

          {/* Deskripsi */}
          <div>
            <label htmlFor="input-acc-desc" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Deskripsi (Opsional)
            </label>
            <div className="relative">
              <input
                id="input-acc-desc"
                type="text"
                placeholder="Catatan tambahan rekening/dompet"
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
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              BATAL
            </button>
            <button
              id="btn-submit-acc-form"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60"
            >
              {isSubmitting ? 'MENYIMPAN...' : isEditMode ? 'PERBARUI AKUN' : 'SIMPAN AKUN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
