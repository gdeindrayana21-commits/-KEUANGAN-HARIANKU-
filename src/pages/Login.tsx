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
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  getIndonesianAuthErrorMessage,
} from '../services/authService';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [showEmailSection, setShowEmailSection] = useState<boolean>(false);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    setIsOperationNotAllowed(false);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err) {
      console.error('Google auth error:', err);
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
    setIsOperationNotAllowed(false);

    try {
      if (isRegisterMode) {
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      onSuccess();
    } catch (err) {
      console.error('Email auth error:', err);
      const errStr = err instanceof Error ? err.message : '';
      if (errStr.includes('auth/operation-not-allowed')) {
        setIsOperationNotAllowed(true);
      }
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
                <div className="flex-1 space-y-2">
                  <p className="font-semibold">{errorMessage}</p>

                  {/* Solusi Langsung Masuk dengan Google jika metode email belum aktif */}
                  {isOperationNotAllowed && (
                    <div className="mt-3 pt-3 border-t border-rose-200/70">
                      <p className="text-xs text-rose-700 mb-2">
                        Penyedia otentikasi proyek Firebase ini telah mengaktifkan <strong>Google Sign-In</strong> secara default. Klik tombol di bawah untuk masuk langsung:
                      </p>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Masuk dengan Google Sekarang</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* OPSI UTAMA: MASUK DENGAN GOOGLE */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200/60 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Masuk Resmi & Instan</span>
              </span>
              <h2 className="text-base font-bold text-slate-800">
                Masuk ke Akun Pembukuan Anda
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Akses seluruh catatan kas, rekening, anggaran, dan tabungan Anda secara aman.
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
                  <span>Menghubungkan ke Google...</span>
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

          {/* OPSI ALTERNATIF: EMAIL & PASSWORD (COLLAPSIBLE / ACCORDION) */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowEmailSection(!showEmailSection);
                setErrorMessage('');
                setIsOperationNotAllowed(false);
              }}
              className="w-full flex items-center justify-between py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <span>Opsi lain: Masuk dengan Email & Kata Sandi</span>
              {showEmailSection ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showEmailSection && (
              <div className="mt-4 space-y-4 pt-2">
                {/* Info & Panduan Aktivasi Firebase Console */}
                <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-900 space-y-2.5">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900 text-xs">
                        Panduan Aktivasi Email/Password di Firebase:
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Jika ingin mendaftar & masuk dengan email manual, aktifkan fiturnya di Firebase Console:
                      </p>
                    </div>
                  </div>

                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900/90 pl-1 font-medium">
                    <li>Buka menu <strong>Authentication</strong> &rarr; tab <strong>Sign-in method</strong>.</li>
                    <li>Klik baris <strong>Email/Password</strong>.</li>
                    <li>Nyalakan toggle <strong>Enable</strong> pertama, lalu klik <strong>Save</strong>.</li>
                  </ol>

                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0979887913/authentication/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Buka Firebase Console Proyek</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

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
                    Daftar (Email)
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
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        />
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
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
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
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
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
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
                    className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 active:bg-black text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <span>{isLoading ? 'Memproses...' : isRegisterMode ? 'Daftar Sekarang' : 'Masuk'}</span>
                    {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Privacy & Isolation Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data Multi-User Terisolasi & Aman di Firebase</span>
          </div>
        </div>
      </div>
    </div>
  );
};
