import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, Plus, Filter, Calendar } from 'lucide-react';
import { Account, Category, Transaction, TransactionType, PeriodFilter } from '../types';
import { isDateInPeriod } from '../utils/date';
import { formatRupiah } from '../utils/currency';
import { TransactionList } from '../components/TransactionList';

interface TransactionsPageProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  accounts,
  categories,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setPeriodFilter('all');
    setCategoryFilter('');
    setAccountFilter('');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // 2. Account filter
      if (accountFilter && tx.accountId !== accountFilter) {
        return false;
      }

      // 3. Category filter
      if (categoryFilter && tx.categoryId !== categoryFilter) {
        return false;
      }

      // 4. Period filter
      if (!isDateInPeriod(tx.date, periodFilter, customStartDate, customEndDate)) {
        return false;
      }

      // 5. Search query (Keterangan, Nama kategori, Nama akun)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const descMatch = (tx.description || '').toLowerCase().includes(query);
        const catMatch = (tx.categoryName || '').toLowerCase().includes(query);
        const accMatch = (tx.accountName || '').toLowerCase().includes(query);
        if (!descMatch && !catMatch && !accMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    typeFilter,
    accountFilter,
    categoryFilter,
    periodFilter,
    customStartDate,
    customEndDate,
    searchQuery,
  ]);

  // Aggregate totals for the filtered results
  const { totalFilteredIncome, totalFilteredExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') inc += tx.amount;
      else exp += tx.amount;
    }
    return { totalFilteredIncome: inc, totalFilteredExpense: exp };
  }, [filteredTransactions]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    periodFilter !== 'all' ||
    categoryFilter !== '' ||
    accountFilter !== '' ||
    customStartDate !== '' ||
    customEndDate !== '';

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Riwayat Transaksi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap seluruh pemasukan dan pengeluaran Anda.
          </p>
        </div>

        <button
          id="btn-page-add-tx"
          type="button"
          onClick={onOpenNewTransaction}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Transaksi</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search bar & Toggle Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              id="input-search-transactions"
              type="text"
              placeholder="Cari transaksi berdasarkan keterangan, kategori, atau akun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              id="btn-toggle-filters"
              type="button"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isFilterExpanded || hasActiveFilters
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter {hasActiveFilters && '(Aktif)'}</span>
            </button>

            {hasActiveFilters && (
              <button
                id="btn-reset-filters"
                type="button"
                onClick={resetFilters}
                className="flex items-center justify-center space-x-1 px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">RESET FILTER</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Filter Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 ${isFilterExpanded ? 'block' : 'hidden sm:grid'}`}>
          {/* Jenis Transaksi */}
          <div>
            <label htmlFor="filter-select-type" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Jenis
            </label>
            <select
              id="filter-select-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | TransactionType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Jenis</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>

          {/* Periode */}
          <div>
            <label htmlFor="filter-select-period" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Periode
            </label>
            <select
              id="filter-select-period"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="last_7_days">7 Hari Terakhir</option>
              <option value="this_month">Bulan Ini</option>
              <option value="last_month">Bulan Lalu</option>
              <option value="this_year">Tahun Ini</option>
              <option value="custom">Custom Tanggal</option>
            </select>
          </div>

          {/* Kategori */}
          <div>
            <label htmlFor="filter-select-category" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Kategori
            </label>
            <select
              id="filter-select-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
                </option>
              ))}
            </select>
          </div>

          {/* Akun */}
          <div>
            <label htmlFor="filter-select-account" className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Akun Keuangan
            </label>
            <select
              id="filter-select-account"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Akun</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range Pickers if 'custom' period is selected */}
          {periodFilter === 'custom' && (
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label htmlFor="input-custom-start" className="block text-xs font-medium text-slate-600 mb-1">
                  Dari Tanggal:
                </label>
                <div className="relative">
                  <input
                    id="input-custom-start"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
              <div>
                <label htmlFor="input-custom-end" className="block text-xs font-medium text-slate-600 mb-1">
                  Sampai Tanggal:
                </label>
                <div className="relative">
                  <input
                    id="input-custom-end"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Summary Stats Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-2 text-slate-500 border-t border-slate-100">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredTransactions.length}</strong> transaksi
          </span>
          <div className="flex items-center space-x-3 mt-1 sm:mt-0 font-medium">
            <span className="text-emerald-600">
              Pemasukan: +{formatRupiah(totalFilteredIncome)}
            </span>
            <span className="text-rose-600">
              Pengeluaran: -{formatRupiah(totalFilteredExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction List / Table */}
      <TransactionList
        transactions={filteredTransactions}
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
        onAddNew={onOpenNewTransaction}
        emptyMessage={
          hasActiveFilters
            ? 'Tidak ada transaksi yang sesuai dengan filter pencarian.'
            : 'Belum ada transaksi.'
        }
      />
    </div>
  );
};
