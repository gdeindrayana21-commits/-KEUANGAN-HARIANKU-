import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { BalanceProgressChartItem } from '../types';
import { formatRupiah } from '../utils/currency';

interface BalanceProgressChartProps {
  data: BalanceProgressChartItem[];
  title?: string;
}

export const BalanceProgressChart: React.FC<BalanceProgressChartProps> = ({
  data,
  title = 'Grafik Perkembangan Saldo',
}) => {
  const hasData = data.length > 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as BalanceProgressChartItem;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-md text-xs">
          <p className="font-bold text-slate-800 mb-1.5">{label}</p>
          <div className="space-y-1">
            <p className="text-slate-900 font-bold flex items-center justify-between gap-3">
              <span>Saldo Akumulasi:</span>
              <span>{formatRupiah(item.balance)}</span>
            </p>
            <p className="text-emerald-600 font-medium flex items-center justify-between gap-3">
              <span>+ Masuk:</span>
              <span>{formatRupiah(item.income)}</span>
            </p>
            <p className="text-rose-600 font-medium flex items-center justify-between gap-3">
              <span>− Keluar:</span>
              <span>{formatRupiah(item.expense)}</span>
            </p>
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
            Tren saldo berjalan dari waktu ke waktu berdasarkan transaksi
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-4">
          <p className="text-xs font-medium text-slate-400">
            Belum ada data perkembangan saldo pada periode ini.
          </p>
        </div>
      ) : (
        <div className="w-full h-64 overflow-x-auto">
          <div className="min-w-[320px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                    return `${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Saldo"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
