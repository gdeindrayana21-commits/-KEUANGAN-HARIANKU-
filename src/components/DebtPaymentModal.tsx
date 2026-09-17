import React, { useState } from 'react';
import { X, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { Debt, Receivable, DebtPayment } from '../types';
import { formatRupiahInputDisplay, parseRupiahInput, formatRupiah } from '../utils/currency';
import { getTodayString, formatTanggalIndonesia } from '../utils/date';

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'debt' | 'receivable';
  item: Debt | Receivable | null;
  onSubmit: (itemId: string, paymentData: {
    amount: number;
    date: string;
    note?: string;
  }) => Promise<void>;
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  isOpen,
  onClose,
  type,
  item,
  onSubmit,
}) => {
  const isDebt = type === 'debt';
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !item) return null;

  const total = item.totalAmount;
  const currentPaid = isDebt
    ? (item as Debt).paidAmount || 0
    : (item as Receivable).receivedAmount || 0;
  const remaining = Math.max(0, total - currentPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const amt = parseRupiahInput(amountRaw);
    if (amt <= 0 || !date) {
      setErrorMessage('Lengkapi nominal pembayaran dan tanggal.');
      return;
    }

    if (amt > remaining) {
      setErrorMessage(`Nominal melebihi sisa kewajiban (${formatRupiah(remaining)}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit(item.id, {
        amount: amt,
        date,
        note: note.trim() || undefined,
      });
      setAmountRaw('');
      setNote('');
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal mencatat pembayaran.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayFull = () => {
    setAmountRaw(String(remaining));
  };

  return (
    <div
      id="modal-debt-payment-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="modal-debt-payment-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isDebt ? 'Bayar Cicilan Hutang' : 'Terima Cicilan Piutang'}
            </h2>
            <p className="text-xs text-slate-500">Pihak: {item.personName}</p>
          </div>
          <button
            id="btn-close-debt-pay-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Pokok:</span>
              <span className="font-semibold text-slate-900">{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {isDebt ? 'Sudah Dibayar:' : 'Sudah Diterima:'}
              </span>
              <span className="font-semibold text-emerald-600">{formatRupiah(currentPaid)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200/60">
              <span className="font-medium text-slate-700">Sisa Kewajiban:</span>
              <span className="font-bold text-rose-600">{formatRupiah(remaining)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-pay-amount" className="block text-xs font-semibold uppercase text-slate-500">
                Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handlePayFull}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Lunaskan Penuh ({formatRupiah(remaining)})
              </button>
            </div>
            <input
              id="input-pay-amount"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 200.000"
              value={amountRaw ? formatRupiahInputDisplay(amountRaw) : ''}
              onChange={(e) => setAmountRaw(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-lg font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="input-pay-date" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Tanggal Pembayaran <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-pay-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-sm text-slate-900"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="input-pay-note" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Catatan / Bukti Bayar
            </label>
            <input
              id="input-pay-note"
              type="text"
              placeholder="Contoh: Cicilan ke-2 transfer BCA"
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN PEMBAYARAN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
