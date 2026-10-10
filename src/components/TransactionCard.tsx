import React from 'react';
import {
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Receipt,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah } from '../utils/currency';
import { formatTanggalIndonesia } from '../utils/date';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onViewReceipt?: (tx: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  onViewReceipt,
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
            <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 mt-0.5">
              <span>{formatTanggalIndonesia(transaction.date)}</span>
              <span>·</span>
              <span className="font-medium text-slate-700">
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
            className={`text-base font-bold tracking-tight tabular-nums ${
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

      {/* Receipt Thumbnail / View Button */}
      {transaction.receiptImageUrl && onViewReceipt && (
        <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl">
          <div className="flex items-center space-x-2.5">
            <img
              src={transaction.receiptImageUrl}
              alt="Struk Pembelanjaan"
              referrerPolicy="no-referrer"
              className="w-10 h-10 object-cover rounded-lg border border-emerald-200 bg-white"
            />
            <span className="text-xs font-semibold text-emerald-900">
              Bukti / Struk Pembelanjaan Tersedia
            </span>
          </div>
          <button
            type="button"
            onClick={() => onViewReceipt(transaction)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Lihat Struk</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-50">
        <button
          id={`btn-edit-tx-card-${transaction.id}`}
          type="button"
          onClick={() => onEdit(transaction)}
          className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
        <button
          id={`btn-delete-tx-card-${transaction.id}`}
          type="button"
          onClick={() => onDelete(transaction)}
          className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
};
