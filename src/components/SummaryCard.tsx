import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  ReceiptText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatRupiah } from '../utils/currency';
import { PeriodComparison } from '../types';

interface SummaryCardProps {
  periodIncome: number;
  periodExpense: number;
  netIncome: number;
  transactionsCount: number;
  incomeComparison: PeriodComparison;
  expenseComparison: PeriodComparison;
  periodLabel: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  periodIncome,
  periodExpense,
  netIncome,
  transactionsCount,
  incomeComparison,
  expenseComparison,
  periodLabel,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. TOTAL PEMASUKAN */}
      <div
        id="card-total-pemasukan"
        className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
            PEMASUKAN ({periodLabel})
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 tabular-nums truncate">
            {formatRupiah(periodIncome)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500 flex-wrap gap-1">
            {incomeComparison.diffNominal !== 0 &&
            incomeComparison.diffPercentage !== null ? (
              <span
                className={`inline-flex items-center font-semibold ${
                  incomeComparison.diffNominal > 0
                    ? 'text-emerald-700'
                    : 'text-slate-600'
                }`}
              >
                {incomeComparison.diffNominal > 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {incomeComparison.label} (
                {incomeComparison.diffPercentage > 0
                  ? `+${incomeComparison.diffPercentage}%`
                  : `${incomeComparison.diffPercentage}%`}
                )
              </span>
            ) : (
              <span>{incomeComparison.label}</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. TOTAL PENGELUARAN */}
      <div
        id="card-total-pengeluaran"
        className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider text-rose-700 uppercase">
            PENGELUARAN ({periodLabel})
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-rose-600 tabular-nums truncate">
            {formatRupiah(periodExpense)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500 flex-wrap gap-1">
            {expenseComparison.diffNominal !== 0 &&
            expenseComparison.diffPercentage !== null ? (
              <span
                className={`inline-flex items-center font-semibold ${
                  expenseComparison.diffNominal > 0
                    ? 'text-rose-700'
                    : 'text-slate-600'
                }`}
              >
                {expenseComparison.diffNominal > 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {expenseComparison.label} (
                {expenseComparison.diffPercentage > 0
                  ? `+${expenseComparison.diffPercentage}%`
                  : `${expenseComparison.diffPercentage}%`}
                )
              </span>
            ) : (
              <span>{expenseComparison.label}</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. SELISIH ARUS KAS PERIODE */}
      <div
        id="card-saldo-bersih-periode"
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
            ARUS KAS BERSIH
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div
            className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums truncate ${
              netIncome >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatRupiah(netIncome)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Pemasukan − Pengeluaran ({periodLabel})
          </p>
        </div>
      </div>

      {/* 4. JUMLAH TRANSAKSI */}
      <div
        id="card-jumlah-transaksi"
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            TRANSAKSI
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ReceiptText className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {transactionsCount}{' '}
            <span className="text-sm font-normal text-slate-600">transaksi</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Pada {periodLabel.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  );
};
