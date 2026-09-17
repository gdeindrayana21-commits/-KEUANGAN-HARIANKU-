import React, { useState, useMemo } from 'react';
import {
  Plus,
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  DollarSign,
} from 'lucide-react';
import { Debt, Receivable } from '../types';
import { formatRupiah } from '../utils/currency';
import { formatTanggalIndonesia, getDaysRemaining } from '../utils/date';
import { DebtForm } from '../components/DebtForm';
import { DebtPaymentModal } from '../components/DebtPaymentModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface DebtsProps {
  debts: Debt[];
  receivables: Receivable[];
  onCreateDebt: (data: {
    personName: string;
    totalAmount: number;
    paidAmount?: number;
    dueDate: string;
    notes?: string;
  }) => Promise<void>;
  onUpdateDebt: (
    debtId: string,
    data: {
      personName: string;
      totalAmount: number;
      dueDate: string;
      notes?: string;
    }
  ) => Promise<void>;
  onAddDebtPayment: (
    debtId: string,
    data: { amount: number; date: string; note?: string }
  ) => Promise<void>;
  onDeleteDebt: (debtId: string) => Promise<void>;

  onCreateReceivable: (data: {
    personName: string;
    totalAmount: number;
    receivedAmount?: number;
    dueDate: string;
    notes?: string;
  }) => Promise<void>;
  onUpdateReceivable: (
    receivableId: string,
    data: {
      personName: string;
      totalAmount: number;
      dueDate: string;
      notes?: string;
    }
  ) => Promise<void>;
  onAddReceivablePayment: (
    receivableId: string,
    data: { amount: number; date: string; note?: string }
  ) => Promise<void>;
  onDeleteReceivable: (receivableId: string) => Promise<void>;
}

