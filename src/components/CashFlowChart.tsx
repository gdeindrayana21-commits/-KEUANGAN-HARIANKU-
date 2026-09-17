import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { CashFlowChartItem } from '../types';
import { formatRupiah } from '../utils/currency';

interface CashFlowChartProps {
  data: CashFlowChartItem[];
  title?: string;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  data,
  title = 'Grafik Arus Kas (Pemasukan vs Pengeluaran)',
}) => {
  const hasData = data.some((item) => item.income > 0 || item.expense > 0);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-md text-xs">
          <p className="font-bold text-slate-800 mb-1.5">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-600 font-semibold flex items-center justify-between gap-3">
              <span>Pemasukan:</span>
              <span>{formatRupiah(payload[0]?.value || 0)}</span>
            </p>
            <p className="text-rose-600 font-semibold flex items-center justify-between gap-3">
              <span>Pengeluaran:</span>
              <span>{formatRupiah(payload[1]?.value || 0)}</span>
            </p>
            {payload[0] && payload[1] && (
              <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between gap-3 text-slate-600 font-medium">
                <span>Selisih:</span>
                <span>{formatRupiah(payload[0].value - payload[1].value)}</span>
              </div>
            )}
          </div>
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
            Perbandingan nominal pemasukan dan pengeluaran
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-4">
          <p className="text-xs font-medium text-slate-400">
            Belum ada data transaksi pada periode ini.
          </p>
        </div>
      ) : (
        <div className="w-full h-64 overflow-x-auto">
          <div className="min-w-[320px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                    return `${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                  formatter={(value) => (value === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                />
                <Bar
                  dataKey="income"
                  name="income"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="expense"
                  name="expense"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
