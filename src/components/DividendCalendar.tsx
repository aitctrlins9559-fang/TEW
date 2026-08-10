import React, { useState } from 'react';
import { Calendar, DollarSign, Sparkles, TrendingUp, BellRing, Target, Layers } from 'lucide-react';
import { StockPosition } from '../types';
import { calculatePortfolioDividends, getStockDividendInfo } from '../utils/dividendHelper';
import { formatMoney } from '../utils/format';
import { playClickSound } from '../utils/audio';

interface DividendCalendarProps {
  portfolio: StockPosition[];
  usdTwdRate: number;
  isPrivacy: boolean;
}

export const DividendCalendar: React.FC<DividendCalendarProps> = ({
  portfolio,
  usdTwdRate,
  isPrivacy,
}) => {
  const [monthlyGoalTWD, setMonthlyGoalTWD] = useState<number>(30000); // Default Goal: $30,000 NTD/month
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'goal'>('overview');

  const summary = calculatePortfolioDividends(portfolio, usdTwdRate);
  const goalProgressPct = Math.min(100, (summary.totalMonthlyPassiveIncomeTWD / monthlyGoalTWD) * 100);

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const maxMonthlyVal = Math.max(...summary.monthlyBreakdown, 1000);

  return (
    <div className="glass-card p-4 sm:p-6 md:p-8 rounded-[2rem] border border-emerald-500/30 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
      {/* Glow Effect */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex flex-wrap items-center gap-2">
              除權息日曆與被動收入試算
              <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                Passive Income
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">整合台美股歷史發放股利，預估組合現金流與除息提醒</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar bg-slate-900/80 p-1 rounded-xl border border-white/10 text-xs font-bold shrink-0">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('overview');
            }}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            總覽 & 月月配
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('calendar');
            }}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            除息提醒 ({summary.upcomingReminders.length})
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('goal');
            }}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'goal'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            財務自由目標
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Annual Passive Income */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-emerald-500/20 space-y-1">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" /> 預估年化被動收入
          </div>
          <div className="text-2xl md:text-3xl font-black font-mono text-emerald-400 tracking-tight">
            ${formatMoney(summary.totalAnnualPassiveIncomeTWD, isPrivacy)}
            <span className="text-xs font-sans text-slate-400 font-semibold ml-1">NT$/年</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            等同每年額外發放 13 薪與加薪
          </div>
        </div>

        {/* Monthly Passive Income */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-sky-500/20 space-y-1">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-sky-400" /> 平均每月領息
          </div>
          <div className="text-2xl md:text-3xl font-black font-mono text-sky-400 tracking-tight">
            ${formatMoney(summary.totalMonthlyPassiveIncomeTWD, isPrivacy)}
            <span className="text-xs font-sans text-slate-400 font-semibold ml-1">NT$/月</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            目標達成率: <strong className="text-sky-300">{goalProgressPct.toFixed(1)}%</strong>
          </div>
        </div>

        {/* Portfolio Dividend Yield */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-amber-500/20 space-y-1">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> 組合平均股息殖利率
          </div>
          <div className="text-2xl md:text-3xl font-black font-mono text-amber-400 tracking-tight">
            {summary.weightedDividendYieldPct.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            持股檔數: {portfolio.length} 檔標的
          </div>
        </div>
      </div>

      {/* Tab 1: Overview & 12-Month Cashflow Bar Chart */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-slate-300">
            <div className="font-bold flex items-center gap-2 text-slate-200">
              <Layers className="w-4 h-4 text-emerald-400" /> 12 個月被動收入發放分佈 (現金流月月配)
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              藍綠色越深代表該月份發放金額越高
            </div>
          </div>

          <div className="bg-slate-950/70 p-5 rounded-2xl border border-white/5 space-y-3">
            <div className="grid grid-cols-12 gap-2 h-44 items-end pt-6 pb-2">
              {summary.monthlyBreakdown.map((val, idx) => {
                const heightPct = Math.max(8, (val / maxMonthlyVal) * 100);
                const isHighMonth = val > summary.totalMonthlyPassiveIncomeTWD;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition mb-1 text-center truncate w-full">
                      ${formatMoney(val, isPrivacy)}
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                        isHighMonth
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                          : 'bg-gradient-to-t from-sky-700 to-sky-500 opacity-80'
                      }`}
                    />
                    <div className="text-[11px] font-mono font-bold text-slate-300 mt-2">
                      {monthNames[idx]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Upcoming Ex-Dividend Calendar */}
      {activeTab === 'calendar' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-400" /> 近期預估除權息月份與單次發放金額預估
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.upcomingReminders.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 p-4 rounded-xl border border-white/10 hover:border-emerald-500/40 transition space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-bold text-white">{item.name}</div>
                    <div className="text-xs font-mono text-sky-400">{item.symbol}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.frequency}
                  </span>
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-white/5 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">預估下期除息</div>
                    <div className="text-slate-200 font-bold">{item.nextExMonthStr}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">單次預估派息</div>
                    <div className="text-emerald-400 font-bold">
                      ${formatMoney(item.estAmountTWD, isPrivacy)} NT$
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Financial Freedom Goal Calculator */}
      {activeTab === 'goal' && (
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-sky-500/20 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-sky-400" /> 每月被動收入目標試算
              </h3>
              <p className="text-xs text-slate-400">設定您的月配息自由目標，系統將試算進度與達成缺口</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-bold">月目標 (NT$):</span>
              <input
                type="number"
                step={5000}
                value={monthlyGoalTWD}
                onChange={(e) => setMonthlyGoalTWD(Math.max(1000, Number(e.target.value)))}
                className="w-32 bg-slate-950 text-emerald-400 font-mono font-bold text-sm px-3 py-1.5 rounded-xl border border-white/20 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">
                目前月領: <strong className="text-emerald-400">${formatMoney(summary.totalMonthlyPassiveIncomeTWD, isPrivacy)}</strong>
              </span>
              <span className="text-slate-300">
                目標金額: <strong className="text-sky-400">${formatMoney(monthlyGoalTWD, isPrivacy)}</strong>
              </span>
            </div>

            <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                style={{ width: `${goalProgressPct}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
            </div>

            <div className="flex justify-between items-center text-xs font-mono pt-1">
              <span className="text-emerald-400 font-bold">進度: {goalProgressPct.toFixed(1)}%</span>
              {summary.totalMonthlyPassiveIncomeTWD < monthlyGoalTWD ? (
                <span className="text-amber-400">
                  差距: 還需月領 ${formatMoney(monthlyGoalTWD - summary.totalMonthlyPassiveIncomeTWD, isPrivacy)} NT$
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">🎉 已達成財富自由初步目標！</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
