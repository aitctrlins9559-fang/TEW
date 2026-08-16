import React from 'react';
import { X, TrendingUp } from 'lucide-react';
import { StockPosition } from '../../types';
import { AssetTrendChart } from '../Charts/AssetTrendChart';
import { AllocationPieChart } from '../Charts/AllocationPieChart';
import { AssetRiverChart } from '../Charts/AssetRiverChart';
import { playClickSound } from '../../utils/audio';

interface AssetAnalysisModalProps {
  isOpen: boolean;
  portfolio: StockPosition[];
  usdTwdRate: number;
  isPrivacy: boolean;
  isRedUp: boolean;
  labels: string[];
  data: number[];
  currentVal: number;
  onClose: () => void;
}

export const AssetAnalysisModal: React.FC<AssetAnalysisModalProps> = ({
  isOpen,
  portfolio,
  usdTwdRate,
  isPrivacy,
  isRedUp,
  labels,
  data,
  currentVal,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5 font-black text-lg text-white">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span>資產總市值走勢、長期河流圖與比重配置</span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
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
      </div>
    </div>
  );
};
