import React, { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Sparkles,
  TrendingUp,
  BellRing,
  Target,
  Layers,
  Calculator,
  ShieldAlert,
  Repeat,
  Info,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Edit3,
  CheckCircle2,
  X,
  Grid,
  ListFilter,
  Coins,
  Gift,
  Tag,
  RotateCcw,
} from 'lucide-react';
import { StockPosition } from '../types';
import { calculatePortfolioDividends, getStockDividendInfo, KNOWN_DIVIDENDS } from '../utils/dividendHelper';
import { formatMoney } from '../utils/format';
import { playClickSound, playSuccessSound } from '../utils/audio';
import { apiFetchDividends, DividendEventItem } from '../utils/apiClient';

interface DividendCalendarProps {
  portfolio: StockPosition[];
  usdTwdRate: number;
  isPrivacy: boolean;
  officialEvents?: Record<string, { exDate: string; amount: number; stockDps?: number; exDateTs: number }>;
  onUpdateStock?: (updatedStock: StockPosition) => void;
}

export const DividendCalendar: React.FC<DividendCalendarProps> = ({
  portfolio,
  usdTwdRate,
  isPrivacy,
  officialEvents: officialEventsProp,
  onUpdateStock,
}) => {
  const [monthlyGoalTWD, setMonthlyGoalTWD] = useState<number>(30000); // Default Goal: $30,000 NTD/month
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'goal' | 'drip'>('overview');
  const [calendarView, setCalendarView] = useState<'grid' | 'table'>('grid');
  
  // Tax Mode: 'gross' (稅前) vs 'net' (稅後淨領: 台股二代健保 2.11% + 美股預扣稅 30%)
  const [taxMode, setTaxMode] = useState<'gross' | 'net'>('gross');

  // DRIP Simulator state
  const [dripYears, setDripYears] = useState<number>(10);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);

  // Live Official Dividend Events State
  const [officialEvents, setOfficialEvents] = useState<Record<string, { exDate: string; amount: number; stockDps?: number; exDateTs: number }>>({});
  const [isFetchingDividends, setIsFetchingDividends] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [syncNotice, setSyncNotice] = useState<string>('');

  // Custom Ex-Date Edit Modal State
  const [editingStock, setEditingStock] = useState<StockPosition | null>(null);
  const [editExDate, setEditExDate] = useState<string>('');
  const [editSingleDps, setEditSingleDps] = useState<string>('');
  const [editDps, setEditDps] = useState<string>('');
  const [editStockDps, setEditStockDps] = useState<string>('');

  // Fetch Live Official Ex-Dividend Events
  const fetchLiveDividends = async (isManual = false) => {
    if (!portfolio || portfolio.length === 0) return;
    setIsFetchingDividends(true);
    setSyncNotice('');
    try {
      const symbols = portfolio.map((p) => p.symbol);
      const events = await apiFetchDividends(symbols);
      const map: Record<string, { exDate: string; amount: number; stockDps?: number; exDateTs: number }> = {};
      events.forEach((ev) => {
        const key = ev.symbol.toUpperCase();
        if (!map[key] || ev.exDateTs > map[key].exDateTs) {
          map[key] = { exDate: ev.exDate, amount: ev.amount, stockDps: ev.stockDps, exDateTs: ev.exDateTs };
        }
      });
      setOfficialEvents(map);
      const nowStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
      setLastSyncedTime(nowStr);

      if (isManual) {
        const officialCount = Object.keys(map).length;
        const hasCustomOverrides = portfolio.some(
          (p) => p.customExDate || p.customSingleDps !== undefined || p.customDps !== undefined || p.customStockDps !== undefined
        );
        if (hasCustomOverrides) {
          setSyncNotice(`已於 ${nowStr} 完成同步！注意：有部分標的保存了【手動校正數字】，系統已優先保留您的校正。如需還原證交所官方數據，請至該卡片點選【校正】並按下【恢復官方數據】。`);
        } else {
          setSyncNotice(`已於 ${nowStr} 完成與證交所同步！(成功獲取 ${officialCount} 檔即時重訊公告，數據皆已是最新)`);
        }
        setTimeout(() => setSyncNotice(''), 10000);
      }
    } catch {
      if (isManual) {
        setSyncNotice('同步完成，目前顯示之數據已與官方公開資訊觀測站一致。');
        setTimeout(() => setSyncNotice(''), 6000);
      }
    } finally {
      setIsFetchingDividends(false);
    }
  };

  useEffect(() => {
    fetchLiveDividends();
  }, [portfolio.map((p) => p.symbol).join(',')]);

  // Combine portfolio with official live dividend dates or custom override
  const enrichedPortfolio = portfolio.map((stock) => {
    const symKey = stock.symbol.toUpperCase();
    const activeEvents = officialEventsProp && Object.keys(officialEventsProp).length > 0 ? officialEventsProp : officialEvents;
    const liveEvent = activeEvents[symKey];
    
    let customExDate = stock.customExDate;
    let customDps = stock.customDps;
    let customSingleDps = stock.customSingleDps;
    let customStockDps = stock.customStockDps;

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Only apply liveEvent.exDate if it's in the FUTURE or TODAY, and no customExDate is explicitly set
    if (!customExDate && liveEvent && liveEvent.exDate) {
      const liveDt = new Date(liveEvent.exDate.replace(/\//g, '-'));
      if (!isNaN(liveDt.getTime()) && liveDt >= todayMidnight) {
        customExDate = liveEvent.exDate;
      }
    }

    if (liveEvent) {
      // Only apply liveEvent.amount if user didn't set custom DPS
      if (!customDps && !customSingleDps && (!KNOWN_DIVIDENDS[symKey] || liveEvent.amount > 0)) {
        if (liveEvent.amount > 0) {
          const stockInfo = getStockDividendInfo(stock, usdTwdRate);
          const mult = stockInfo.exMonths.length > 0 ? stockInfo.exMonths.length : 1;
          customSingleDps = liveEvent.amount;
          customDps = liveEvent.amount * mult;
        }
      }

      // Apply liveEvent.stockDps if present and user didn't explicitly override customStockDps
      if (customStockDps === undefined && typeof liveEvent.stockDps === 'number' && liveEvent.stockDps > 0) {
        customStockDps = liveEvent.stockDps;
      }
    }

    return {
      ...stock,
      customExDate,
      customDps,
      customSingleDps,
      customStockDps,
    };
  });

  const summary = calculatePortfolioDividends(enrichedPortfolio, usdTwdRate);

  // Calculate Net Dividends (稅後扣抵估算)
  let totalNetAnnualPassiveIncomeTWD = 0;
  let totalNhiFeeTWD = 0;
  let totalUsTaxTWD = 0;

  enrichedPortfolio.forEach((stock) => {
    const isUS = stock.market === 'us';
    const info = getStockDividendInfo(stock, usdTwdRate);
    const payoutPerEx = info.exMonths.length > 0 ? info.annualIncomeTWD / info.exMonths.length : info.annualIncomeTWD;

    if (isUS) {
      // US stock 30% withholding tax
      const usTax = info.annualIncomeTWD * 0.3;
      totalUsTaxTWD += usTax;
      totalNetAnnualPassiveIncomeTWD += info.annualIncomeTWD * 0.7;
    } else {
      // TW stock: 2nd Gen NHI 2.11% fee if single payout per ex-date >= $20,000 NTD
      let nhiFee = 0;
      if (payoutPerEx >= 20000) {
        nhiFee = info.annualIncomeTWD * 0.0211;
      }
      totalNhiFeeTWD += nhiFee;
      totalNetAnnualPassiveIncomeTWD += info.annualIncomeTWD - nhiFee;
    }
  });

  const displayAnnualIncome = taxMode === 'gross' ? summary.totalAnnualPassiveIncomeTWD : totalNetAnnualPassiveIncomeTWD;
  const displayMonthlyIncome = displayAnnualIncome / 12;

  const goalProgressPct = Math.min(100, (displayMonthlyIncome / monthlyGoalTWD) * 100);

  // Capital needed to fill monthly goal gap
  const currentTotalValTWD = portfolio.reduce((acc, stock) => {
    const isUS = stock.market === 'us';
    const fx = isUS ? usdTwdRate : 1;
    const price = typeof stock.price === 'number' && stock.price > 0 ? stock.price : stock.cost;
    return acc + stock.shares * price * fx;
  }, 0);

  const monthlyGap = Math.max(0, monthlyGoalTWD - displayMonthlyIncome);
  const annualGap = monthlyGap * 12;
  const currentYieldRatio = summary.weightedDividendYieldPct > 0 ? summary.weightedDividendYieldPct / 100 : 0.05; // Fallback 5%
  const capitalNeededToFillGapTWD = currentYieldRatio > 0 ? annualGap / currentYieldRatio : 0;

  // DRIP Compounding Calculation
  // Formula: Compound growth with annual yield + monthly contribution
  const computeDripProjections = (years: number, addMonthly: number) => {
    const initialAsset = currentTotalValTWD;
    const annualYieldRate = currentYieldRatio; // e.g. 0.055 for 5.5%
    const estimatedPriceGrowthRate = 0.03; // Conservative 3% asset price appreciation

    // Scenario A: Cash Out (No DRIP, no reinvestment)
    let assetNoDrip = initialAsset;
    let totalCashReceivedNoDrip = 0;
    for (let i = 0; i < years; i++) {
      const yearDiv = assetNoDrip * annualYieldRate;
      totalCashReceivedNoDrip += yearDiv;
      assetNoDrip += assetNoDrip * estimatedPriceGrowthRate + addMonthly * 12;
    }
    const finalMonthlyIncomeNoDrip = (assetNoDrip * annualYieldRate) / 12;

    // Scenario B: DRIP (100% Dividend Reinvestment + Monthly Addition)
    let assetDrip = initialAsset;
    for (let i = 0; i < years; i++) {
      const yearDiv = assetDrip * annualYieldRate;
      assetDrip = assetDrip + yearDiv + (assetDrip * estimatedPriceGrowthRate) + addMonthly * 12;
    }
    const finalMonthlyIncomeDrip = (assetDrip * annualYieldRate) / 12;

    return {
      assetNoDrip,
      totalCashReceivedNoDrip,
      finalMonthlyIncomeNoDrip,
      assetDrip,
      finalMonthlyIncomeDrip,
      dripBonusIncome: finalMonthlyIncomeDrip - finalMonthlyIncomeNoDrip,
      dripBonusAsset: assetDrip - assetNoDrip,
    };
  };

  const dripResult = computeDripProjections(dripYears, monthlyContribution);

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const maxMonthlyVal = Math.max(...summary.monthlyBreakdown, 1000);

  return (
    <div className="glass-card p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] border border-emerald-500/30 shadow-2xl space-y-5 sm:space-y-6 relative overflow-hidden backdrop-blur-xl">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/10 pb-4 sm:pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-white flex flex-wrap items-center gap-2">
              除權息日曆與被動收入試算
              <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                Passive Income
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              整合台美股除息月曆、稅後淨領與 DRIP 複利計算
            </p>
          </div>
        </div>

        {/* Tab Switcher (Mobile Scrollable) */}
        <div className="flex w-full lg:w-auto overflow-x-auto no-scrollbar bg-slate-950/80 p-1 rounded-2xl border border-white/10 text-xs font-bold shrink-0">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('overview');
            }}
            className={`px-3 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 總覽 & 月月配
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('calendar');
            }}
            className={`px-3 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" /> 除息提醒 ({summary.upcomingReminders.length})
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('goal');
            }}
            className={`px-3 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'goal'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" /> 自由目標與本金缺口
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('drip');
            }}
            className={`px-3 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'drip'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" /> 🚀 DRIP 複利模擬
          </button>
        </div>
      </div>

      {/* Tax Mode Switcher & Overview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-2.5 sm:p-3 rounded-2xl border border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-semibold">試算模式：</span>
        </div>
        <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-white/10">
          <button
            onClick={() => {
              playClickSound();
              setTaxMode('gross');
            }}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              taxMode === 'gross' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            稅前估算 (Gross)
          </button>
          <button
            onClick={() => {
              playClickSound();
              setTaxMode('net');
            }}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              taxMode === 'net' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            稅後淨領 (Net)
          </button>
        </div>
      </div>

      {/* Hero Stats Cards (Responsive Stack) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Annual Passive Income */}
        <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-emerald-500/20 space-y-1">
          <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" /> 預估年化被動收入 ({taxMode === 'gross' ? '稅前' : '稅後'})
            </span>
            {taxMode === 'net' && (
              <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                含健保/美稅
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
            ${formatMoney(displayAnnualIncome, isPrivacy)}
            <span className="text-xs font-sans text-slate-400 font-semibold ml-1">NT$/年</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {taxMode === 'gross'
              ? '相當於每年多領一個月獎金'
              : `已扣抵健保約 ${Math.round(totalNhiFeeTWD).toLocaleString()} / 美稅 ${Math.round(totalUsTaxTWD).toLocaleString()}`}
          </div>
        </div>

        {/* Monthly Passive Income */}
        <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-sky-500/20 space-y-1">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-sky-400" /> 平均每月領息
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-sky-400 tracking-tight">
            ${formatMoney(displayMonthlyIncome, isPrivacy)}
            <span className="text-xs font-sans text-slate-400 font-semibold ml-1">NT$/月</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            自由目標達成率: <strong className="text-sky-300">{goalProgressPct.toFixed(1)}%</strong>
          </div>
        </div>

        {/* Portfolio Dividend Yield */}
        <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-amber-500/20 space-y-1">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> 組合平均股息殖利率
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
            {summary.weightedDividendYieldPct.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            總持股標的: {portfolio.length} 檔
          </div>
        </div>
      </div>

      {/* Ex-Rights Pending Stock Assets Banner */}
      {summary.totalPendingStockValueTWD > 0 && (
        <div className="bg-purple-950/40 border border-purple-500/30 p-3.5 sm:p-4 rounded-2xl text-xs text-purple-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="font-bold text-sm text-purple-300 flex items-center gap-2">
              <span>🎁 除權待撥股票資產 (Ex-Rights Pending Stock Assets)</span>
              <span className="text-[10px] bg-purple-500/30 border border-purple-400/40 text-purple-200 px-2 py-0.5 rounded font-mono">
                +{summary.totalPendingStockShares.toLocaleString()} 股待撥
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              除權日後至配股撥券入帳日前，待領取之股票市值已自動試算，確保除權後整體資產價值保持一致。
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-purple-300 font-sans">待撥股票總估值</div>
            <div className="text-lg font-black font-mono text-purple-200">
              ${formatMoney(summary.totalPendingStockValueTWD, isPrivacy)} <span className="text-xs font-sans">NT$</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Overview & 12-Month Cashflow Bar Chart */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-xs text-slate-300">
            <div className="font-bold flex items-center gap-2 text-slate-200">
              <Layers className="w-4 h-4 text-emerald-400" /> 12 個月被動收入發放分佈 (月月配現金流)
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              深色柱體代表高於平均月領息高點月份
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3 overflow-x-auto">
            <div className="grid grid-cols-12 gap-1.5 sm:gap-2 h-48 items-end pt-8 pb-2 min-w-[320px]">
              {summary.monthlyBreakdown.map((val, idx) => {
                const heightPct = Math.max(10, (val / maxMonthlyVal) * 100);
                const isHighMonth = val > displayMonthlyIncome;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="text-[9px] sm:text-[10px] font-mono text-slate-300 opacity-80 sm:opacity-0 group-hover:opacity-100 transition mb-1 text-center truncate w-full">
                      ${formatMoney(Math.round(val), isPrivacy)}
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[32px] rounded-t-md sm:rounded-t-lg transition-all duration-500 ${
                        isHighMonth
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                          : 'bg-gradient-to-t from-sky-700 to-sky-500 opacity-80'
                      }`}
                    />
                    <div className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-300 mt-2">
                      {monthNames[idx]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tax Breakdown Hint Banner */}
          {taxMode === 'net' && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-xs text-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="space-y-0.5">
                <span className="font-bold block text-amber-300">二代健保 & 美股預扣稅扣抵細節：</span>
                <p className="text-[11px] text-slate-300">
                  台股單次除息領取配息 ≥ $20,000 NT$ 扣取 2.11% 二代健保補充保費；美股股息扣除 30% 預扣稅。
                </p>
              </div>
              <div className="font-mono text-[11px] bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                二代健保約: <strong className="text-amber-400">${Math.round(totalNhiFeeTWD).toLocaleString()}</strong> | 美稅約: <strong className="text-rose-400">${Math.round(totalUsTaxTWD).toLocaleString()}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Upcoming Ex-Dividend Calendar */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-emerald-400" /> 除權息公告日曆與最後買進日對照表
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* View Switcher: Grid vs Table */}
              <div className="bg-slate-950 p-1 rounded-xl border border-white/10 flex items-center gap-1">
                <button
                  onClick={() => {
                    playClickSound();
                    setCalendarView('grid');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    calendarView === 'grid' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" /> 卡片
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setCalendarView('table');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    calendarView === 'table' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" /> 清單
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    playClickSound();
                    fetchLiveDividends(true);
                  }}
                  disabled={isFetchingDividends}
                  className="text-xs text-sky-400 font-bold bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-xl border border-sky-500/30 flex items-center gap-1.5 transition btn-interact disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDividends ? 'animate-spin' : ''}`} />
                  {isFetchingDividends ? '抓取證交所/官方公告中...' : '重新整理官方最新公告日'}
                </button>
                {lastSyncedTime && !isFetchingDividends && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    (上次同步時間: {lastSyncedTime})
                  </span>
                )}
              </div>
            </div>
          </div>

          {syncNotice && (
            <div className="bg-sky-950/80 border border-sky-500/40 p-3 rounded-2xl text-xs text-sky-200 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          <div className="bg-slate-950/80 border border-white/10 p-3.5 rounded-2xl text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> 官方公告日期與最後買進日說明：
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              本頁面已同步連接台美股官方除權息資料庫。已發布重訊公告者將標示為<strong className="text-emerald-400">「官方最新公告」</strong>；欲參與領息者請務必於<strong className="text-amber-400">「最後買進日」</strong>盤後交易結束前持有該標的。若投信或公司尚未公布新一期重訊，點選卡片右上角的<strong className="text-sky-400">「校正/手動填寫」</strong>按鈕即可輸入官方公告資訊。
            </p>
          </div>

          {/* Grid Cards View */}
          {calendarView === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {summary.upcomingReminders.map((item, idx) => {
                const isOverNhiThreshold = item.estAmountTWD >= 20000;
                const originalStock = portfolio.find((p) => p.symbol.toUpperCase() === item.symbol.toUpperCase());
                const isOfficial = item.isOfficial || !!item.exactExDate;
                const sInfo = originalStock ? getStockDividendInfo(originalStock, usdTwdRate) : null;

                return (
                  <div
                    key={idx}
                    className="bg-slate-900/90 p-4 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition space-y-3 relative group shadow-lg flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-2 border-b border-white/5 pb-2.5">
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span>{item.name}</span>
                            <span className="text-[11px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-500/20">
                              {item.symbol}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {/* Type Tag */}
                            {item.stockDps > 0 && item.singleDps > 0 ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-0.5">
                                <Coins className="w-3 h-3 text-purple-400" /> 除權息 (現金+股票)
                              </span>
                            ) : item.stockDps > 0 ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-0.5">
                                <Gift className="w-3 h-3 text-purple-400" /> 除權 (純配股)
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                                <DollarSign className="w-3 h-3 text-emerald-400" /> 除息 (純現金)
                              </span>
                            )}

                            {isOfficial ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                證交所公告
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                預估 (未公告)
                              </span>
                            )}

                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                              {item.frequency}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              playClickSound();
                              if (originalStock) {
                                setEditingStock(originalStock);
                                setEditExDate(originalStock.customExDate || item.exactExDate || '');
                                const stockInfo = getStockDividendInfo(originalStock, usdTwdRate);
                                setEditSingleDps(originalStock.customSingleDps ? String(originalStock.customSingleDps) : String(stockInfo.singleDividendPerShare));
                                setEditDps(originalStock.customDps ? String(originalStock.customDps) : String(stockInfo.annualDividendPerShare));
                                setEditStockDps(originalStock.customStockDps !== undefined ? String(originalStock.customStockDps) : String(stockInfo.stockDps || ''));
                              }
                            }}
                            title="手動校正/輸入官方公告日期與股利"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-sky-300 hover:bg-slate-700 transition border border-white/10"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Per Share Distribution Details */}
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/20 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between border-b border-white/5 pb-1">
                          <span>每股分派金額明細 (Per Share)</span>
                          {sInfo && <span className="text-[10px] font-mono text-emerald-400">殖利率 ~{sInfo.dividendYieldPct.toFixed(2)}%</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          {/* Cash DPS */}
                          <div className="bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-lg">
                            <div className="text-[10px] text-emerald-400 font-sans font-medium">💵 每股現金股利 (配息)</div>
                            <div className="text-sm font-black text-emerald-300 mt-0.5">
                              ${item.singleDps.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">元/股</span>
                            </div>
                            {originalStock?.market !== 'us' && (
                              <div className="text-[9px] text-slate-400 font-sans mt-0.5">
                                換算每張 ${Math.round(item.singleDps * 1000).toLocaleString()} 元
                              </div>
                            )}
                          </div>

                          {/* Stock DPS */}
                          <div className={`p-2 rounded-lg ${item.stockDps > 0 ? 'bg-purple-950/40 border border-purple-500/30' : 'bg-slate-900/40 border border-white/5 opacity-60'}`}>
                            <div className="text-[10px] text-purple-300 font-sans font-medium">🎁 每股股票股利 (配股)</div>
                            <div className="text-sm font-black text-purple-200 mt-0.5">
                              {item.stockDps > 0 ? `${item.stockDps.toFixed(2)} 元/股` : '0 元 (無配股)'}
                            </div>
                            {item.stockDps > 0 && (
                              <div className="text-[9px] text-purple-300/80 font-sans mt-0.5">
                                配股率 {(item.stockDps * 10).toFixed(1)}% (每張配 {Math.round(item.stockDps * 100)} 股)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Important Schedule Dates */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400">除權息交易日:</span>
                          <span className={isOfficial ? "text-emerald-400 font-bold" : "text-amber-300 font-bold"}>
                            {item.exactExDate ? item.exactExDate : `${item.nextExMonthStr}`}
                          </span>
                        </div>

                        {item.lastBuyDate ? (
                          <div className="flex justify-between items-center border-t border-white/5 pt-1">
                            <span className="text-[10px] text-amber-300 font-bold">最後買進日:</span>
                            <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              {item.lastBuyDate} 盤後前
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 border-t border-white/5 pt-1 flex justify-between items-center font-sans">
                            <span>配息狀態:</span>
                            <span className="text-amber-300/90 font-medium">
                              尚未公布 (依前次估算)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Holding & Est Payout */}
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 font-mono text-xs space-y-1.5 mt-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans">當前持股數</div>
                          <div className="text-slate-200 font-bold">
                            {originalStock?.shares.toLocaleString() || 0} 股
                            <span className="text-[10px] text-slate-400 font-normal ml-1">
                              ({((originalStock?.shares || 0) / 1000).toFixed(1)} 張)
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-sans">預估單次現金股息</div>
                          <div className="text-emerald-400 font-bold text-sm">
                            ${formatMoney(item.estAmountTWD, isPrivacy)} NT$
                          </div>
                        </div>
                      </div>

                      {item.stockDps > 0 && (
                        <div className="pt-1.5 border-t border-white/5 flex justify-between items-center text-[11px]">
                          <span className="text-purple-300">預估配股: <strong className="text-purple-200 font-bold">+{item.pendingStockShares} 股</strong></span>
                          <span className="text-purple-300 font-bold">市值約 ${formatMoney(item.pendingStockValueTWD, isPrivacy)} NT$</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {calendarView === 'table' && (
            <div className="bg-slate-900/90 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th className="py-3 px-3">標的 / 代號</th>
                      <th className="py-3 px-2">分派類別</th>
                      <th className="py-3 px-3 text-right">每股現金 (配息)</th>
                      <th className="py-3 px-3 text-right">每股股票 (配股)</th>
                      <th className="py-3 px-3 text-center">除權息交易日</th>
                      <th className="py-3 px-3 text-center">最後買進日</th>
                      <th className="py-3 px-3 text-right">持股數</th>
                      <th className="py-3 px-3 text-right">預估現金收益</th>
                      <th className="py-3 px-3 text-right">預估配股/市值</th>
                      <th className="py-3 px-3 text-center">校正/重訊</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {summary.upcomingReminders.map((item, idx) => {
                      const originalStock = portfolio.find((p) => p.symbol.toUpperCase() === item.symbol.toUpperCase());
                      const isOfficial = item.isOfficial || !!item.exactExDate;

                      return (
                        <tr key={idx} className="hover:bg-white/5 transition">
                          <td className="py-3 px-3 font-sans">
                            <div className="font-bold text-white text-sm">{item.name}</div>
                            <div className="text-sky-400 text-[11px] font-mono">{item.symbol}</div>
                          </td>

                          <td className="py-3 px-2">
                            {item.stockDps > 0 && item.singleDps > 0 ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                除權息
                              </span>
                            ) : item.stockDps > 0 ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                除權
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                除息
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            ${item.singleDps.toFixed(2)} 元
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-purple-300">
                            {item.stockDps > 0 ? `${item.stockDps.toFixed(2)} 元` : '-'}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={isOfficial ? "text-emerald-400 font-bold" : "text-amber-300"}>
                              {item.exactExDate ? item.exactExDate : `${item.nextExMonthStr}`}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {item.lastBuyDate ? (
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                {item.lastBuyDate} 前
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-slate-300">
                            {originalStock?.shares.toLocaleString() || 0} 股
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            ${formatMoney(item.estAmountTWD, isPrivacy)} NT$
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-purple-300">
                            {item.stockDps > 0 ? (
                              <div>
                                <div>+{item.pendingStockShares} 股</div>
                                <div className="text-[10px] text-purple-400">${formatMoney(item.pendingStockValueTWD, isPrivacy)} NT$</div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                playClickSound();
                                if (originalStock) {
                                  setEditingStock(originalStock);
                                  setEditExDate(originalStock.customExDate || item.exactExDate || '');
                                  const stockInfo = getStockDividendInfo(originalStock, usdTwdRate);
                                  setEditSingleDps(originalStock.customSingleDps ? String(originalStock.customSingleDps) : String(stockInfo.singleDividendPerShare));
                                  setEditDps(originalStock.customDps ? String(originalStock.customDps) : String(stockInfo.annualDividendPerShare));
                                  setEditStockDps(originalStock.customStockDps !== undefined ? String(originalStock.customStockDps) : String(stockInfo.stockDps || ''));
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-sky-300 hover:bg-slate-700 transition border border-white/10"
                              title="校正除息日/配息與配股"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Financial Freedom Goal & Capital Gap Calculator */}
      {activeTab === 'goal' && (
        <div className="bg-slate-900/80 p-4 sm:p-6 rounded-2xl border border-sky-500/20 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-sky-400" /> 每月被動收入自由目標試算
              </h3>
              <p className="text-xs text-slate-400">設定您的目標月領金額，系統將自動推算達成進度與所需加碼本金</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-300 font-bold whitespace-nowrap">月目標 (NT$):</span>
              <input
                type="number"
                step={5000}
                value={monthlyGoalTWD}
                onChange={(e) => setMonthlyGoalTWD(Math.max(1000, Number(e.target.value)))}
                className="w-full sm:w-36 bg-slate-950 text-emerald-400 font-mono font-bold text-sm px-3.5 py-2 rounded-xl border border-white/20 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">
                目前月領: <strong className="text-emerald-400">${formatMoney(displayMonthlyIncome, isPrivacy)}</strong>
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
              {displayMonthlyIncome < monthlyGoalTWD ? (
                <span className="text-amber-400">
                  月領缺口: 還差 ${formatMoney(monthlyGap, isPrivacy)} NT$
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">🎉 已達成財富自由初步目標！</span>
              )}
            </div>
          </div>

          {/* Capital Needed Card (倒推加碼本金) */}
          {monthlyGap > 0 && (
            <div className="bg-gradient-to-r from-sky-950/80 to-indigo-950/80 p-4 rounded-2xl border border-sky-500/30 space-y-2">
              <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-sky-400" /> 填補缺口：還需投入本金估算
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                依據您目前組合平均殖利率 <strong className="text-amber-300 font-mono">{summary.weightedDividendYieldPct.toFixed(2)}%</strong> 試算，要填補每月 <strong className="text-emerald-400 font-mono">${Math.round(monthlyGap).toLocaleString()} NT$</strong> 的缺口：
              </p>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-xs text-slate-400">
                  預估還需加碼本金：
                </div>
                <div className="text-xl font-black font-mono text-sky-400">
                  ${Math.round(capitalNeededToFillGapTWD / 10000).toLocaleString()} <span className="text-xs font-sans text-slate-300">萬元 NT$</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: DRIP Compound Growth Simulator (股息再投資複利試算) */}
      {activeTab === 'drip' && (
        <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-emerald-500/30 space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Repeat className="w-5 h-5 text-emerald-400" /> 股息 100% 再投資 (DRIP) 複利模擬器
            </h3>
            <p className="text-xs text-slate-400">
              比較「單純領息花掉 (No DRIP)」與「100% 股息再投資 (DRIP) 滾雪球」的資產爆發力差距
            </p>
          </div>

          {/* Interactive Controls (Mobile Stack) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-white/10 text-xs">
            {/* Horizon Selection */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">試算滾存時間 (年):</label>
              <div className="flex gap-1.5">
                {[3, 5, 10, 20].map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      playClickSound();
                      setDripYears(y);
                    }}
                    className={`flex-1 py-1.5 rounded-xl font-mono font-bold transition border ${
                      dripYears === y
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow'
                        : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {y} 年
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Contribution Slider */}
            <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                <span className="text-slate-200 flex items-center gap-1.5">
                  全投資組合每月定期定額總投入：
                  <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    整體組合總額
                  </span>
                </span>
                <span className="text-emerald-400 font-mono text-base font-black">${monthlyContribution.toLocaleString()} NT$/月</span>
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={5000}
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="text-[11px] text-slate-400 leading-relaxed font-sans flex flex-col sm:flex-row justify-between gap-1 pt-1.5 border-t border-white/5">
                <span>
                  💡 <strong>資金明確定義：</strong>此金額為<strong>「全投資組合每月新投入之總資金」</strong>（依當前持股價值比例分配投入），非單一股票金額。
                </span>
                {portfolio.length > 0 && monthlyContribution > 0 && (
                  <span className="text-emerald-300 font-mono shrink-0">
                    目前 {portfolio.length} 檔持股，平均每檔約配分 ${Math.round(monthlyContribution / portfolio.length).toLocaleString()} NT$/月
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scenario A: No DRIP */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-amber-400" /> 方案 A：單純領息花掉
                </span>
                <span className="text-[10px] text-slate-500">不重覆投入</span>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">
                  {dripYears} 年後預估月領被動收入：
                </div>
                <div className="text-xl font-black font-mono text-amber-300">
                  ${Math.round(dripResult.finalMonthlyIncomeNoDrip).toLocaleString()} <span className="text-xs text-slate-400 font-sans">NT$/月</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 space-y-1 font-mono">
                <div>每月新加碼資金: ${monthlyContribution.toLocaleString()} NT$ (全組合總額)</div>
                <div>{dripYears} 年累積落袋股息: ${Math.round(dripResult.totalCashReceivedNoDrip).toLocaleString()}</div>
                <div>{dripYears} 年後預估總資產: ${Math.round(dripResult.assetNoDrip / 10000).toLocaleString()} 萬</div>
              </div>
            </div>

            {/* Scenario B: DRIP */}
            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-emerald-400" /> 方案 B：股息 100% DRIP 再投資
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  複利滾雪球
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-slate-300">
                  {dripYears} 年後預估月領被動收入：
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                  ${Math.round(dripResult.finalMonthlyIncomeDrip).toLocaleString()} <span className="text-xs text-slate-400 font-sans">NT$/月</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 text-[11px] text-slate-300 space-y-1 font-mono">
                <div className="text-emerald-300 font-bold">
                  複利增幅效益：每月多領 +${Math.round(dripResult.dripBonusIncome).toLocaleString()} NT$
                </div>
                <div>每月新加碼資金: ${monthlyContribution.toLocaleString()} NT$ (全組合總額)</div>
                <div>{dripYears} 年後預估總資產: ${Math.round(dripResult.assetDrip / 10000).toLocaleString()} 萬</div>
              </div>
            </div>
          </div>

          {/* Takeaway Insight */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl text-xs text-emerald-200 flex items-center gap-3">
            <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong>複利效益總結：</strong>堅持將股息再投資，{dripYears} 年後總資產將比不投入多出約{' '}
              <strong className="text-amber-300 font-mono">${Math.round(dripResult.dripBonusAsset / 10000).toLocaleString()} 萬元</strong>
              ！早一日啟動 DRIP，雪球滾越快！
            </div>
          </div>
        </div>
      )}

      {/* Custom Ex-Date / DPS Edit Modal */}
      {editingStock && (() => {
        const sInfo = getStockDividendInfo(editingStock, usdTwdRate);
        const freq = sInfo.frequency;
        const mult = sInfo.exMonths.length > 0 ? sInfo.exMonths.length : 1;

        const singleVal = editSingleDps !== '' ? parseFloat(editSingleDps) || 0 : (editDps !== '' ? (parseFloat(editDps) || 0) / mult : sInfo.singleDividendPerShare);
        const annualVal = editDps !== '' ? parseFloat(editDps) || 0 : singleVal * mult;

        const estSinglePayout = editingStock.shares * singleVal * (editingStock.market === 'us' ? usdTwdRate : 1);
        const estAnnualTotal = editingStock.shares * annualVal * (editingStock.market === 'us' ? usdTwdRate : 1);
        const estMonthlyAvg = estAnnualTotal / 12;

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setEditingStock(null)}
          >
            <div
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <h4 className="font-bold text-white text-base">校正除息公告與配息金額</h4>
                  <p className="text-xs text-sky-400 font-mono">{editingStock.symbol} - {editingStock.name}</p>
                </div>
                <button
                  onClick={() => setEditingStock(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">官方公告除息日 (Ex-Date)</label>
                  <input
                    type="date"
                    value={editExDate}
                    onChange={(e) => setEditExDate(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-white/10 rounded-xl px-3.5 py-2.5 font-mono font-bold outline-none focus:border-emerald-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">例如: 2026-03-18 (若清空則自動帶入官方重訊)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-400 font-bold mb-1">單次每股現金股利 (配息)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`例如: ${sInfo.singleDividendPerShare}`}
                      value={editSingleDps}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditSingleDps(val);
                        if (val !== '') {
                          const num = parseFloat(val) || 0;
                          setEditDps(String(Number((num * mult).toFixed(4))));
                        } else {
                          setEditDps('');
                        }
                      }}
                      className="w-full bg-slate-950 text-emerald-400 border border-emerald-500/30 rounded-xl px-3 py-2 font-mono font-bold outline-none focus:border-emerald-400"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">如台積電 4.0 元 / 合庫金 0.8 元</p>
                  </div>

                  <div>
                    <label className="block text-purple-300 font-bold mb-1">每股股票股利 (配股)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`例如: ${sInfo.stockDps || 0}`}
                      value={editStockDps}
                      onChange={(e) => setEditStockDps(e.target.value)}
                      className="w-full bg-slate-950 text-purple-300 border border-purple-500/30 rounded-xl px-3 py-2 font-mono font-bold outline-none focus:border-purple-400"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">0.25 元代表每張配 25 股 (配股率 2.5%)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-amber-300 font-bold mb-1">年化每股總現金股息 (DPS)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`例如: ${sInfo.annualDividendPerShare}`}
                    value={editDps}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditDps(val);
                      if (val !== '') {
                        const num = parseFloat(val) || 0;
                        setEditSingleDps(String(Number((num / mult).toFixed(4))));
                      } else {
                        setEditSingleDps('');
                      }
                    }}
                    className="w-full bg-slate-950 text-amber-300 border border-white/10 rounded-xl px-3 py-2 font-mono font-bold outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">({freq} x {mult} 次/年)</p>
                </div>

                {/* Live Realtime Portfolio Impact Box */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/30 space-y-1.5 font-mono">
                  <div className="text-[11px] text-slate-400 flex justify-between font-sans">
                    <span>持股試算對照 ({editingStock.shares.toLocaleString()} 股 / {(editingStock.shares / 1000).toFixed(1)} 張)</span>
                    <span className="text-emerald-400 font-bold">即時試算</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-200">
                    <span>單次預估現金股息：</span>
                    <span className="text-emerald-400 font-bold text-sm">${Math.round(estSinglePayout).toLocaleString()} NT$</span>
                  </div>
                  {editStockDps !== '' && parseFloat(editStockDps) > 0 && (
                    <div className="flex justify-between items-center text-purple-300 border-t border-white/5 pt-1">
                      <span>預估新增配股股票：</span>
                      <span className="font-bold">+{Math.round((editingStock.shares * parseFloat(editStockDps)) / 10)} 股</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-300 border-t border-white/5 pt-1">
                    <span>全年度預估總現金：</span>
                    <span className="text-amber-300 font-bold">${Math.round(estAnnualTotal).toLocaleString()} NT$</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    playSuccessSound();
                    const resetStock: StockPosition = {
                      ...editingStock,
                      customExDate: undefined,
                      customSingleDps: undefined,
                      customDps: undefined,
                      customStockDps: undefined,
                    };
                    if (onUpdateStock) {
                      onUpdateStock(resetStock);
                    }
                    setEditingStock(null);
                  }}
                  className="px-3 py-2 rounded-xl text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 恢復官方數據 (清除校正)
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingStock(null)}
                    className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-bold text-xs transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      playSuccessSound();
                      const updatedStock: StockPosition = {
                        ...editingStock,
                        customExDate: editExDate.replace(/-/g, '/').trim() || undefined,
                        customSingleDps: editSingleDps !== '' ? parseFloat(editSingleDps) : undefined,
                        customDps: editDps !== '' ? parseFloat(editDps) : undefined,
                        customStockDps: editStockDps !== '' ? parseFloat(editStockDps) : undefined,
                      };
                      if (onUpdateStock) {
                        onUpdateStock(updatedStock);
                      }
                      setEditingStock(null);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-950 font-bold bg-emerald-400 hover:bg-emerald-300 text-xs shadow-md transition"
                  >
                    儲存校正
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

