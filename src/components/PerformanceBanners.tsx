import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StockPosition } from '../types';
import { formatMoney } from '../utils/format';

interface PerformanceBannersProps {
  portfolio: StockPosition[];
  usdTwdRate: number;
  isPrivacy: boolean;
  isRedUp: boolean;
  onTriggerMVP: (name: string, profitStr: string, roi: number) => void;
  onTriggerLVP: (name: string, profitStr: string, roi: number) => void;
}

export const PerformanceBanners: React.FC<PerformanceBannersProps> = ({
  portfolio,
  usdTwdRate,
  isPrivacy,
  isRedUp,
  onTriggerMVP,
  onTriggerLVP,
}) => {
  const getUpColor = () => (isRedUp ? 'text-rose-400' : 'text-emerald-400');
  const getDownColor = () => (isRedUp ? 'text-emerald-400' : 'text-rose-400');

  const stats = portfolio.map((item) => {
    const fx = item.market === 'us' ? usdTwdRate : 1;
    const costTWD = item.shares * item.cost * (item.market === 'us' ? item.buyRate : 1);
    const valueTWD = item.price ? item.shares * item.price * fx : null;
    const profitTWD = valueTWD !== null ? valueTWD - costTWD : null;
    const roi = costTWD > 0 && profitTWD !== null ? (profitTWD / costTWD) * 100 : null;

    return {
      name: `${item.symbol} ${item.name}`,
      profit: profitTWD,
      roi,
    };
  });

  const winners = stats
    .filter((s) => s.profit !== null && s.profit > 0)
    .sort((a, b) => (b.profit || 0) - (a.profit || 0));

  const losers = stats
    .filter((s) => s.profit !== null && s.profit < 0)
    .sort((a, b) => (a.profit || 0) - (b.profit || 0));

  const mvp = winners.length > 0 ? winners[0] : null;
  const lvp = losers.length > 0 ? losers[0] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* MVP Best Performer */}
      <div
        onClick={() => {
          if (mvp && mvp.profit !== null && mvp.roi !== null) {
            const pStr = `+${formatMoney(mvp.profit, isPrivacy)} (+${mvp.roi.toFixed(1)}%)`;
            onTriggerMVP(mvp.name, pStr, mvp.roi);
          }
        }}
        className="glass-card hover-card p-6 rounded-3xl flex justify-between items-center border-l-4 border-l-emerald-500/50 cursor-pointer group"
      >
        <div>
          <div className="text-[10px] text-emerald-400/80 font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5 group-hover:text-emerald-300 transition">
            <TrendingUp className="w-3.5 h-3.5" /> 最佳獲利 (點擊解鎖成就)
          </div>
          <div className="text-lg font-black text-white tracking-wide">
            {mvp ? mvp.name : '無累積獲利標的'}
          </div>
        </div>
        <div className={`text-xl md:text-2xl font-black font-mono tracking-tighter tabular-nums group-hover:scale-110 transition-transform origin-right ${getUpColor()}`}>
          {mvp && mvp.profit !== null && mvp.roi !== null
            ? `+${formatMoney(mvp.profit, isPrivacy)} (+${mvp.roi.toFixed(1)}%)`
            : '$0 (0%)'}
        </div>
      </div>

      {/* LVP Worst Loss */}
      <div
        onClick={() => {
          if (lvp && lvp.profit !== null && lvp.roi !== null) {
            const pStr = `${formatMoney(lvp.profit, isPrivacy)} (${lvp.roi.toFixed(1)}%)`;
            onTriggerLVP(lvp.name, pStr, lvp.roi);
          }
        }}
        className="glass-card hover-card p-6 rounded-3xl flex justify-between items-center border-l-4 border-l-rose-500/50 cursor-pointer group"
      >
        <div>
          <div className="text-[10px] text-rose-400/80 font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5 group-hover:text-rose-300 transition">
            <TrendingDown className="w-3.5 h-3.5" /> 最大虧損 (點擊啟動風控)
          </div>
          <div className="text-lg font-black text-white tracking-wide">
            {lvp ? lvp.name : '無累積虧損標的'}
          </div>
        </div>
        <div className={`text-xl md:text-2xl font-black font-mono tracking-tighter tabular-nums group-hover:scale-110 transition-transform origin-right ${getDownColor()}`}>
          {lvp && lvp.profit !== null && lvp.roi !== null
            ? `${formatMoney(lvp.profit, isPrivacy)} (${lvp.roi.toFixed(1)}%)`
            : '$0 (0%)'}
        </div>
      </div>
    </div>
  );
};
