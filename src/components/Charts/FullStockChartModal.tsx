import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X,
  BarChart2,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Search,
  PieChart,
  BarChart,
  Sliders,
  Sparkles,
  Info,
  DollarSign,
  Percent,
  Layers,
  Flame,
  Volume2,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart } from 'react-chartjs-2';
import { StockPosition, ChartTarget, MarketType, IntradayData } from '../../types';
import { playClickSound } from '../../utils/audio';
import { apiFetchChartData, apiSearchStock } from '../../utils/apiClient';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

interface FullStockChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: StockPosition[];
  selectedChartTarget: ChartTarget;
  onSelectChartTarget: (symbol: string, market: MarketType, name: string) => void;
  isRedUp: boolean;
}

// Quick Switcher Preset Categories
const MARKET_INDICES: Array<{ symbol: string; market: MarketType; name: string }> = [
  { symbol: '^TWII', market: 'tse', name: '台股加權' },
  { symbol: '^DJI', market: 'us', name: '道瓊工業' },
  { symbol: '^GSPC', market: 'us', name: '標普500' },
  { symbol: '^IXIC', market: 'us', name: '納斯達克' },
  { symbol: '^N225', market: 'us', name: '日經225' },
];

const HOT_STOCKS: Array<{ symbol: string; market: MarketType; name: string }> = [
  { symbol: '2330', market: 'tse', name: '台積電' },
  { symbol: '2317', market: 'tse', name: '鴻海' },
  { symbol: '2454', market: 'tse', name: '聯發科' },
  { symbol: '0050', market: 'tse', name: '元大台灣50' },
  { symbol: '0056', market: 'tse', name: '元大高股息' },
  { symbol: '00878', market: 'tse', name: '國泰永續高股息' },
  { symbol: 'TSLA', market: 'us', name: '特斯拉' },
  { symbol: 'NVDA', market: 'us', name: '輝達' },
  { symbol: 'AAPL', market: 'us', name: '蘋果' },
];

function generateFullTradingSession(
  market: MarketType,
  symbol: string,
  ts: number[],
  quotes: number[],
  rawVolumes: number[] = []
) {
  const isUS = market === 'us' || symbol === '^DJI' || symbol === '^GSPC' || symbol === '^IXIC';
  const isJP = symbol === '^N225';
  const isKR = symbol === '^KS11';

  let startMins = 9 * 60; // 09:00
  let endMins = 13 * 60 + 30; // 13:30

  if (isUS) {
    startMins = 9 * 60 + 30; // 09:30
    endMins = 16 * 60; // 16:00
  } else if (isJP) {
    startMins = 9 * 60; // 09:00
    endMins = 15 * 60; // 15:00
  } else if (isKR) {
    startMins = 9 * 60; // 09:00
    endMins = 15 * 60 + 30; // 15:30
  }

  const fullLabels: string[] = [];
  for (let m = startMins; m <= endMins; m += 5) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    fullLabels.push(`${hh}:${mm}`);
  }

  const priceMap = new Map<string, number>();
  const volumeMap = new Map<string, number>();
  const validPrices: number[] = [];

  ts.forEach((t, i) => {
    if (typeof quotes[i] === 'number' && quotes[i] > 0) {
      const d = new Date(t * 1000);
      const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      priceMap.set(hhmm, quotes[i]);
      if (typeof rawVolumes[i] === 'number') {
        volumeMap.set(hhmm, rawVolumes[i]);
      }
      validPrices.push(quotes[i]);
    }
  });

  if (validPrices.length === 0) {
    return { fullLabels: [], fullPrices: [], validPrices: [], fullVolumes: [] };
  }

  let latestAvailableIndex = -1;
  fullLabels.forEach((label, idx) => {
    if (priceMap.has(label)) {
      latestAvailableIndex = idx;
    }
  });

  if (latestAvailableIndex === -1) {
    const fallbackLabels: string[] = [];
    const fallbackVolumes: number[] = [];
    ts.forEach((t, i) => {
      if (typeof quotes[i] === 'number' && quotes[i] > 0) {
        const d = new Date(t * 1000);
        fallbackLabels.push(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
        fallbackVolumes.push(rawVolumes[i] || 0);
      }
    });
    return { fullLabels: fallbackLabels, fullPrices: validPrices, validPrices, fullVolumes: fallbackVolumes };
  }

  const fullPrices: (number | null)[] = [];
  const fullVolumes: number[] = [];
  let lastVal: number | null = null;

  for (let i = 0; i < fullLabels.length; i++) {
    const label = fullLabels[i];
    if (priceMap.has(label)) {
      lastVal = priceMap.get(label)!;
      fullPrices.push(lastVal);
      fullVolumes.push(volumeMap.get(label) || 0);
    } else if (i <= latestAvailableIndex) {
      fullPrices.push(lastVal);
      fullVolumes.push(0);
    } else {
      fullPrices.push(null);
      fullVolumes.push(0);
    }
  }

  return { fullLabels, fullPrices, validPrices, fullVolumes };
}

