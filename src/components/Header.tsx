import React from 'react';
import {
  Activity,
  Play,
  Pause,
  RefreshCw,
  CloudCog,
  Palette,
  Eye,
  EyeOff,
  Plus,
  Unlock,
  Lock,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface HeaderProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  isRedUp: boolean;
  onToggleTheme: () => void;
  isPrivacy: boolean;
  onTogglePrivacy: () => void;
  isAutoRefreshOn: boolean;
  onToggleAutoRefresh: () => void;
  countdownTimer: number;
  activeRefreshInterval: number;
  onManualRefresh: () => void;
  isFetchingPrices: boolean;
  cloudSyncUrl: string;
  onOpenSyncModal: () => void;
  onOpenAddModal: () => void;
  onOpenAICopilot: () => void;
  onOpenChangelog?: () => void;
  usdTwdRate: number;
  lastUpdateTime: string;
  twMarketOpen: boolean;
  usMarketOpen: boolean;
  quoteSuccessCount: number;
  totalPositionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onToggleAdmin,
  onToggleTheme,
  isPrivacy,
  onTogglePrivacy,
  isAutoRefreshOn,
  onToggleAutoRefresh,
  countdownTimer,
  activeRefreshInterval,
  onManualRefresh,
  isFetchingPrices,
  cloudSyncUrl,
  onOpenSyncModal,
  onOpenAddModal,
  onOpenAICopilot,
  onOpenChangelog,
  usdTwdRate,
  lastUpdateTime,
  twMarketOpen,
  usMarketOpen,
  quoteSuccessCount,
  totalPositionsCount,
}) => {
  const isCloudBound = Boolean(cloudSyncUrl && cloudSyncUrl.includes('script.google.com'));

  return (
    <header className="glass-card flex flex-col gap-3 p-3.5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-[2rem] border border-white/10 shadow-2xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-white/5 pb-3 sm:pb-4">
        <div className="w-full lg:w-auto">
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <h1
              onClick={onToggleAdmin}
              className="cursor-pointer text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 flex items-center gap-2 tracking-tight hover:opacity-80 transition"
              title="點擊切換管理員權限"
            >
              <Activity className="w-5 h-5 sm:w-7 sm:h-7 text-sky-400 animate-pulse" /> 持股監控
            </h1>
            <button
              onClick={onToggleAdmin}
              className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition flex items-center gap-1 shrink-0 ${
                isAdmin
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isAdmin ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span>{isAdmin ? '已解鎖' : '已鎖定'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
            <button
              onClick={() => {
                playClickSound();
                onOpenChangelog?.();
              }}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 font-bold tracking-wider transition flex items-center gap-1.5 btn-interact shadow-[0_0_10px_rgba(56,189,248,0.15)]"
              title="點擊查看系統更新記錄與新功能說明"
            >
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>新功能記錄</span>
            </button>

            {/* TW Market Badge */}
            <span
              className={`text-[10px] px-2 py-1 rounded border font-medium flex items-center transition ${
                twMarketOpen
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700/50 bg-slate-800/80 text-slate-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                  twMarketOpen ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              台股{twMarketOpen ? '盤中' : '收盤'}
            </span>

            {/* US Market Badge */}
            <span
              className={`text-[10px] px-2 py-1 rounded border font-medium flex items-center transition ${
                usMarketOpen
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                  : 'border-slate-700/50 bg-slate-800/80 text-slate-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                  usMarketOpen ? 'bg-blue-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              美股{usMarketOpen ? '盤中' : '收盤'}
            </span>

            {/* Cloud Status Badge */}
            <button
              onClick={() => {
                playClickSound();
                onOpenSyncModal();
              }}
              className={`text-[10px] px-2 py-1 rounded border font-medium flex items-center gap-1.5 transition ${
                isCloudBound
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              {isCloudBound ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
              <span>{isCloudBound ? '雲端已綁定' : '未綁定雲端'}</span>
            </button>

            {/* Time Badge */}
            <span className="text-[10px] px-2 py-1 rounded border border-slate-700/50 bg-slate-800/80 text-slate-400 font-medium flex items-center gap-1.5 transition">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>{lastUpdateTime || '等待更新...'}</span>
            </span>

            {/* Quote Status Badge */}
            {totalPositionsCount > 0 && (
              <span
                className={`text-[10px] px-2 py-1 rounded border font-medium flex items-center gap-1.5 ${
                  quoteSuccessCount === totalPositionsCount
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                }`}
              >
                {quoteSuccessCount === totalPositionsCount ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>
                  {quoteSuccessCount}/{totalPositionsCount} 檔成功
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Exchange Rate Badge */}
        <div className="flex items-center gap-2 bg-black/40 px-4 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xs text-slate-400 font-semibold tracking-wide">USD/TWD</span>
          <span className="text-amber-400 font-mono font-bold text-base tracking-wider tabular-nums">
            {usdTwdRate > 0 ? usdTwdRate.toFixed(2) : '31.50'}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-start">
        {/* Auto refresh button */}
        <button
          onClick={() => {
            playClickSound();
            onToggleAutoRefresh();
          }}
          className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 btn-interact ${
            isAutoRefreshOn
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-white/5'
          }`}
        >
          {isAutoRefreshOn ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span className="w-16 text-left font-mono tabular-nums">
            {isAutoRefreshOn
              ? `${activeRefreshInterval === 15 ? '盤中' : '開'} ${countdownTimer}s`
              : '暫停'}
          </span>
        </button>

        {/* Refresh button */}
        <button
          onClick={() => {
            playClickSound();
            onManualRefresh();
          }}
          className="min-h-[40px] bg-slate-800/80 hover:bg-slate-700 text-white border border-white/5 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 btn-interact"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isFetchingPrices ? 'animate-spin' : ''}`} />
          <span>手動刷新</span>
        </button>

        {/* AI Copilot Button */}
        <button
          onClick={() => {
            playClickSound();
            onOpenAICopilot();
          }}
          className="min-h-[40px] bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-300 border border-purple-500/40 hover:from-purple-600/50 hover:to-indigo-600/50 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 btn-interact shadow-[0_0_15px_rgba(168,85,247,0.25)]"
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>AI 戰情顧問</span>
        </button>

        {/* Sync Modal Button */}
        <button
          onClick={() => {
            playClickSound();
            if (!isAdmin) {
              onToggleAdmin();
            } else {
              onOpenSyncModal();
            }
          }}
          className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 btn-interact ${
            isAdmin
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
              : 'bg-slate-800/80 text-slate-400 border border-white/5 hover:bg-slate-700'
          }`}
          title={isAdmin ? "管理雲端同步設定" : "【鎖定中】點擊輸入密碼解鎖後即可進入雲端金鑰同步設定"}
        >
          <CloudCog className="w-3.5 h-3.5" />
          <span>同步設定</span>
          {!isAdmin && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={() => {
            playClickSound();
            onToggleTheme();
          }}
          className="min-h-[40px] bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/5 px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 btn-interact"
          title="切換紅漲綠跌 / 綠漲紅跌"
        >
          <Palette className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Privacy Mode Toggle */}
        <button
          onClick={() => {
            playClickSound();
            onTogglePrivacy();
          }}
          className="min-h-[40px] bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/5 px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 btn-interact"
          title="隱私遮蔽模式"
        >
          {isPrivacy ? (
            <EyeOff className="w-4 h-4 text-rose-400" />
          ) : (
            <Eye className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Add Position Button - Always Unlocked for Local Use */}
        <button
          onClick={() => {
            playClickSound();
            onOpenAddModal();
          }}
          className="min-h-[40px] w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 btn-interact shadow-[0_0_15px_rgba(16,185,129,0.3)] sm:ml-auto"
          title="新增持股部位"
        >
          <Plus className="w-4 h-4" />
          <span>新增部位</span>
        </button>
      </div>
    </header>
  );
};
