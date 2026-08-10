import React from 'react';
import { Wallet, Coins, Zap, LineChart, Layers } from 'lucide-react';
import { formatMoney } from '../utils/format';

interface KpiCardsProps {
  totalValue: number;
  totalCost: number;
  todayPL: number;
  totalProfit: number | null;
  totalROI: number | null;
  totalCount: number;
  twCount: number;
  usCount: number;
  isPrivacy: boolean;
  isRedUp: boolean;
  onOpenTodayPLModal: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalValue,
  totalCost,
  todayPL,
  totalProfit,
  totalROI,
  totalCount,
  twCount,
  usCount,
  isPrivacy,
  isRedUp,
  onOpenTodayPLModal,
}) => {
  const getUpColor = () => (isRedUp ? 'text-rose-400' : 'text-emerald-400');
  const getDownColor = () => (isRedUp ? 'text-emerald-400' : 'text-rose-400');

  const todayPLClass = todayPL >= 0 ? getUpColor() : getDownColor();
  const totalProfitClass = totalProfit === null ? 'text-slate-500' : totalProfit >= 0 ? getUpColor() : getDownColor();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Total Valuation */}
      <div className="glass-card p-5 rounded-3xl group border border-sky-500/30 shadow-[0_0_30px_rgba(56,189,248,0.12)] relative overflow-hidden flex flex-col justify-between">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="text-[11px] text-sky-200/80 font-semibold tracking-wide flex items-center justify-between relative z-10">
          <span>總資產估值 (NT$)</span>
          <Wallet className="w-4 h-4 text-sky-400 group-hover:scale-110 transition" />
        </div>
        <div className="text-xl sm:text-2xl xl:text-3xl font-black text-white mt-2 font-mono tracking-tight tabular-nums relative z-10 truncate">
          {formatMoney(totalValue, isPrivacy)}
        </div>
      </div>

      {/* 2. Total Cost */}
      <div className="glass-card p-5 rounded-3xl group flex flex-col justify-between">
        <div className="text-[11px] text-slate-400 font-semibold tracking-wide flex items-center justify-between">
          <span>建倉總成本 (NT$)</span>
          <Coins className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
        </div>
        <div className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-300 mt-2 font-mono tracking-tight tabular-nums truncate">
          {formatMoney(totalCost, isPrivacy)}
        </div>
      </div>

      {/* 3. Intraday P&L (Clickable) */}
      <div
        onClick={onOpenTodayPLModal}
        className="glass-card hover-card p-5 rounded-3xl group border border-amber-500/20 cursor-pointer flex flex-col justify-between"
        title="點擊檢視盤中損益貢獻排行榜"
      >
        <div className="text-[11px] text-amber-300/80 font-semibold tracking-wide flex items-center justify-between">
          <span>今日盤中損益 (NT$)</span>
          <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
        </div>
        <div className={`text-xl sm:text-2xl xl:text-3xl font-black mt-2 font-mono tracking-tight tabular-nums truncate ${todayPLClass}`}>
          {todayPL >= 0 ? '+' : ''}
          {formatMoney(todayPL, isPrivacy)}
        </div>
        <div className="text-[11px] text-amber-400/80 mt-2 font-bold tracking-wide tabular-nums flex items-center justify-between pt-1 border-t border-white/5">
          <span>開盤起算</span>
          <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            排行榜 📊
          </span>
        </div>
      </div>

      {/* 4. Unrealized P&L */}
      <div className="glass-card p-5 rounded-3xl group flex flex-col justify-between">
        <div className="text-[11px] text-slate-400 font-semibold tracking-wide flex items-center justify-between">
          <span>未實現損益 (NT$)</span>
          <LineChart className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
        </div>
        <div className={`text-xl sm:text-2xl xl:text-3xl font-black mt-2 font-mono tracking-tight tabular-nums truncate ${totalProfitClass}`}>
          {totalProfit === null ? '--' : `${totalProfit >= 0 ? '+' : ''}${formatMoney(totalProfit, isPrivacy)}`}
        </div>
        <div className={`text-[11px] mt-2 font-bold tracking-wide tabular-nums pt-1 border-t border-white/5 ${totalProfitClass}`}>
          {totalROI === null
            ? '部分報價未齊全'
            : `報酬率 ${totalROI >= 0 ? '+' : ''}${totalROI.toFixed(2)}%`}
        </div>
      </div>

      {/* 5. Holdings Count */}
      <div className="glass-card p-5 rounded-3xl group flex flex-col justify-between">
        <div className="text-[11px] text-slate-400 font-semibold tracking-wide flex items-center justify-between">
          <span>監控持股檔數</span>
          <Layers className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
        </div>
        <div className="text-xl sm:text-2xl xl:text-3xl font-black text-amber-400 mt-2 font-mono tracking-tight tabular-nums">
          {totalCount} 檔
        </div>
        <div className="text-[11px] text-amber-400/70 mt-2 font-semibold tracking-wide tabular-nums pt-1 border-t border-white/5">
          台股 {twCount} | 美股 {usCount}
        </div>
      </div>
    </div>
  );
};