export const FullStockChartModal: React.FC<FullStockChartModalProps> = ({
  isOpen,
  onClose,
  portfolio,
  selectedChartTarget,
  onSelectChartTarget,
  isRedUp,
}) => {
  const [intradayData, setIntradayData] = useState<IntradayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Indicators toggles
  const [showVWAP, setShowVWAP] = useState(true);
  const [showMA5, setShowMA5] = useState(false);
  const [showVolumeBars, setShowVolumeBars] = useState(true);

  // Quick Switcher search & category tabs
  const [switcherTab, setSwitcherTab] = useState<'portfolio' | 'indices' | 'hot'>('portfolio');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ symbol: string; name: string; market: MarketType }>
  >([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Match current target with portfolio item
  const matchedPortfolioItem = useMemo(() => {
    return portfolio.find(
      (p) => p.symbol === selectedChartTarget.symbol && p.market === selectedChartTarget.market
    );
  }, [portfolio, selectedChartTarget]);

  // Handle Search Input in Modal
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await apiSearchStock(val);
        setSearchResults(res);
      } catch {
        setSearchResults([]);
      }
    }, 250);
  };

  // Fetch Intraday Data
  const fetchIntradayData = useCallback(
    async (target: ChartTarget) => {
      if (!target.symbol) return;
      setLoading(true);
      setErrorMsg(null);

      try {
        const s =
          target.symbol.startsWith('^')
            ? target.symbol
            : target.market === 'tse'
            ? `${target.symbol}.TW`
            : target.market === 'otc'
            ? `${target.symbol}.TWO`
            : target.symbol;

        const json = await apiFetchChartData(s, '1d', '5m');

        if (!json || !json.success || !json.meta) {
          throw new Error('暫無即時分時行情數據');
        }

        const meta = json.meta;
        const ts: number[] = json.timestamp || [];
        const quotes: number[] = json.quotes || [];
        const rawVolumes: number[] = json.volumes || [];

        const { fullLabels, fullPrices, validPrices, fullVolumes } = generateFullTradingSession(
          target.market,
          target.symbol,
          ts,
          quotes,
          rawVolumes
        );

        if (validPrices.length === 0) {
          throw new Error('暫無盤中分時走勢數據');
        }

        const prevClose = meta.chartPreviousClose || meta.previousClose || validPrices[0];
        let latestPrice = validPrices[validPrices.length - 1];
        if (matchedPortfolioItem?.price && matchedPortfolioItem.price > 0) {
          latestPrice = matchedPortfolioItem.price;
        }

        const openPrice = meta.regularMarketOpen || meta.open || validPrices[0] || prevClose;
        const highPrice = Math.max(...validPrices);
        const lowPrice = Math.min(...validPrices);

        let totalVolume = meta.regularMarketVolume || meta.volume || 0;
        if (totalVolume === 0 && fullVolumes.length > 0) {
          totalVolume = fullVolumes.reduce((a, b) => a + b, 0);
        }

        // Estimated volume calculation based on current session progress
        const validCount = validPrices.length;
        const totalSessionIntervals = 54; // ~54 5-min blocks in a standard 4.5h trading session
        const sessionProgress = Math.max(0.1, Math.min(1.0, validCount / totalSessionIntervals));
        const estimatedVolume = Math.round(totalVolume / sessionProgress);

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
          openPrice,
          highPrice,
          lowPrice,
          latestPrice,
          totalVolume,
          estimatedVolume,
          limitUpPrice,
          limitDownPrice,
          amplitudePct,
          rangePct,
          labels: fullLabels,
          prices: fullPrices as number[],
          volumes: fullVolumes,
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
    if (isOpen && selectedChartTarget.symbol) {
      fetchIntradayData(selectedChartTarget);
    }
  }, [isOpen, selectedChartTarget, fetchIntradayData]);

  const getUpColor = useCallback(() => (isRedUp ? '#f43f5e' : '#34d399'), [isRedUp]);
  const getDownColor = useCallback(() => (isRedUp ? '#34d399' : '#f43f5e'), [isRedUp]);

  // Stepper navigation (< / >)
  const portfolioList = useMemo(() => {
    return portfolio.map((p) => ({ symbol: p.symbol, market: p.market, name: p.name }));
  }, [portfolio]);

  const currentPortfolioIndex = useMemo(() => {
    return portfolioList.findIndex(
      (p) => p.symbol === selectedChartTarget.symbol && p.market === selectedChartTarget.market
    );
  }, [portfolioList, selectedChartTarget]);

  const handlePrevStock = () => {
    if (portfolioList.length === 0) return;
    playClickSound();
    const prevIdx = (currentPortfolioIndex - 1 + portfolioList.length) % portfolioList.length;
    const item = portfolioList[prevIdx];
    onSelectChartTarget(item.symbol, item.market, item.name);
  };

  const handleNextStock = () => {
    if (portfolioList.length === 0) return;
    playClickSound();
    const nextIdx = (currentPortfolioIndex + 1) % portfolioList.length;
    const item = portfolioList[nextIdx];
    onSelectChartTarget(item.symbol, item.market, item.name);
  };

  // Chart datasets & multi-axis volume bar setup
  const chartData = useMemo(() => {
    if (!intradayData) return null;
    const diff = intradayData.latestPrice - intradayData.prevClose;
    const lineColor = diff >= 0 ? getUpColor() : getDownColor();

    const lastValidIdx = intradayData.prices.findLastIndex((p) => p !== null && p !== undefined);

    // Calculate VWAP (cumulative average)
    const vwapData: (number | null)[] = [];
    let cumSum = 0;
    let count = 0;
    intradayData.prices.forEach((p) => {
      if (p !== null && p !== undefined) {
        cumSum += p;
        count += 1;
        vwapData.push(cumSum / count);
      } else {
        vwapData.push(null);
      }
    });

    // Calculate MA5 (5-point moving average)
    const ma5Data: (number | null)[] = [];
    intradayData.prices.forEach((p, idx) => {
      if (p === null || p === undefined) {
        ma5Data.push(null);
      } else {
        const slice = intradayData.prices
          .slice(Math.max(0, idx - 4), idx + 1)
          .filter((x): x is number => x !== null && x !== undefined);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        ma5Data.push(avg);
      }
    });

    // Color code volume bars based on price direction relative to previous tick
    const volumeColors: string[] = [];
    const volumes = intradayData.volumes || [];
    let prevP = intradayData.prevClose;

    intradayData.prices.forEach((p) => {
      if (p !== null && p !== undefined) {
        if (p >= prevP) {
          volumeColors.push(getUpColor() + '80'); // 50% opacity
        } else {
          volumeColors.push(getDownColor() + '80');
        }
        prevP = p;
      } else {
        volumeColors.push('transparent');
      }
    });

    const datasets: any[] = [
      {
        type: 'line' as const,
        label: `${intradayData.name} 分時價`,
        data: intradayData.prices,
        borderColor: lineColor,
        borderWidth: 2.5,
        fill: true,
        spanGaps: false,
        tension: 0.15,
        pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === lastValidIdx ? 6 : 0),
        pointBackgroundColor: lineColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        pointHitRadius: 20,
        yAxisID: 'y',
        backgroundColor: (context: {
          chart: { ctx: CanvasRenderingContext2D; chartArea?: { bottom: number; top: number } };
        }) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'transparent';
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(15,23,42,0)');
          gradient.addColorStop(1, diff >= 0 ? 'rgba(56,189,248,0.20)' : 'rgba(244,63,94,0.20)');
          return gradient;
        },
      },
    ];

    if (showVWAP) {
      datasets.push({
        type: 'line' as const,
        label: '當日 VWAP 均價線',
        data: vwapData,
        borderColor: '#f59e0b', // Amber
        borderWidth: 1.5,
        borderDash: [3, 3],
        fill: false,
        pointRadius: 0,
        tension: 0.2,
        yAxisID: 'y',
      });
    }

    if (showMA5) {
      datasets.push({
        type: 'line' as const,
        label: 'MA5 均線',
        data: ma5Data,
        borderColor: '#a855f7', // Purple
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        tension: 0.2,
        yAxisID: 'y',
      });
    }

    if (showVolumeBars && volumes.length > 0) {
      datasets.push({
        type: 'bar' as const,
        label: '分時成交量',
        data: volumes,
        backgroundColor: volumeColors,
        borderWidth: 0,
        barThickness: 'flex',
        yAxisID: 'y1',
      });
    }

    return {
      labels: intradayData.labels,
      datasets,
    };
  }, [intradayData, getUpColor, getDownColor, showVWAP, showMA5, showVolumeBars]);

  const maxVolume = useMemo(() => {
    if (!intradayData || !intradayData.volumes) return 1000;
    return Math.max(...intradayData.volumes, 10);
  }, [intradayData]);

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
          displayColors: true,
          callbacks: {
            title: (items: Array<{ label: string }>) => `時間: ${items[0]?.label || ''}`,
            label: (item: { raw: unknown; dataset: { label: string; yAxisID?: string } }) => {
              if (item.raw === null || item.raw === undefined) return `${item.dataset.label}: --`;
              const val = Number(item.raw) || 0;
              if (item.dataset.yAxisID === 'y1') {
                if (intradayData.market === 'us') {
                  return `成交量: ${val.toLocaleString()} 股`;
                }
                const lots = Math.round(val / 1000);
                return `成交量: ${val.toLocaleString()} 股 (${lots} 張)`;
              }
              const d = val - prevClose;
              const dPct = prevClose > 0 ? (d / prevClose) * 100 : 0;
              return `${item.dataset.label}: $${val.toFixed(2)} (${d >= 0 ? '+' : ''}${dPct.toFixed(2)}%)`;
            },
          },
        },
        annotation: {
          annotations: {
            prevCloseLine: {
              type: 'line' as const,
              yMin: prevClose,
              yMax: prevClose,
              borderColor: 'rgba(148, 163, 184, 0.5)',
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
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: { color: '#64748b', maxTicksLimit: 12, font: { family: 'monospace', size: 10 } },
        },
        y: {
          type: 'linear' as const,
          position: 'left' as const,
          min: intradayData.market === 'us' ? undefined : intradayData.limitDownPrice,
          max: intradayData.market === 'us' ? undefined : intradayData.limitUpPrice,
          grid: { color: 'rgba(255,255,255,0.05)', borderDash: [4, 4] },
          ticks: {
            color: '#64748b',
            font: { family: 'monospace', size: 10 },
            callback: (val: string | number) => `$${Number(val).toFixed(1)}`,
          },
        },
        y1: {
          type: 'linear' as const,
          position: 'right' as const,
          display: showVolumeBars,
          grid: { display: false },
          max: maxVolume * 3.8, // keeps volume bars confined to bottom 25% of chart height
          ticks: {
            color: '#475569',
            font: { family: 'monospace', size: 9 },
            callback: (val: string | number) => {
              const num = Number(val);
              if (num <= 0) return '';
              if (intradayData.market === 'us') {
                return num >= 1000000 ? `${(num / 1000000).toFixed(1)}M` : `${(num / 1000).toFixed(0)}K`;
              }
              const lots = num / 1000;
              return lots >= 1000 ? `${(lots / 1000).toFixed(1)}k張` : `${Math.round(lots)}張`;
            },
          },
        },
      },
    };
  }, [intradayData, maxVolume, showVolumeBars]);

  if (!isOpen) return null;

  const diff = intradayData ? intradayData.latestPrice - intradayData.prevClose : 0;
  const diffPct =
    intradayData && intradayData.prevClose > 0 ? (diff / intradayData.prevClose) * 100 : 0;
  const isUp = diff >= 0;

  // Strength status text & indicator
  const strengthPct = intradayData ? Math.min(100, Math.max(0, intradayData.rangePct)) : 50;
  const strengthText =
    strengthPct >= 80
      ? '多方強勢拉抬'
      : strengthPct >= 60
      ? '多方偏強'
      : strengthPct >= 40
      ? '高低區間震盪'
      : strengthPct >= 20
      ? '空方偏弱'
      : '極度低檔支撐';

  // Format Volume string nicely (張數 for TW, M/K shares for US)
  const formatVolumeStr = (shares: number, market: MarketType) => {
    if (!shares || shares <= 0) return '--';
    if (market === 'us') {
      return shares >= 1000000
        ? `${(shares / 1000000).toFixed(2)} M 股`
        : `${(shares / 1000).toFixed(1)} K 股`;
    }
    const lots = Math.round(shares / 1000);
    return `${lots.toLocaleString()} 張 (${(shares / 10000).toFixed(1)}萬股)`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-y-auto animate-fadeIn p-3 sm:p-5 h-[100dvh]">
      {/* Top Professional Control Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide truncate">
                {selectedChartTarget.name || selectedChartTarget.symbol}
              </h2>
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg shrink-0">
                {selectedChartTarget.symbol}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 shrink-0">
                {selectedChartTarget.market === 'us' ? '美股' : selectedChartTarget.market === 'otc' ? '上櫃' : '上市'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              專業級全畫幅即時看盤 (五檔量價與高低位階)
            </p>
          </div>
        </div>

        {/* Action Controls & Stock Stepper (< / >) */}
        <div className="flex items-center gap-2 shrink-0">
          {portfolioList.length > 1 && (
            <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-0.5">
              <button
                onClick={handlePrevStock}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
                title="上一檔持股"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono px-1.5 text-slate-400 font-bold">
                {currentPortfolioIndex >= 0 ? `${currentPortfolioIndex + 1}/${portfolioList.length}` : '切換'}
              </span>
              <button
                onClick={handleNextStock}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
                title="下一檔持股"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="關閉看盤視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Re-organized Intraday Real-time Information Panel */}
      {intradayData && (
        <div className="my-2 space-y-2 shrink-0">
          {/* ESSENTIAL CORE BANNER: Price + Volume + Key Action Status */}
          <div className="bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-sky-500/20 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left: Latest Price & Change */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className={`text-3xl sm:text-4xl font-black font-mono tracking-tight tabular-nums ${
                  isUp
                    ? isRedUp
                      ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                    : isRedUp
                    ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                    : 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                }`}
              >
                ${intradayData.latestPrice.toFixed(2)}
              </span>
              <span
                className={`text-sm sm:text-base font-mono font-bold flex items-center gap-1 ${
                  isUp
                    ? isRedUp
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                    : isRedUp
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isUp ? '+' : ''}
                {diff.toFixed(2)} ({isUp ? '+' : ''}
                {diffPct.toFixed(2)}%)
              </span>
            </div>

            {/* Center: Essential Volume & Intraday VWAP Highlight Cards */}
            <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
              <div className="bg-slate-950/70 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">成交量 (Total Vol)</span>
                  <strong className="text-amber-300 font-bold">
                    {formatVolumeStr(intradayData.totalVolume, intradayData.market)}
                  </strong>
                </div>
              </div>

              {intradayData.estimatedVolume > 0 && (
                <div className="bg-slate-950/70 border border-purple-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <Flame className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">估計全日量 (Est Vol)</span>
                    <strong className="text-purple-300 font-bold">
                      {formatVolumeStr(intradayData.estimatedVolume, intradayData.market)}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Portfolio Unrealized P&L Quick Snapshot (If User Owns This Stock) */}
            {matchedPortfolioItem && (
              <div className="bg-purple-950/40 border border-purple-500/30 px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-3 flex-wrap w-full lg:w-auto">
                <span className="text-purple-300 font-bold flex items-center gap-1 shrink-0">
                  <PieChart className="w-3.5 h-3.5" /> 我的庫存現況
                </span>
                <span className="text-slate-300">
                  {matchedPortfolioItem.shares} 股 @ ${(matchedPortfolioItem.cost || 0).toFixed(1)}
                </span>
                {(() => {
                  const currentValue = matchedPortfolioItem.shares * intradayData.latestPrice;
                  const totalCost = matchedPortfolioItem.shares * (matchedPortfolioItem.cost || 0);
                  const unpl = currentValue - totalCost;
                  const unplRoi = totalCost > 0 ? (unpl / totalCost) * 100 : 0;
                  const isUnplPos = unpl >= 0;
                  return (
                    <span
                      className={`font-bold ${
                        isUnplPos
                          ? isRedUp
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                          : isRedUp
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      未實現 {isUnplPos ? '+' : ''}${Math.round(unpl).toLocaleString()} (
                      {isUnplPos ? '+' : ''}
                      {unplRoi.toFixed(1)}%)
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* SECONDARY TRADING METRICS & PIVOT CARDS (精簡後的靈魂數據) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">開盤價 (Open)</span>
              <strong className="text-slate-200">${intradayData.openPrice.toFixed(2)}</strong>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">昨日收盤 (Prev Close)</span>
              <strong className="text-slate-300">${intradayData.prevClose.toFixed(2)}</strong>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">今日最高 (Day High)</span>
              <strong className="text-rose-400">${intradayData.highPrice.toFixed(2)}</strong>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">今日最低 (Day Low)</span>
              <strong className="text-emerald-400">${intradayData.lowPrice.toFixed(2)}</strong>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">盤中振幅 (Amplitude)</span>
              <strong className="text-amber-400">{intradayData.amplitudePct.toFixed(2)}%</strong>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">距今日高點 (From High)</span>
              <strong className="text-slate-200">
                {intradayData.highPrice > 0 ? (
                  <>
                    -
                    {(
                      ((intradayData.highPrice - intradayData.latestPrice) / intradayData.highPrice) *
                      100
                    ).toFixed(2)}
                    %
                  </>
                ) : (
                  '--'
                )}
              </strong>
            </div>
          </div>

          {/* Intraday Strength & Position Slider Bar */}
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[10px] text-slate-400">盤中高低位階與強弱控盤:</span>
              <span className="text-sky-400 font-bold">
                {strengthText} (位階 {Math.round(strengthPct)}%)
              </span>
            </div>
            <div className="flex-1 max-w-md h-2 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  strengthPct >= 60
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : strengthPct >= 40
                    ? 'bg-gradient-to-r from-sky-500 to-amber-500'
                    : 'bg-gradient-to-r from-emerald-500 to-sky-500'
                }`}
                style={{ width: `${strengthPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas Section */}
      <div className="shrink-0 my-2 w-full bg-slate-900/40 p-3 sm:p-4 rounded-3xl border border-white/10 relative flex flex-col justify-center min-h-[350px]">
        {/* Intraday Technical Overlay Toggles */}
        <div className="sm:absolute sm:top-3 sm:right-4 z-10 flex items-center gap-2 flex-wrap mb-2 sm:mb-0">
          <button
            onClick={() => {
              playClickSound();
              setShowVWAP(!showVWAP);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition flex items-center gap-1 border ${
              showVWAP
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${showVWAP ? 'bg-amber-400' : 'bg-slate-600'}`}
            />
            VWAP 均價線
          </button>
          <button
            onClick={() => {
              playClickSound();
              setShowMA5(!showMA5);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition flex items-center gap-1 border ${
              showMA5
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${showMA5 ? 'bg-purple-400' : 'bg-slate-600'}`}
            />
            MA5 均線
          </button>
          <button
            onClick={() => {
              playClickSound();
              setShowVolumeBars(!showVolumeBars);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition flex items-center gap-1 border ${
              showVolumeBars
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart className="w-3 h-3 text-sky-400" />
            成交量柱
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center text-sky-400 font-mono text-sm py-20 gap-2">
            <Activity className="w-8 h-8 animate-spin text-sky-400" />
            <span>盤中即時行情數據加載中...</span>
          </div>
        ) : errorMsg ? (
          <div className="text-center text-slate-400 font-mono text-sm py-20">
            {errorMsg}
          </div>
        ) : chartData ? (
          <div className="w-full h-[320px] sm:h-[420px] md:h-[480px] relative pt-2">
            <Chart type="line" data={chartData} options={options} />
          </div>
        ) : null}
      </div>

      {/* Expanded Interactive Bottom Quick Switcher */}
      <div className="pt-2 border-t border-white/10 shrink-0 space-y-2">
        {/* Switcher Navigation Tabs & In-Modal Live Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Categories Tabs */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => {
                playClickSound();
                setSwitcherTab('portfolio');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                switcherTab === 'portfolio'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>我的持股</span>
              <span className="bg-black/20 px-1.5 py-0.5 rounded text-[10px]">
                {portfolio.length}
              </span>
            </button>
            <button
              onClick={() => {
                playClickSound();
                setSwitcherTab('indices');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                switcherTab === 'indices'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>台美大盤</span>
            </button>
            <button
              onClick={() => {
                playClickSound();
                setSwitcherTab('hot');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                switcherTab === 'hot'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>熱門標的</span>
            </button>
          </div>

          {/* In-Modal Search Input */}
          <div className="relative flex-1 max-w-sm">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="搜尋股票代號或名稱 (免關閉視窗)..."
                className="w-full bg-slate-900 border border-white/15 focus:border-sky-400 text-xs text-white placeholder-slate-500 pl-8 pr-8 py-2 rounded-xl focus:outline-none transition font-mono"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown overlay inside modal */}
            {searchResults.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900 border border-sky-500/40 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-48 overflow-y-auto">
                <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] font-mono text-slate-400 border-b border-white/5">
                  搜尋結果 (點擊直接切換走勢)
                </div>
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playClickSound();
                      onSelectChartTarget(item.symbol, item.market, item.name);
                      setSearchInput('');
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-sky-500/20 transition flex items-center justify-between border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-sky-400 font-bold">{item.symbol}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase">
                      {item.market === 'us' ? '美股' : item.market === 'otc' ? '上櫃' : '上市'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Switcher Horizontal Pill Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          {switcherTab === 'portfolio' && (
            <>
              {portfolio.length === 0 ? (
                <span className="text-xs text-slate-500 italic py-1">目前庫存清單無個股</span>
              ) : (
                portfolio.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      playClickSound();
                      onSelectChartTarget(item.symbol, item.market, item.name);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition shrink-0 flex items-center gap-1.5 border ${
                      selectedChartTarget.symbol === item.symbol
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/30'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:border-sky-500/50'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="opacity-75">{item.symbol}</span>
                  </button>
                ))
              )}
            </>
          )}

          {switcherTab === 'indices' &&
            MARKET_INDICES.map((item) => (
              <button
                key={item.symbol}
                onClick={() => {
                  playClickSound();
                  onSelectChartTarget(item.symbol, item.market, item.name);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition shrink-0 flex items-center gap-1.5 border ${
                  selectedChartTarget.symbol === item.symbol
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/30'
                    : 'bg-slate-900 text-slate-300 border-white/10 hover:border-sky-500/50'
                }`}
              >
                <span>{item.name}</span>
                <span className="opacity-75">{item.symbol}</span>
              </button>
            ))}

          {switcherTab === 'hot' &&
            HOT_STOCKS.map((item) => (
              <button
                key={item.symbol}
                onClick={() => {
                  playClickSound();
                  onSelectChartTarget(item.symbol, item.market, item.name);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition shrink-0 flex items-center gap-1.5 border ${
                  selectedChartTarget.symbol === item.symbol
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/30'
                    : 'bg-slate-900 text-slate-300 border-white/10 hover:border-sky-500/50'
                }`}
              >
                <span>{item.name}</span>
                <span className="opacity-75">{item.symbol}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
