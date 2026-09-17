import React, { useState } from 'react';
import { Plus, Tag, Edit2, Trash2, Power, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Category, TransactionType } from '../types';
import { CategoryForm } from '../components/CategoryForm';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface CategoriesPageProps {
  categories: Category[];
  onCreateCategory: (data: {
    name: string;
    type: TransactionType;
    icon: string;
  }) => Promise<void>;
  onUpdateCategory: (
    categoryId: string,
    data: { name: string; icon: string }
  ) => Promise<void>;
  onToggleCategoryActive: (categoryId: string, isActive: boolean) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onToggleCategoryActive,
  onDeleteCategory,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [alertError, setAlertError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const currentCategories = categories.filter((c) => c.type === activeTab);
  const incomeCount = categories.filter((c) => c.type === 'income').length;
  const expenseCount = categories.filter((c) => c.type === 'expense').length;

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
    setAlertError('');
    setSuccessMessage('');
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsFormOpen(true);
    setAlertError('');
    setSuccessMessage('');
  };

  const handleFormSubmit = async (data: {
    name: string;
    type: TransactionType;
    icon: string;
  }) => {
    if (editingCategory) {
      await onUpdateCategory(editingCategory.id, {
        name: data.name,
        icon: data.icon,
      });
      setSuccessMessage('Kategori berhasil diperbarui.');
    } else {
      await onCreateCategory(data);
      setSuccessMessage('Kategori baru berhasil ditambahkan.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    try {
      await onDeleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      setSuccessMessage('Kategori berhasil dihapus.');
    } catch (err) {
      setDeletingCategory(null);
      setAlertError(
        err instanceof Error
          ? err.message
          : 'Kategori ini masih digunakan oleh transaksi. Nonaktifkan kategori atau ganti kategori transaksi terkait.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Kategori Transaksi
              </h2>
              <p className="text-xs text-slate-500">
                Kelola kategori pemasukan dan pengeluaran harian Anda.
              </p>
            </div>
          </div>
        </div>

        <button
          id="btn-add-category-top"
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Kategori</span>
        </button>
      </div>

      {/* Notifications */}
      {alertError && (
        <div
          id="alert-category-error"
          className="flex items-start space-x-2.5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{alertError}</div>
          <button
            type="button"
            onClick={() => setAlertError('')}
            className="text-amber-500 hover:text-amber-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div
          id="alert-category-success"
          className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Segmented Filter: Pengeluaran vs Pemasukan */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-md">
        <button
          id="tab-cat-expense"
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'expense'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          PENGELUARAN ({expenseCount})
        </button>
        <button
          id="tab-cat-income"
          type="button"
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'income'
              ? 'bg-white text-emerald-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          PEMASUKAN ({incomeCount})
        </button>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {currentCategories.map((cat) => (
          <div
            key={cat.id}
            id={`category-card-${cat.id}`}
            className={`bg-white rounded-2xl p-4 border transition-all flex items-center justify-between ${
              cat.isActive
                ? 'border-slate-200/80 shadow-xs hover:border-slate-300'
                : 'border-slate-200/50 bg-slate-50 opacity-60'
            }`}
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                  cat.type === 'income'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {cat.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-semibold text-slate-900 truncate">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {cat.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                id={`btn-toggle-cat-${cat.id}`}
                type="button"
                onClick={() => onToggleCategoryActive(cat.id, !cat.isActive)}
                title={cat.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
              <button
                id={`btn-edit-cat-${cat.id}`}
                type="button"
                onClick={() => handleOpenEdit(cat)}
                title="Edit kategori"
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                id={`btn-delete-cat-${cat.id}`}
                type="button"
                onClick={() => setDeletingCategory(cat)}
                title="Hapus kategori"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal Form */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingCategory}
        defaultType={activeTab}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        title="Hapus Kategori?"
        message={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name}"? Kategori yang masih digunakan transaksi tidak dapat dihapus langsung.`}
        confirmText="HAPUS"
        cancelText="BATAL"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
};
