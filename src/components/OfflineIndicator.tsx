import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center space-x-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg border border-amber-500/40"
    >
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Mode Offline — Data tersimpan di perangkat digunakan.</span>
    </div>
  );
};
