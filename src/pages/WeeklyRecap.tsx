import React, { useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale, ReceiptText, Calendar } from 'lucide-react';
import { Transaction } from '../types';
import {
  getStartOfWeek,
  getEndOfWeek,
  parseLocalDate,
  toDateString,
  HARI_MINGGUAN,
  formatTanggalIndonesia,
} from '../utils/date';
import { formatRupiah } from '../utils/currency';
import { CashFlowChart } from '../components/CashFlowChart';

interface WeeklyRecapProps {
  transactions: Transaction[];
}

export const WeeklyRecap: React.FC<WeeklyRecapProps> = ({ transactions }) => {
  // Store start date of the selected week (Monday)
  const [weekStartStr, setWeekStartStr] = useState<string>(() => getStartOfWeek(new Date()));

  const handlePrevWeek = () => {
    const monday = parseLocalDate(weekStartStr);
    monday.setDate(monday.getDate() - 7);
    setWeekStartStr(toDateString(monday));
  };

  const handleNextWeek = () => {
    const monday = parseLocalDate(weekStartStr);
    monday.setDate(monday.getDate() + 7);
    setWeekStartStr(toDateString(monday));
  };

  const handleCurrentWeek = () => {
    setWeekStartStr(getStartOfWeek(new Date()));
  };

  const mondayDate = parseLocalDate(weekStartStr);
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);
  const weekEndStr = toDateString(sundayDate);

  // Table & Chart breakdown for the 7 days (Monday to Sunday)
  const daysData = HARI_MINGGUAN.map((dayName, idx) => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + idx);
    const dStr = toDateString(d);

    const dayTxs = transactions.filter((tx) => tx.date === dStr);
    let income = 0;
    let expense = 0;

    for (const tx of dayTxs) {
      const amt = Math.round(Number(tx.amount) || 0);
      if (tx.type === 'income') income += amt;
      else expense += amt;
    }

    return {
      dayName,
      dateStr: dStr,
      income,
      expense,
      net: income - expense,
      count: dayTxs.length,
    };
  });

  const totalIncome = daysData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = daysData.reduce((sum, d) => sum + d.expense, 0);
  const netIncome = totalIncome - totalExpense;
  const totalTransactions = daysData.reduce((sum, d) => sum + d.count, 0);
  const dailyAverageExpense = Math.round(totalExpense / 7);

  // Cash flow chart format
  const chartData = daysData.map((d) => ({
    label: d.dayName,
    income: d.income,
    expense: d.expense,
    net: d.net,
  }));

  const isCurrentWeek = weekStartStr === getStartOfWeek(new Date());

  return (
    <div className="space-y-6">
      {/* Header & Week Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Rekap Mingguan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan dan evaluasi arus kas mingguan Anda
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-recap-prev-week"
            type="button"
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Minggu Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            {formatTanggalIndonesia(weekStartStr)} – {formatTanggalIndonesia(weekEndStr)}
          </span>

          <button
            id="btn-recap-next-week"
            type="button"
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Minggu Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            id="btn-recap-current-week"
            type="button"
            onClick={handleCurrentWeek}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isCurrentWeek
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Minggu Berjalan
          </button>
        </div>
      </div>

      {/* Summary Cards (Section 12) */}
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
          <p className="text-[11px] text-slate-400 mt-1">Minggu ini</p>
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
          <p className="text-[11px] text-slate-400 mt-1">Minggu ini</p>
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
          <p className="text-[11px] text-slate-400 mt-1">Total transaksi</p>
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
          <p className="text-[11px] text-slate-400 mt-1">Pengeluaran / 7 hari</p>
        </div>
      </div>

      {/* Grafik Mingguan (Section 14) */}
      <CashFlowChart
        data={chartData}
        title="Grafik Mingguan (Senin – Minggu)"
      />

      {/* Tabel Rekap Mingguan (Section 13) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Tabel Rincian Harian (Senin – Minggu)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-3 px-3">Hari</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3 text-right">Pemasukan</th>
                <th className="py-3 px-3 text-right">Pengeluaran</th>
                <th className="py-3 px-3 text-right">Saldo Bersih</th>
                <th className="py-3 px-3 text-center">Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daysData.map((d) => (
                <tr key={d.dayName} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{d.dayName}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatTanggalIndonesia(d.dateStr)}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                    {formatRupiah(d.income)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-rose-600">
                    {formatRupiah(d.expense)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-semibold ${
                      d.net >= 0 ? 'text-slate-800' : 'text-rose-600'
                    }`}
                  >
                    {formatRupiah(d.net)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600">{d.count}</td>
                </tr>
              ))}
              {/* TOTAL ROW (Section 13) */}
              <tr className="border-t-2 border-slate-200 bg-slate-100/70 font-bold text-slate-900">
                <td className="py-3 px-3 uppercase tracking-wider" colSpan={2}>
                  TOTAL
                </td>
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
