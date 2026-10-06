import React from 'react';
import { Plus, Wifi, WifiOff, LogOut, User as UserIcon, Smartphone } from 'lucide-react';
import { UserProfile } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  user: UserProfile | null;
  isOnline: boolean;
  onOpenNewTransaction: () => void;
  onLogout: () => void;
  isMobilePreview?: boolean;
  onToggleMobilePreview?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isOnline,
  onOpenNewTransaction,
  onLogout,
  isMobilePreview = false,
  onToggleMobilePreview,
}) => {
  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 pt-safe"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs font-bold text-base shrink-0">
            K
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none truncate">
              KEUANGAN HARIANKU
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 mt-0.5 truncate">
              Catat keuangan, kendalikan pengeluaran.
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Desktop Mobile View Toggle */}
          {onToggleMobilePreview && (
            <button
              id="btn-toggle-mobile-preview"
              type="button"
              onClick={onToggleMobilePreview}
              title={isMobilePreview ? 'Kembali ke Tampilan Penuh' : 'Tampilan Layar HP'}
              className={`hidden md:flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                isMobilePreview
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isMobilePreview ? 'Mode Layar HP: Aktif' : 'Mode HP'}</span>
            </button>
          )}

          {/* PWA Install Button & Phone Guide */}
          <PWAInstallButton
            variant="navbar"
            isMobilePreview={isMobilePreview}
            onToggleMobilePreview={onToggleMobilePreview}
          />

          {/* Realtime Database Sync / Network Status Indicator */}
          {!isMobilePreview && (
            <div
              id="network-status-badge"
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                isOnline ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersinkronisasi</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span>Offline</span>
                </>
              )}
            </div>
          )}

          {/* Primary Action Button "+ Tambah Transaksi" */}
          <button
            id="btn-nav-add-transaction"
            type="button"
            onClick={onOpenNewTransaction}
            className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Tambah Transaksi</span>
            <span className="sm:hidden">Catat</span>
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center pl-1.5 sm:pl-2.5 border-l border-slate-200 space-x-1.5">
            {!isMobilePreview && (
              <div className="hidden xl:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                  {user?.name || 'Pengguna'}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {user?.email}
                </span>
              </div>
            )}

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>

            <button
              id="btn-nav-logout"
              type="button"
              onClick={onLogout}
              title="Keluar (Logout)"
              className="min-w-[38px] min-h-[38px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
