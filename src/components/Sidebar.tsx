import React from 'react';
import {
  Home,
  Receipt,
  FileText,
  Calendar,
  CalendarRange,
  CalendarDays,
  CalendarCheck,
  Wallet,
  Tag,
  Settings,
  LogOut,
  PieChart,
  Target,
  HandCoins,
  RefreshCw,
  Database,
} from 'lucide-react';
import { UserProfile } from '../types';

export type TabType =
  | 'dashboard'
  | 'transactions'
  | 'reports'
  | 'daily_recap'
  | 'weekly_recap'
  | 'monthly_recap'
  | 'yearly_recap'
  | 'budgets'
  | 'savings'
  | 'debts'
  | 'recurring'
  | 'accounts'
  | 'categories'
  | 'backup_restore'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  user,
  onLogout,
}) => {
  const mainNav = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
    { id: 'transactions' as TabType, label: 'Transaksi', icon: <Receipt className="w-4 h-4" /> },
    { id: 'reports' as TabType, label: 'Laporan', icon: <FileText className="w-4 h-4" /> },
  ];

  const planningNav = [
    { id: 'budgets' as TabType, label: 'Anggaran Bulanan', icon: <PieChart className="w-4 h-4" /> },
    { id: 'savings' as TabType, label: 'Target Tabungan', icon: <Target className="w-4 h-4" /> },
    { id: 'debts' as TabType, label: 'Hutang & Piutang', icon: <HandCoins className="w-4 h-4" /> },
    { id: 'recurring' as TabType, label: 'Transaksi Rutin', icon: <RefreshCw className="w-4 h-4" /> },
  ];

  const recapNav = [
    { id: 'daily_recap' as TabType, label: 'Rekap Harian', icon: <Calendar className="w-4 h-4" /> },
    { id: 'weekly_recap' as TabType, label: 'Rekap Mingguan', icon: <CalendarRange className="w-4 h-4" /> },
    { id: 'monthly_recap' as TabType, label: 'Rekap Bulanan', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'yearly_recap' as TabType, label: 'Rekap Tahunan', icon: <CalendarCheck className="w-4 h-4" /> },
  ];

  const manageNav = [
    { id: 'accounts' as TabType, label: 'Akun Keuangan', icon: <Wallet className="w-4 h-4" /> },
    { id: 'categories' as TabType, label: 'Kategori', icon: <Tag className="w-4 h-4" /> },
    { id: 'backup_restore' as TabType, label: 'Backup & Restore', icon: <Database className="w-4 h-4" /> },
    { id: 'settings' as TabType, label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-screen p-4 justify-between select-none overflow-y-auto"
    >
      <div className="space-y-5">
        {/* Logo & Tagline */}
        <div className="px-2 py-2">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              K
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 tracking-tight block">
                KEUANGAN HARIANKU
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                Tahap 3: Fitur Lengkap
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic mt-1 leading-snug">
            "Catat keuangan, kendalikan pengeluaran."
          </p>
        </div>

        {/* 1. Group: Utama */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
            Utama
          </span>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 2. Group: Perencanaan & Finansial (Tahap 3) */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
            Perencanaan & Finansial
          </span>
          <nav className="space-y-1">
            {planningNav.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3. Group: Rekapitulasi */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
            Rekapitulasi
          </span>
          <nav className="space-y-1">
            {recapNav.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 4. Group: Pengelolaan */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
            Pengelolaan
          </span>
          <nav className="space-y-1">
            {manageNav.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom User info & Logout */}
      <div className="pt-4 mt-6 border-t border-slate-100 space-y-3">
        <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {user?.name || 'Pengguna'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          id="btn-sidebar-logout"
          type="button"
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
};
