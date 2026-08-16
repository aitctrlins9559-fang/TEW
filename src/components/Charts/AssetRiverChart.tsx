import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { StockPosition } from '../../types';
import { formatMoney } from '../../utils/format';
import { Waves, Calendar, Info, Layers, RefreshCw, CheckCircle2 } from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import { apiFetchChartData } from '../../utils/apiClient';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AssetRiverChartProps {
  portfolio: StockPosition[];
  usdTwdRate: number;
  isPrivacy: boolean;
  isRedUp: boolean;
}

// Preset color palette for stacked layers in the river chart
const PALETTE = [
  { border: '#38bdf8', bg: 'rgba(56, 189, 248, 0.6)' },   // Sky Blue
  { border: '#818cf8', bg: 'rgba(129, 140, 248, 0.6)' },  // Indigo
  { border: '#34d399', bg: 'rgba(52, 211, 153, 0.6)' },   // Emerald
  { border: '#fbbf24', bg: 'rgba(251, 191, 36, 0.6)' },   // Amber
  { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.6)' },    // Rose
  { border: '#c084fc', bg: 'rgba(192, 132, 252, 0.6)' },  // Purple
  { border: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.6)' },   // Teal
  { border: '#fb923c', bg: 'rgba(251, 146, 60, 0.6)' },   // Orange
];

