import React from 'react';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah } from '../utils/currency';
import { formatTanggalIndonesia } from '../utils/date';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  return (
    <div
      id={`tx-card-${transaction.id}`}
      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isIncome
                ? 'bg-emerald-50 text-emerald-600'
                : isTransfer
                ? 'bg-blue-50 text-blue-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isIncome ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : isTransfer ? (
              <ArrowLeftRight className="w-5 h-5" />
            ) : (
              <ArrowDownLeft className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              {isTransfer ? 'Transfer Antar Akun' : transaction.categoryName}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span>{formatTanggalIndonesia(transaction.date)}</span>
              <span>•</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                {isTransfer
                  ? `${transaction.accountName} ➔ ${transaction.toAccountName || 'Tujuan'}`
                  : transaction.accountName}
              </span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <div
            className={`text-base font-bold tracking-tight ${
              isIncome
                ? 'text-emerald-600'
                : isTransfer
                ? 'text-blue-600'
                : 'text-rose-600'
            }`}
          >
            {isIncome
              ? `+${formatRupiah(transaction.amount)}`
              : isTransfer
              ? formatRupiah(transaction.amount)
              : `-${formatRupiah(transaction.amount)}`}
          </div>
          {transaction.time && (
            <span className="text-xs text-slate-400">{transaction.time}</span>
          )}
        </div>
      </div>

      {transaction.description && (
        <p className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg italic">
          "{transaction.description}"
        </p>
      )}

      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-50">
        <button
          id={`btn-edit-tx-card-${transaction.id}`}
          type="button"
          onClick={() => onEdit(transaction)}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
        <button
          id={`btn-delete-tx-card-${transaction.id}`}
          type="button"
          onClick={() => onDelete(transaction)}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
};
