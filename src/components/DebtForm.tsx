import React, { useState, useEffect } from 'react';
import { X, HandCoins, Calendar, AlertCircle } from 'lucide-react';
import { Debt, Receivable } from '../types';
import { formatRupiahInputDisplay, parseRupiahInput } from '../utils/currency';
import { getTodayString } from '../utils/date';

interface DebtFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'debt' | 'receivable';
  initialData?: Debt | Receivable | null;
  onSubmit: (data: {
    personName: string;
    totalAmount: number;
    paidAmount?: number;
    dueDate: string;
    notes?: string;
  }) => Promise<void>;
}

export const DebtForm: React.FC<DebtFormProps> = ({
  isOpen,
  onClose,
  type,
  initialData,
  onSubmit,
}) => {
  const isDebt = type === 'debt';
  const [personName, setPersonName] = useState<string>('');
  const [totalAmountRaw, setTotalAmountRaw] = useState<string>('');
  const [initialPaidRaw, setInitialPaidRaw] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setPersonName(initialData.personName);
      setTotalAmountRaw(String(initialData.totalAmount));
      const alreadyPaid = isDebt
        ? (initialData as Debt).paidAmount
        : (initialData as Receivable).receivedAmount;
      setInitialPaidRaw(String(alreadyPaid || 0));
      setDueDate(initialData.dueDate);
      setNotes(initialData.notes || '');
    } else {
      setPersonName('');
      setTotalAmountRaw('');
      setInitialPaidRaw('0');
      // Default due date: 1 month from now
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      setDueDate(d.toISOString().slice(0, 10));
      setNotes('');
    }
    setErrorMessage('');
  }, [initialData, isOpen, type, isDebt]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const total = parseRupiahInput(totalAmountRaw);
    const paid = parseRupiahInput(initialPaidRaw);

    if (!personName.trim() || total <= 0 || !dueDate) {
      setErrorMessage('Lengkapi nama pihak, nominal total, dan tanggal jatuh tempo.');
      return;
    }

    if (paid > total) {
      setErrorMessage('Nominal yang dibayar/diterima tidak boleh melebihi total pokok.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        personName: personName.trim(),
        totalAmount: total,
        paidAmount: paid,
        dueDate,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan catatan.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-debt-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="modal-debt-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDebt ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <HandCoins className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {initialData
                ? `EDIT ${isDebt ? 'HUTANG' : 'PIUTANG'}`
                : `CATAT ${isDebt ? 'HUTANG SAYA' : 'PIUTANG SAYA'}`}
            </h2>
          </div>
          <button
            id="btn-close-debt-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nama Pihak */}
          <div>
            <label htmlFor="input-debt-person" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              {isDebt ? 'Pemberi Pinjaman (Hutang ke Siapa)' : 'Peminjam (Siapa yang Berhutang)'} <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-debt-person"
              type="text"
              placeholder="Contoh: Budi Santoso, Bank Mandiri, Teman Kantor"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-sm text-slate-900"
            />
          </div>

          {/* Nominal Pokok */}
          <div>
            <label htmlFor="input-debt-total" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Total Nominal (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-debt-total"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 1.000.000"
              value={totalAmountRaw ? formatRupiahInputDisplay(totalAmountRaw) : ''}
              onChange={(e) => setTotalAmountRaw(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-lg font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900"
            />
          </div>

          {/* Nominal Sudah Dibayar/Diterima (Saat Pembuatan Baru) */}
          {!initialData && (
            <div>
              <label htmlFor="input-debt-paid-init" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                {isDebt ? 'Sudah Dibayar Sebagian (Rp)' : 'Sudah Diterima Sebagian (Rp)'}
              </label>
              <input
                id="input-debt-paid-init"
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 0"
                value={initialPaidRaw ? formatRupiahInputDisplay(initialPaidRaw) : ''}
                onChange={(e) => setInitialPaidRaw(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-sm text-slate-900"
              />
            </div>
          )}

          {/* Tanggal Jatuh Tempo */}
          <div>
            <label htmlFor="input-debt-date" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Tanggal Jatuh Tempo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-debt-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-sm text-slate-900"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label htmlFor="input-debt-notes" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Keterangan Tambahan
            </label>
            <input
              id="input-debt-notes"
              type="text"
              placeholder="Contoh: Pinjaman modal usaha, DP motor, dll"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-sm text-slate-900"
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
              id="btn-cancel-debt-form"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              BATAL
            </button>
            <button
              id="btn-submit-debt-form"
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 ${
                isDebt ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN CATATAN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
