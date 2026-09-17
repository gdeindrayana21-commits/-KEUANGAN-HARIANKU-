import {
  Account,
  Transaction,
  PeriodFilter,
  DashboardSummary,
  PeriodComparison,
  CategoryBreakdownItem,
  CashFlowChartItem,
  BalanceProgressChartItem,
} from '../types';
import {
  isDateInPeriod,
  getTodayString,
  getPreviousPeriodRange,
  parseLocalDate,
  toDateString,
  getStartOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  BULAN_INDONESIA,
  HARI_MINGGUAN,
  formatTanggalIndonesia,
} from './date';
import { formatRupiah } from './currency';

/**
 * Calculates current balance for a single account:
 * currentBalance = initialBalance + total income for this account - total expense for this account
 */
export function calculateAccountBalance(
  initialBalance: number,
  accountTransactions: Transaction[],
  accountId?: string
): number {
  const init = Math.round(Number(initialBalance) || 0);

  let incomeTotal = 0;
  let expenseTotal = 0;

  for (const tx of accountTransactions) {
    const amt = Math.round(Number(tx.amount) || 0);
    if (tx.type === 'income') {
      if (!accountId || tx.accountId === accountId) {
        incomeTotal += amt;
      }
    } else if (tx.type === 'expense') {
      if (!accountId || tx.accountId === accountId) {
        expenseTotal += amt;
      }
    } else if (tx.type === 'transfer') {
      // Transfer is an internal transfer:
      // Outflow from source account (tx.accountId)
      // Inflow to destination account (tx.toAccountId)
      if (accountId) {
        if (tx.accountId === accountId) {
          expenseTotal += amt;
        }
        if (tx.toAccountId === accountId) {
          incomeTotal += amt;
        }
      }
    }
  }

  return init + incomeTotal - expenseTotal;
}

/**
 * Helper to calculate period comparison metrics (Section 5)
 */
export function calculatePeriodComparison(
  currentVal: number,
  prevVal: number
): PeriodComparison {
  const diffNominal = currentVal - prevVal;
  
  if (prevVal === 0) {
    return {
      currentValue: currentVal,
      previousValue: prevVal,
      diffNominal,
      diffPercentage: null,
      label: 'Tidak ada data pembanding.',
    };
  }

  const diffPercentage = Math.round(((currentVal - prevVal) / prevVal) * 100 * 10) / 10;
  
  let label = 'Sama dengan periode sebelumnya';
  if (diffNominal > 0) {
    label = `Naik ${formatRupiah(diffNominal)}`;
  } else if (diffNominal < 0) {
    label = `Turun ${formatRupiah(Math.abs(diffNominal))}`;
  }

  return {
    currentValue: currentVal,
    previousValue: prevVal,
    diffNominal,
    diffPercentage,
    label,
  };
}

/**
 * Calculates dashboard summary statistics adhering strictly to Section 4 & 5.
 * - totalBalance: saldo aktual seluruh akun (tidak terpengaruh periode)
 * - periodIncome: total pemasukan periode
 * - periodExpense: total pengeluaran periode
 * - netIncome: periodIncome - periodExpense
 */
export function calculateDashboardSummary(
  transactions: Transaction[],
  accounts: Account[],
  period: PeriodFilter = 'this_month',
  customStart?: string,
  customEnd?: string
): DashboardSummary {
  // 1. Saldo Saat Ini = saldo aktual seluruh akun
  const activeAccounts = accounts.filter((acc) => acc.isActive);
  const totalBalance = activeAccounts.reduce(
    (sum, acc) => sum + Math.round(Number(acc.currentBalance) || 0),
    0
  );

  // 2. Transaksi periode aktif
  const currentPeriodTxs = transactions.filter((tx) =>
    isDateInPeriod(tx.date, period, customStart, customEnd)
  );

  let periodIncome = 0;
  let periodExpense = 0;

  for (const tx of currentPeriodTxs) {
    const amt = Math.round(Number(tx.amount) || 0);
    if (tx.type === 'income') {
      periodIncome += amt;
    } else if (tx.type === 'expense') {
      periodExpense += amt;
    }
  }

  const netIncome = periodIncome - periodExpense;
  const transactionsCount = currentPeriodTxs.length;

  // 3. Transaksi hari ini
  const todayStr = getTodayString();
  const todayTransactionsCount = transactions.filter((tx) => tx.date === todayStr).length;

  // 4. Hitung pembanding periode sebelumnya
  const prevRange = getPreviousPeriodRange(period, customStart, customEnd);
  let prevIncome = 0;
  let prevExpense = 0;

  if (prevRange) {
    const prevTxs = transactions.filter(
      (tx) => tx.date >= prevRange.start && tx.date <= prevRange.end
    );
    for (const tx of prevTxs) {
      const amt = Math.round(Number(tx.amount) || 0);
      if (tx.type === 'income') {
        prevIncome += amt;
      } else if (tx.type === 'expense') {
        prevExpense += amt;
      }
    }
  }

  const incomeComparison = calculatePeriodComparison(periodIncome, prevIncome);
  const expenseComparison = calculatePeriodComparison(periodExpense, prevExpense);

  return {
    totalBalance,
    periodIncome,
    periodExpense,
    netIncome,
    transactionsCount,
    todayTransactionsCount,
    incomeComparison,
    expenseComparison,
  };
}

