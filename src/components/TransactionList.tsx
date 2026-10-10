import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ReceiptText,
  Plus,
  Receipt,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah } from '../utils/currency';
import { formatTanggalIndonesia } from '../utils/date';
import { TransactionCard } from './TransactionCard';
import { ReceiptModal } from './ReceiptModal';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onAddNew?: () => void;
  emptyMessage?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onAddNew,
  emptyMessage = 'Belum ada transaksi.',
}) => {
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);

  if (transactions.length === 0) {
    return (
      <div
        id="empty-transaction-state"
        className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <ReceiptText className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-700">{emptyMessage}</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Mulai catat transaksi pemasukan (Cash), pengeluaran (Cash/Bank), beserta foto struk pembelanjaan.
        </p>
        {onAddNew && (
          <button
            id="btn-empty-add-tx"
            type="button"
            onClick={onAddNew}
            className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Transaksi</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Card List (Hidden on sm and larger screens) */}
      <div className="sm:hidden space-y-3">
        {transactions.map((tx) => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewReceipt={(t) => setViewingReceiptTx(t)}
          />
        ))}
      </div>

      {/* Desktop Responsive Table (Visible on sm and larger screens) */}
      <div className="hidden sm:block overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-xs font-semibold text-slate-500 border-b border-slate-200/80 uppercase tracking-wider">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-3">Jenis</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Keterangan & Struk</th>
                <th className="py-3 px-4">Akun</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';

                return (
                  <tr
                    key={tx.id}
                    id={`tx-row-${tx.id}`}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Tanggal */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {formatTanggalIndonesia(tx.date)}
                      {tx.time && (
                        <span className="block text-xs text-slate-400 font-normal">
                          {tx.time}
                        </span>
                      )}
                    </td>

                    {/* Jenis */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-700'
                            : isTransfer
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {isIncome ? (
                          <>
                            <ArrowUpRight className="w-3 h-3 mr-1" /> Pemasukan
                          </>
                        ) : isTransfer ? (
                          <>
                            <ArrowLeftRight className="w-3 h-3 mr-1" /> Transfer
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3 h-3 mr-1" /> Pengeluaran
                          </>
                        )}
                      </span>
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                      {isTransfer ? 'Transfer Antar Akun' : tx.categoryName}
                    </td>

                    {/* Keterangan & Struk */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      <div className="truncate">
                        {tx.description || <span className="text-slate-300">-</span>}
                      </div>
                      {tx.receiptImageUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingReceiptTx(tx)}
                          className="mt-1 inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Lihat Foto Struk</span>
                        </button>
                      )}
                    </td>

                    {/* Akun */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium">
                        {isTransfer
                          ? `${tx.accountName} ➔ ${tx.toAccountName || 'Tujuan'}`
                          : tx.accountName}
                      </span>
                    </td>

                    {/* Nominal */}
                    <td
                      className={`py-3 px-4 whitespace-nowrap text-right font-bold tracking-tight tabular-nums ${
                        isIncome
                          ? 'text-emerald-600'
                          : isTransfer
                          ? 'text-blue-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {isIncome
                        ? `+${formatRupiah(tx.amount)}`
                        : isTransfer
                        ? formatRupiah(tx.amount)
                        : `-${formatRupiah(tx.amount)}`}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center space-x-1">
                        {tx.receiptImageUrl && (
                          <button
                            type="button"
                            onClick={() => setViewingReceiptTx(tx)}
                            title="Lihat foto struk pembelanjaan"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          id={`btn-table-edit-${tx.id}`}
                          type="button"
                          onClick={() => onEdit(tx)}
                          title="Edit transaksi"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-table-delete-${tx.id}`}
                          type="button"
                          onClick={() => onDelete(tx)}
                          title="Hapus transaksi"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Lightbox Modal */}
      <ReceiptModal
        transaction={viewingReceiptTx}
        onClose={() => setViewingReceiptTx(null)}
      />
    </div>
  );
};
