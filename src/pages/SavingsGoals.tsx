import React, { useState, useMemo } from 'react';
import {
  Plus,
  Target,
  Trophy,
  Calendar,
  Wallet,
  CheckCircle,
  Clock,
  ArrowDownRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { SavingsGoal, Account } from '../types';
import { formatRupiah } from '../utils/currency';
import { formatTanggalIndonesia, getDaysRemaining } from '../utils/date';
import { SavingsGoalForm } from '../components/SavingsGoalForm';
import { SavingsDepositModal } from '../components/SavingsDepositModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface SavingsGoalsProps {
  savingsGoals: SavingsGoal[];
  accounts: Account[];
  onCreateGoal: (data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    accountId?: string;
    accountName?: string;
    notes?: string;
  }) => Promise<void>;
  onUpdateGoal: (
    goalId: string,
    data: {
      name: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
      accountId?: string;
      accountName?: string;
      notes?: string;
    }
  ) => Promise<void>;
  onAdjustAmount: (goalId: string, deltaAmount: number) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  savingsGoals,
  accounts,
  onCreateGoal,
  onUpdateGoal,
  onAdjustAmount,
  onDeleteGoal,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'achieved'>('all');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [activeGoal, setActiveGoal] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filtered goals
  const filteredGoals = useMemo(() => {
    if (filterStatus === 'all') return savingsGoals;
    return savingsGoals.filter((g) => g.status === filterStatus);
  }, [savingsGoals, filterStatus]);

  // Overall totals
  const totalTarget = useMemo(() => {
    return savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  }, [savingsGoals]);

  const totalCollected = useMemo(() => {
    return savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  }, [savingsGoals]);

  const achievedCount = useMemo(() => {
    return savingsGoals.filter((g) => g.status === 'achieved').length;
  }, [savingsGoals]);

  const overallProgress = totalTarget > 0 ? Math.min(Math.round((totalCollected / totalTarget) * 100), 100) : 0;

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleOpenDeposit = (goal: SavingsGoal) => {
    setActiveGoal(goal);
    setIsDepositOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingGoal) return;
    try {
      setIsDeleting(true);
      await onDeleteGoal(deletingGoal.id);
      setDeletingGoal(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Target Tabungan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rencanakan dan wujudkan impian keuangan Anda secara disiplin
          </p>
        </div>

        <button
          id="btn-add-savings-goal"
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Target Baru</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Terkumpul</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-teal-600 mt-2">
            {formatRupiah(totalCollected)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Dari target total {formatRupiah(totalTarget)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Progres Keseluruhan</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {overallProgress}%
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Impian Tercapai</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-2">
            {achievedCount} / {savingsGoals.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Target telah sukses terkumpul
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
            filterStatus === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua ({savingsGoals.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('in_progress')}
          className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
            filterStatus === 'in_progress'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sedang Berjalan ({savingsGoals.filter((g) => g.status === 'in_progress').length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('achieved')}
          className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
            filterStatus === 'achieved'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tercapai ({achievedCount})
        </button>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Belum ada target tabungan di daftar ini
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Mulai tentukan impian dan target tabungan Anda untuk memotivasi pengelolaan dana.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Target Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const progress = Math.min(
              Math.round((goal.currentAmount / goal.targetAmount) * 100),
              100
            );
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const daysLeft = getDaysRemaining(goal.targetDate);
            const isAchieved = goal.status === 'achieved' || goal.currentAmount >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                id={`savings-goal-card-${goal.id}`}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between ${
                  isAchieved
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {goal.name}
                        </h3>
                        {isAchieved ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <CheckCircle className="w-3 h-3" />
                            <span>TERCAPAI!</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                            <Clock className="w-3 h-3" />
                            <span>{daysLeft >= 0 ? `${daysLeft} hari lagi` : 'Lewat target'}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Hingga {formatTanggalIndonesia(goal.targetDate)}</span>
                        </span>
                        {goal.accountName && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              <Wallet className="w-3 h-3" />
                              <span>{goal.accountName}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Target"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingGoal(goal)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Target"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts & Progress */}
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-teal-600">
                        {formatRupiah(goal.currentAmount)}
                      </span>
                      <span className="text-xs text-slate-400">
                        Target: <strong className="text-slate-700">{formatRupiah(goal.targetAmount)}</strong>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAchieved ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5 font-medium">
                      <span>{progress}% terkumpul</span>
                      <span>
                        {isAchieved
                          ? 'Target telah terpenuhi'
                          : `Kurang ${formatRupiah(remaining)}`}
                      </span>
                    </div>
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-slate-500 italic mt-3 bg-slate-50/80 p-2 rounded-lg">
                      "{goal.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom action: Setor / Tarik */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenDeposit(goal)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Setor / Tarik Tabungan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Form Modal */}
      <SavingsGoalForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        accounts={accounts}
        initialData={editingGoal}
        onSubmit={async (data) => {
          if (editingGoal) {
            await onUpdateGoal(editingGoal.id, data);
          } else {
            await onCreateGoal(data);
          }
        }}
      />

      {/* Deposit Modal */}
      <SavingsDepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        goal={activeGoal}
        onSubmit={async (goalId, amount, isWithdraw) => {
          const delta = isWithdraw ? -amount : amount;
          await onAdjustAmount(goalId, delta);
        }}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingGoal}
        title="HAPUS TARGET TABUNGAN"
        message={`Apakah Anda yakin ingin menghapus target tabungan "${deletingGoal?.name}"?`}
        confirmLabel="Hapus Target"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingGoal(null)}
      />
    </div>
  );
};
