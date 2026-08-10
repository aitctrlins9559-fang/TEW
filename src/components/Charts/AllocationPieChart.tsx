import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PieChart, ShieldCheck, LayoutGrid, List } from 'lucide-react';
import { StockPosition } from '../../types';
import { playClickSound } from '../../utils/audio';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AllocationPieChartProps {
  portfolio: StockPosition[];
  usdTwdRate: number;
  isPrivacy: boolean;
}

export const AllocationPieChart: React.FC<AllocationPieChartProps> = ({
  portfolio,
  usdTwdRate,
  isPrivacy,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'stacked'>('split');
  const isEmpty = portfolio.length === 0;

  const labels = isEmpty ? ['尚未建倉'] : portfolio.map((p) => `${p.name} (${p.symbol})`);
  const rawValues = isEmpty
    ? [1]
    : portfolio.map((p) =>
        p.price && p.price > 0 ? p.shares * p.price * (p.market === 'us' ? usdTwdRate : 1) : 0
      );

  const baseColors = [
    '#38bdf8', // sky-400
    '#818cf8', // indigo-400
    '#34d399', // emerald-400
    '#f43f5e', // rose-500
    '#fbbf24', // amber-400
    '#a855f7', // purple-500
    '#fb923c', // orange-400
    '#f472b6', // pink-400
    '#2dd4bf', // teal-400
    '#c084fc', // violet-400
    '#facc15', // yellow-400
    '#e879f9', // fuchsia-400
  ];

  const bgColors = isEmpty ? ['#334155'] : labels.map((_, i) => baseColors[i % baseColors.length]);

  const chartData = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          data: rawValues,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: 'rgba(15, 23, 42, 0.8)',
          hoverOffset: isEmpty ? 0 : 6,
        },
      ],
    };
  }, [labels, rawValues, bgColors, isEmpty]);

  const totalValue = rawValues.reduce((a, b) => a + b, 0);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '74%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#38bdf8',
          bodyColor: '#f8fafc',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          callbacks: {
            label: (context: { raw: unknown; chart: ChartJS }) => {
              if (isEmpty) return ' 市值: $0 NT$ (0%)';
              const dataset = context.chart.data.datasets[0];
              const currentTotal = (dataset.data as number[]).reduce((a, b) => a + b, 0);
              const val = Number(context.raw) || 0;
              const pct = currentTotal > 0 ? ((val / currentTotal) * 100).toFixed(1) + '%' : '0%';
              return isPrivacy
                ? ` 市值: **** NT$ (${pct})`
                : ` 市值: $${Math.round(val).toLocaleString()} NT$ (${pct})`;
            },
          },
        },
      },
    };
  }, [isEmpty, isPrivacy]);

  return (
    <div className="lg:col-span-2 glass-card p-5 md:p-6 rounded-3xl space-y-4 flex flex-col border border-white/10 shadow-2xl">
      {/* Header with View Mode Selector */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-400" /> 個股資產配置占比
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 權重分佈
          </span>
          <div className="bg-slate-900/60 p-0.5 rounded-lg border border-white/10 flex items-center gap-0.5">
            <button
              onClick={() => {
                playClickSound();
                setViewMode('split');
              }}
              className={`p-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="並排顯示"
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                playClickSound();
                setViewMode('stacked');
              }}
              className={`p-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                viewMode === 'stacked'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="上下列表全覽"
            >
              <List className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-grow py-1">
          {/* Doughnut Canvas */}
          <div className="sm:col-span-5 relative h-[210px] w-full flex items-center justify-center">
            <Doughnut data={chartData} options={options} />

            {/* Absolute Center Content with Scaled Font */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                資產總額
              </span>
              <span className="text-xs sm:text-sm md:text-base font-black font-mono text-white tracking-tight tabular-nums drop-shadow-md max-w-[110px] sm:max-w-[130px] truncate">
                {isPrivacy ? '****' : `$${Math.round(totalValue).toLocaleString()}`}
              </span>
              <span className="text-[9px] font-mono text-indigo-400 font-semibold mt-0.5">
                {isEmpty ? '無持股' : `共 ${portfolio.length} 筆`}
              </span>
            </div>
          </div>

          {/* Legend List (Expanded Column Width) */}
          <div className="sm:col-span-7 space-y-1.5 max-h-[220px] overflow-y-auto pr-1 text-xs">
            {isEmpty ? (
              <div className="text-slate-500 text-xs text-center py-8">目前尚無持股部位</div>
            ) : (
              portfolio.map((item, idx) => {
                const val =
                  item.price && item.price > 0
                    ? item.shares * item.price * (item.market === 'us' ? usdTwdRate : 1)
                    : 0;
                const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
                const color = baseColors[idx % baseColors.length];

                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-slate-900/50 hover:bg-white/5 p-2 rounded-xl transition border border-white/5 gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span
                        className="font-bold text-slate-200 text-xs truncate"
                        title={`${item.name} (${item.symbol})`}
                      >
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {item.symbol}
                      </span>
                    </div>

                    <div className="text-right shrink-0 font-mono flex items-center gap-2">
                      <span className="font-bold text-sky-400 text-xs tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {isPrivacy ? '****' : `$${Math.round(val).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Stacked View: Doughnut on top, Full-width Stock List below */
        <div className="space-y-4 flex-grow py-1">
          <div className="relative h-[200px] w-full flex items-center justify-center">
            <Doughnut data={chartData} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                資產總額
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-white tracking-tight tabular-nums drop-shadow-md">
                {isPrivacy ? '****' : `$${Math.round(totalValue).toLocaleString()}`}
              </span>
              <span className="text-[10px] font-mono text-indigo-400 font-semibold mt-0.5">
                {isEmpty ? '無持股' : `共 ${portfolio.length} 筆標的部位`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
            {isEmpty ? (
              <div className="col-span-2 text-slate-500 text-xs text-center py-6">
                目前尚無持股部位
              </div>
            ) : (
              portfolio.map((item, idx) => {
                const val =
                  item.price && item.price > 0
                    ? item.shares * item.price * (item.market === 'us' ? usdTwdRate : 1)
                    : 0;
                const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
                const color = baseColors[idx % baseColors.length];

                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-slate-900/50 hover:bg-white/5 p-2.5 rounded-xl transition border border-white/5 gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-100 text-xs truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.symbol} ｜ {item.market.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <div className="font-bold text-sky-400 text-xs tabular-nums">
                        {pct.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-300 tabular-nums">
                        {isPrivacy ? '****' : `$${Math.round(val).toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

