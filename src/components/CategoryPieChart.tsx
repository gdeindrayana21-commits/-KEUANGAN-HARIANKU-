import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryBreakdownItem } from '../types';
import { formatRupiah } from '../utils/currency';

interface CategoryPieChartProps {
  categories: CategoryBreakdownItem[];
  title?: string;
}

const COLORS = [
  '#f43f5e', // rose
  '#f97316', // orange
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#10b981', // emerald
  '#64748b', // slate
];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  categories,
  title = 'Pengeluaran Berdasarkan Kategori',
}) => {
  const hasExpenses = categories.length > 0 && categories.some((c) => c.totalAmount > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryBreakdownItem;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-md text-xs">
          <p className="font-bold text-slate-900 mb-1">{data.categoryName}</p>
          <p className="text-rose-600 font-semibold">{formatRupiah(data.totalAmount)}</p>
          <p className="text-slate-500 mt-0.5">{data.percentage}% dari total pengeluaran</p>
          <p className="text-slate-400 text-[10px] mt-0.5">{data.transactionsCount} transaksi</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Komposisi pengeluaran menurut kategori
          </p>
        </div>
      </div>

      {!hasExpenses ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-4">
          <p className="text-xs font-medium text-slate-400">
            Belum ada data pengeluaran pada periode ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Donut Chart */}
          <div className="md:col-span-5 h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="totalAmount"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {categories.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.categoryId}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Categories List (Section 8) */}
          <div className="md:col-span-7 space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {categories.map((cat, idx) => {
              const color = COLORS[idx % COLORS.length];
              return (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/60 transition-colors text-xs"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-slate-800 truncate">
                      {idx + 1}. {cat.categoryName}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-slate-900 block">
                      {formatRupiah(cat.totalAmount)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
