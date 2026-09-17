import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Memuat data...',
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <div
        id="loading-fullscreen-container"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xs text-white"
      >
        <div className="flex flex-col items-center p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
          <p className="text-sm font-medium tracking-wide text-slate-200">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="loading-inline-container"
      className="flex flex-col items-center justify-center py-12 px-4 text-slate-500"
    >
      <Loader2 className="w-7 h-7 text-emerald-500 animate-spin mb-2" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse space-y-3">
      <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
      <div className="h-8 bg-slate-200 rounded-md w-2/3"></div>
      <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
    </div>
  );
};