/**
 * Calculates category breakdown for expense or income in a given transaction set (Sections 7 & 8)
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  type: 'expense' | 'income' = 'expense'
): CategoryBreakdownItem[] {
  const filtered = transactions.filter((tx) => tx.type === type);
  const totalAmount = filtered.reduce((sum, tx) => sum + Math.round(Number(tx.amount) || 0), 0);

  const categoryMap = new Map<string, { name: string; amount: number; count: number }>();

  for (const tx of filtered) {
    const key = tx.categoryId || 'unknown';
    const name = tx.categoryName || 'Lainnya';
    const amt = Math.round(Number(tx.amount) || 0);

    const existing = categoryMap.get(key) || { name, amount: 0, count: 0 };
    existing.amount += amt;
    existing.count += 1;
    categoryMap.set(key, existing);
  }

  const result: CategoryBreakdownItem[] = [];
  categoryMap.forEach((val, key) => {
    const percentage = totalAmount > 0 ? Math.round((val.amount / totalAmount) * 1000) / 10 : 0;
    result.push({
      categoryId: key,
      categoryName: val.name,
      totalAmount: val.amount,
      transactionsCount: val.count,
      percentage,
      type,
    });
  });

  // Urutkan dari nominal terbesar (Section 8)
  return result.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Calculates Cash Flow Chart Data (Pemasukan vs Pengeluaran) based on period (Section 6)
 */
export function calculateCashFlowChartData(
  transactions: Transaction[],
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string
): CashFlowChartItem[] {
  const now = new Date();
  const todayStr = getTodayString();

  if (period === 'today') {
    // Breakdown by hour blocks: 00-03, 04-07, 08-11, 12-15, 16-19, 20-23
    const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    const buckets = hours.map((h) => ({ label: h, income: 0, expense: 0, net: 0 }));

    const todayTxs = transactions.filter((tx) => tx.date === todayStr);
    for (const tx of todayTxs) {
      const hour = parseInt(tx.time?.split(':')[0] || '12', 10);
      const bucketIdx = Math.min(Math.floor(hour / 4), 5);
      const amt = Math.round(Number(tx.amount) || 0);
      if (tx.type === 'income') {
        buckets[bucketIdx].income += amt;
      } else {
        buckets[bucketIdx].expense += amt;
      }
      buckets[bucketIdx].net = buckets[bucketIdx].income - buckets[bucketIdx].expense;
    }
    return buckets;
  }

  if (period === 'this_week') {
    // Senin to Minggu
    const startOfWeekStr = getStartOfWeek(now);
    const monday = parseLocalDate(startOfWeekStr);

    const weekDays: CashFlowChartItem[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = toDateString(d);
      const label = HARI_MINGGUAN[i];

      const dayTxs = transactions.filter((tx) => tx.date === dStr);
      let income = 0;
      let expense = 0;
      for (const tx of dayTxs) {
        const amt = Math.round(Number(tx.amount) || 0);
        if (tx.type === 'income') income += amt;
        else expense += amt;
      }
      weekDays.push({
        label,
        income,
        expense,
        net: income - expense,
      });
    }
    return weekDays;
  }

  if (period === 'this_month' || period === 'last_month') {
    const targetMonthDate =
      period === 'last_month'
        ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
        : new Date(now.getFullYear(), now.getMonth(), 1);

    const year = targetMonthDate.getFullYear();
    const month = targetMonthDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const monthDays: CashFlowChartItem[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTxs = transactions.filter((tx) => tx.date === dayStr);

      let income = 0;
      let expense = 0;
      for (const tx of dayTxs) {
        const amt = Math.round(Number(tx.amount) || 0);
        if (tx.type === 'income') income += amt;
        else expense += amt;
      }

      monthDays.push({
        label: String(day).padStart(2, '0'),
        income,
        expense,
        net: income - expense,
      });
    }
    return monthDays;
  }

  if (period === 'this_year') {
    // Januari to Desember
    const currentYear = now.getFullYear();
    const months: CashFlowChartItem[] = [];

    for (let m = 0; m < 12; m++) {
      const label = BULAN_INDONESIA[m].substring(0, 3);
      const startStr = getStartOfMonth(currentYear, m);
      const endStr = getEndOfMonth(currentYear, m);

      const monthTxs = transactions.filter((tx) => tx.date >= startStr && tx.date <= endStr);
      let income = 0;
      let expense = 0;
      for (const tx of monthTxs) {
        const amt = Math.round(Number(tx.amount) || 0);
        if (tx.type === 'income') income += amt;
        else expense += amt;
      }

      months.push({
        label,
        income,
        expense,
        net: income - expense,
      });
    }
    return months;
  }

  if (period === 'custom' && customStart && customEnd) {
    const s = parseLocalDate(customStart);
    const e = parseLocalDate(customEnd);
    const daysDiff = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const customDays: CashFlowChartItem[] = [];
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      const dStr = toDateString(d);

      const dayTxs = transactions.filter((tx) => tx.date === dStr);
      let income = 0;
      let expense = 0;
      for (const tx of dayTxs) {
        const amt = Math.round(Number(tx.amount) || 0);
        if (tx.type === 'income') income += amt;
        else expense += amt;
      }

      customDays.push({
        label: dStr.substring(5), // MM-DD
        income,
        expense,
        net: income - expense,
      });
    }
    return customDays;
  }

  // Default / all: group by past 6 months
  const fallbackMonths: CashFlowChartItem[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = BULAN_INDONESIA[d.getMonth()].substring(0, 3);
    const startStr = getStartOfMonth(d.getFullYear(), d.getMonth());
    const endStr = getEndOfMonth(d.getFullYear(), d.getMonth());

    const monthTxs = transactions.filter((tx) => tx.date >= startStr && tx.date <= endStr);
    let income = 0;
    let expense = 0;
    for (const tx of monthTxs) {
      const amt = Math.round(Number(tx.amount) || 0);
      if (tx.type === 'income') income += amt;
      else expense += amt;
    }

    fallbackMonths.push({
      label,
      income,
      expense,
      net: income - expense,
    });
  }
  return fallbackMonths;
}

