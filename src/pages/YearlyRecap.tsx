import React, { useState } from 'react';
import { CalendarCheck, TrendingUp, TrendingDown, Scale, ReceiptText } from 'lucide-react';
import { Transaction } from '../types';
import {
  BULAN_INDONESIA,
  getStartOfMonth,
  getEndOfMonth,
} from '../utils/date';
import { formatRupiah } from '../utils/currency';
import { CashFlowChart } from '../components/CashFlowChart';

interface YearlyRecapProps {
  transactions: Transaction[];
}

export const YearlyRecap: React.FC<YearlyRecapProps> = ({ transactions }) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const monthsData = BULAN_INDONESIA.map((monthName, idx) => {
    const startStr = getStartOfMonth(selectedYear, idx);
    const endStr = getEndOfMonth(selectedYear, idx);

    const monthTxs = transactions.filter(
      (tx) => tx.date >= startStr && tx.date <= endStr
    );

    let income = 0;
    let expense = 0;

    for (const tx of monthTxs) {
      const amt = Math.round(Number(tx.amount) || 0);
      if (tx.type === 'income') income += amt;
      else expense += amt;
    }

    return {
      monthName,
      monthIndex: idx,
      income,
      expense,
      net: income - expense,
      count: monthTxs.length,
    };
  });

  const totalIncome = monthsData.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = monthsData.reduce((sum, m) => sum + m.expense, 0);
  const netIncome = totalIncome - totalExpense;
  const totalTransactions = monthsData.reduce((sum, m) => sum + m.count, 0);

  // Chart data
  const chartData = monthsData.map((m) => ({
    label: m.monthName.substring(0, 3),
    income: m.income,
    expense: m.expense,
    net: m.net,
  }));

  const yearsOptions = [
    now.getFullYear() - 3,
    now.getFullYear() - 2,
    now.getFullYear() - 1,
    now.getFullYear(),
    now.getFullYear() + 1,
  ];

  return (
    <div className="space-y-6">
      {/* Header & Year Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Rekap Tahunan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan dan tren keuangan tahunan dari Januari hingga Desember
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Tahun:</span>
          <select
            id="select-recap-yearly-year"
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

      {/* Summary Cards (Section 18) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <p className="text-[11px] text-slate-400 mt-1">Tahun {selectedYear}</p>
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
          <p className="text-[11px] text-slate-400 mt-1">Tahun {selectedYear}</p>
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
            {totalTransactions}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total transaksi setahun</p>
        </div>
      </div>

      {/* Grafik Tahunan (Section 20) */}
      <CashFlowChart
        data={chartData}
        title={`Grafik Tahunan Pemasukan vs Pengeluaran (${selectedYear})`}
      />

      {/* Tabel Rekap Tahunan (Section 19) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Tabel Rekap Tahunan per Bulan ({selectedYear})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-3 px-3">Bulan</th>
                <th className="py-3 px-3 text-right">Pemasukan</th>
                <th className="py-3 px-3 text-right">Pengeluaran</th>
                <th className="py-3 px-3 text-right">Saldo Bersih</th>
                <th className="py-3 px-3 text-center">Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthsData.map((m) => (
                <tr key={m.monthName} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{m.monthName}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                    {formatRupiah(m.income)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-rose-600">
                    {formatRupiah(m.expense)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-semibold ${
                      m.net >= 0 ? 'text-slate-800' : 'text-rose-600'
                    }`}
                  >
                    {formatRupiah(m.net)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600">{m.count}</td>
                </tr>
              ))}
              {/* TOTAL ROW (Section 19) */}
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
                <td className="py-3 px-3 text-center font-bold text-slate-900">
                  {totalTransactions}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
