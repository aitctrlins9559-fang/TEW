import React from 'react';
import { PieChart, Download, Upload, CloudUpload, Box, Unlock, Plus } from 'lucide-react';
import { StockPosition } from '../types';
import { formatMoney, escapeHtml } from '../utils/format';
import { playClickSound } from '../utils/audio';

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
  onPublishToGlobal: () => void;
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
  const getUpColor = () => (isRedUp ? 'text-rose-400' : 'text-emerald-400');
  const getDownColor = () => (isRedUp ? 'text-emerald-400' : 'text-rose-400');

  return (
    <div className="glass-card p-0 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-white/5 gap-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5 tracking-wide">
          <PieChart className="w-5 h-5 text-sky-400" /> 部位明細
          <span className="bg-sky-500/10 text-sky-400 text-xs px-2.5 py-0.5 rounded-full font-mono tabular-nums">
            {portfolio.length}
          </span>
        </h2>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              playClickSound();
              if (!isAdmin) {
                onToggleAdmin();
              } else {
                onOpenAddModal();
              }
            }}
            className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 btn-interact shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-4 h-4" /> 新增部位
          </button>

          {isAdmin && (
            <>
              <button
                onClick={onPublishToGlobal}
                className="text-xs bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 btn-interact shadow-[0_0_10px_rgba(56,189,248,0.15)]"
              >
                <CloudUpload className="w-4 h-4" /> 強制覆蓋雲端
              </button>
              <button
                onClick={onExportData}
                className="text-xs bg-slate-800/50 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl transition flex items-center gap-1.5 btn-interact"
              >
                <Download className="w-4 h-4" /> 備份
              </button>
              <button
                onClick={onImportData}
                className="text-xs bg-slate-800/50 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl transition flex items-center gap-1.5 btn-interact"
              >
                <Upload className="w-4 h-4" /> 還原
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300 min-w-[900px]">
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
              <th className="py-5 px-6 text-center font-semibold">歷程與操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {portfolio.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                      <Box className="w-8 h-8 text-slate-500" />
                    </div>
                    <div className="text-slate-400 text-sm font-medium tracking-wide">
                      目前空空如也，尚未建立任何監控部位
                    </div>
                    <button
                      onClick={onToggleAdmin}
                      className="mt-2 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 btn-interact shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                    >
                      <Unlock className="w-4 h-4" /> 點此解鎖權限並新增持股
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              portfolio.map((item) => {
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
                      {itemMarketValTWD === null ? '--' : formatMoney(itemMarketValTWD, isPrivacy)}
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

                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playClickSound();
                              onOpenEditModal(item.id);
                            }}
                            className="text-xs bg-slate-800/80 hover:bg-sky-900/40 text-sky-400 border border-white/5 px-2.5 py-1.5 rounded-lg transition btn-interact"
                          >
                            編輯
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteStock(item.id);
                            }}
                            className="text-xs bg-slate-800/80 hover:bg-rose-900/40 text-rose-400 border border-white/5 px-2.5 py-1.5 rounded-lg transition btn-interact"
                          >
                            刪除
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
