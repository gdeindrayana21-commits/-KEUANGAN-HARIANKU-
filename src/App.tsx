import { useState, useEffect, useCallback } from 'react';
import {
  syncUserProfile,
  logoutUser,
  subscribeAuthState,
  AppAuthUser,
} from './services/authService';
import {
  subscribeAccounts,
  seedDefaultAccountsIfEmpty,
  createAccount,
  updateAccount,
  adjustAccountCurrentBalance,
  toggleAccountActive,
  deleteAccount,
  recalculateAllAccounts,
} from './services/accountService';
import {
  subscribeCategories,
  seedDefaultCategoriesIfEmpty,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
} from './services/categoryService';
import {
  subscribeTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from './services/transactionService';
import {
  subscribeBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from './services/budgetService';
import {
  subscribeSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  adjustSavingsGoalAmount,
  deleteSavingsGoal,
} from './services/savingsService';
import {
  subscribeDebts,
  createDebt,
  updateDebt,
  addDebtPayment,
  deleteDebt,
} from './services/debtService';
import {
  subscribeReceivables,
  createReceivable,
  updateReceivable,
  addReceivablePayment,
  deleteReceivable,
} from './services/receivableService';
import {
  subscribeRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  executeRecurringTransaction,
  toggleRecurringActive,
  deleteRecurringTransaction,
} from './services/recurringService';
import {
  Account,
  Category,
  Transaction,
  UserProfile,
  AccountType,
  CategoryType,
  TransactionType,
  Budget,
  SavingsGoal,
  Debt,
  Receivable,
  RecurringTransaction,
  RecurringFrequency,
} from './types';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { BottomNavigation } from './components/BottomNavigation';
import { RecapNavigation } from './components/RecapNavigation';
import { TransactionForm } from './components/TransactionForm';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Loading } from './components/Loading';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DailyRecap } from './pages/DailyRecap';
import { WeeklyRecap } from './pages/WeeklyRecap';
import { MonthlyRecap } from './pages/MonthlyRecap';
import { YearlyRecap } from './pages/YearlyRecap';
import { Reports } from './pages/Reports';
import { TransactionsPage } from './pages/Transactions';
import { AccountsPage } from './pages/Accounts';
import { CategoriesPage } from './pages/Categories';
import { SettingsPage } from './pages/Settings';
import { Budgets } from './pages/Budgets';
import { SavingsGoals } from './pages/SavingsGoals';
import { Debts } from './pages/Debts';
import { RecurringTransactions } from './pages/RecurringTransactions';
import { BackupRestore } from './pages/BackupRestore';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);

  // Data states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  // Navigation & UI states
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState<boolean>(false);

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { isOnline } = useNetworkStatus();

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // 1. Auth Listener (Firebase Auth + Seamless Cloud Firestore Fallback Session)
  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
          // Seed default categories and default Cash + Bank accounts if this user is new
          await seedDefaultCategoriesIfEmpty(user.uid);
          await seedDefaultAccountsIfEmpty(user.uid);
        } catch (err) {
          console.warn('Error initializing user profile, categories, or accounts:', err);
        }
      } else {
        setUserProfile(null);
        setAccounts([]);
        setCategories([]);
        setTransactions([]);
        setBudgets([]);
        setSavingsGoals([]);
        setDebts([]);
        setReceivables([]);
        setRecurringTransactions([]);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Realtime Subscriptions for Logged-In User
  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.uid;

    const unsubAccounts = subscribeAccounts(
      userId,
      (accs) => setAccounts(accs),
      (err) => console.warn('Accounts subscription error:', err)
    );

    const unsubCategories = subscribeCategories(
      userId,
      (cats) => setCategories(cats),
      (err) => console.warn('Categories subscription error:', err)
    );

    const unsubTransactions = subscribeTransactions(
      userId,
      (txs) => setTransactions(txs),
      (err) => console.warn('Transactions subscription error:', err)
    );

    const unsubBudgets = subscribeBudgets(
      userId,
      (b) => setBudgets(b),
      (err) => console.warn('Budgets subscription error:', err)
    );

    const unsubSavings = subscribeSavingsGoals(
      userId,
      (s) => setSavingsGoals(s),
      (err) => console.warn('Savings subscription error:', err)
    );

    const unsubDebts = subscribeDebts(
      userId,
      (d) => setDebts(d),
      (err) => console.warn('Debts subscription error:', err)
    );

    const unsubReceivables = subscribeReceivables(
      userId,
      (r) => setReceivables(r),
      (err) => console.warn('Receivables subscription error:', err)
    );

    const unsubRecurring = subscribeRecurringTransactions(
      userId,
      (rec) => setRecurringTransactions(rec),
      (err) => console.warn('Recurring subscription error:', err)
    );

    return () => {
      unsubAccounts();
      unsubCategories();
      unsubTransactions();
      unsubBudgets();
      unsubSavings();
      unsubDebts();
      unsubReceivables();
      unsubRecurring();
    };
  }, [currentUser]);

  // Transaction Handlers
  const handleOpenCreateTransaction = () => {
    setEditingTransaction(null);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTxModalOpen(true);
  };

  const handleTransactionFormSubmit = async (data: {
    type: TransactionType;
    amount: number;
    categoryId?: string;
    categoryName?: string;
    accountId: string;
    accountName: string;
    toAccountId?: string;
    toAccountName?: string;
    date: string;
    time: string;
    description: string;
    receiptImageUrl?: string;
    receiptFileName?: string;
  }) => {
    if (!currentUser) return;

    if (editingTransaction) {
      await updateTransaction(currentUser.uid, editingTransaction.id, editingTransaction, data);
      showToast('Transaksi berhasil diperbarui.');
    } else {
      await createTransaction(currentUser.uid, data);
      showToast('Transaksi berhasil disimpan.');
    }
  };

  const handleDeleteTransactionClick = (tx: Transaction) => {
    setDeletingTransaction(tx);
  };

  const handleConfirmDeleteTransaction = async () => {
    if (!currentUser || !deletingTransaction) return;
    setIsDeletingTx(true);
    try {
      await deleteTransaction(
        currentUser.uid,
        deletingTransaction.id,
        deletingTransaction.accountId,
        deletingTransaction.type === 'transfer' ? deletingTransaction.toAccountId : undefined
      );
      setDeletingTransaction(null);
      showToast('Transaksi berhasil dihapus.');
    } catch (err) {
      console.error('Delete transaction error:', err);
      showToast('Gagal menghapus transaksi. Coba lagi.', 'error');
    } finally {
      setIsDeletingTx(false);
    }
  };

  // Account Handlers
  const handleCreateAccount = async (data: {
    name: string;
    type: AccountType;
    initialBalance: number;
    description: string;
  }) => {
    if (!currentUser) return;
    await createAccount(currentUser.uid, data);
    showToast('Akun keuangan berhasil ditambahkan.');
  };

  const handleUpdateAccount = async (
    accountId: string,
    data: {
      name: string;
      type: AccountType;
      initialBalance: number;
      targetCurrentBalance?: number;
      description: string;
    }
  ) => {
    if (!currentUser) return;
    await updateAccount(currentUser.uid, accountId, data);
    showToast('Akun keuangan & saldo berhasil diperbarui.');
  };

  const handleRecordBankIncome = async (data: {
    accountId: string;
    accountName: string;
    amount: number;
    sourceLabel: string;
    date: string;
    description: string;
  }) => {
    if (!currentUser) return;
    const incomeCategory = categories.find((c) => c.type === 'income' && c.isActive);
    await createTransaction(currentUser.uid, {
      type: 'income',
      amount: data.amount,
      categoryId: incomeCategory?.id || 'bank_income',
      categoryName: data.sourceLabel || incomeCategory?.name || 'Dana Masuk Bank',
      accountId: data.accountId,
      accountName: data.accountName,
      date: data.date,
      time: new Date().toTimeString().slice(0, 5),
      description: data.description,
    });
    showToast(`Dana masuk (${data.sourceLabel}) berhasil ditambahkan ke ${data.accountName}.`);
  };

  const handleDirectAdjustBalance = async (
    accountId: string,
    newCurrentBalance: number,
    note: string
  ) => {
    if (!currentUser) return;
    await adjustAccountCurrentBalance(currentUser.uid, accountId, newCurrentBalance, note);
    showToast('Saldo rekening bank berhasil diperbarui.');
  };

  const handleToggleAccountActive = async (accountId: string, isActive: boolean) => {
    if (!currentUser) return;
    await toggleAccountActive(currentUser.uid, accountId, isActive);
    showToast(isActive ? 'Akun telah diaktifkan kembali.' : 'Akun berhasil dinonaktifkan.');
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!currentUser) return;
    await deleteAccount(currentUser.uid, accountId, true);
    showToast('Akun keuangan berhasil dihapus.');
  };

  const handleRecalculateAll = async () => {
    if (!currentUser) return;
    await recalculateAllAccounts(currentUser.uid);
    showToast('Seluruh saldo akun berhasil disinkronkan.');
  };

  // Category Handlers
  const handleCreateCategory = async (data: {
    name: string;
    type: CategoryType;
    icon: string;
  }) => {
    if (!currentUser) return;
    await createCategory(currentUser.uid, data);
    showToast('Kategori baru berhasil ditambahkan.');
  };

  const handleUpdateCategory = async (
    categoryId: string,
    data: { name: string; icon: string }
  ) => {
    if (!currentUser) return;
    await updateCategory(currentUser.uid, categoryId, data);
    showToast('Kategori berhasil diperbarui.');
  };

  const handleToggleCategoryActive = async (categoryId: string, isActive: boolean) => {
    if (!currentUser) return;
    await toggleCategoryActive(currentUser.uid, categoryId, isActive);
    showToast(isActive ? 'Kategori diaktifkan kembali.' : 'Kategori dinonaktifkan.');
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!currentUser) return;
    await deleteCategory(currentUser.uid, categoryId);
    showToast('Kategori berhasil dihapus.');
  };

  // Budget Handlers
  const handleCreateBudget = async (data: {
    categoryId: string;
    categoryName: string;
    periodMonth: string;
    amount: number;
  }) => {
    if (!currentUser) return;
    await createBudget(currentUser.uid, data);
    showToast('Anggaran kategori berhasil disimpan.');
  };

  const handleUpdateBudget = async (
    budgetId: string,
    data: {
      categoryId: string;
      categoryName: string;
      periodMonth: string;
      amount: number;
    }
  ) => {
    if (!currentUser) return;
    await updateBudget(currentUser.uid, budgetId, data);
    showToast('Anggaran kategori berhasil diperbarui.');
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!currentUser) return;
    await deleteBudget(currentUser.uid, budgetId);
    showToast('Anggaran berhasil dihapus.');
  };

  // Savings Goal Handlers
  const handleCreateSavingsGoal = async (data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    accountId?: string;
    accountName?: string;
    notes?: string;
  }) => {
    if (!currentUser) return;
    await createSavingsGoal(currentUser.uid, data);
    showToast('Target tabungan berhasil dibuat.');
  };

  const handleUpdateSavingsGoal = async (
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
  ) => {
    if (!currentUser) return;
    await updateSavingsGoal(currentUser.uid, goalId, data);
    showToast('Target tabungan berhasil diperbarui.');
  };

  const handleAdjustSavingsGoal = async (goalId: string, deltaAmount: number) => {
    if (!currentUser) return;
    await adjustSavingsGoalAmount(currentUser.uid, goalId, deltaAmount);
    showToast('Saldo tabungan berhasil diperbarui.');
  };

  const handleDeleteSavingsGoal = async (goalId: string) => {
    if (!currentUser) return;
    await deleteSavingsGoal(currentUser.uid, goalId);
    showToast('Target tabungan berhasil dihapus.');
  };

  // Debt & Receivable Handlers
  const handleCreateDebt = async (data: {
    personName: string;
    totalAmount: number;
    paidAmount?: number;
    dueDate: string;
    notes?: string;
  }) => {
    if (!currentUser) return;
    await createDebt(currentUser.uid, data);
    showToast('Catatan hutang berhasil disimpan.');
  };

  const handleUpdateDebt = async (
    debtId: string,
    data: {
      personName: string;
      totalAmount: number;
      dueDate: string;
      notes?: string;
    }
  ) => {
    if (!currentUser) return;
    await updateDebt(currentUser.uid, debtId, data);
    showToast('Catatan hutang berhasil diperbarui.');
  };

  const handleAddDebtPayment = async (
    debtId: string,
    paymentData: { amount: number; date: string; note?: string }
  ) => {
    if (!currentUser) return;
    await addDebtPayment(currentUser.uid, debtId, paymentData);
    showToast('Pembayaran cicilan hutang berhasil dicatat.');
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!currentUser) return;
    await deleteDebt(currentUser.uid, debtId);
    showToast('Catatan hutang berhasil dihapus.');
  };

  const handleCreateReceivable = async (data: {
    personName: string;
    totalAmount: number;
    receivedAmount?: number;
    dueDate: string;
    notes?: string;
  }) => {
    if (!currentUser) return;
    await createReceivable(currentUser.uid, data);
    showToast('Catatan piutang berhasil disimpan.');
  };

  const handleUpdateReceivable = async (
    receivableId: string,
    data: {
      personName: string;
      totalAmount: number;
      dueDate: string;
      notes?: string;
    }
  ) => {
    if (!currentUser) return;
    await updateReceivable(currentUser.uid, receivableId, data);
    showToast('Catatan piutang berhasil diperbarui.');
  };

  const handleAddReceivablePayment = async (
    receivableId: string,
    paymentData: { amount: number; date: string; note?: string }
  ) => {
    if (!currentUser) return;
    await addReceivablePayment(currentUser.uid, receivableId, paymentData);
    showToast('Pembayaran cicilan piutang berhasil dicatat.');
  };

  const handleDeleteReceivable = async (receivableId: string) => {
    if (!currentUser) return;
    await deleteReceivable(currentUser.uid, receivableId);
    showToast('Catatan piutang berhasil dihapus.');
  };

  // Recurring Transaction Handlers
  const handleCreateRecurring = async (data: {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    categoryName: string;
    accountId: string;
    accountName: string;
    description: string;
    frequency: RecurringFrequency;
    startDate: string;
    nextExecutionDate: string;
    isActive: boolean;
  }) => {
    if (!currentUser) return;
    await createRecurringTransaction(currentUser.uid, data);
    showToast('Jadwal transaksi rutin berhasil ditambahkan.');
  };

  const handleUpdateRecurring = async (
    id: string,
    data: {
      type: 'income' | 'expense';
      amount: number;
      categoryId: string;
      categoryName: string;
      accountId: string;
      accountName: string;
      description: string;
      frequency: RecurringFrequency;
      startDate: string;
      nextExecutionDate: string;
      isActive: boolean;
    }
  ) => {
    if (!currentUser) return;
    await updateRecurringTransaction(currentUser.uid, id, data);
    showToast('Jadwal transaksi rutin berhasil diperbarui.');
  };

  const handleExecuteRecurring = async (r: RecurringTransaction) => {
    if (!currentUser) return;
    await executeRecurringTransaction(currentUser.uid, r);
    showToast('Transaksi rutin berhasil diposting!');
  };

  const handleToggleRecurringActive = async (id: string, currentActive: boolean) => {
    if (!currentUser) return;
    await toggleRecurringActive(currentUser.uid, id, !currentActive);
    showToast(currentActive ? 'Jadwal dinonaktifkan.' : 'Jadwal diaktifkan kembali.');
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!currentUser) return;
    await deleteRecurringTransaction(currentUser.uid, id);
    showToast('Jadwal transaksi rutin berhasil dihapus.');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast('Berhasil keluar dari akun.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // View Routing
  if (isAuthLoading) {
    return <Loading fullScreen message="Memuat Keuangan Harianku..." />;
  }

  if (!currentUser) {
    return <Login onSuccess={() => {}} />;
  }

  const isRecapTab = [
    'daily_recap',
    'weekly_recap',
    'monthly_recap',
    'yearly_recap',
  ].includes(activeTab);

  return (
    <div
      id="app-root"
      className={`min-h-screen flex flex-col antialiased text-slate-900 ${
        isMobilePreview ? 'bg-slate-800 py-4 px-2 items-center justify-start' : 'bg-slate-100'
      }`}
    >
      <div
        className={`w-full flex-1 flex flex-col ${
          isMobilePreview
            ? 'max-w-[412px] bg-slate-100 rounded-3xl shadow-2xl border-4 border-slate-700 overflow-hidden relative min-h-[840px]'
            : ''
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          user={userProfile}
          isOnline={isOnline}
          onOpenNewTransaction={handleOpenCreateTransaction}
          onLogout={handleLogout}
          isMobilePreview={isMobilePreview}
          onToggleMobilePreview={() => setIsMobilePreview((prev) => !prev)}
        />

        {/* Main Layout: Desktop Sidebar + Content */}
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {/* Desktop Sidebar (hidden when simulating mobile phone viewport) */}
          {!isMobilePreview && (
            <Sidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              user={userProfile}
              onLogout={handleLogout}
            />
          )}

          {/* Page Content View Area */}
          <main
            id="main-content-area"
            className={`flex-1 p-4 ${
              isMobilePreview ? 'pb-28' : 'sm:p-6 lg:p-8 pb-28 md:pb-8'
            } overflow-y-auto max-w-full space-y-5`}
          >
            {/* Global Toast Notification */}
            {toast && (
              <div
                id="global-toast-notification"
                className={`fixed top-16 right-4 sm:right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform duration-200 animate-in fade-in slide-in-from-top-2 ${
                  toast.type === 'success'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20'
                    : 'bg-rose-600 text-white border-rose-700 shadow-rose-900/20'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{toast.message}</span>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Sub Navigation when on any Recap tab */}
            {isRecapTab && (
              <div className="no-print">
                <RecapNavigation
                  activeTab={activeTab}
                  onSelectTab={setActiveTab}
                />
              </div>
            )}

            {/* Active View Container */}
            {activeTab === 'dashboard' && (
              <>
                <PWAInstallButton
                  variant="banner"
                  isMobilePreview={isMobilePreview}
                  onToggleMobilePreview={() => setIsMobilePreview((prev) => !prev)}
                />
                <Dashboard
                  accounts={accounts}
                  transactions={transactions}
                  onOpenNewTransaction={handleOpenCreateTransaction}
                  onEditTransaction={handleOpenEditTransaction}
                  onDeleteTransaction={handleDeleteTransactionClick}
                  onViewAllTransactions={() => setActiveTab('transactions')}
                  onManageAccounts={() => setActiveTab('accounts')}
                  onRecordBankIncome={handleRecordBankIncome}
                  onDirectAdjustBalance={handleDirectAdjustBalance}
                />
              </>
            )}

            {activeTab === 'daily_recap' && (
              <DailyRecap
                transactions={transactions}
                onOpenNewTransaction={handleOpenCreateTransaction}
              />
            )}

            {activeTab === 'weekly_recap' && (
              <WeeklyRecap
                transactions={transactions}
              />
            )}

            {activeTab === 'monthly_recap' && (
              <MonthlyRecap
                transactions={transactions}
              />
            )}

            {activeTab === 'yearly_recap' && (
              <YearlyRecap
                transactions={transactions}
              />
            )}

            {activeTab === 'reports' && (
              <Reports
                transactions={transactions}
                accounts={accounts}
                categories={categories}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsPage
                transactions={transactions}
                accounts={accounts}
                categories={categories}
                onOpenNewTransaction={handleOpenCreateTransaction}
                onEditTransaction={handleOpenEditTransaction}
                onDeleteTransaction={handleDeleteTransactionClick}
              />
            )}

            {/* Phase 3 Views */}
            {activeTab === 'budgets' && (
              <Budgets
                budgets={budgets}
                categories={categories}
                transactions={transactions}
                onCreateBudget={handleCreateBudget}
                onUpdateBudget={handleUpdateBudget}
                onDeleteBudget={handleDeleteBudget}
              />
            )}

            {activeTab === 'savings' && (
              <SavingsGoals
                savingsGoals={savingsGoals}
                accounts={accounts}
                onCreateGoal={handleCreateSavingsGoal}
                onUpdateGoal={handleUpdateSavingsGoal}
                onAdjustAmount={handleAdjustSavingsGoal}
                onDeleteGoal={handleDeleteSavingsGoal}
              />
            )}

            {activeTab === 'debts' && (
              <Debts
                debts={debts}
                receivables={receivables}
                onCreateDebt={handleCreateDebt}
                onUpdateDebt={handleUpdateDebt}
                onAddDebtPayment={handleAddDebtPayment}
                onDeleteDebt={handleDeleteDebt}
                onCreateReceivable={handleCreateReceivable}
                onUpdateReceivable={handleUpdateReceivable}
                onAddReceivablePayment={handleAddReceivablePayment}
                onDeleteReceivable={handleDeleteReceivable}
              />
            )}

            {activeTab === 'recurring' && (
              <RecurringTransactions
                recurringTransactions={recurringTransactions}
                categories={categories}
                accounts={accounts}
                onCreateRecurring={handleCreateRecurring}
                onUpdateRecurring={handleUpdateRecurring}
                onExecuteRecurring={handleExecuteRecurring}
                onToggleActive={handleToggleRecurringActive}
                onDeleteRecurring={handleDeleteRecurring}
              />
            )}

            {activeTab === 'backup_restore' && (
              <BackupRestore
                userId={currentUser.uid}
                accounts={accounts}
                categories={categories}
                transactions={transactions}
                budgets={budgets}
                savingsGoals={savingsGoals}
                debts={debts}
                receivables={receivables}
                recurringTransactions={recurringTransactions}
                onDataRestored={() => showToast('Data berhasil dipulihkan!')}
              />
            )}

            {activeTab === 'accounts' && (
              <AccountsPage
                accounts={accounts}
                transactions={transactions}
                onCreateAccount={handleCreateAccount}
                onUpdateAccount={handleUpdateAccount}
                onRecordBankIncome={handleRecordBankIncome}
                onDirectAdjustBalance={handleDirectAdjustBalance}
                onToggleAccountActive={handleToggleAccountActive}
                onDeleteAccount={handleDeleteAccount}
                onRecalculateAll={handleRecalculateAll}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesPage
                categories={categories}
                onCreateCategory={handleCreateCategory}
                onUpdateCategory={handleUpdateCategory}
                onToggleCategoryActive={handleToggleCategoryActive}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                user={userProfile}
                isOnline={isOnline}
                onLogout={handleLogout}
                onRecalculateAll={handleRecalculateAll}
                isMobilePreview={isMobilePreview}
                onToggleMobilePreview={() => setIsMobilePreview((prev) => !prev)}
              />
            )}
          </main>
        </div>

        {/* Mobile Bottom Navigation & Quick FAB */}
        <BottomNavigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenNewTransaction={handleOpenCreateTransaction}
          forceMobile={isMobilePreview}
        />
      </div>

      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Transaction Modal (Add or Edit) */}
      <TransactionForm
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        accounts={accounts}
        categories={categories}
        initialData={editingTransaction}
        onSubmit={handleTransactionFormSubmit}
      />

      {/* Delete Transaction Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTransaction}
        title="Hapus transaksi?"
        message="Transaksi yang dihapus akan memengaruhi saldo akun terkait."
        confirmLabel="HAPUS"
        cancelLabel="BATAL"
        isLoading={isDeletingTx}
        onConfirm={handleConfirmDeleteTransaction}
        onClose={() => setDeletingTransaction(null)}
      />
    </div>
  );
}