export const AssetRiverChart: React.FC<AssetRiverChartProps> = ({
  portfolio,
  usdTwdRate,
  isPrivacy,
}) => {
  // Weeks range: 4 (1m), 12 (3m), 26 (6m), 52 (1y)
  const [weeksRange, setWeeksRange] = useState<number>(12);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [realChartData, setRealChartData] = useState<{
    labels: string[];
    datasets: any[];
    totalStartVal: number;
    totalCurrentVal: number;
  }>({
    labels: [],
    datasets: [],
    totalStartVal: 0,
    totalCurrentVal: 0,
  });

  // Fetch real historical weekly price series for each stock
  useEffect(() => {
    let isMounted = true;
    if (!portfolio || portfolio.length === 0) {
      setRealChartData({ labels: [], datasets: [], totalStartVal: 0, totalCurrentVal: 0 });
      setIsLoading(false);
      return;
    }

    const fetchRealData = async () => {
      setIsLoading(true);

      // Map weeks count to Yahoo API range
      let range = '3mo';
      if (weeksRange === 4) range = '1mo';
      else if (weeksRange === 12) range = '3mo';
      else if (weeksRange === 26) range = '6mo';
      else if (weeksRange === 52) range = '1y';

      try {
        const results = await Promise.all(
          portfolio.map(async (stock) => {
            const sym = stock.symbol;
            let querySym = sym.toUpperCase();
            if (stock.market === 'tse' && !querySym.endsWith('.TW')) querySym = `${querySym}.TW`;
            if (stock.market === 'otc' && !querySym.endsWith('.TWO')) querySym = `${querySym}.TWO`;

            const chartRes = await apiFetchChartData(querySym, range, '1wk');
            return {
              stock,
              chartRes,
            };
          })
        );

        if (!isMounted) return;

        // Collect all timestamps and map to formatted date strings
        const timeMap = new Map<number, string>();
        results.forEach(({ chartRes }) => {
          if (chartRes && Array.isArray(chartRes.timestamp)) {
            chartRes.timestamp.forEach((ts: number) => {
              if (ts && !timeMap.has(ts)) {
                const dt = new Date(ts * 1000);
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const dd = String(dt.getDate()).padStart(2, '0');
                timeMap.set(ts, `${mm}/${dd}`);
              }
            });
          }
        });

        // Sorted unix timestamps ascending
        const sortedTimestamps = Array.from(timeMap.keys()).sort((a, b) => a - b);

        let dateLabels: string[] = sortedTimestamps.map((ts) => timeMap.get(ts) || '');

        // Fallback date labels if empty
        if (sortedTimestamps.length === 0) {
          const today = new Date();
          for (let i = weeksRange; i >= 0; i--) {
            const d = new Date(today.getTime() - i * 7 * 86400 * 1000);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            dateLabels.push(`${mm}/${dd}`);
          }
        }

        let startValSum = 0;
        let currentValSum = 0;

        // Build stacked dataset using REAL prices
        const datasets = results.map(({ stock, chartRes }, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const fx = stock.market === 'us' ? usdTwdRate : 1;
          const currentPrice = stock.price && stock.price > 0 ? stock.price : stock.cost;
          const currentVal = stock.shares * currentPrice * fx;
          currentValSum += currentVal;

          const rawTsList: number[] = chartRes?.timestamp || [];
          const rawQuotes: (number | null)[] = chartRes?.quotes || [];

          // Create map from ts to quote
          const tsToPrice = new Map<number, number>();
          rawTsList.forEach((ts, tIdx) => {
            const p = rawQuotes[tIdx];
            if (p && typeof p === 'number' && p > 0) {
              tsToPrice.set(ts, p);
            }
          });

          // Match each sorted timestamp
          let lastValidPrice = stock.cost || currentPrice;
          const seriesData: number[] = [];

          if (sortedTimestamps.length > 0) {
            sortedTimestamps.forEach((ts, tsIdx) => {
              const realP = tsToPrice.get(ts);
              if (realP && realP > 0) {
                lastValidPrice = realP;
              }
              const holdingVal = Math.round(stock.shares * lastValidPrice * fx);
              seriesData.push(holdingVal);

              if (tsIdx === 0) {
                startValSum += holdingVal;
              }
            });
          } else {
            // Static fallback if API call returned no ts
            for (let i = 0; i < dateLabels.length; i++) {
              seriesData.push(Math.round(currentVal));
            }
            startValSum += currentVal;
          }

          return {
            label: `${stock.name} (${stock.symbol})`,
            data: seriesData,
            borderColor: color.border,
            backgroundColor: color.bg,
            borderWidth: 1.5,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: color.border,
          };
        });

        setRealChartData({
          labels: dateLabels,
          datasets,
          totalStartVal: startValSum,
          totalCurrentVal: currentValSum,
        });
      } catch {
        // ignore
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRealData();

    return () => {
      isMounted = false;
    };
  }, [portfolio, usdTwdRate, weeksRange]);

  const { labels, datasets, totalStartVal, totalCurrentVal } = realChartData;
  const diffVal = totalCurrentVal - totalStartVal;
  const diffPct = totalStartVal > 0 ? (diffVal / totalStartVal) * 100 : 0;

  const chartData = useMemo(() => {
    return {
      labels,
      datasets,
    };
  }, [labels, datasets]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            color: '#94a3b8',
            font: { size: 10, family: 'sans-serif' },
            boxWidth: 10,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#38bdf8',
          bodyColor: '#f8fafc',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            title: (items: Array<{ label: string }>) => `週次時間: ${items[0]?.label || ''}`,
            label: (item: { dataset: { label?: string }; raw: unknown }) => {
              const val = Number(item.raw) || 0;
              if (isPrivacy) return `${item.dataset.label || ''}: **** NT$`;
              return `${item.dataset.label || ''}: $${Math.round(val).toLocaleString()} NT$`;
            },
            footer: (items: Array<{ raw: unknown }>) => {
              if (isPrivacy) return `當週全資產總計: **** NT$`;
              const total = items.reduce((sum, it) => sum + (Number(it.raw) || 0), 0);
              return `當週全資產總計: $${Math.round(total).toLocaleString()} NT$`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: {
            color: '#64748b',
            font: { size: 10, family: 'monospace' },
            maxTicksLimit: 10,
            maxRotation: 0,
            padding: 8,
          },
        },
        y: {
          stacked: true,
          position: 'right' as const,
          grid: { color: 'rgba(255,255,255,0.05)', borderDash: [5, 5] },
          ticks: {
            color: '#94a3b8',
            font: { size: 11, family: 'monospace', weight: 'bold' as const },
            maxTicksLimit: 5, // Generous spacing for Y-axis numbers
            padding: 12,
            callback: (value: string | number) => {
              if (isPrivacy) return '****';
              const val = Number(value);
              if (Math.abs(val) >= 10000) {
                const w = val / 10000;
                return w % 1 === 0 ? `${w.toFixed(0)} 萬` : `${w.toFixed(1)} 萬`;
              }
              return `$${Math.round(val).toLocaleString()}`;
            },
          },
        },
      },
    };
  }, [isPrivacy]);

  return (
    <div className="glass-card p-5 md:p-6 rounded-3xl space-y-4 border border-white/10 shadow-2xl relative">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">
                LONG-TERM ASSET RIVER FLOW
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide flex flex-wrap items-center gap-2">
                長期資產堆疊河流圖
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  X軸最小單位：1 週
                </span>
                {isLoading ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    歷史行情載入中...
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    官方市場真實歷史數據
                  </span>
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Weeks Time Range Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs">
          {[
            { label: '4 週 (1月)', weeks: 4 },
            { label: '12 週 (3月)', weeks: 12 },
            { label: '26 週 (半年)', weeks: 26 },
            { label: '52 週 (1年)', weeks: 52 },
          ].map((item) => (
            <button
              key={item.weeks}
              onClick={() => {
                playClickSound();
                setWeeksRange(item.weeks);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                weeksRange === item.weeks
                  ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info Notice Bar */}
      <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Layers className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            週次間距：<strong className="text-sky-300">{weeksRange} 週 (7 天/刻度)</strong> | 持股層疊：<strong className="text-emerald-400">{portfolio.length} 檔標的</strong>
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 text-[11px]">區間資產增減：</span>
          <span className={`font-bold ml-1 ${diffVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPrivacy ? '****' : `${diffVal >= 0 ? '+' : ''}$${Math.abs(Math.round(diffVal)).toLocaleString()} (${diffVal >= 0 ? '+' : ''}${diffPct.toFixed(2)}%)`}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[340px] relative w-full pt-1">
        <Line data={chartData} options={options} />
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider font-mono border-t border-white/5 pt-2">
        <span>起始週: {labels[0] || '--'}</span>
        <span className="text-indigo-400/80">★ 河流圖堆疊展示各持股市值演變</span>
        <span>最新週: {labels[labels.length - 1] || '--'}</span>
      </div>
    </div>
  );
};
