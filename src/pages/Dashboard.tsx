import React, { useState } from 'react';
import {
  Filter,
  Calendar,
  ReceiptText,
  ArrowRight,
  Banknote,
  Landmark,
  ArrowUpRight,
  Settings2,
  Plus,
} from 'lucide-react';
import { Account, Transaction, PeriodFilter } from '../types';
import {
  calculateDashboardSummary,
  calculateCategoryBreakdown,
  calculateCashFlowChartData,
  calculateBalanceProgress,
  calculateAutomatedInsights,
} from '../utils/calculations';
import { formatRupiah } from '../utils/currency';
import { getTodayString } from '../utils/date';
import { SummaryCard } from '../components/SummaryCard';
import { CashFlowChart } from '../components/CashFlowChart';
import { CategoryPieChart } from '../components/CategoryPieChart';
import { BalanceProgressChart } from '../components/BalanceProgressChart';
import { FinancialAnalysisCard } from '../components/FinancialAnalysisCard';
import { TransactionList } from '../components/TransactionList';
import { BankTopUpModal } from '../components/BankTopUpModal';

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onViewAllTransactions: () => void;
  onManageAccounts?: () => void;
  onRecordBankIncome?: (data: {
    accountId: string;
    accountName: string;
    amount: number;
    sourceLabel: string;
    date: string;
    description: string;
  }) => Promise<void>;
  onDirectAdjustBalance?: (
    accountId: string,
    newCurrentBalance: number,
    note: string
  ) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  accounts,
  transactions,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onViewAllTransactions,
  onManageAccounts,
  onRecordBankIncome,
  onDirectAdjustBalance,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [customStart, setCustomStart] = useState<string>(getTodayString());
  const [customEnd, setCustomEnd] = useState<string>(getTodayString());
  const [appliedCustomStart, setAppliedCustomStart] = useState<string>('');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState<string>('');
  const [showCustomInputs, setShowCustomInputs] = useState<boolean>(false);
  const [topUpBankAccount, setTopUpBankAccount] = useState<Account | null>(null);
  const [selectedChartAccountId, setSelectedChartAccountId] = useState<string>('');

  const periodOptions: { id: PeriodFilter; label: string }[] = [
    { id: 'today', label: 'Hari Ini' },
    { id: 'this_week', label: 'Minggu Ini' },
    { id: 'this_month', label: 'Bulan Ini' },
    { id: 'last_month', label: 'Bulan Lalu' },
    { id: 'this_year', label: 'Tahun Ini' },
    { id: 'custom', label: 'Custom' },
  ];

  const handlePeriodChange = (selected: PeriodFilter) => {
    setPeriod(selected);
    if (selected === 'custom') {
      setShowCustomInputs(true);
    } else {
      setShowCustomInputs(false);
      setAppliedCustomStart('');
      setAppliedCustomEnd('');
    }
  };

  const handleApplyCustomDate = () => {
    if (customStart && customEnd) {
      setAppliedCustomStart(customStart);
      setAppliedCustomEnd(customEnd);
    }
  };

  const activeStart =
    period === 'custom' ? appliedCustomStart || customStart : undefined;
  const activeEnd =
    period === 'custom' ? appliedCustomEnd || customEnd : undefined;

  const getPeriodLabel = (p: PeriodFilter): string => {
    switch (p) {
      case 'today':
        return 'Hari Ini';
      case 'this_week':
        return 'Minggu Ini';
      case 'this_month':
        return 'Bulan Ini';
      case 'last_month':
        return 'Bulan Lalu';
      case 'this_year':
        return 'Tahun Ini';
      case 'custom':
        return activeStart && activeEnd
          ? `${activeStart} s/d ${activeEnd}`
          : 'Periode Kustom';
      default:
        return 'Semua Waktu';
    }
  };

  // Separate Cash accounts and Bank accounts strictly — never combine their balances
  const activeAccounts = accounts.filter((a) => a.isActive);
  const cashAccounts = activeAccounts.filter((a) => a.type === 'Cash');
  const bankAccounts = activeAccounts.filter((a) => a.type !== 'Cash');

  const selectedChartAccount =
    activeAccounts.find((a) => a.id === selectedChartAccountId) ||
    cashAccounts[0] ||
    bankAccounts[0] ||
    activeAccounts[0] ||
    null;

  // Calculations
  const summary = calculateDashboardSummary(
    transactions,
    accounts,
    period,
    activeStart,
    activeEnd
  );
  const categoriesBreakdown = calculateCategoryBreakdown(
    transactions.filter((tx) => {
      if (period === 'custom' && activeStart && activeEnd) {
        return tx.date >= activeStart && tx.date <= activeEnd;
      }
      return true;
    }),
    'expense'
  );
  const cashFlowData = calculateCashFlowChartData(
    transactions,
    period,
    activeStart,
    activeEnd
  );
  const balanceProgressData = selectedChartAccount
    ? calculateBalanceProgress(
        transactions,
        [selectedChartAccount],
        period,
        activeStart,
        activeEnd
      )
    : [];
  const automatedInsights = calculateAutomatedInsights(
    transactions,
    accounts,
    period,
    activeStart,
    activeEnd
  );

  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* 1. Header & Filter Periode */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Dashboard Keuangan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Saldo Akun Cash dan setiap Rekening Bank ditampilkan terpisah (tidak digabungkan)
            </p>
          </div>

          {/* Filter Periode Buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center text-xs text-slate-500 font-semibold uppercase mr-1">
              <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span className="hidden sm:inline">Periode:</span>
            </div>
            {periodOptions.map((opt) => {
              const isSelected = period === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`btn-period-${opt.id}`}
                  type="button"
                  onClick={() => handlePeriodChange(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Inputs if Custom selected */}
        {showCustomInputs && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">Dari:</span>
              <input
                id="input-custom-start-date"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-emerald-500 bg-slate-50"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-600">Sampai:</span>
              <input
                id="input-custom-end-date"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-emerald-500 bg-slate-50"
              />
            </div>

            <button
              id="btn-apply-custom-date"
              type="button"
              onClick={handleApplyCustomDate}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              TERAPKAN
            </button>
          </div>
        )}
      </div>

      {/* 2. Saldo Masing-Masing Akun Terpisah: Akun Cash & Setiap Rekening Bank Berdiri Sendiri */}
      <div className="space-y-4">
        {/* Bagian A: Akun Cash */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Saldo Akun Cash (Uang Tunai & Pemasukan)
              </h3>
            </div>
            {onManageAccounts && (
              <button
                type="button"
                onClick={onManageAccounts}
                className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Kelola / Hapus Akun</span>
              </button>
            )}
          </div>

          {cashAccounts.length === 0 ? (
            <div className="bg-white p-4 rounded-2xl border border-dashed border-emerald-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Belum ada Akun Cash aktif.
              </span>
              {onManageAccounts && (
                <button
                  type="button"
                  onClick={onManageAccounts}
                  className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                >
                  + Buat Akun Cash
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cashAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold">
                          <span>{acc.name}</span>
                          <span>·</span>
                          <span>Akun Cash</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
                          {formatRupiah(acc.currentBalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Saldo <strong>{acc.name}</strong> terpisah dari Rekening Bank. Otomatis bertambah saat ada pemasukan dan hanya berkurang saat ada pengeluaran tunai (Cash).
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bagian B: Setiap Rekening Bank Ditampilkan Terpisah Masing-Masing (Tidak Digabung) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Landmark className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Saldo Masing-Masing Rekening Bank ({bankAccounts.length} Rekening — Tidak Digabung)
              </h3>
            </div>
            {onManageAccounts && (
              <button
                type="button"
                onClick={onManageAccounts}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah / Hapus Bank</span>
              </button>
            )}
          </div>

          {bankAccounts.length === 0 ? (
            <div className="bg-white p-4 rounded-2xl border border-dashed border-blue-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Belum ada Rekening Bank aktif.
              </span>
              {onManageAccounts && (
                <button
                  type="button"
                  onClick={onManageAccounts}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  + Buat Rekening Bank
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-white p-5 rounded-2xl border border-blue-200/90 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 text-xs text-blue-700 font-bold truncate">
                          <span className="truncate">{acc.name}</span>
                          <span>·</span>
                          <span>Bank</span>
                        </div>
                        <div
                          className={`text-2xl font-bold tabular-nums mt-0.5 ${
                            acc.currentBalance >= 0
                              ? 'text-slate-900'
                              : 'text-rose-600'
                          }`}
                        >
                          {formatRupiah(acc.currentBalance)}
                        </div>
                      </div>
                    </div>

                    {onRecordBankIncome && onDirectAdjustBalance && (
                      <button
                        type="button"
                        onClick={() => setTopUpBankAccount(acc)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-xl flex items-center space-x-1 shadow-xs transition-colors cursor-pointer shrink-0"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>+ Gaji / Edit</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Saldo <strong>{acc.name}</strong> berdiri sendiri (tidak digabung dengan bank lain maupun Cash). Otomatis berkurang saat ada pengeluaran dari rekening ini.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. 4 Kartu Statistik Arus Kas Periode (Tanpa Menggabungkan Saldo Akun) */}
      <SummaryCard
        periodIncome={summary.periodIncome}
        periodExpense={summary.periodExpense}
        netIncome={summary.netIncome}
        transactionsCount={summary.transactionsCount}
        incomeComparison={summary.incomeComparison}
        expenseComparison={summary.expenseComparison}
        periodLabel={getPeriodLabel(period)}
      />

      {/* 4. Grafik Pemasukan vs Pengeluaran & Grafik Pengeluaran Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <CashFlowChart
            data={cashFlowData}
            title={`Arus Kas (${getPeriodLabel(period)})`}
          />
        </div>
        <div className="lg:col-span-5">
          <CategoryPieChart
            categories={categoriesBreakdown}
            title="Pengeluaran Berdasarkan Kategori"
          />
        </div>
      </div>

      {/* 5. Grafik Perkembangan Saldo Per Masing-Masing Akun (Tidak Digabung) */}
      <div className="space-y-2.5">
        {activeAccounts.length > 0 && (
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">
              Pilih Akun untuk Grafik Perkembangan Saldo (Per Akun):
            </span>
            <div className="flex items-center flex-wrap gap-1.5">
              {activeAccounts.map((acc) => {
                const isSelected = selectedChartAccount?.id === acc.id;
                const isBank = acc.type !== 'Cash';
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedChartAccountId(acc.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? isBank
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {acc.name} ({formatRupiah(acc.currentBalance)})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <BalanceProgressChart
          data={balanceProgressData}
          title={`Perkembangan Saldo ${
            selectedChartAccount ? selectedChartAccount.name : ''
          } (${getPeriodLabel(period)})`}
        />
      </div>

      {/* 6. Analisis Otomatis & Daftar Akun Masing-Masing */}
      <FinancialAnalysisCard
        insights={automatedInsights}
        periodLabel={getPeriodLabel(period)}
      />

      {/* 7. Transaksi Terbaru (Maksimal 10) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ReceiptText className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-bold text-slate-900">
              Transaksi Terbaru
            </h3>
            <span className="text-xs text-slate-500">· 10 Terakhir</span>
          </div>

          {transactions.length > 0 && (
            <button
              id="btn-see-all-transactions"
              type="button"
              onClick={onViewAllTransactions}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              <span>Lihat Semua Transaksi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <TransactionList
          transactions={recentTransactions}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
          onAddNew={onOpenNewTransaction}
          emptyMessage="Belum ada transaksi tercatat."
        />
      </div>

      {/* Bank TopUp / Edit Saldo Modal on Dashboard */}
      {onRecordBankIncome && onDirectAdjustBalance && (
        <BankTopUpModal
          isOpen={!!topUpBankAccount}
          account={topUpBankAccount}
          onClose={() => setTopUpBankAccount(null)}
          onRecordBankIncome={onRecordBankIncome}
          onDirectAdjustBalance={onDirectAdjustBalance}
        />
      )}
    </div>
  );
};
