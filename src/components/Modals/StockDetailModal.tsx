import React from 'react';
import {
  X,
  TrendingUp,
  BarChart2,
  History,
  Edit3,
  Trash2,
  DollarSign,
  Sparkles,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { StockPosition } from '../../types';
import { formatMoney } from '../../utils/format';
import { playClickSound } from '../../utils/audio';
import { getStockDividendInfo } from '../../utils/dividendHelper';

interface StockDetailModalProps {
  isOpen: boolean;
  stock: StockPosition | null;
  usdTwdRate: number;
  isPrivacy: boolean;
  isRedUp: boolean;
  onClose: () => void;
  onOpenChart: (symbol: string, market: 'tse' | 'otc' | 'us', name: string) => void;
  onOpenTxHistory: (stockId: string) => void;
  onOpenEditModal: (stockId: string) => void;
  onDeleteStock: (stockId: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  isOpen,
  stock,
  usdTwdRate,
  isPrivacy,
  isRedUp,
  onClose,
  onOpenChart,
  onOpenTxHistory,
  onOpenEditModal,
  onDeleteStock,
}) => {
  if (!isOpen || !stock) return null;

  const isUS = stock.market === 'us';
  const buyFx = isUS ? stock.buyRate || usdTwdRate : 1;
  const marketFx = isUS ? usdTwdRate : 1;
  const safePrice = typeof stock.price === 'number' && stock.price > 0 ? stock.price : null;

  const costTWD = stock.shares * stock.cost * buyFx;
  const marketValTWD = safePrice === null ? null : stock.shares * safePrice * marketFx;
  const profitTWD = marketValTWD === null ? null : marketValTWD - costTWD;
  const roi = costTWD > 0 && profitTWD !== null ? (profitTWD / costTWD) * 100 : null;

  const getUpColor = () => (isRedUp ? 'text-rose-400' : 'text-emerald-400');
  const getDownColor = () => (isRedUp ? 'text-emerald-400' : 'text-rose-400');

  const profitColorClass =
    profitTWD === null ? 'text-slate-500' : profitTWD >= 0 ? getUpColor() : getDownColor();

  const divInfo = getStockDividendInfo(stock, usdTwdRate);
  const txCount = Array.isArray(stock.transactions) ? stock.transactions.length : 1;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 text-slate-100 flex flex-col overflow-y-auto animate-fadeIn h-[100dvh]">
      {/* Top Sticky Header Navigation Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-3.5 flex items-center justify-between gap-3 shadow-xl">
        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="flex items-center gap-1.5 text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-2 rounded-xl border border-white/10 text-xs font-bold transition btn-interact shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>返回清單</span>
        </button>

        <div className="flex flex-col items-center min-w-0">
          <div className="flex items-center gap-2 max-w-full">
            <span className="text-base font-black text-white truncate">{stock.name}</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              {stock.market.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{stock.symbol}</span>
        </div>

        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-xl transition btn-interact shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Full-Screen Content Body */}
      <div className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-4 flex-1">
        {/* Price & Real-time Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-sky-500/30 p-5 rounded-3xl space-y-3 shadow-2xl">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-[11px] text-slate-400 block font-sans font-medium">最新市場成交價</span>
              <div className="text-3xl font-black font-mono text-white tabular-nums tracking-tight">
                {safePrice === null ? '--' : isUS ? `$${safePrice} USD` : `$${safePrice}`}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-sans font-medium">持股總報酬率</span>
              <div className={`text-2xl font-black font-mono tabular-nums ${profitColorClass}`}>
                {roi === null ? '--' : `${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`}
              </div>
            </div>
          </div>

          {/* High/Low Range Indicator if present */}
          {(stock.dayHigh || stock.dayLow) && (
            <div className="pt-2.5 border-t border-white/10 flex justify-between items-center text-xs font-mono text-slate-400">
              <span>今日最低: ${stock.dayLow || '--'}</span>
              <span>今日最高: ${stock.dayHigh || '--'}</span>
            </div>
          )}
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Market Value */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-1.5 shadow-md">
            <span className="text-[11px] text-slate-400 font-sans block flex items-center gap-1.5 font-medium">
              <DollarSign className="w-4 h-4 text-sky-400" /> 持有總市值 (NT$)
            </span>
            <div className="text-lg font-bold font-mono text-white">
              {marketValTWD === null ? '--' : formatMoney(marketValTWD, isPrivacy)}
            </div>
          </div>

          {/* Profit & Loss */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-1.5 shadow-md">
            <span className="text-[11px] text-slate-400 font-sans block flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> 未實現損益 (NT$)
            </span>
            <div className={`text-lg font-bold font-mono ${profitColorClass}`}>
              {profitTWD === null
                ? '--'
                : `${profitTWD >= 0 ? '+' : ''}${formatMoney(profitTWD, isPrivacy)}`}
            </div>
          </div>

          {/* Shares & Cost */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-1.5 shadow-md">
            <span className="text-[11px] text-slate-400 font-sans block flex items-center gap-1.5 font-medium">
              <Layers className="w-4 h-4 text-indigo-400" /> 持有股數與均價
            </span>
            <div className="text-slate-200 font-mono font-bold text-sm">
              {stock.shares.toLocaleString()} 股 (${stock.cost})
            </div>
            {isUS && (
              <div className="text-[10px] text-slate-400 font-mono">
                買入匯率: {buyFx.toFixed(2)}
              </div>
            )}
          </div>

          {/* Dividends */}
          <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 space-y-1.5 shadow-md">
            <span className="text-[11px] text-amber-300 font-sans block flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" /> 預估年股息 (殖利率)
            </span>
            <div className="text-amber-400 font-mono font-bold text-sm">
              ${formatMoney(divInfo.annualIncomeTWD, isPrivacy)} ({divInfo.dividendYieldPct.toFixed(1)}%)
            </div>
            <div className="text-[10px] text-amber-300/80 font-sans">
              發放頻率: {divInfo.frequency}
            </div>
          </div>
        </div>

        {/* Transaction History & Initial Buy Info */}
        <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-300">
            <span>初次建立買入日期：</span>
            <span className="font-mono text-white font-bold">{stock.buyDate || '未記錄'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>累計分批交易次數：</span>
            <span className="font-mono text-sky-400 font-bold">{txCount} 筆交易紀錄</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2.5">
          {/* Main Chart Action */}
          <button
            onClick={() => {
              playClickSound();
              onClose();
              onOpenChart(stock.symbol, stock.market, stock.name);
            }}
            className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition flex items-center justify-center gap-2 btn-interact shadow-lg"
          >
            <BarChart2 className="w-4.5 h-4.5" /> 檢視即時分時 K 線圖
          </button>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                playClickSound();
                onClose();
                onOpenTxHistory(stock.id);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 py-3 px-2 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 btn-interact"
            >
              <History className="w-4 h-4" /> 歷程({txCount})
            </button>

            <button
              onClick={() => {
                playClickSound();
                onClose();
                onOpenEditModal(stock.id);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 py-3 px-2 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 btn-interact"
            >
              <Edit3 className="w-4 h-4 text-sky-400" /> 編輯
            </button>

            <button
              onClick={() => {
                onClose();
                onDeleteStock(stock.id);
              }}
              className="bg-slate-800 hover:bg-rose-900/40 text-rose-400 border border-white/10 py-3 px-2 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 btn-interact"
            >
              <Trash2 className="w-4 h-4" /> 刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

