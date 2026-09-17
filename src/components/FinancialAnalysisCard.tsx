import React from 'react';
import { Sparkles, CalendarDays, Wallet, PieChart, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { AutomatedInsights } from '../utils/calculations';
import { formatRupiah } from '../utils/currency';

interface FinancialAnalysisCardProps {
  insights: AutomatedInsights;
  periodLabel: string;
}

export const FinancialAnalysisCard: React.FC<FinancialAnalysisCardProps> = ({
  insights,
  periodLabel,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Ringkasan Keuangan / Analisis Otomatis (Sections 22 & 23) */}
      <div
        id="financial-analysis-summary"
        className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Ringkasan Keuangan
              </h3>
              <p className="text-xs text-slate-500">
                Analisis otomatis arus kas periode {periodLabel.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed pt-1">
            <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <ArrowUpRight className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{insights.incomeText}</span>
            </div>

            <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <ArrowDownRight className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{insights.expenseText}</span>
            </div>

            <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <PieChart className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <span>{insights.topCategoryText}</span>
            </div>

            <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <CalendarDays className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p>{insights.dailyAverageExpenseText}</p>
                <p className="mt-1 font-medium text-slate-900">{insights.maxExpenseDayText}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between font-medium">
              <span>{insights.transactionsCountText}</span>
              <span className="text-slate-500">{insights.expenseToIncomeRatioText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Akun Dengan Saldo Terbesar (Section 24) */}
      <div
        id="financial-analysis-accounts"
        className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Akun Berdasarkan Saldo
              </h3>
              <p className="text-xs text-slate-500">
                Peringkat akun aktif menurut saldo aktual saat ini
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {insights.rankedAccounts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada akun aktif.</p>
            ) : (
              insights.rankedAccounts.map((acc, idx) => (
                <div
                  key={acc.name + idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 truncate">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.type}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-900">{formatRupiah(acc.balance)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
