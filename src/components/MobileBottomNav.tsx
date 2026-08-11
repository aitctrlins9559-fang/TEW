import React from 'react';
import { LayoutDashboard, PieChart, TrendingUp, Sparkles, Plus, RefreshCw } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface MobileBottomNavProps {
  activeTab: 'all' | 'overview' | 'portfolio' | 'charts' | 'ai';
  onSelectTab: (tab: 'all' | 'overview' | 'portfolio' | 'charts' | 'ai') => void;
  onOpenAddModal: () => void;
  onOpenAICopilot: () => void;
  onManualRefresh: () => void;
  isFetchingPrices: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  onOpenAICopilot,
  onManualRefresh,
  isFetchingPrices,
}) => {
  return (
    <>
      {/* Mobile Floating Quick Refresh & Add FAB */}
      <div className="fixed bottom-20 right-4 lg:hidden z-40 flex flex-col gap-2.5 items-center">
        <button
          onClick={() => {
            playClickSound();
            onManualRefresh();
          }}
          className="w-11 h-11 rounded-full bg-slate-900/90 text-sky-400 border border-sky-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-center btn-interact active:scale-90 transition"
          title="重新整理報價"
        >
          <RefreshCw className={`w-5 h-5 ${isFetchingPrices ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => {
            playClickSound();
            onOpenAddModal();
          }}
          className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-[0_8px_25px_rgba(16,185,129,0.5)] flex items-center justify-center btn-interact active:scale-90 transition"
          title="新增部位"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 z-50 px-2 py-2 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-5 items-center max-w-md mx-auto">
          {/* Tab 1: Overview */}
          <button
            onClick={() => {
              playClickSound();
              onSelectTab('overview');
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition ${
              activeTab === 'overview' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">戰情總覽</span>
          </button>

          {/* Tab 2: Portfolio */}
          <button
            onClick={() => {
              playClickSound();
              onSelectTab('portfolio');
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition ${
              activeTab === 'portfolio' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[10px]">持股明細</span>
          </button>

          {/* Tab 3: All View */}
          <button
            onClick={() => {
              playClickSound();
              onSelectTab('all');
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition ${
              activeTab === 'all' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
              activeTab === 'all' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border border-white/5'
            }`}>
              <span className="text-xs font-mono font-bold">全</span>
            </div>
            <span className="text-[9px]">完整主頁</span>
          </button>

          {/* Tab 4: Analytics */}
          <button
            onClick={() => {
              playClickSound();
              onSelectTab('charts');
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition ${
              activeTab === 'charts' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px]">資產分析</span>
          </button>

          {/* Tab 5: AI Copilot */}
          <button
            onClick={() => {
              playClickSound();
              onSelectTab('ai');
              onOpenAICopilot();
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition ${
              activeTab === 'ai' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-[10px] text-purple-300 font-semibold">AI 顧問</span>
          </button>
        </div>
      </nav>
    </>
  );
};
