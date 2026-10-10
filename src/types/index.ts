export type AccountType = 'Cash' | 'Bank' | 'E-Wallet' | 'Lainnya';

export type CategoryType = 'income' | 'expense';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type PeriodFilter = 
  | 'today' 
  | 'this_week' 
  | 'this_month' 
  | 'last_month' 
  | 'this_year' 
  | 'custom'
  | 'all';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  categoryName?: string;
  accountId: string;
  accountName: string;
  toAccountId?: string;
  toAccountName?: string;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:mm
  description?: string;
  receiptImageUrl?: string;
  receiptFileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilterOptions {
  type?: 'all' | TransactionType;
  period?: PeriodFilter;
  categoryId?: string;
  accountId?: string;
  searchQuery?: string;
  customStartDate?: string;
  customEndDate?: string;
  sortBy?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface PeriodComparison {
  currentValue: number;
  previousValue: number;
  diffNominal: number;
  diffPercentage: number | null; // null if previous was 0
  label: string; // e.g. "Naik Rp 1.000.000" or "Turun Rp 500.000"
}

export interface DashboardSummary {
  totalBalance: number; // Saldo aktual seluruh akun
  periodIncome: number; // Total pemasukan periode
  periodExpense: number; // Total pengeluaran periode
  netIncome: number; // Saldo bersih periode (periodIncome - periodExpense)
  transactionsCount: number; // Jumlah transaksi periode
  todayTransactionsCount: number;
  incomeComparison: PeriodComparison;
  expenseComparison: PeriodComparison;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionsCount: number;
  percentage: number;
  type: TransactionType;
}

export interface CashFlowChartItem {
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface BalanceProgressChartItem {
  date: string;
  label: string;
  balance: number;
  income: number;
  expense: number;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  periodMonth: string; // Format: YYYY-MM (e.g. 2026-03)
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // Format: YYYY-MM-DD
  accountId?: string;
  accountName?: string;
  status: 'in_progress' | 'achieved';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string; // Format: YYYY-MM-DD
  note?: string;
  accountId?: string;
  accountName?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  personName: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string; // Format: YYYY-MM-DD
  status: 'unpaid' | 'partially_paid' | 'paid';
  notes?: string;
  payments?: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface Receivable {
  id: string;
  userId: string;
  personName: string;
  totalAmount: number;
  receivedAmount: number;
  dueDate: string; // Format: YYYY-MM-DD
  status: 'unpaid' | 'partially_paid' | 'paid';
  notes?: string;
  payments?: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  userId: string;
  title: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  accountId: string;
  accountName: string;
  toAccountId?: string;
  toAccountName?: string;
  frequency: RecurringFrequency;
  startDate?: string;
  nextExecutionDate: string; // Format: YYYY-MM-DD
  lastExecutedDate?: string;
  autoExecute: boolean;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  appName: string;
  userId: string;
  data: {
    accounts: Account[];
    categories: Category[];
    transactions: Transaction[];
    budgets: Budget[];
    savingsGoals: SavingsGoal[];
    debts: Debt[];
    receivables: Receivable[];
    recurringTransactions: RecurringTransaction[];
  };
}

