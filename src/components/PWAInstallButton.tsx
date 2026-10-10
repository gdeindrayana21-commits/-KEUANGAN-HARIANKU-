import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  CheckCircle2,
  MoreVertical,
  PlusSquare,
  MonitorSmartphone,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner' | 'card' | 'login';
  isMobilePreview?: boolean;
  onToggleMobilePreview?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  isMobilePreview = false,
  onToggleMobilePreview,
}) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios'>(
    isIOS ? 'ios' : 'android'
  );
  const [copiedUrl, setCopiedUrl] = useState(false);

  const rawOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const appUrl = rawOrigin.includes('ais-dev-')
    ? rawOrigin.replace('ais-dev-', 'ais-pre-')
    : rawOrigin;

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback copy
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KEUANGAN HARIANKU',
          text: 'Aplikasi Pencatatan Keuangan Harian di HP:',
          url: appUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyUrl();
    }
  };

  // Hide only simple navbar install button when already installed in standalone mode (unless on desktop where preview toggle is helpful)
  if (isInstalled && variant === 'login') {
    return null;
  }

  return (
    <>
      {variant === 'navbar' && !isInstalled && (
        <button
          id="btn-pwa-install-navbar"
          type="button"
          onClick={handlePrimaryClick}
          className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          title="Pasang Aplikasi di HP"
        >
          <Smartphone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="hidden sm:inline">Aplikasi HP</span>
          <span className="sm:hidden">Instal</span>
        </button>
      )}

      {variant === 'login' && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">
                Gunakan sebagai Aplikasi di HP
              </p>
              <p className="text-[11px] text-slate-500">
                Pasang di layar utama Android & iPhone tanpa Play Store
              </p>
            </div>
          </div>
          <button
            id="btn-pwa-install-login"
            type="button"
            onClick={handlePrimaryClick}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstallable ? 'Instal Sekarang' : 'Cara Pasang di HP'}</span>
          </button>
        </div>
      )}

      {variant === 'banner' && !isInstalled && (
        <div
          id="pwa-mobile-banner"
          className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Aplikasi HP Keuangan Harianku (PWA)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pasang langsung ke layar utama HP Android atau iPhone untuk akses cepat & layar penuh seperti aplikasi asli.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {onToggleMobilePreview && (
              <button
                type="button"
                onClick={onToggleMobilePreview}
                className="hidden md:flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <MonitorSmartphone className="w-4 h-4" />
                <span>{isMobilePreview ? 'Layar Penuh' : 'Simulasi Layar HP'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>{isInstallable ? 'Instal Aplikasi HP' : 'Pasang di HP Sekarang'}</span>
            </button>
          </div>
        </div>
      )}

      {variant === 'card' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Aplikasi HP (Android & iOS)
                </h3>
                <p className="text-xs text-slate-500">
                  Progressive Web App (PWA) siap dipasang di ponsel Anda
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-700">
              {isInstalled ? 'Terpasang di Perangkat' : 'Siap Dipasang'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Aplikasi <strong>KEUANGAN HARIANKU</strong> mendukung instalasi langsung di HP Android maupun iPhone tanpa perlu mengunduh file besar. Aplikasi berjalan layar penuh (<em>standalone</em>), hemat kuota, dan tetap dapat dibuka saat sinyal lemah.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {!isInstalled && (
              <button
                type="button"
                onClick={handlePrimaryClick}
                className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isInstallable ? 'Instal Langsung di Perangkat Ini' : 'Panduan & Link Pasang di HP'}</span>
              </button>
            )}

            {onToggleMobilePreview && (
              <button
                type="button"
                onClick={onToggleMobilePreview}
                className="hidden md:flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <MonitorSmartphone className="w-4 h-4" />
                <span>{isMobilePreview ? 'Kembali ke Mode Desktop' : 'Coba Tampilan Layar HP'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Link untuk HP</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Panduan & Instalasi Aplikasi HP */}
      {showModal && (
        <div
          id="pwa-install-modal"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pasang Aplikasi di HP
                  </h3>
                  <p className="text-xs text-slate-500">
                    Keuangan Harianku untuk Android & iPhone
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Direct One-Click Install if browser supports beforeinstallprompt */}
              {isInstallable && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Perangkat Anda Mendukung Instalasi Instan!</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Klik tombol di bawah untuk langsung menambahkan ikon aplikasi <strong>KeuanganKu</strong> ke layar utama HP Anda:
                  </p>
                  <button
                    type="button"
                    onClick={install}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instal Aplikasi Sekarang</span>
                  </button>
                </div>
              )}

              {/* Notice if inside preview iframe */}
              {isInIframe && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5">
                  <p className="text-xs font-bold text-amber-900">
                    Buka di Tab Penuh atau Kirim ke HP Anda
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Saat ini Anda membuka aplikasi di dalam jendela pratinjau. Agar tombol <strong>Instal Aplikasi</strong> muncul di HP, buka tautan aplikasi ini di browser <strong>Chrome (Android)</strong> atau <strong>Safari (iPhone)</strong>:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors"
                    >
                      <span>Buka Aplikasi di Tab Baru</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Link Copy & Share for Phone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Link Aplikasi untuk Dibuka di HP:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    title="Bagikan ke WhatsApp / HP"
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Platform Guide Selector Tabs */}
              <div className="space-y-3">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('android')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeGuideTab === 'android'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    HP Android (Chrome)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('ios')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeGuideTab === 'ios'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    iPhone / iPad (Safari)
                  </button>
                </div>

                {activeGuideTab === 'android' ? (
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      Langkah Pasang di HP Android:
                    </h4>
                    <ol className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                          1
                        </span>
                        <span>
                          Buka link aplikasi di atas menggunakan browser <strong>Google Chrome</strong> di HP Android Anda.
                        </span>
                      </li>
                      <li className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                          2
                        </span>
                        <span className="flex items-center flex-wrap gap-1">
                          Ketuk ikon menu titik tiga <MoreVertical className="w-3.5 h-3.5 inline text-slate-700" /> di pojok kanan atas Chrome.
                        </span>
                      </li>
                      <li className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                          3
                        </span>
                        <span>
                          Pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke layar utama"</strong> (Add to Home screen).
                        </span>
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      Langkah Pasang di iPhone / iOS:
                    </h4>
                    <ol className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                          1
                        </span>
                        <span>
                          Buka link aplikasi di browser <strong>Safari</strong> pada iPhone atau iPad Anda.
                        </span>
                      </li>
                      <li className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                          2
                        </span>
                        <span className="flex items-center flex-wrap gap-1">
                          Ketuk tombol <strong>Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline text-slate-700" /> di bilah navigasi bawah Safari.
                        </span>
                      </li>
                      <li className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                          3
                        </span>
                        <span className="flex items-center flex-wrap gap-1">
                          Gulir ke bawah lalu ketuk <strong>"Tambah ke Layar Utama"</strong> (Add to Home Screen) <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" />.
                        </span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              {onToggleMobilePreview ? (
                <button
                  type="button"
                  onClick={() => {
                    onToggleMobilePreview();
                    setShowModal(false);
                  }}
                  className="hidden md:flex items-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <MonitorSmartphone className="w-4 h-4 text-emerald-600" />
                  <span>{isMobilePreview ? 'Matikan Simulasi HP' : 'Lihat Simulasi Layar HP'}</span>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
