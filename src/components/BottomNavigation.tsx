import React, { useState } from 'react';
import {
  Home,
  Receipt,
  CalendarDays,
  FileText,
  Plus,
  Menu,
  X,
  Wallet,
  Tag,
  Settings,
  PieChart,
  Target,
  HandCoins,
  RefreshCw,
  Database,
} from 'lucide-react';
import { TabType } from './Sidebar';

interface BottomNavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenNewTransaction: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTransaction,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  const isRecapActive = [
    'daily_recap',
    'weekly_recap',
    'monthly_recap',
    'yearly_recap',
  ].includes(activeTab);

  const handleSelect = (tab: TabType) => {
    onSelectTab(tab);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Mobile Floating Action Button (FAB) */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button
          id="btn-mobile-fab-add"
          type="button"
          onClick={onOpenNewTransaction}
          title="Tambah Transaksi Baru"
          className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-all cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* More Menu Drawer Backdrop */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Menu Lengkap & Perencanaan
              </span>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelect('budgets')}
                className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
                  <PieChart className="w-4 h-4" />
                </div>
                <span className="text-center">Anggaran</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('savings')}
                className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5">
                  <Target className="w-4 h-4" />
                </div>
                <span className="text-center">Tabungan</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('debts')}
                className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5">
                  <HandCoins className="w-4 h-4" />
                </div>
                <span className="text-center">Hutang/Piutang</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('recurring')}
                className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-1.5">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <span className="text-center">Rutin</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('accounts')}
                className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-center">Akun</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('categories')}
                className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
                  <Tag className="w-4 h-4" />
                </div>
                <span className="text-center">Kategori</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('backup_restore')}
                className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-center">Backup</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('settings')}
                className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-1.5">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-center">Pengaturan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar Navigation */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-1 py-1.5 flex items-center justify-around shadow-sm"
      >
        {/* 1. Home */}
        <button
          id="bottom-nav-dashboard"
          type="button"
          onClick={() => handleSelect('dashboard')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* 2. Rekap */}
        <button
          id="bottom-nav-recap"
          type="button"
          onClick={() => handleSelect('daily_recap')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            isRecapActive
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[10px]">Rekap</span>
        </button>

        {/* 3. Transaksi */}
        <button
          id="bottom-nav-transactions"
          type="button"
          onClick={() => handleSelect('transactions')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'transactions'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[10px]">Transaksi</span>
        </button>

        {/* 4. Laporan */}
        <button
          id="bottom-nav-reports"
          type="button"
          onClick={() => handleSelect('reports')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'reports'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[10px]">Laporan</span>
        </button>

        {/* 5. More Menu */}
        <button
          id="bottom-nav-more"
          type="button"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            ['budgets', 'savings', 'debts', 'recurring', 'accounts', 'categories', 'backup_restore', 'settings'].includes(activeTab) || showMoreMenu
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Menu className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>
    </>
  );
};