export const Debts: React.FC<DebtsProps> = ({
  debts,
  receivables,
  onCreateDebt,
  onUpdateDebt,
  onAddDebtPayment,
  onDeleteDebt,
  onCreateReceivable,
  onUpdateReceivable,
  onAddReceivablePayment,
  onDeleteReceivable,
}) => {
  const [activeTab, setActiveTab] = useState<'debt' | 'receivable'>('debt');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Debt | Receivable | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [paymentTargetItem, setPaymentTargetItem] = useState<Debt | Receivable | null>(null);
  const [deletingItem, setDeletingItem] = useState<Debt | Receivable | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const isDebtTab = activeTab === 'debt';
  const currentList = isDebtTab ? debts : receivables;

  // Filter list
  const filteredList = useMemo(() => {
    return currentList.filter((item) => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'paid') return item.status === 'paid';
      return item.status === 'unpaid' || item.status === 'partially_paid';
    });
  }, [currentList, filterStatus]);

  // Overall statistics for debts and receivables
  const totalDebtUnpaid = useMemo(() => {
    return debts.reduce((sum, d) => sum + Math.max(0, d.totalAmount - (d.paidAmount || 0)), 0);
  }, [debts]);

  const totalReceivableUnpaid = useMemo(() => {
    return receivables.reduce((sum, r) => sum + Math.max(0, r.totalAmount - (r.receivedAmount || 0)), 0);
  }, [receivables]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Debt | Receivable) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleOpenPayment = (item: Debt | Receivable) => {
    setPaymentTargetItem(item);
    setIsPaymentOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      if (isDebtTab) {
        await onDeleteDebt(deletingItem.id);
      } else {
        await onDeleteReceivable(deletingItem.id);
      }
      setDeletingItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Hutang & Piutang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola kewajiban hutang dan tagihan piutang lengkap dengan riwayat cicilan
          </p>
        </div>

        <button
          id="btn-add-debt"
          type="button"
          onClick={handleOpenAdd}
          className={`inline-flex items-center space-x-1.5 px-4 py-2.5 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto ${
            isDebtTab ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isDebtTab ? '+ Catat Hutang' : '+ Catat Piutang'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setActiveTab('debt')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            isDebtTab
              ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Total Hutang Belum Lunas
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-2">
            {formatRupiah(totalDebtUnpaid)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {debts.filter((d) => d.status !== 'paid').length} catatan hutang aktif
          </div>
        </div>

        <div
          onClick={() => setActiveTab('receivable')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            !isDebtTab
              ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Total Piutang Belum Diterima
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-2">
            {formatRupiah(totalReceivableUnpaid)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {receivables.filter((r) => r.status !== 'paid').length} tagihan piutang aktif
          </div>
        </div>
      </div>

      {/* Main Tabs (Hutang Saya / Piutang Saya) and Filter Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('debt')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              isDebtTab
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Hutang Saya ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receivable')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              !isDebtTab
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Piutang Saya ({receivables.length})
          </button>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('unpaid')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'unpaid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Belum Lunas
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'paid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Lunas
          </button>
        </div>
      </div>

      {/* Cards List */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <HandCoins className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Belum ada catatan {isDebtTab ? 'hutang' : 'piutang'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isDebtTab
              ? 'Catat pinjaman atau kewajiban finansial Anda agar terkelola dengan aman.'
              : 'Catat uang yang dipinjam oleh teman atau pihak lain agar tidak terlupa.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className={`mt-4 px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center space-x-1 ${
              isDebtTab ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isDebtTab ? 'Catat Hutang Sekarang' : 'Catat Piutang Sekarang'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => {
            const currentPaid = isDebtTab
              ? (item as Debt).paidAmount || 0
              : (item as Receivable).receivedAmount || 0;
            const remaining = Math.max(0, item.totalAmount - currentPaid);
            const percent = Math.min(
              Math.round((currentPaid / item.totalAmount) * 100),
              100
            );
            const isLunas = item.status === 'paid' || remaining <= 0;
            const daysLeft = getDaysRemaining(item.dueDate);
            const isOverdue = !isLunas && daysLeft < 0;
            const isDueSoon = !isLunas && daysLeft >= 0 && daysLeft <= 3;
            const isExpanded = expandedPaymentId === item.id;
            const payments = item.payments || [];

            return (
              <div
                key={item.id}
                id={`debt-card-${item.id}`}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between ${
                  isLunas
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {item.personName}
                        </h3>
                        {isLunas ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            <span>LUNAS</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>JATUH TEMPO LEWAT ({Math.abs(daysLeft)} HARI)</span>
                          </span>
                        ) : isDueSoon ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>SISA {daysLeft} HARI LAGI</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                            <Clock className="w-3 h-3" />
                            <span>Jatuh Tempo: {daysLeft} hari</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Jatuh Tempo: {formatTanggalIndonesia(item.dueDate)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Catatan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mt-4 grid grid-cols-2 gap-2 p-3 bg-slate-50/80 rounded-xl">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400">Total Pokok</span>
                      <div className="text-sm font-bold text-slate-900">{formatRupiah(item.totalAmount)}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        {isDebtTab ? 'Sisa Hutang' : 'Sisa Piutang'}
                      </span>
                      <div className={`text-sm font-bold ${isLunas ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatRupiah(remaining)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{isDebtTab ? 'Sudah dibayar' : 'Sudah diterima'}: {formatRupiah(currentPaid)}</span>
                      <span className="font-bold">{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLunas
                            ? 'bg-emerald-500'
                            : isDebtTab
                            ? 'bg-rose-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 italic mt-3 bg-slate-50 p-2 rounded-lg">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom actions: Catat Pembayaran & Riwayat */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedPaymentId(isExpanded ? null : item.id)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 font-medium"
                  >
                    <span>{payments.length} Riwayat Bayar</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {!isLunas && (
                    <button
                      type="button"
                      onClick={() => handleOpenPayment(item)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
                        isDebtTab ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{isDebtTab ? 'Bayar Cicilan' : 'Terima Pembayaran'}</span>
                    </button>
                  )}
                </div>

                {/* Expanded Payment History */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-semibold uppercase text-slate-400">Riwayat Pembayaran:</p>
                    {payments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Belum ada catatan pembayaran.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {payments.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">
                                {formatRupiah(p.amount)}
                              </span>
                              {p.note && <span className="text-slate-400 ml-2">({p.note})</span>}
                            </div>
                            <span className="text-slate-400">{formatTanggalIndonesia(p.date)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <DebtForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        type={activeTab}
        initialData={editingItem}
        onSubmit={async (data) => {
          if (editingItem) {
            if (isDebtTab) {
              await onUpdateDebt(editingItem.id, data);
            } else {
              await onUpdateReceivable(editingItem.id, data);
            }
          } else {
            if (isDebtTab) {
              await onCreateDebt(data);
            } else {
              await onCreateReceivable(data);
            }
          }
        }}
      />

      {/* Payment Modal */}
      <DebtPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        type={activeTab}
        item={paymentTargetItem}
        onSubmit={async (itemId, paymentData) => {
          if (isDebtTab) {
            await onAddDebtPayment(itemId, paymentData);
          } else {
            await onAddReceivablePayment(itemId, paymentData);
          }
        }}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        title={`HAPUS CATATAN ${isDebtTab ? 'HUTANG' : 'PIUTANG'}`}
        message={`Apakah Anda yakin ingin menghapus catatan ${isDebtTab ? 'hutang kepada' : 'piutang dari'} "${deletingItem?.personName}"?`}
        confirmLabel="Hapus Catatan"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
};