/**
 * Calculates Balance Progress (Perkembangan Saldo) over time (Section 9)
 * Formula: Saldo awal + pemasukan kumulatif - pengeluaran kumulatif
 */
export function calculateBalanceProgress(
  transactions: Transaction[],
  accounts: Account[],
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string
): BalanceProgressChartItem[] {
  // 1. Initial base = sum of initial balances
  const baseInitial = accounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + Math.round(Number(a.initialBalance) || 0), 0);

  // 2. Sort all transactions chronologically
  const sortedTxs = [...transactions].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return (a.time || '').localeCompare(b.time || '');
  });

  // 3. Map cumulative running balance by date
  let runningBalance = baseInitial;
  const balanceAtEndOfDate = new Map<string, { balance: number; income: number; expense: number }>();

  for (const tx of sortedTxs) {
    const amt = Math.round(Number(tx.amount) || 0);
    const dateKey = tx.date;
    const currentRecord = balanceAtEndOfDate.get(dateKey) || {
      balance: runningBalance,
      income: 0,
      expense: 0,
    };

    if (tx.type === 'income') {
      runningBalance += amt;
      currentRecord.income += amt;
    } else {
      runningBalance -= amt;
      currentRecord.expense += amt;
    }
    currentRecord.balance = runningBalance;
    balanceAtEndOfDate.set(dateKey, currentRecord);
  }

  // 4. Determine timeline dates for selected period
  const cashFlow = calculateCashFlowChartData(transactions, period, customStart, customEnd);
  if (cashFlow.length === 0) return [];

  // Build points matching the period intervals
  let prevKnownBalance = baseInitial;
  const progressItems: BalanceProgressChartItem[] = [];

  // If filtered by period, find start balance before period
  let periodStartDate = '';
  if (period === 'today') {
    periodStartDate = getTodayString();
  } else if (period === 'this_week') {
    periodStartDate = getStartOfWeek(new Date());
  } else if (period === 'this_month') {
    const now = new Date();
    periodStartDate = getStartOfMonth(now.getFullYear(), now.getMonth());
  } else if (period === 'last_month') {
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    periodStartDate = getStartOfMonth(lastMonthDate.getFullYear(), lastMonthDate.getMonth());
  } else if (period === 'this_year') {
    periodStartDate = getStartOfYear(new Date().getFullYear());
  } else if (period === 'custom' && customStart) {
    periodStartDate = customStart;
  }

  // Compute balance right before period start
  if (periodStartDate) {
    let preBalance = baseInitial;
    for (const tx of sortedTxs) {
      if (tx.date < periodStartDate) {
        const amt = Math.round(Number(tx.amount) || 0);
        if (tx.type === 'income') preBalance += amt;
        else preBalance -= amt;
      } else {
        break;
      }
    }
    prevKnownBalance = preBalance;
  }

  // Generate chart items using the cash flow points
  let currentAccumulated = prevKnownBalance;
  for (const item of cashFlow) {
    currentAccumulated += item.income - item.expense;
    progressItems.push({
      date: item.label,
      label: item.label,
      balance: currentAccumulated,
      income: item.income,
      expense: item.expense,
    });
  }

  return progressItems;
}

