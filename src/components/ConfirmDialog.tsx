import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  confirmVariant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  isDestructive = true,
  confirmVariant,
  isLoading = false,
  onConfirm,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const finalConfirmText = confirmLabel || confirmText || 'KONFIRMASI';
  const finalCancelText = cancelLabel || cancelText || 'BATAL';
  const isDanger = confirmVariant ? confirmVariant === 'danger' : isDestructive;

  return (
    <div
      id="confirm-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs transition-opacity"
    >
      <div
        id="confirm-dialog-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl ${
                isDanger ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          </div>
          <button
            id="btn-dialog-close-x"
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm leading-relaxed text-slate-600">{message}</p>
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-slate-50/75 border-t border-slate-100">
          <button
            id="btn-dialog-cancel"
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {finalCancelText}
          </button>
          <button
            id="btn-dialog-confirm"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-all shadow-xs disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {isLoading ? 'MEMPROSES...' : finalConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
