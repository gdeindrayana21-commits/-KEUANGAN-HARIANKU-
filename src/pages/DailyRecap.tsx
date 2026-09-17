import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale, ReceiptText } from 'lucide-react';
import { Transaction } from '../types';
import {
  getTodayString,
  formatTanggalLengkap,
  parseLocalDate,
  toDateString,
} from '../utils/date';
import { formatRupiah } from '../utils/currency';

interface DailyRecapProps {
  transactions: Transaction[];
  onOpenNewTransaction?: () => void;
}

export const DailyRecap: React.FC<DailyRecapProps> = ({ transactions }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const handlePrevDay = () => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(toDateString(d));
  };

  const handleNextDay = () => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(toDateString(d));
  };

  const handleToday = () => {
    setSelectedDate(getTodayString());
  };

  // Filter transactions for this day
  const dayTransactions = transactions.filter((tx) => tx.date === selectedDate);
  const incomeList = dayTransactions.filter((tx) => tx.type === 'income');
  const expenseList = dayTransactions.filter((tx) => tx.type === 'expense');

  const totalIncome = incomeList.reduce((sum, tx) => sum + Math.round(Number(tx.amount) || 0), 0);
  const totalExpense = expenseList.reduce((sum, tx) => sum + Math.round(Number(tx.amount) || 0), 0);
  const netIncome = totalIncome - totalExpense;
  const transactionsCount = dayTransactions.length;

  return (
    <div className="space-y-6">
      {/* Header & Date Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Rekap Harian
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan dan rincian transaksi harian Anda
          </p>
        </div>

        {/* Date Controls */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-recap-prev-day"
            type="button"
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center">
            <input
              id="input-recap-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-emerald-500 cursor-pointer"
            />
          </div>

          <button
            id="btn-recap-next-day"
            type="button"
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Hari Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            id="btn-recap-today"
            type="button"
            onClick={handleToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              selectedDate === getTodayString()
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Selected Date Badge & Summary Cards (Section 10) */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 bg-slate-100/80 px-4 py-2 rounded-xl w-fit">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>{formatTanggalLengkap(selectedDate)}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Pemasukan */}
          <div className="bg-white rounded-2xl p-4.5 border border-emerald-100 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
                TOTAL PEMASUKAN
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold tracking-tight text-emerald-600">
              {formatRupiah(totalIncome)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{incomeList.length} transaksi</p>
          </div>

          {/* Total Pengeluaran */}
          <div className="bg-white rounded-2xl p-4.5 border border-rose-100 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider text-rose-700 uppercase">
                TOTAL PENGELUARAN
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold tracking-tight text-rose-600">
              {formatRupiah(totalExpense)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{expenseList.length} transaksi</p>
          </div>

          {/* Saldo Bersih */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                SALDO BERSIH
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-xl font-bold tracking-tight ${
                netIncome >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatRupiah(netIncome)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Pemasukan − Pengeluaran</p>
          </div>

          {/* Jumlah Transaksi */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                JUMLAH TRANSAKSI
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ReceiptText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold tracking-tight text-slate-900">
              {transactionsCount}{' '}
              <span className="text-sm font-normal text-slate-600">transaksi</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total hari ini</p>
          </div>
        </div>
      </div>

      {/* Detail Transaksi: Pemasukan & Pengeluaran (Section 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* PEMASUKAN */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Daftar Pemasukan
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {formatRupiah(totalIncome)}
            </span>
          </div>

          {incomeList.length === 0 ? (
            <div className="py-10 text-center text-xs font-medium text-slate-400">
              Tidak ada pemasukan pada hari ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {incomeList.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {tx.time || '-'}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {tx.categoryName}
                      </span>
                    </div>
                    {tx.description && (
                      <p className="text-xs text-slate-600 truncate">{tx.description}</p>
                    )}
                    <span className="inline-block text-[10px] font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                      {tx.accountName}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-emerald-600 block">
                      +{formatRupiah(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PENGELUARAN */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Daftar Pengeluaran
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
              {formatRupiah(totalExpense)}
            </span>
          </div>

          {expenseList.length === 0 ? (
            <div className="py-10 text-center text-xs font-medium text-slate-400">
              Tidak ada pengeluaran pada hari ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {expenseList.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {tx.time || '-'}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {tx.categoryName}
                      </span>
                    </div>
                    {tx.description && (
                      <p className="text-xs text-slate-600 truncate">{tx.description}</p>
                    )}
                    <span className="inline-block text-[10px] font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                      {tx.accountName}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-rose-600 block">
                      −{formatRupiah(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
