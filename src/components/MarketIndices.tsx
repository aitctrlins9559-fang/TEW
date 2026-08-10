import React from 'react';
import { Sunrise, Sunset, Activity, TrendingUp, TrendingDown, LineChart } from 'lucide-react';
import { MarketIndex } from '../types';
import { playClickSound } from '../utils/audio';

interface MarketIndicesProps {
  indices: MarketIndex[];
  twiiChangePct: number | null;
  portfolioTodayPct: number | null;
  isRedUp: boolean;
  onSelectIndex?: (symbol: string, market: 'tse' | 'otc' | 'us', name: string) => void;
}

export const MarketIndices: React.FC<MarketIndicesProps> = ({
  indices,
  twiiChangePct,
  portfolioTodayPct,
  isRedUp,
  onSelectIndex,
}) => {
  const getIndex = (symbol: string) => indices.find((i) => i.symbol === symbol);

  const twii = getIndex('^TWII');
  const n225 = getIndex('^N225');
  const ks11 = getIndex('^KS11');
  const dji = getIndex('^DJI');
  const gspc = getIndex('^GSPC');
  const ixic = getIndex('^IXIC');

  const getUpClass = () => (isRedUp ? 'text-rose-400' : 'text-emerald-400');
  const getDownClass = () => (isRedUp ? 'text-emerald-400' : 'text-rose-400');

  const renderCard = (
    indexItem: MarketIndex | undefined,
    name: string,
    symbol: string,
    marketType: 'tse' | 'us' = 'tse'
  ) => {
    const price = indexItem?.price;
    const prevClose = indexItem?.prevClose;
    const change = indexItem?.change;
    const changePct = indexItem?.changePct;

    const isUp = change !== null && change !== undefined && change >= 0;
    const colorClass =
      change === null || change === undefined
        ? 'text-slate-400'
        : isUp
        ? getUpClass()
        : getDownClass();

    return (
      <div
        onClick={() => {
          playClickSound();
          onSelectIndex?.(symbol, marketType, name);
        }}
        className="glass-card hover-card p-4 rounded-2xl group cursor-pointer hover:border-sky-500/40 hover:scale-[1.01] active:scale-[0.98] transition-all space-y-2 relative overflow-hidden"
        title="點擊切換查看該指數即時走勢圖 📈"
      >
        {/* Top bar: name and market code */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold tracking-wider">
          <span className="flex items-center gap-1 group-hover:text-sky-300 transition">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            {name}
          </span>
          <span className="font-mono text-slate-500 text-[10px] flex items-center gap-1">
            <LineChart className="w-3 h-3 text-sky-400/60 opacity-0 group-hover:opacity-100 transition" />
            {symbol}
          </span>
        </div>

        {/* Index price & change */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-xl font-black text-white font-mono tracking-tight group-hover:text-sky-400 transition tabular-nums">
            {price
              ? price.toLocaleString('zh-TW', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : '--'}
          </div>
          <div className={`text-xs font-mono font-bold tabular-nums flex items-center gap-0.5 ${colorClass}`}>
            {change !== null && change !== undefined ? (
              <>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isUp ? '+' : ''}
                {change.toFixed(2)}
              </>
            ) : null}
          </div>
        </div>

        {/* Additional Stats: Prev Close & Pct */}
        <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/5 pt-2 text-slate-400">
          <span>
            昨收:{' '}
            <strong className="text-slate-300">
              {prevClose ? prevClose.toLocaleString('zh-TW', { maximumFractionDigits: 1 }) : '--'}
            </strong>
          </span>
          <span className={`font-bold px-1.5 py-0.5 rounded ${
            isUp
              ? isRedUp ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
              : isRedUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {changePct !== null && changePct !== undefined
              ? `${isUp ? '+' : ''}${changePct.toFixed(2)}%`
              : '--'}
          </span>
        </div>
      </div>
    );
  };

  const beatsMarket =
    portfolioTodayPct !== null && twiiChangePct !== null && portfolioTodayPct >= twiiChangePct;

  return (
    <div className="space-y-4">
      {/* Asian Morning Markets */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-widest px-1 flex flex-wrap justify-between items-center gap-2">
          <span className="flex items-center gap-1.5">
            <Sunrise className="w-4 h-4 text-amber-400" /> 亞洲核心指數戰情室
          </span>
          {twiiChangePct !== null && portfolioTodayPct !== null && (
            <span
              className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl border backdrop-blur-md ${
                beatsMarket
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              大盤: {twiiChangePct >= 0 ? '+' : ''}
              {twiiChangePct.toFixed(2)}% ｜ 個人持股: {portfolioTodayPct >= 0 ? '+' : ''}
              {portfolioTodayPct.toFixed(2)}% ({beatsMarket ? '勝過大盤 🚀' : '穩健守備 🛡️'})
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {renderCard(twii, '台股加權指數', '^TWII', 'tse')}
          {renderCard(n225, '日經 225 指數', '^N225', 'tse')}
          {renderCard(ks11, '韓國 KOSPI', '^KS11', 'tse')}
        </div>
      </div>

      {/* US Markets */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-widest px-1 flex items-center gap-1.5">
          <Sunset className="w-4 h-4 text-indigo-400" /> 美股三大核心指數
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {renderCard(dji, '道瓊工業指數', '^DJI', 'us')}
          {renderCard(gspc, '標普 500 指數', '^GSPC', 'us')}
          {renderCard(ixic, '那斯達克指數', '^IXIC', 'us')}
        </div>
      </div>
    </div>
  );
};
