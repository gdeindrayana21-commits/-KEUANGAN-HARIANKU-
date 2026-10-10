import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  getIndonesianAuthErrorMessage,
} from '../services/authService';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err) {
      const msg = getIndonesianAuthErrorMessage(err);
      setErrorMessage(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Lengkapi alamat email dan kata sandi Anda.');
      return;
    }

    if (isRegisterMode && !name.trim()) {
      setErrorMessage('Masukkan nama lengkap Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (isRegisterMode) {
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      onSuccess();
    } catch (err) {
      setErrorMessage(getIndonesianAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="login-page-container"
      className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Header Identitas Aplikasi */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20 mb-3.5">
            K
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            KEUANGAN HARIANKU
          </h1>
          <p className="text-sm text-slate-500 mt-1 italic">
            "Catat keuangan, kendalikan pengeluaran."
          </p>
        </div>

        {/* Card Login Utama */}
        <div
          id="login-form-card"
          className="bg-white py-8 px-6 sm:px-8 shadow-xs border border-slate-200/80 rounded-2xl"
        >
          {/* Status Notifikasi / Error */}
          {errorMessage && (
            <div
              id="login-error-banner"
              className="p-4 mb-6 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-800"
            >
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* OPSI 1: MASUK DENGAN GOOGLE */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200/60 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Akses Cepat & Aman</span>
              </span>
              <h2 className="text-base font-bold text-slate-800">
                Masuk ke Akun Pembukuan Anda
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Kelola Akun Cash, Rekening Bank, dan Struk Pembelanjaan harian Anda.
              </p>
            </div>

            {/* Tombol Utama Google Sign-In */}
            <button
              id="btn-login-google-primary"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 hover:border-emerald-500 rounded-xl text-sm font-bold text-slate-800 transition-all shadow-xs hover:shadow-md disabled:opacity-60 cursor-pointer group"
            >
              {isGoogleLoading ? (
                <div className="flex items-center space-x-2 text-slate-600">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Menghubungkan ke Akun...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="group-hover:text-emerald-700 transition-colors">
                    Masuk dengan Akun Google
                  </span>
                </>
              )}
            </button>
          </div>

          {/* PEMBATAS */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Atau dengan Email
            </span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* OPSI 2: EMAIL & KATA SANDI (LANGSUNG AKTIF) */}
          <div className="space-y-4">
            {/* Tabs Mode */}
            <div className="flex border-b border-slate-100">
              <button
                id="tab-login"
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMessage('');
                }}
                className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  !isRegisterMode
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Masuk (Email)
              </button>
              <button
                id="tab-register"
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMessage('');
                }}
                className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  isRegisterMode
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {/* Name Input (Register mode only) */}
              {isRegisterMode && (
                <div>
                  <label
                    htmlFor="input-login-name"
                    className="block text-[11px] font-semibold uppercase text-slate-600 mb-1"
                  >
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <input
                      id="input-login-name"
                      type="text"
                      required
                      placeholder="Nama Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label
                  htmlFor="input-login-email"
                  className="block text-[11px] font-semibold uppercase text-slate-600 mb-1"
                >
                  Alamat Email
                </label>
                <div className="relative">
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="input-login-password"
                  className="block text-[11px] font-semibold uppercase text-slate-600 mb-1"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    id="btn-toggle-password"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || isGoogleLoading}
                    className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
              >
                <span>
                  {isLoading
                    ? 'Memproses...'
                    : isRegisterMode
                    ? 'Daftar & Masuk Sekarang'
                    : 'Masuk dengan Email'}
                </span>
                {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>

          {/* Install on Mobile Phone Card */}
          <PWAInstallButton variant="login" />

          {/* Privacy & Isolation Note */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data Multi-User Terisolasi & Aman di Cloud Firestore</span>
          </div>
        </div>
      </div>
    </div>
  );
};
