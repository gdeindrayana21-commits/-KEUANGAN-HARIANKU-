import React from 'react';
import { Plus, Wifi, WifiOff, LogOut, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  isOnline: boolean;
  onOpenNewTransaction: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isOnline,
  onOpenNewTransaction,
  onLogout,
}) => {
  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand / Logo (Mobile visible, desktop sidebar has it too) */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs font-bold text-base">
            K
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
              KEUANGAN HARIANKU
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 mt-0.5">
              Catat keuangan, kendalikan pengeluaran.
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Realtime Database Sync / Network Status Indicator */}
          <div
            id="network-status-badge"
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Data tersinkronisasi</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>Tidak ada koneksi internet</span>
              </>
            )}
          </div>

          {/* Primary Action Button "+ Tambah Transaksi" */}
          <button
            id="btn-nav-add-transaction"
            type="button"
            onClick={onOpenNewTransaction}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Transaksi</span>
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center pl-2 sm:pl-3 border-l border-slate-200 space-x-2">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                {user?.name || 'Pengguna'}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                {user?.email}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>

            <button
              id="btn-nav-logout"
              type="button"
              onClick={onLogout}
              title="Keluar (Logout)"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
