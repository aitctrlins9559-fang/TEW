import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  PieChart,
  Download,
  Upload,
  Box,
  Plus,
  History,
  Edit3,
  Trash2,
  Calendar,
  Sparkles,
  BarChart2,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { StockPosition } from '../types';
import { formatMoney } from '../utils/format';
import { playClickSound } from '../utils/audio';
import { getStockDividendInfo } from '../utils/dividendHelper';
import { StockDetailModal } from './Modals/StockDetailModal';

interface StockTableProps {
  portfolio: StockPosition[];
  usdTwdRate: number;
  isAdmin: boolean;
  isPrivacy: boolean;
  isRedUp: boolean;
  onSelectChartTarget: (symbol: string, market: 'tse' | 'otc' | 'us', name: string) => void;
  onOpenTxHistory: (stockId: string) => void;
  onOpenEditModal: (stockId: string) => void;
  onDeleteStock: (stockId: string) => void;
  onOpenAddModal: () => void;
  onToggleAdmin: () => void;
  onPublishToGlobal?: () => void;
  onExportData: () => void;
  onImportData: () => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  portfolio,
  usdTwdRate,
  isAdmin,
  isPrivacy,
  isRedUp,
  onSelectChartTarget,
  onOpenTxHistory,
  onOpenEditModal,
  onDeleteStock,
  onOpenAddModal,
  onToggleAdmin,
  onPublishToGlobal,
  onExportData,
  onImportData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'tw' | 'us'>('all');
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [detailModalStock, setDetailModalStock] = useState<StockPosition | null>(null);
  const dataMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dataMenuRef.current && !dataMenuRef.current.contains(e.target as Node)) {
        setIsDataMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUpColor = () => (isRedUp ? 'text-rose-400' : 'text-emerald-400');
  const getDownColor = () => (isRedUp ? 'text-emerald-400' : 'text-rose-400');

  // Filtered portfolio list
  const filteredPortfolio = useMemo(() => {
    return portfolio.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSymbol = item.symbol.toLowerCase().includes(q);
        if (!matchName && !matchSymbol) return false;
      }

      // 2. Filter Tab
      const isUS = item.market === 'us';
      if (filterTab === 'tw' && isUS) return false;
      if (filterTab === 'us' && !isUS) return false;

      return true;
    });
  }, [portfolio, searchQuery, filterTab]);

  // Counts for tabs
  const counts = useMemo(() => {
    let tw = 0;
    let us = 0;

    portfolio.forEach((item) => {
      const isUS = item.market === 'us';
      if (isUS) us++;
      else tw++;
    });

    return { all: portfolio.length, tw, us };
  }, [portfolio]);

  return (
    <div className="glass-card p-0 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl space-y-0">
      {/* Table Header Controls */}
      <div className="p-5 md:p-6 border-b border-white/5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5 tracking-wide">
            <PieChart className="w-5 h-5 text-sky-400" /> 持股部位明細
            <span className="bg-sky-500/10 text-sky-400 text-xs px-2.5 py-0.5 rounded-full font-mono tabular-nums border border-sky-500/20">
              {filteredPortfolio.length} / {portfolio.length}
            </span>
          </h2>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Primary Action: Add Position */}
            <button
              onClick={() => {
                playClickSound();
                onOpenAddModal();
              }}
              className="flex-1 md:flex-none text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 md:py-2 rounded-xl transition flex items-center justify-center gap-1.5 btn-interact shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-4 h-4" /> 新增持股
            </button>

            {/* Data Management Dropdown */}
            <div className="relative" ref={dataMenuRef}>
              <button
                onClick={() => {
                  playClickSound();
                  setIsDataMenuOpen((prev) => !prev);
                }}
                className={`text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10 px-3.5 py-2.5 md:py-2 rounded-xl transition flex items-center gap-1.5 btn-interact ${
                  isDataMenuOpen ? 'border-sky-400 bg-slate-700 text-white' : ''
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                <span>資料管理</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDataMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDataMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-scaleUp space-y-1">
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsDataMenuOpen(false);
                      onExportData();
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 text-xs text-slate-200 transition"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>匯出持股備份檔 (JSON)</span>
                  </button>

                  <button
                    onClick={() => {
                      playClickSound();
                      setIsDataMenuOpen(false);
                      onImportData();
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 text-xs text-slate-200 transition"
                  >
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>還原 JSON 備份檔</span>
                  </button>

                  {onPublishToGlobal && (
                    <button
                      onClick={() => {
                        playClickSound();
                        setIsDataMenuOpen(false);
                        onPublishToGlobal();
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 text-xs text-emerald-400 transition"
                    >
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>發佈至全域雲端</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Market / Profit Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-white/5">
            <button
              onClick={() => {
                playClickSound();
                setFilterTab('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterTab === 'all'
                  ? 'bg-sky-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              全部 ({counts.all})
            </button>

            <button
              onClick={() => {
                playClickSound();
                setFilterTab('tw');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterTab === 'tw'
                  ? 'bg-sky-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              台股 ({counts.tw})
            </button>

            <button
              onClick={() => {
                playClickSound();
                setFilterTab('us');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterTab === 'us'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              美股 ({counts.us})
            </button>
          </div>

          {/* Search Box Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋標的名稱或代號..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredPortfolio.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
              <Box className="w-8 h-8 text-slate-500" />
            </div>
            <div className="text-slate-400 text-sm font-medium tracking-wide">
              {searchQuery || filterTab !== 'all'
                ? '沒有符合篩選條件的部位，嘗試清除搜尋條件'
                : '目前空空如也，尚未建立任何監控部位'}
            </div>
            {searchQuery || filterTab !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterTab('all');
                }}
                className="mt-2 bg-slate-800 text-slate-200 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition border border-white/10"
              >
                重置篩選
              </button>
            ) : (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenAddModal();
                }}
                className="mt-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 btn-interact shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              >
                <Plus className="w-4 h-4" /> 新增第一筆持股部位
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* MOBILE VIEW: High-Density Financial List Layout (lg:hidden) */}
          {/* ========================================================= */}
          <div className="block lg:hidden divide-y divide-white/5 bg-slate-900/30">
            {filteredPortfolio.map((item) => {
              const isUS = item.market === 'us';
              const buyFx = isUS ? item.buyRate || usdTwdRate : 1;
              const marketFx = isUS ? usdTwdRate : 1;
              const safePrice =
                typeof item.price === 'number' && item.price > 0 ? item.price : null;

              const itemCostTWD = item.shares * item.cost * buyFx;
              const itemMarketValTWD = safePrice === null ? null : item.shares * safePrice * marketFx;
              const itemProfitTWD = itemMarketValTWD === null ? null : itemMarketValTWD - itemCostTWD;
              const itemRoi = itemCostTWD > 0 && itemProfitTWD !== null ? (itemProfitTWD / itemCostTWD) * 100 : null;

              const profitColorClass =
                itemProfitTWD === null ? 'text-slate-500' : itemProfitTWD >= 0 ? getUpColor() : getDownColor();

              const divInfo = getStockDividendInfo(item, usdTwdRate);
              const hasCashDiv = divInfo.singleDividendPerShare > 0;
              const hasStockDiv = typeof divInfo.stockDps === 'number' && divInfo.stockDps > 0;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    playClickSound();
                    setDetailModalStock(item);
                  }}
                  className="px-4 py-3.5 hover:bg-slate-800/60 active:bg-slate-800 transition cursor-pointer flex items-center justify-between gap-3 group border-b border-white/5 last:border-0"
                >
                  {/* Left Column: Stock Info & Dividend Tag */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white group-hover:text-sky-400 transition truncate tracking-tight">
                        {item.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 shrink-0 uppercase">
                        {item.market}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span className="text-sky-400 font-bold">{item.symbol}</span>
                      <span>•</span>
                      <span>{item.shares.toLocaleString()} 股</span>
                    </div>

                    {/* Mobile Dividend Badge Indicator */}
                    {(hasCashDiv || hasStockDiv) && (
                      <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                        {hasCashDiv && hasStockDiv ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            權息 (現金${divInfo.singleDividendPerShare} + 配股{divInfo.stockDps}元)
                          </span>
                        ) : hasStockDiv ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            配股 ({divInfo.stockDps}元)
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            配息 (${divInfo.singleDividendPerShare}元)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Price, Valuation, Profit & Chevron */}
                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <div className="flex flex-col items-end">
                      {/* Price & ROI */}
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-base font-black text-slate-100">
                          {safePrice === null ? '--' : `$${safePrice}`}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            itemRoi === null
                              ? 'bg-slate-800 text-slate-400'
                              : itemRoi >= 0
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {itemRoi === null ? '--' : `${itemRoi >= 0 ? '+' : ''}${itemRoi.toFixed(2)}%`}
                        </span>
                      </div>

                      {/* Valuation & Profit */}
                      <div className="text-[11px] font-mono mt-0.5 flex items-center gap-1 text-slate-300">
                        <span className="font-semibold">{itemMarketValTWD === null ? '--' : formatMoney(itemMarketValTWD, isPrivacy)}</span>
                        <span className="text-slate-600">|</span>
                        <span className={`font-bold ${profitColorClass}`}>
                          {itemProfitTWD === null
                            ? '--'
                            : `${itemProfitTWD >= 0 ? '+' : ''}${formatMoney(itemProfitTWD, isPrivacy)}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        成本 <span className="font-mono text-slate-300">${formatMoney(itemCostTWD, isPrivacy)}</span>
                      </div>
                    </div>

                    {/* Chevron Indicator */}
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* DESKTOP VIEW: Full Comprehensive Data Table (hidden lg:table) */}
          {/* ========================================================= */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300 min-w-[1000px]">
              <thead className="text-xs uppercase bg-black/40 text-slate-400 tracking-wider">
                <tr>
                  <th className="py-5 px-6 font-semibold sticky left-0 z-20 bg-[#0B1120]/95 backdrop-blur-xl border-r border-white/5 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                    標的名稱 (點擊看圖)
                  </th>
                  <th className="py-5 px-6 font-semibold">最新價格</th>
                  <th className="py-5 px-6 font-semibold">持有股數</th>
                  <th className="py-5 px-6 font-semibold">買入均價與匯率</th>
                  <th className="py-5 px-6 font-semibold">當前市值 (NT$)</th>
                  <th className="py-5 px-6 font-semibold">未實現損益 (NT$)</th>
                  <th className="py-5 px-6 font-semibold">報酬率</th>
                  <th className="py-5 px-6 font-semibold text-amber-400">預估股息 / 殖利率</th>
                  <th className="py-5 px-6 text-center font-semibold">歷程與操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPortfolio.map((item) => {
                  const isUS = item.market === 'us';
                  const buyFx = isUS ? item.buyRate || usdTwdRate : 1;
                  const marketFx = isUS ? usdTwdRate : 1;
                  const safePrice =
                    typeof item.price === 'number' && item.price > 0 ? item.price : null;

                  const itemCostTWD = item.shares * item.cost * buyFx;
                  const itemMarketValTWD = safePrice === null ? null : item.shares * safePrice * marketFx;
                  const itemProfitTWD = itemMarketValTWD === null ? null : itemMarketValTWD - itemCostTWD;
                  const itemRoi = itemCostTWD > 0 && itemProfitTWD !== null ? (itemProfitTWD / itemCostTWD) * 100 : null;

                  const profitColorClass =
                    itemProfitTWD === null ? 'text-slate-500' : itemProfitTWD >= 0 ? getUpColor() : getDownColor();

                  const pulseClass =
                    item.priceChanged === 'up'
                      ? 'pulse-up'
                      : item.priceChanged === 'down'
                      ? 'pulse-down'
                      : '';

                  let statusBadge = null;
                  if (safePrice && item.dayHigh && safePrice >= item.dayHigh) {
                    statusBadge = (
                      <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 py-0.5 rounded ml-1 font-bold">
                        🔥創高
                      </span>
                    );
                  } else if (safePrice && item.dayLow && safePrice <= item.dayLow) {
                    statusBadge = (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded ml-1 font-bold">
                        📉創低
                      </span>
                    );
                  }

                  const divInfo = getStockDividendInfo(item, usdTwdRate);
                  const txCount = Array.isArray(item.transactions) ? item.transactions.length : 1;

                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition group cursor-pointer">
                      {/* Stock Name */}
                      <td
                        onClick={() => onSelectChartTarget(item.symbol, item.market, item.name)}
                        className="py-5 px-6 font-bold text-white whitespace-nowrap sticky left-0 z-10 bg-[#111827]/95 backdrop-blur-xl border-r border-white/5 shadow-[2px_0_5px_rgba(0,0,0,0.2)] group-hover:bg-[#1f2937]/95 transition-all"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-base tracking-wide group-hover:text-sky-400 transition">
                            {item.name}
                          </span>
                          <span className={`text-xs ${isUS ? 'text-amber-400' : 'text-sky-400'} font-mono mt-0.5 tabular-nums`}>
                            {item.symbol}
                            <span className="text-[9px] border border-white/20 px-1 rounded ml-1">
                              {item.market.toUpperCase()}
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className={`py-5 px-6 font-mono font-semibold text-slate-200 text-base whitespace-nowrap tabular-nums ${pulseClass}`}>
                        {safePrice === null
                          ? '--'
                          : isUS
                          ? `$${safePrice} USD`
                          : `$${safePrice}`}
                        {statusBadge}
                        {item.fetchError && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 ml-1">
                            無報價
                          </span>
                        )}
                      </td>

                      {/* Shares */}
                      <td className="py-5 px-6 text-slate-300 font-mono text-base whitespace-nowrap tabular-nums">
                        {item.shares.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans">股</span>
                      </td>

                      {/* Cost & Date */}
                      <td className="py-5 px-6 text-slate-400 font-mono whitespace-nowrap tabular-nums">
                        {isUS ? (
                          <>
                            ${item.cost}{' '}
                            <span className="text-[10px] text-amber-400/80">(Fx {buyFx.toFixed(2)})</span>
                          </>
                        ) : (
                          `$${item.cost}`
                        )}
                        <div className="text-[10px] text-slate-500 mt-1.5 tracking-wider uppercase">
                          {item.buyDate || '未記錄'}
                        </div>
                      </td>

                      {/* Market Value */}
                      <td className="py-5 px-6 font-mono font-bold text-white text-base whitespace-nowrap tabular-nums">
                        <div>{itemMarketValTWD === null ? '--' : formatMoney(itemMarketValTWD, isPrivacy)}</div>
                        <div className="text-[11px] text-slate-400 font-normal font-sans mt-0.5 flex items-center gap-1">
                          <span>買入成本</span>
                          <span className="font-mono text-slate-300 font-semibold">${formatMoney(itemCostTWD, isPrivacy)}</span>
                        </div>
                      </td>

                      {/* Profit/Loss */}
                      <td className={`py-5 px-6 font-mono font-bold text-base ${profitColorClass} whitespace-nowrap tabular-nums`}>
                        {itemProfitTWD === null
                          ? '--'
                          : `${itemProfitTWD >= 0 ? '+' : ''}${formatMoney(itemProfitTWD, isPrivacy)}`}
                      </td>

                      {/* ROI */}
                      <td className={`py-5 px-6 font-mono font-bold text-base ${profitColorClass} whitespace-nowrap tabular-nums`}>
                        <span className={`${itemRoi !== null && itemRoi >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'} px-2 py-1 rounded-lg`}>
                          {itemRoi === null ? '--' : `${itemRoi >= 0 ? '+' : ''}${itemRoi.toFixed(2)}%`}
                        </span>
                      </td>

                      {/* Estimated Dividend / Yield */}
                      <td className="py-5 px-6 font-mono text-amber-400 whitespace-nowrap tabular-nums">
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          ${formatMoney(divInfo.annualIncomeTWD, isPrivacy)} <span className="text-[10px] text-slate-400 font-sans">/年</span>
                          {divInfo.isOfficial ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans font-bold">已公告</span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-sans font-bold">未公布(估算)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold">
                          單次配息 ${formatMoney(divInfo.singlePayoutTWD, isPrivacy)}
                        </div>
                        {divInfo.stockDps > 0 && (
                          <div className="text-[11px] text-purple-300 font-semibold flex items-center gap-1">
                            <span>配股 {divInfo.stockDps} 元</span>
                            <span className="text-[9px] bg-purple-500/20 px-1 rounded border border-purple-500/30">
                              +{divInfo.pendingStockShares}股 (待撥 ${formatMoney(divInfo.pendingStockValueTWD, isPrivacy)})
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-amber-400/80 font-medium">
                          {divInfo.dividendYieldPct.toFixed(1)}% <span className="text-[9px] text-slate-500 font-sans">({divInfo.frequency})</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-5 px-6 text-center space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickSound();
                            onOpenTxHistory(item.id);
                          }}
                          className="text-xs bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-1.5 rounded-lg transition btn-interact font-medium"
                        >
                          📜 歷程({txCount})
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickSound();
                            onOpenEditModal(item.id);
                          }}
                          className="text-xs bg-slate-800/80 hover:bg-sky-900/40 text-sky-400 border border-white/10 px-2.5 py-1.5 rounded-lg transition btn-interact"
                        >
                          編輯
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteStock(item.id);
                          }}
                          className="text-xs bg-slate-800/80 hover:bg-rose-900/40 text-rose-400 border border-white/10 px-2.5 py-1.5 rounded-lg transition btn-interact"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* Stock Detail Inspection Modal */}
      <StockDetailModal
        isOpen={Boolean(detailModalStock)}
        stock={detailModalStock}
        usdTwdRate={usdTwdRate}
        isPrivacy={isPrivacy}
        isRedUp={isRedUp}
        onClose={() => setDetailModalStock(null)}
        onOpenChart={(symbol, market, name) => {
          onSelectChartTarget(symbol, market, name);
        }}
        onOpenTxHistory={onOpenTxHistory}
        onOpenEditModal={onOpenEditModal}
        onDeleteStock={onDeleteStock}
      />
    </div>
  );
};
