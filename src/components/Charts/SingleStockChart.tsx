import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart2, Search, Zap, Activity } from 'lucide-react';
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
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import { StockPosition, ChartTarget, MarketType, IntradayData } from '../../types';
import { playClickSound } from '../../utils/audio';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

interface SingleStockChartProps {
  portfolio: StockPosition[];
  selectedChartTarget: ChartTarget;
  onSelectChartTarget: (symbol: string, market: MarketType, name: string) => void;
  isRedUp: boolean;
}

export const SingleStockChart: React.FC<SingleStockChartProps> = ({
  portfolio,
  selectedChartTarget,
  onSelectChartTarget,
  isRedUp,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [intradayData, setIntradayData] = useState<IntradayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 尋找此標的是否在持股中，以取得實時 price
  const matchedPortfolioItem = portfolio.find(
    (p) => p.symbol === selectedChartTarget.symbol && p.market === selectedChartTarget.market
  );

  const fetchIntradayData = useCallback(
    async (target: ChartTarget) => {
      if (!target.symbol) return;
      setLoading(true);
      setErrorMsg(null);

      try {
        const s =
          target.market === 'tse'
            ? `${target.symbol}.TW`
            : target.market === 'otc'
            ? `${target.symbol}.TWO`
            : target.symbol;

        const res = await fetch(`/api/chart?symbol=${encodeURIComponent(s)}&interval=5m&range=1d`);
        const json = await res.json();

        if (!json.success || !json.meta) {
          throw new Error('暫無即時分時行情數據');
        }

        const meta = json.meta;
        const ts: number[] = json.timestamp || [];
        const quotes: number[] = json.quotes || [];

        const labels: string[] = [];
        const prices: number[] = [];

        ts.forEach((t, i) => {
          if (typeof quotes[i] === 'number' && quotes[i] > 0) {
            const d = new Date(t * 1000);
            labels.push(
              `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            );
            prices.push(quotes[i]);
          }
        });

        if (prices.length === 0) {
          throw new Error('暫無盤中分時走勢數據');
        }

        const prevClose = meta.chartPreviousClose || meta.previousClose || prices[0];
        // 若持股清單內有更即時的 real-time 價位，則以即時現價作為最末點
        let latestPrice = prices[prices.length - 1];
        if (matchedPortfolioItem?.price && matchedPortfolioItem.price > 0) {
          latestPrice = matchedPortfolioItem.price;
          prices[prices.length - 1] = latestPrice;
        }

        const highPrice = Math.max(...prices);
        const lowPrice = Math.min(...prices);

        const limitUpPrice = prevClose * 1.1;
        const limitDownPrice = prevClose * 0.9;
        const amplitudePct = prevClose > 0 ? ((highPrice - lowPrice) / prevClose) * 100 : 0;

        const rangeSpan = highPrice - lowPrice;
        const rangePct = rangeSpan > 0 ? ((latestPrice - lowPrice) / rangeSpan) * 100 : 50;

        setIntradayData({
          symbol: target.symbol,
          market: target.market,
          name: target.name || target.symbol,
          prevClose,
          highPrice,
          lowPrice,
          latestPrice,
          limitUpPrice,
          limitDownPrice,
          amplitudePct,
          rangePct,
          labels,
          prices,
        });
      } catch (err) {
        setErrorMsg((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [matchedPortfolioItem]
  );

  useEffect(() => {
    if (selectedChartTarget.symbol) {
      setSearchInput(selectedChartTarget.symbol);
      fetchIntradayData(selectedChartTarget);
    }
  }, [selectedChartTarget, fetchIntradayData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim().toUpperCase();
    if (!query) return;

    const matchedInPortfolio = portfolio.find((p) => p.symbol === query);
    if (matchedInPortfolio) {
      onSelectChartTarget(query, matchedInPortfolio.market, matchedInPortfolio.name);
    } else {
      const isNum = /^\d{4,6}$/.test(query);
      onSelectChartTarget(query, isNum ? 'tse' : 'us', query);
    }
  };

  const getUpColor = useCallback(() => (isRedUp ? '#f43f5e' : '#34d399'), [isRedUp]);
  const getDownColor = useCallback(() => (isRedUp ? '#34d399' : '#f43f5e'), [isRedUp]);

  const chartData = useMemo(() => {
    if (!intradayData) return null;
    const diff = intradayData.latestPrice - intradayData.prevClose;
    const lineColor = diff >= 0 ? getUpColor() : getDownColor();

    return {
      labels: intradayData.labels,
      datasets: [
        {
          label: `${intradayData.name} 即時分時價`,
          data: intradayData.prices,
          borderColor: lineColor,
          borderWidth: 2,
          fill: true,
          tension: 0.15,
          pointRadius: (ctx: { dataIndex: number; dataset: { data: number[] } }) =>
            ctx.dataIndex === ctx.dataset.data.length - 1 ? 5 : 0, // 最末現價點特別亮起
          pointBackgroundColor: lineColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          pointHitRadius: 25,
          backgroundColor: (context: {
            chart: { ctx: CanvasRenderingContext2D; chartArea?: { bottom: number; top: number } };
          }) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'transparent';
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(15,23,42,0)');
            gradient.addColorStop(1, diff >= 0 ? 'rgba(56,189,248,0.18)' : 'rgba(244,63,94,0.18)');
            return gradient;
          },
        },
      ],
    };
  }, [intradayData, getUpColor, getDownColor]);

  const options = useMemo(() => {
    if (!intradayData) return {};
    const prevClose = intradayData.prevClose;

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#38bdf8',
          bodyColor: '#f8fafc',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (items: Array<{ label: string }>) => `時間: ${items[0]?.label || ''}`,
            label: (item: { raw: unknown }) => {
              const p = Number(item.raw) || 0;
              const d = p - prevClose;
              const dPct = prevClose > 0 ? (d / prevClose) * 100 : 0;
              return [
                `價位: $${p.toFixed(2)} ${intradayData.market === 'us' ? 'USD' : 'NT$'}`,
                `變動: ${d >= 0 ? '+' : ''}${d.toFixed(2)} (${d >= 0 ? '+' : ''}${dPct.toFixed(2)}%)`,
              ];
            },
          },
        },
        annotation: {
          annotations: {
            prevCloseLine: {
              type: 'line' as const,
              yMin: prevClose,
              yMax: prevClose,
              borderColor: 'rgba(148, 163, 184, 0.45)',
              borderWidth: 1.5,
              borderDash: [4, 4],
              label: {
                content: `昨收 $${prevClose.toFixed(2)}`,
                display: true,
                position: 'start' as const,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#94a3b8',
                font: { size: 10, weight: 'bold' as const },
              },
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.02)' },
          ticks: { color: '#64748b', maxTicksLimit: 7, font: { family: 'monospace', size: 10 } },
        },
        y: {
          min: intradayData.market === 'us' ? undefined : intradayData.limitDownPrice,
          max: intradayData.market === 'us' ? undefined : intradayData.limitUpPrice,
          grid: { color: 'rgba(255,255,255,0.04)', borderDash: [4, 4] },
          ticks: {
            color: '#64748b',
            font: { family: 'monospace', size: 10 },
            callback: (val: string | number) => `$${Number(val).toFixed(1)}`,
          },
        },
      },
    };
  }, [intradayData]);

  const diff = intradayData ? intradayData.latestPrice - intradayData.prevClose : 0;
  const diffPct =
    intradayData && intradayData.prevClose > 0 ? (diff / intradayData.prevClose) * 100 : 0;

  return (
    <div
      id="singleStockChartCard"
      className="glass-card p-5 md:p-6 rounded-3xl space-y-5 border border-white/10 shadow-2xl"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-wide">
            <BarChart2 className="w-4 h-4 text-purple-400" /> 個股即時分時走勢圖
            <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> 盤中現價同步
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Portfolio Select */}
          <select
            value={
              portfolio.some((p) => p.symbol === selectedChartTarget.symbol)
                ? `${selectedChartTarget.symbol}_${selectedChartTarget.market}`
                : ''
            }
            onChange={(e) => {
              playClickSound();
              const val = e.target.value;
              if (!val) return;
              const item = portfolio.find((p) => `${p.symbol}_${p.market}` === val);
              if (item) {
                onSelectChartTarget(item.symbol, item.market, item.name);
              }
            }}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-sky-400 font-bold outline-none cursor-pointer hover:border-sky-500/50 transition"
          >
            <option value="">從持股快速選擇...</option>
            {portfolio.map((item) => (
              <option key={item.id} value={`${item.symbol}_${item.market}`}>
                {item.symbol} {item.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="搜尋代號 (2330 / NVDA)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="glass-input rounded-xl px-3 py-1.5 text-xs text-white outline-none w-40 font-mono uppercase pr-7"
            />
            <button type="submit" className="absolute right-2 text-slate-400 hover:text-sky-400 p-0.5">
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* 6 High-Tech Metric Tiles (調優字體大小) */}
      {intradayData ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <div className="text-slate-400 font-medium text-[11px] mb-0.5">昨日收盤</div>
            <div className="text-sm font-bold text-slate-200 font-mono tabular-nums">
              ${intradayData.prevClose.toFixed(2)}
            </div>
          </div>
          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <div className="text-slate-400 font-medium text-[11px] mb-0.5">當日最高</div>
            <div className="text-sm font-bold text-rose-400 font-mono tabular-nums">
              ${intradayData.highPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <div className="text-slate-400 font-medium text-[11px] mb-0.5">當日最低</div>
            <div className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
              ${intradayData.lowPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <div className="text-slate-400 font-medium text-[11px] mb-0.5">當日振幅</div>
            <div className="text-sm font-bold text-amber-400 font-mono tabular-nums">
              {intradayData.amplitudePct.toFixed(2)}%
            </div>
          </div>
          <div className="bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/20">
            <div className="text-rose-400/80 font-medium text-[11px] mb-0.5">漲停參考 (+10%)</div>
            <div className="text-sm font-bold text-rose-400 font-mono tabular-nums">
              ${intradayData.limitUpPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/20">
            <div className="text-emerald-400/80 font-medium text-[11px] mb-0.5">跌停參考 (-10%)</div>
            <div className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
              ${intradayData.limitDownPrice.toFixed(2)}
            </div>
          </div>
        </div>
      ) : null}

      {/* Intraday Position Bar */}
      {intradayData && (
        <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-slate-300 font-medium text-[11px]">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> 當前相對高低位階 (Intraday Position)
            </span>
            <span className="font-mono text-sky-400 font-bold">{intradayData.rangePct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden p-0.5 border border-white/5">
            <div
              className="bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, intradayData.rangePct))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums pt-0.5">
            <span>最低: <strong className="text-emerald-400">${intradayData.lowPrice.toFixed(2)}</strong></span>
            <span>
              即時現價:{' '}
              <strong
                className={`font-bold ${
                  diff >= 0
                    ? isRedUp
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                    : isRedUp
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                ${intradayData.latestPrice.toFixed(2)} ({diff >= 0 ? '+' : ''}${diff.toFixed(2)} /{' '}
                {diff >= 0 ? '+' : ''}${diffPct.toFixed(2)}%)
              </strong>
            </span>
            <span>最高: <strong className="text-rose-400">${intradayData.highPrice.toFixed(2)}</strong></span>
          </div>
        </div>
      )}

      {/* Line Chart Canvas */}
      <div className="h-64 sm:h-72 relative w-full pt-1">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-sky-400 font-mono text-xs">
            即時分時數據連線中...
          </div>
        ) : errorMsg ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-mono text-xs">
            {errorMsg}
          </div>
        ) : chartData ? (
          <Line data={chartData} options={options} />
        ) : null}
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 font-mono tracking-wider uppercase tabular-nums border-t border-white/5 pt-2">
        <span>標的: {intradayData ? `${intradayData.name} (${intradayData.symbol})` : '--'}</span>
        <span>
          {intradayData
            ? `當前盤中價: $${intradayData.latestPrice.toFixed(2)} ${
                intradayData.market === 'us' ? 'USD' : 'NT$'
              }`
            : '請選擇監控標的'}
        </span>
      </div>
    </div>
  );
};
