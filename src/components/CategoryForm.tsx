import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle } from 'lucide-react';
import { Category, TransactionType } from '../types';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Category | null;
  defaultType?: TransactionType;
  onSubmit: (data: { name: string; type: TransactionType; icon: string }) => Promise<void>;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  initialData,
  defaultType = 'expense',
  onSubmit,
}) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [icon, setIcon] = useState<string>('Tag');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setIcon(initialData.icon || 'Tag');
    } else {
      setName('');
      setType(defaultType);
      setIcon('Tag');
    }
    setErrorMessage('');
  }, [initialData, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama kategori wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        name: name.trim(),
        type,
        icon,
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan kategori. Coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!initialData;

  return (
    <div
      id="modal-category-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="modal-category-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {isEditMode ? 'EDIT KATEGORI' : 'TAMBAH KATEGORI'}
            </h2>
          </div>
          <button
            id="btn-close-category-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Jenis Kategori (disabled in edit mode to prevent type mismatches with existing txs) */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Jenis Kategori
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                id="btn-cat-type-expense"
                type="button"
                disabled={isEditMode || isSubmitting}
                onClick={() => setType('expense')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  type === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs border border-rose-100'
                    : 'text-slate-600 hover:text-slate-900'
                } ${isEditMode ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                PENGELUARAN
              </button>
              <button
                id="btn-cat-type-income"
                type="button"
                disabled={isEditMode || isSubmitting}
                onClick={() => setType('income')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  type === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900'
                } ${isEditMode ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                PEMASUKAN
              </button>
            </div>
            {isEditMode && (
              <p className="text-[11px] text-slate-400 mt-1">
                Jenis kategori tidak dapat diubah setelah dibuat.
              </p>
            )}
          </div>

          {/* Nama Kategori */}
          <div>
            <label htmlFor="input-cat-name" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-cat-name"
              type="text"
              placeholder="Contoh: Makanan, Transportasi, Belanja"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              maxLength={80}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {errorMessage && (
            <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              id="btn-cancel-cat-form"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              BATAL
            </button>
            <button
              id="btn-submit-cat-form"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60"
            >
              {isSubmitting ? 'MENYIMPAN...' : isEditMode ? 'PERBARUI KATEGORI' : 'SIMPAN KATEGORI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