/**
 * Automated Financial Insights / Ringkasan Keuangan (Section 22 & 23)
 */
export interface AutomatedInsights {
  incomeText: string;
  expenseText: string;
  topCategoryText: string;
  dailyAverageExpenseText: string;
  maxExpenseDayText: string;
  transactionsCountText: string;
  expenseToIncomeRatioText: string;
  rankedAccounts: { name: string; balance: number; type: string }[];
}

export function calculateAutomatedInsights(
  transactions: Transaction[],
  accounts: Account[],
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string
): AutomatedInsights {
  const periodTxs = transactions.filter((tx) =>
    isDateInPeriod(tx.date, period, customStart, customEnd)
  );

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByDate = new Map<string, number>();

  for (const tx of periodTxs) {
    const amt = Math.round(Number(tx.amount) || 0);
    if (tx.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
      expenseByDate.set(tx.date, (expenseByDate.get(tx.date) || 0) + amt);
    }
  }

  // 1. Sentences
  const incomeText = `Total pemasukan pada periode ini adalah ${formatRupiah(totalIncome)}.`;
  const expenseText = `Total pengeluaran pada periode ini adalah ${formatRupiah(totalExpense)}.`;

  // 2. Top expense category
  const categories = calculateCategoryBreakdown(periodTxs, 'expense');
  let topCategoryText = 'Belum ada pengeluaran pada periode ini.';
  if (categories.length > 0 && categories[0].totalAmount > 0) {
    topCategoryText = `Kategori dengan total pengeluaran terbesar adalah ${categories[0].categoryName} sebesar ${formatRupiah(categories[0].totalAmount)} (${categories[0].percentage}%).`;
  }

  // 3. Daily average expense
  let daysInPeriod = 1;
  const now = new Date();
  if (period === 'today') {
    daysInPeriod = 1;
  } else if (period === 'this_week') {
    daysInPeriod = 7;
  } else if (period === 'this_month' || period === 'last_month') {
    const target =
      period === 'last_month'
        ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    daysInPeriod = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  } else if (period === 'this_year') {
    daysInPeriod = 365;
  } else if (period === 'custom' && customStart && customEnd) {
    const s = parseLocalDate(customStart);
    const e = parseLocalDate(customEnd);
    daysInPeriod = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  } else {
    daysInPeriod = 30;
  }

  const dailyAvg = Math.round(totalExpense / daysInPeriod);
  const dailyAverageExpenseText = `Rata-rata pengeluaran per hari adalah ${formatRupiah(dailyAvg)}.`;

  // 4. Hari dengan pengeluaran terbesar (Section 23)
  let maxExpenseDayText = 'Tidak ada data pengeluaran.';
  if (expenseByDate.size > 0) {
    let maxDate = '';
    let maxAmt = -1;
    expenseByDate.forEach((amt, dStr) => {
      if (amt > maxAmt) {
        maxAmt = amt;
        maxDate = dStr;
      }
    });
    if (maxAmt > 0 && maxDate) {
      maxExpenseDayText = `Pengeluaran terbesar tercatat pada ${formatTanggalIndonesia(maxDate)} sebesar ${formatRupiah(maxAmt)}.`;
    }
  }

  // 5. Transaction count
  const transactionsCountText = `Jumlah transaksi tercatat sebanyak ${periodTxs.length} transaksi.`;

  // 6. Expense to income ratio
  let expenseToIncomeRatioText = 'Persentase pengeluaran terhadap pemasukan: 0%';
  if (totalIncome > 0) {
    const ratio = Math.round((totalExpense / totalIncome) * 1000) / 10;
    expenseToIncomeRatioText = `Persentase pengeluaran terhadap pemasukan adalah ${ratio}%.`;
  } else if (totalExpense > 0) {
    expenseToIncomeRatioText = 'Pengeluaran tercatat tanpa adanya pemasukan pada periode ini.';
  }

  // 7. Akun dengan saldo terbesar (Section 24)
  const rankedAccounts = accounts
    .filter((a) => a.isActive)
    .map((a) => ({
      name: a.name,
      balance: Math.round(Number(a.currentBalance) || 0),
      type: a.type,
    }))
    .sort((a, b) => b.balance - a.balance);

  return {
    incomeText,
    expenseText,
    topCategoryText,
    dailyAverageExpenseText,
    maxExpenseDayText,
    transactionsCountText,
    expenseToIncomeRatioText,
    rankedAccounts,
  };
}
