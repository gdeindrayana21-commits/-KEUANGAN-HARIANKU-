import React, { useState } from 'react';
import { Filter, Calendar, ReceiptText, ArrowRight, Sparkles } from 'lucide-react';
import { Account, Transaction, PeriodFilter } from '../types';
import {
  calculateDashboardSummary,
  calculateCategoryBreakdown,
  calculateCashFlowChartData,
  calculateBalanceProgress,
  calculateAutomatedInsights,
} from '../utils/calculations';
import { getTodayString } from '../utils/date';
import { SummaryCard } from '../components/SummaryCard';
import { CashFlowChart } from '../components/CashFlowChart';
import { CategoryPieChart } from '../components/CategoryPieChart';
import { BalanceProgressChart } from '../components/BalanceProgressChart';
import { FinancialAnalysisCard } from '../components/FinancialAnalysisCard';
import { TransactionList } from '../components/TransactionList';

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onViewAllTransactions: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  accounts,
  transactions,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onViewAllTransactions,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [customStart, setCustomStart] = useState<string>(getTodayString());
  const [customEnd, setCustomEnd] = useState<string>(getTodayString());
  const [appliedCustomStart, setAppliedCustomStart] = useState<string>('');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState<string>('');
  const [showCustomInputs, setShowCustomInputs] = useState<boolean>(false);

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

  const activeStart = period === 'custom' ? appliedCustomStart || customStart : undefined;
  const activeEnd = period === 'custom' ? appliedCustomEnd || customEnd : undefined;

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
        return activeStart && activeEnd ? `${activeStart} s/d ${activeEnd}` : 'Periode Kustom';
      default:
        return 'Semua Waktu';
    }
  };

  // Calculations
  const summary = calculateDashboardSummary(transactions, accounts, period, activeStart, activeEnd);
  const categoriesBreakdown = calculateCategoryBreakdown(
    transactions.filter((tx) => {
      if (period === 'custom' && activeStart && activeEnd) {
        return tx.date >= activeStart && tx.date <= activeEnd;
      }
      return true;
    }),
    'expense'
  );
  const cashFlowData = calculateCashFlowChartData(transactions, period, activeStart, activeEnd);
  const balanceProgressData = calculateBalanceProgress(transactions, accounts, period, activeStart, activeEnd);
  const automatedInsights = calculateAutomatedInsights(transactions, accounts, period, activeStart, activeEnd);

  // Top 10 latest transactions
  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* 1. Header & Filter Periode (Section 3) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Dashboard Keuangan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ringkasan kondisi keuangan Anda
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

      {/* 2. 5 Kartu Statistik Utama (Sections 4 & 5) */}
      <SummaryCard
        totalBalance={summary.totalBalance}
        periodIncome={summary.periodIncome}
        periodExpense={summary.periodExpense}
        netIncome={summary.netIncome}
        transactionsCount={summary.transactionsCount}
        incomeComparison={summary.incomeComparison}
        expenseComparison={summary.expenseComparison}
        periodLabel={getPeriodLabel(period)}
      />

      {/* 3. Grafik Pemasukan vs Pengeluaran & Grafik Pengeluaran Kategori (Sections 6, 7, 8) */}
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

      {/* 4. Grafik Perkembangan Saldo (Section 9) */}
      <div>
        <BalanceProgressChart
          data={balanceProgressData}
          title={`Perkembangan Saldo (${getPeriodLabel(period)})`}
        />
      </div>

      {/* 5. Analisis Otomatis & Akun Saldo Terbesar (Sections 22, 23, 24) */}
      <FinancialAnalysisCard
        insights={automatedInsights}
        periodLabel={getPeriodLabel(period)}
      />

      {/* 6. Transaksi Terbaru (Maksimal 10) (Section 21) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ReceiptText className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-bold text-slate-900">
              Transaksi Terbaru
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
              10 Terakhir
            </span>
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
    </div>
  );
};
