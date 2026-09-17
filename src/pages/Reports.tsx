import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  ArrowUpDown,
  Filter,
  Calendar,
  Wallet,
  Tag,
  TrendingUp,
  TrendingDown,
  Scale,
  ReceiptText,
} from 'lucide-react';
import { Transaction, Account, Category, PeriodFilter, TransactionType } from '../types';
import {
  isDateInPeriod,
  getTodayString,
  formatTanggalIndonesia,
  BULAN_INDONESIA,
} from '../utils/date';
import { formatRupiah } from '../utils/currency';
import { exportToCSV, exportToExcel, exportToPDF, printReport } from '../utils/export';
import { calculateCategoryBreakdown } from '../utils/calculations';

interface ReportsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export const Reports: React.FC<ReportsProps> = ({
  transactions,
  accounts,
  categories,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('this_month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  const [customStart, setCustomStart] = useState<string>(getTodayString());
  const [customEnd, setCustomEnd] = useState<string>(getTodayString());

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((tx) => {
      // 1. Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // 2. Period
      if (!isDateInPeriod(tx.date, periodFilter, customStart, customEnd)) return false;

      // 3. Category
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;

      // 4. Account
      if (accountFilter !== 'all' && tx.accountId !== accountFilter) return false;

      return true;
    });

    // Sorting (Section 26)
    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        const cmp = b.date.localeCompare(a.date);
        return cmp !== 0 ? cmp : (b.time || '').localeCompare(a.time || '');
      }
      if (sortBy === 'date_asc') {
        const cmp = a.date.localeCompare(b.date);
        return cmp !== 0 ? cmp : (a.time || '').localeCompare(b.time || '');
      }
      if (sortBy === 'amount_desc') {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }
      if (sortBy === 'amount_asc') {
        return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      }
      return 0;
    });

    return result;
  }, [
    transactions,
    typeFilter,
    periodFilter,
    categoryFilter,
    accountFilter,
    sortBy,
    customStart,
    customEnd,
  ]);

  // Summary Metrics (Section 27)
  const totalIncome = filteredTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + Math.round(Number(tx.amount) || 0), 0);

  const totalExpense = filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + Math.round(Number(tx.amount) || 0), 0);

  const netIncome = totalIncome - totalExpense;
  const transactionsCount = filteredTransactions.length;

  // Period label for export file naming
  const getPeriodLabel = (): string => {
    const now = new Date();
    switch (periodFilter) {
      case 'today':
        return `Hari_Ini_${getTodayString()}`;
      case 'this_week':
        return 'Minggu_Ini';
      case 'this_month':
        return `${BULAN_INDONESIA[now.getMonth()]}_${now.getFullYear()}`;
      case 'last_month': {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `${BULAN_INDONESIA[lm.getMonth()]}_${lm.getFullYear()}`;
      }
      case 'this_year':
        return `Tahun_${now.getFullYear()}`;
      case 'custom':
        return `${customStart}_sd_${customEnd}`;
      default:
        return 'Semua_Transaksi';
    }
  };

  const exportSummary = {
    periodLabel: getPeriodLabel().replace(/_/g, ' '),
    totalIncome,
    totalExpense,
    netIncome,
    transactionsCount,
  };

  const handleExportCSV = () => {
    exportToCSV(filteredTransactions, exportSummary, getPeriodLabel());
  };

  const handleExportExcel = () => {
    const catBreakdown = calculateCategoryBreakdown(filteredTransactions, 'expense');
    exportToExcel(
      filteredTransactions,
      accounts,
      catBreakdown,
      exportSummary,
      getPeriodLabel()
    );
  };

  const handleExportPDF = () => {
    exportToPDF(filteredTransactions, exportSummary, getPeriodLabel());
  };

  const handlePrint = () => {
    printReport();
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Action Bar (Sections 25, 28-31) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Laporan Transaksi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencarian, penyaringan, dan ekspor laporan keuangan
              </p>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2 filter-controls">
          <button
            id="btn-export-csv"
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>

          <button
            id="btn-export-excel"
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            id="btn-export-pdf"
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </button>

          <button
            id="btn-print-report"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT LAPORAN</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Card (Section 25 & 26) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 filter-controls">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filter Laporan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Jenis Transaksi */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Jenis
            </label>
            <select
              id="select-filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Transaksi</option>
              <option value="income">Pemasukan Saja</option>
              <option value="expense">Pengeluaran Saja</option>
            </select>
          </div>

          {/* Periode */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Periode
            </label>
            <select
              id="select-filter-period"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-emerald-500 cursor-pointer"
            >
              <option value="this_month">Bulan Ini</option>
              <option value="last_month">Bulan Lalu</option>
              <option value="today">Hari Ini</option>
              <option value="this_week">Minggu Ini</option>
              <option value="this_year">Tahun Ini</option>
              <option value="custom">Custom Tanggal</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Kategori
            </label>
            <select
              id="select-filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'income' ? 'Masuk' : 'Keluar'})
                </option>
              ))}
            </select>
          </div>

          {/* Akun */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Akun
            </label>
            <select
              id="select-filter-account"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Akun</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          {/* Urutan (Sorting) (Section 26) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Urutan
            </label>
            <select
              id="select-filter-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-emerald-500 cursor-pointer"
            >
              <option value="date_desc">Terbaru (Tanggal ↓)</option>
              <option value="date_asc">Terlama (Tanggal ↑)</option>
              <option value="amount_desc">Nominal Terbesar</option>
              <option value="amount_asc">Nominal Terkecil</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if Custom selected */}
        {periodFilter === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600">Dari:</span>
              <input
                id="input-report-custom-start"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600">Sampai:</span>
              <input
                id="input-report-custom-end"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Print Header Visible Only When Printing */}
      <div className="hidden print-only mb-6">
        <h1 className="text-2xl font-bold text-slate-900">KEUANGAN HARIANKU</h1>
        <h2 className="text-lg font-semibold text-slate-700">LAPORAN TRANSAKSI</h2>
        <p className="text-xs text-slate-500 mt-1">
          Periode: {exportSummary.periodLabel} | Tanggal Cetak: {formatTanggalIndonesia(new Date())}
        </p>
      </div>

      {/* Summary Cards of Current Report (Section 27) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-card">
        <div className="bg-white rounded-2xl p-4.5 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
              TOTAL PEMASUKAN
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 no-print">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-emerald-600">
            {formatRupiah(totalIncome)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Hasil filter aktif</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider text-rose-700 uppercase">
              TOTAL PENGELUARAN
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 no-print">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-rose-600">
            {formatRupiah(totalExpense)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Hasil filter aktif</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              SALDO BERSIH
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 no-print">
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
              JUMLAH TRANSAKSI
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 no-print">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-slate-900">
            {transactionsCount}{' '}
            <span className="text-sm font-normal text-slate-600">transaksi</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Data yang sesuai filter</p>
        </div>
      </div>

      {/* Tabel Laporan (Section 27) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 print-card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Rincian Transaksi ({filteredTransactions.length} baris)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-3 px-2.5 text-center w-10">No</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-2.5 text-center">Waktu</th>
                <th className="py-3 px-2.5 text-center">Jenis</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3">Akun</th>
                <th className="py-3 px-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data transaksi yang memenuhi kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-2.5 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {formatTanggalIndonesia(tx.date)}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-slate-500">
                      {tx.time || '-'}
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}
                      >
                        {tx.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {tx.categoryName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {tx.description || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {tx.accountName}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '−'}
                      {formatRupiah(tx.amount)}
                    </td>
                  </tr>
                ))
              )}

              {/* Baris Total di bawah tabel */}
              {filteredTransactions.length > 0 && (
                <tr className="border-t-2 border-slate-200 bg-slate-100/70 font-bold text-slate-900">
                  <td colSpan={7} className="py-3 px-3 uppercase tracking-wider text-right">
                    TOTAL BERSIH (PEMASUKAN − PENGELUARAN):
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-bold ${
                      netIncome >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {formatRupiah(netIncome)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
