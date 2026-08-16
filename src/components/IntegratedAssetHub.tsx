import React, { useState } from 'react';
import { TrendingUp, PieChart, LayoutGrid, ChevronDown, ChevronUp, Waves } from 'lucide-react';
import { StockPosition } from '../types';
import { AssetTrendChart } from './Charts/AssetTrendChart';
import { AllocationPieChart } from './Charts/AllocationPieChart';
import { AssetRiverChart } from './Charts/AssetRiverChart';
import { formatMoney } from '../utils/format';
import { playClickSound } from '../utils/audio';

interface IntegratedAssetHubProps {
  labels: string[];
  data: number[];
  currentVal: number;
  portfolio: StockPosition[];
  usdTwdRate: number;
  isPrivacy: boolean;
  isRedUp: boolean;
}

export const IntegratedAssetHub: React.FC<IntegratedAssetHubProps> = ({
  labels,
  data,
  currentVal,
  portfolio,
  usdTwdRate,
  isPrivacy,
  isRedUp,
}) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'river' | 'pie' | 'both'>('both');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="glass-card p-4 sm:p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-4 relative transition-all duration-300">
      {/* Card Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 text-sky-400">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 tracking-wide">
              全資產數據樞紐
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                {formatMoney(currentVal, isPrivacy)}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">整合即時總市值歷史走勢、長期河流圖與個股權重配比</p>
          </div>
        </div>

        {/* View Switcher & Expand/Collapse Toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {isExpanded && (
            <div className="flex items-center gap-1 p-1 bg-slate-950/70 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('trend');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'trend'
                    ? 'bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">即時走勢</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('river');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'river'
                    ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Waves className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">長期河流圖</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('pie');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'pie'
                    ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">資產占比</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('both');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'both'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">雙軌/全景</span>
              </button>
            </div>
          )}

          {/* Expand / Fold Button */}
          <button
            onClick={() => {
              playClickSound();
              setIsExpanded((prev) => !prev);
            }}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-semibold transition flex items-center gap-1.5 ml-auto sm:ml-0 btn-interact"
            title={isExpanded ? '折疊走勢圖表區塊' : '展開走勢圖表區塊'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-sky-400" />
                <span>收合圖力</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-sky-400" />
                <span>展開分析圖表</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Chart Views */}
      {isExpanded && (
        <div className="animate-fadeIn transition-all duration-300">
          {activeTab === 'trend' && (
            <div className="w-full">
              <AssetTrendChart
                labels={labels}
                data={data}
                currentVal={currentVal}
                isPrivacy={isPrivacy}
                isRedUp={isRedUp}
              />
            </div>
          )}

          {activeTab === 'river' && (
            <div className="w-full">
              <AssetRiverChart
                portfolio={portfolio}
                usdTwdRate={usdTwdRate}
                isPrivacy={isPrivacy}
                isRedUp={isRedUp}
              />
            </div>
          )}

          {activeTab === 'pie' && (
            <div className="w-full">
              <AllocationPieChart
                portfolio={portfolio}
                usdTwdRate={usdTwdRate}
                isPrivacy={isPrivacy}
              />
            </div>
          )}

          {activeTab === 'both' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <AssetTrendChart
                  labels={labels}
                  data={data}
                  currentVal={currentVal}
                  isPrivacy={isPrivacy}
                  isRedUp={isRedUp}
                />
                <AllocationPieChart
                  portfolio={portfolio}
                  usdTwdRate={usdTwdRate}
                  isPrivacy={isPrivacy}
                />
              </div>

              {/* Long-Term Asset River Chart */}
              <AssetRiverChart
                portfolio={portfolio}
                usdTwdRate={usdTwdRate}
                isPrivacy={isPrivacy}
                isRedUp={isRedUp}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
