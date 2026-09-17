import React, { useState } from 'react';
import { User, Shield, Wifi, WifiOff, RefreshCw, LogOut, CheckCircle2, Database, Info } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsPageProps {
  user: UserProfile | null;
  isOnline: boolean;
  onLogout: () => void;
  onRecalculateAll: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  isOnline,
  onLogout,
  onRecalculateAll,
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('');
    try {
      await onRecalculateAll();
      setSyncStatus('Sinkronisasi dan verifikasi saldo selesai!');
    } catch (e) {
      setSyncStatus('Gagal melakukan sinkronisasi.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Pengaturan & Profil
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Informasi akun, status database, dan sinkronisasi data.
        </p>
      </div>

      {/* Profil Pengguna */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <User className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Profil Pengguna
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Nama Lengkap</span>
            <span className="font-semibold text-slate-800">{user?.name || '-'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Alamat Email</span>
            <span className="font-semibold text-slate-800">{user?.email || '-'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
            <span className="text-xs font-medium text-slate-500 block">User ID (Firestore Isolation)</span>
            <span className="font-mono text-xs text-slate-600 break-all">{user?.uid || '-'}</span>
          </div>
        </div>
      </div>

      {/* Database & Sinkronisasi */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Database & Sinkronisasi
          </h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-2.5">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-emerald-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-rose-600" />
              )}
              <span className="text-slate-700 font-medium">Status Jaringan</span>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isOnline ? 'Online (Terhubung)' : 'Offline (Tidak ada koneksi)'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-2.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-700 font-medium">Cloud Firestore & Auth</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Aktif & Terisolasi
            </span>
          </div>
        </div>

        {syncStatus && (
          <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{syncStatus}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            id="btn-settings-recalculate"
            type="button"
            onClick={handleSync}
            disabled={isSyncing || !isOnline}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menghitung Ulang...' : 'Sinkronkan & Hitung Ulang Seluruh Saldo'}</span>
          </button>
        </div>
      </div>

      {/* Informasi Tahap Pengembangan */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
        <div className="flex items-center space-x-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-slate-500" />
          <span>Informasi Versi & Tahapan</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Aplikasi <strong>KEUANGAN HARIANKU</strong> saat ini beroperasi pada <strong>Tahap 1</strong> yang berfokus pada fondasi pencatatan keuangan harian, akun multi-dompet, kategori pemasukan/pengeluaran, perhitungan saldo otomatis, filter transaksi, dan sinkronisasi database real-time.
        </p>
      </div>

      {/* Logout Button */}
      <div className="pt-2">
        <button
          id="btn-settings-logout"
          type="button"
          onClick={onLogout}
          className="flex items-center space-x-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold rounded-xl border border-rose-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </div>
  );
};
