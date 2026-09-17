import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, AlertCircle } from 'lucide-react';
import { SavingsGoal } from '../types';
import { formatRupiahInputDisplay, parseRupiahInput, formatRupiah } from '../utils/currency';

interface SavingsDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onSubmit: (goalId: string, amount: number, isWithdraw: boolean) => Promise<void>;
}

export const SavingsDepositModal: React.FC<SavingsDepositModalProps> = ({
  isOpen,
  onClose,
  goal,
  onSubmit,
}) => {
  const [isWithdraw, setIsWithdraw] = useState<boolean>(false);
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const amt = parseRupiahInput(amountRaw);
    if (amt <= 0) {
      setErrorMessage('Nominal harus lebih dari 0.');
      return;
    }

    if (isWithdraw && amt > goal.currentAmount) {
      setErrorMessage(`Nominal penarikan melebihi saldo tabungan (${formatRupiah(goal.currentAmount)}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit(goal.id, amt, isWithdraw);
      setAmountRaw('');
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal memperbarui saldo tabungan.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-savings-deposit-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="modal-savings-deposit-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isWithdraw ? 'Tarik Dana Tabungan' : 'Setor Dana Tabungan'}
            </h2>
            <p className="text-xs text-slate-500">{goal.name}</p>
          </div>
          <button
            id="btn-close-deposit-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setIsWithdraw(false)}
              className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                !isWithdraw
                  ? 'bg-white text-teal-600 shadow-xs border border-teal-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 mr-1.5" />
              + SETOR TABUNGAN
            </button>
            <button
              type="button"
              onClick={() => setIsWithdraw(true)}
              className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                isWithdraw
                  ? 'bg-white text-rose-600 shadow-xs border border-rose-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5" />
              - TARIK TABUNGAN
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Saldo Tabungan Saat Ini:</span>
            <span className="font-bold text-slate-900">{formatRupiah(goal.currentAmount)}</span>
          </div>

          <div>
            <label htmlFor="input-deposit-amount" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Nominal {isWithdraw ? 'Tarik' : 'Setor'} (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-deposit-amount"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 250.000"
              value={amountRaw ? formatRupiahInputDisplay(amountRaw) : ''}
              onChange={(e) => setAmountRaw(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-lg font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
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
              className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 ${
                isWithdraw ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isSubmitting ? 'MEMPROSES...' : isWithdraw ? 'KONFIRMASI TARIK' : 'KONFIRMASI SETOR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
