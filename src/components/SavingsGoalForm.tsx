import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, Wallet, FileText, AlertCircle } from 'lucide-react';
import { SavingsGoal, Account } from '../types';
import { formatRupiahInputDisplay, parseRupiahInput } from '../utils/currency';
import { getTodayString } from '../utils/date';

interface SavingsGoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  initialData?: SavingsGoal | null;
  onSubmit: (data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    accountId?: string;
    accountName?: string;
    notes?: string;
  }) => Promise<void>;
}

export const SavingsGoalForm: React.FC<SavingsGoalFormProps> = ({
  isOpen,
  onClose,
  accounts,
  initialData,
  onSubmit,
}) => {
  const [name, setName] = useState<string>('');
  const [targetAmountRaw, setTargetAmountRaw] = useState<string>('');
  const [currentAmountRaw, setCurrentAmountRaw] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTargetAmountRaw(String(initialData.targetAmount));
      setCurrentAmountRaw(String(initialData.currentAmount));
      setTargetDate(initialData.targetDate);
      setAccountId(initialData.accountId || '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setTargetAmountRaw('');
      setCurrentAmountRaw('0');
      // Default target date 6 months ahead
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      setTargetDate(d.toISOString().slice(0, 10));
      setAccountId('');
      setNotes('');
    }
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const target = parseRupiahInput(targetAmountRaw);
    const current = parseRupiahInput(currentAmountRaw);

    if (!name.trim() || target <= 0 || !targetDate) {
      setErrorMessage('Lengkapi nama, target nominal, dan tanggal target.');
      return;
    }

    const acc = accounts.find((a) => a.id === accountId);

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        targetDate,
        accountId: accountId || undefined,
        accountName: acc?.name || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan target tabungan.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-savings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="modal-savings-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {initialData ? 'EDIT TARGET TABUNGAN' : 'TARGET TABUNGAN BARU'}
            </h2>
          </div>
          <button
            id="btn-close-savings-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nama Target */}
          <div>
            <label htmlFor="input-savings-name" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Nama Impian / Tujuan <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-savings-name"
              type="text"
              placeholder="Contoh: Dana Darurat, Umroh, Beli Motor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm text-slate-900"
            />
          </div>

          {/* Target Nominal */}
          <div>
            <label htmlFor="input-savings-target" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Target Dana yang Dibutuhkan (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-savings-target"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 15.000.000"
              value={targetAmountRaw ? formatRupiahInputDisplay(targetAmountRaw) : ''}
              onChange={(e) => setTargetAmountRaw(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-lg font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Dana Awal Saat Ini */}
          <div>
            <label htmlFor="input-savings-current" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Dana yang Sudah Ada (Rp)
            </label>
            <input
              id="input-savings-current"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 2.000.000"
              value={currentAmountRaw ? formatRupiahInputDisplay(currentAmountRaw) : ''}
              onChange={(e) => setCurrentAmountRaw(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm text-slate-900"
            />
          </div>

          {/* Target Tanggal Tercapai */}
          <div>
            <label htmlFor="input-savings-date" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Target Waktu Selesai <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-savings-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm text-slate-900"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Akun Rekening Penampung (Opsional) */}
          <div>
            <label htmlFor="select-savings-account" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Akun Tempat Menyimpan (Opsional)
            </label>
            <div className="relative">
              <select
                id="select-savings-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm text-slate-900 appearance-none"
              >
                <option value="">-- Tidak Ditautkan --</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
              <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label htmlFor="input-savings-notes" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Catatan Tambahan
            </label>
            <div className="relative">
              <input
                id="input-savings-notes"
                type="text"
                placeholder="Misal: Nabung Rp 500rb per bulan"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm text-slate-900"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              id="btn-cancel-savings-form"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              BATAL
            </button>
            <button
              id="btn-submit-savings-form"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN TARGET'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
