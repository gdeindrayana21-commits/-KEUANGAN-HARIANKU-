import React, { useState } from 'react';
import { CalendarDays, TrendingUp, TrendingDown, Scale, ReceiptText, Calendar } from 'lucide-react';
import { Transaction } from '../types';
import {
  BULAN_INDONESIA,
  getStartOfMonth,
  getEndOfMonth,
  formatTanggalIndonesia,
} from '../utils/date';
import { calculateCategoryBreakdown } from '../utils/calculations';
import { formatRupiah } from '../utils/currency';
import { CategoryPieChart } from '../components/CategoryPieChart';

interface MonthlyRecapProps {
  transactions: Transaction[];
}

export const MonthlyRecap: React.FC<MonthlyRecapProps> = ({ transactions }) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed

  // Total days in the selected month
  const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const startStr = getStartOfMonth(selectedYear, selectedMonth);
  const endStr = getEndOfMonth(selectedYear, selectedMonth);

  // Filter transactions for this month
  const monthTransactions = transactions.filter(
    (tx) => tx.date >= startStr && tx.date <= endStr
  );

  // Daily rows from 1 to totalDaysInMonth
  const dailyRows = [];
  let totalIncome = 0;
  let totalExpense = 0;

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTxs = monthTransactions.filter((tx) => tx.date === dStr);

    let dayIncome = 0;
    let dayExpense = 0;

    for (const tx of dayTxs) {
      const amt = Math.round(Number(tx.amount) || 0);
      if (tx.type === 'income') dayIncome += amt;
      else dayExpense += amt;
    }

    totalIncome += dayIncome;
    totalExpense += dayExpense;

    dailyRows.push({
      day: d,
      dateStr: dStr,
      income: dayIncome,
      expense: dayExpense,
      net: dayIncome - dayExpense,
      count: dayTxs.length,
    });
  }

  const netIncome = totalIncome - totalExpense;
  const transactionsCount = monthTransactions.length;
  const dailyAverageExpense = Math.round(totalExpense / totalDaysInMonth);

  // Category breakdown for this month
  const categoryBreakdown = calculateCategoryBreakdown(monthTransactions, 'expense');

  const yearsOptions = [
    now.getFullYear() - 2,
    now.getFullYear() - 1,
    now.getFullYear(),
    now.getFullYear() + 1,
  ];

  return (
    <div className="space-y-6">
      {/* Header & Month/Year Selectors */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Rekap Bulanan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis arus kas dan rincian transaksi bulanan
          </p>
        </div>

        {/* Month & Year Controls (Section 15) */}
        <div className="flex items-center space-x-2 flex-wrap">
          <select
            id="select-recap-month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-emerald-500 cursor-pointer"
          >
            {BULAN_INDONESIA.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>

          <select
            id="select-recap-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-emerald-500 cursor-pointer"
          >
            {yearsOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards (Section 15) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
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
          <p className="text-[11px] text-slate-400 mt-1">Bulan ini</p>
        </div>

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
          <p className="text-[11px] text-slate-400 mt-1">Bulan ini</p>
        </div>

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

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              TRANSAKSI
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-slate-900">
            {transactionsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Transaksi tercatat</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider text-amber-700 uppercase">
              RATA-RATA / HARI
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-slate-900">
            {formatRupiah(dailyAverageExpense)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pengeluaran / {totalDaysInMonth} hari</p>
        </div>
      </div>

      {/* Category Breakdown Section (Section 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <CategoryPieChart
            categories={categoryBreakdown}
            title={`Pengeluaran per Kategori (${BULAN_INDONESIA[selectedMonth]} ${selectedYear})`}
          />
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Tabel Rekap Bulanan Berdasarkan Kategori
          </h3>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-center">Transaksi</th>
                  <th className="py-2.5 px-3 text-right">Total Nominal</th>
                  <th className="py-2.5 px-3 text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Belum ada pengeluaran pada bulan ini.
                    </td>
                  </tr>
                ) : (
                  categoryBreakdown.map((c) => (
                    <tr key={c.categoryId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {c.categoryName}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {c.transactionsCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                        {formatRupiah(c.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                        {c.percentage}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tabel Harian dalam Bulan (Section 16) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Tabel Harian dalam Bulan ({BULAN_INDONESIA[selectedMonth]} {selectedYear})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3 text-right">Pemasukan</th>
                <th className="py-3 px-3 text-right">Pengeluaran</th>
                <th className="py-3 px-3 text-right">Saldo Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyRows.map((d) => (
                <tr key={d.day} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2 px-3 font-medium text-slate-800">
                    {formatTanggalIndonesia(d.dateStr)}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                    {formatRupiah(d.income)}
                  </td>
                  <td className="py-2 px-3 text-right text-rose-600 font-medium">
                    {formatRupiah(d.expense)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-semibold ${
                      d.net >= 0 ? 'text-slate-800' : 'text-rose-600'
                    }`}
                  >
                    {formatRupiah(d.net)}
                  </td>
                </tr>
              ))}
              {/* TOTAL ROW (Section 16) */}
              <tr className="border-t-2 border-slate-200 bg-slate-100/70 font-bold text-slate-900">
                <td className="py-3 px-3 uppercase tracking-wider">TOTAL</td>
                <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                  {formatRupiah(totalIncome)}
                </td>
                <td className="py-3 px-3 text-right text-rose-700 font-bold">
                  {formatRupiah(totalExpense)}
                </td>
                <td
                  className={`py-3 px-3 text-right font-bold ${
                    netIncome >= 0 ? 'text-slate-900' : 'text-rose-600'
                  }`}
                >
                  {formatRupiah(netIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
