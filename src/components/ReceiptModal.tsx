import React from 'react';
import { X, Download, Receipt, Calendar, Wallet } from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah } from '../utils/currency';
import { formatTanggalIndonesia } from '../utils/date';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  if (!transaction || !transaction.receiptImageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = transaction.receiptImageUrl!;
    link.download =
      transaction.receiptFileName || `struk-${transaction.date}-${transaction.id.slice(0, 6)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="modal-receipt-preview"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bukti / Struk Pembelanjaan
              </h3>
              <p className="text-xs text-slate-500">
                {transaction.categoryName || 'Transaksi'} · {formatRupiah(transaction.amount)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Container */}
        <div className="p-4 bg-slate-900 flex items-center justify-center max-h-[65vh] overflow-y-auto">
          <img
            src={transaction.receiptImageUrl}
            alt={transaction.receiptFileName || 'Foto Struk Pembelanjaan'}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Transaction Summary & Download Footer */}
        <div className="p-4 bg-white border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {formatTanggalIndonesia(transaction.date)}{' '}
                {transaction.time ? `• ${transaction.time}` : ''}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 font-medium text-slate-800">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Akun: {transaction.accountName}</span>
            </div>
          </div>

          {transaction.description && (
            <p className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
              {transaction.description}
            </p>
          )}

          <div className="flex items-center justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Foto Struk</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
