import React from 'react';
import { Zap, X } from 'lucide-react';
import { StockPosition } from '../../types';
import { formatMoney } from '../../utils/format';
import { playClickSound } from '../../utils/audio';

interface TodayPLModalProps {
  isOpen: boolean;
  portfolio: StockPosition[];
  usdTwdRate: number;
  isPrivacy: boolean;
  isRedUp: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string, market: 'tse' | 'otc' | 'us', name: string) => void;
}

export const TodayPLModal: React.FC<TodayPLModalProps> = ({
  isOpen,
  portfolio,
  usdTwdRate,
  isPrivacy,
  isRedUp,
  onClose,
  onSelectStock,
}) => {
  if (!isOpen) return null;

  const getUpColor = () => (isRedUp ? 'text-rose-400' : 'text-emerald-400');
  const getDownColor = () => (isRedUp ? 'text-emerald-400' : 'text-rose-400');

  let totalTodayPL = 0;

  const list = portfolio
    .map((item) => {
      const safePrice = typeof item.price === 'number' && item.price > 0 ? item.price : null;
      const safePrev =
        typeof item.prevClose === 'number' && item.prevClose > 0 ? item.prevClose : safePrice;
      const fx = item.market === 'us' ? usdTwdRate : 1;

      if (safePrice !== null && safePrev !== null) {
        const diff = safePrice - safePrev;
        const diffPct = safePrev > 0 ? (diff / safePrev) * 100 : 0;
        const dayPL = item.shares * diff * fx;
        totalTodayPL += dayPL;
        return { ...item, safePrice, safePrev, diff, diffPct, dayPL };
      }
      return { ...item, safePrice, safePrev: null, diff: 0, diffPct: 0, dayPL: 0 };
    })
    .sort((a, b) => b.dayPL - a.dayPL);

  return (
    <div
      onClick={() => {
        playClickSound();
        onClose();
      }}
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[68] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card rounded-t-[2rem] sm:rounded-3xl p-5 md:p-8 w-full max-w-xl shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto border border-white/10"
      >
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Zap className="w-5 h-5" /> 今日盤中損益貢獻排行榜
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              累計變動：{totalTodayPL >= 0 ? '+' : ''}
              {formatMoney(totalTodayPL, isPrivacy)} NT$ （依金額貢獻排序）
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-full transition btn-interact"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="uppercase bg-black/40 text-slate-400 font-semibold border-b border-white/5">
              <tr>
                <th className="py-3 px-4">標的名稱</th>
                <th className="py-3 px-4">當前價</th>
                <th className="py-3 px-4">今日漲跌</th>
                <th className="py-3 px-4 text-right">今日損益貢獻 (NT$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {list.map((item) => {
                const isUp = item.dayPL >= 0;
                const colorClass =
                  item.dayPL === 0 ? 'text-slate-400' : isUp ? getUpColor() : getDownColor();

                return (
                  <tr
                    key={item.id}
                    onClick={() => {
                      onClose();
                      onSelectStock(item.symbol, item.market, item.name);
                    }}
                    className="hover:bg-white/5 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-bold text-white">
                      {item.name} <span className="text-[11px] text-sky-400 font-mono ml-1">({item.symbol})</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {item.safePrice ? `$${item.safePrice}` : '--'}
                    </td>
                    <td className={`py-3.5 px-4 font-mono font-bold ${colorClass}`}>
                      {item.diff >= 0 ? '+' : ''}
                      {item.diff.toFixed(2)} ({item.diffPct >= 0 ? '+' : ''}
                      {item.diffPct.toFixed(2)}%)
                    </td>
                    <td className={`py-3.5 px-4 font-mono font-bold text-right tabular-nums ${colorClass}`}>
                      {item.dayPL >= 0 ? '+' : ''}
                      {formatMoney(item.dayPL, isPrivacy)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition btn-interact"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
