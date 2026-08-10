import React, { useState } from 'react';
import { Sparkles, RefreshCw, Compass, ShieldAlert } from 'lucide-react';
import { getLunarCalendarInfo, LunarInfo } from '../utils/lunar';
import { playClickSound } from '../utils/audio';

export const LunarFortuneCard: React.FC = () => {
  const [lunarInfo, setLunarInfo] = useState<LunarInfo>(getLunarCalendarInfo());

  const handleRefresh = () => {
    playClickSound();
    setLunarInfo(getLunarCalendarInfo());
  };

  return (
    <div className="glass-card p-5 md:p-6 rounded-3xl border border-sky-500/20 shadow-[0_0_30px_rgba(56,189,248,0.06)] space-y-3.5 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-36 h-36 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-wrap justify-between items-center gap-2 relative z-10 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-4 h-4 text-amber-400" /> 每日黃曆宜忌與操盤心法
          <span className="text-[11px] text-sky-300/70 font-mono font-medium ml-1 tabular-nums">
            {lunarInfo.dateStr}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-white/10 px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 btn-interact shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> 換一心法
        </button>
      </div>

      <div className="relative z-10 space-y-3">
        {/* Date & GanZhi */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 tracking-wide">
            ☯️ {lunarInfo.lunarText} ｜ {lunarInfo.ganZhiText}
          </span>
        </div>

        {/* Yi / Ji items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex items-start gap-2">
            <span className="text-emerald-400 font-bold shrink-0">【宜】</span>
            <span className="text-slate-200 font-medium leading-relaxed">{lunarInfo.yiList}</span>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">【忌】</span>
            <span className="text-slate-200 font-medium leading-relaxed">{lunarInfo.jiList}</span>
          </div>
        </div>

        {/* Chong / Sha / Cai & Trading Mindset Mantra */}
        <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 space-y-1.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
            <span className="flex items-center gap-1 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              沖煞：<strong className="text-amber-300">{lunarInfo.chong}</strong> (煞{lunarInfo.sha})
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              財神方位：<strong className="text-emerald-300">{lunarInfo.cai}</strong>
            </span>
          </div>

          <div className="text-amber-300/90 font-bold tracking-wide pt-1 text-xs sm:text-sm flex items-start gap-1.5 leading-relaxed">
            <span className="shrink-0 text-amber-400">💡 操盤心法：</span>
            <span>{lunarInfo.tradingMindset}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

