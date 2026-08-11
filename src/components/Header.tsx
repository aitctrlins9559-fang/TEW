import React, { useState, useRef, useEffect } from 'react';
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
  Settings,
  ChevronDown,
  FileText,
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
  isRedUp,
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
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close tools menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="glass-card flex flex-col gap-3.5 p-3.5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-[2rem] border border-white/10 shadow-2xl relative z-40 overflow-visible">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-white/5 pb-3.5">
        <div className="w-full lg:w-auto">
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <h1
              onClick={onToggleAdmin}
              className="cursor-pointer text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 flex items-center gap-2 tracking-tight hover:opacity-80 transition"
              title="點擊切換管理員解鎖身分"
            >
              <Activity className="w-5 h-5 sm:w-7 sm:h-7 text-sky-400 animate-pulse" /> 持股監控雷達
            </h1>
            <button
              onClick={() => {
                playClickSound();
                onToggleAdmin();
              }}
              className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono transition flex items-center gap-1.5 shrink-0 ${
                isAdmin
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700/80 hover:text-slate-200'
              }`}
              title={isAdmin ? "管理員身分：已解鎖" : "點擊輸入密碼解鎖管理員身分"}
            >
              {isAdmin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isAdmin ? '管理員權限' : '未解鎖'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
            {/* TW Market Badge */}
            <span
              className={`text-[10px] px-2 py-1 rounded-lg border font-medium flex items-center transition ${
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
              className={`text-[10px] px-2 py-1 rounded-lg border font-medium flex items-center transition ${
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
                if (!isAdmin) {
                  onToggleAdmin();
                } else {
                  onOpenSyncModal();
                }
              }}
              className={`text-[10px] px-2 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition ${
                isCloudBound
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              {isCloudBound ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
              <span>{isCloudBound ? '雲端已綁定' : '未綁定雲端'}</span>
            </button>

            {/* Time Badge */}
            <span className="text-[10px] px-2 py-1 rounded-lg border border-slate-700/50 bg-slate-800/80 text-slate-400 font-medium flex items-center gap-1.5 transition">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>{lastUpdateTime || '等待更新...'}</span>
            </span>

            {/* Quote Status Badge */}
            {totalPositionsCount > 0 && (
              <span
                className={`text-[10px] px-2 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
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
        <div className="flex items-center gap-2 bg-black/40 px-4 py-3 rounded-2xl border border-white/5 shadow-inner">
          <span className="text-xs text-slate-400 font-semibold tracking-wide">USD/TWD</span>
          <span className="text-amber-400 font-mono font-bold text-base tracking-wider tabular-nums">
            {usdTwdRate > 0 ? usdTwdRate.toFixed(2) : '31.50'}
          </span>
        </div>
      </div>

      {/* Control Buttons Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 justify-start">
        {/* Primary Action 1: Add Position */}
        <button
          onClick={() => {
            playClickSound();
            onOpenAddModal();
          }}
          className="min-h-[42px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 btn-interact shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          title="新增持股部位"
        >
          <Plus className="w-4 h-4" />
          <span>新增部位</span>
        </button>

        {/* Primary Action 2: AI Copilot */}
        <button
          onClick={() => {
            playClickSound();
            onOpenAICopilot();
          }}
          className="min-h-[42px] bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-300 border border-purple-500/40 hover:from-purple-600/50 hover:to-indigo-600/50 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 btn-interact shadow-[0_0_15px_rgba(168,85,247,0.25)]"
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>AI 戰情顧問</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={() => {
            playClickSound();
            onManualRefresh();
          }}
          className="min-h-[42px] bg-slate-800/80 hover:bg-slate-700 text-white border border-white/10 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 btn-interact"
          title="立即重新抓取最新台美股即時報價"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isFetchingPrices ? 'animate-spin' : ''}`} />
          <span>手動刷新</span>
        </button>

        {/* Auto Refresh Toggle */}
        <button
          onClick={() => {
            playClickSound();
            onToggleAutoRefresh();
          }}
          className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 btn-interact ${
            isAutoRefreshOn
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-white/10'
          }`}
          title="切換自動定時刷報價"
        >
          {isAutoRefreshOn ? <Play className="w-3.5 h-3.5 text-sky-400" /> : <Pause className="w-3.5 h-3.5" />}
          <span className="font-mono tabular-nums">
            {isAutoRefreshOn
              ? `${activeRefreshInterval === 15 ? '盤中' : '自動'} ${countdownTimer}s`
              : '自動刷新關閉'}
          </span>
        </button>

        {/* Interactive Interactive Tools Menu Dropdown */}
        <div className="relative ml-auto" ref={toolsMenuRef}>
          <button
            onClick={() => {
              playClickSound();
              setIsToolsOpen((prev) => !prev);
            }}
            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border btn-interact ${
              isToolsOpen
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-white/10'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>偏好與工具箱</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu Panel */}
          {isToolsOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-2 z-[100] animate-scaleUp space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">
                顯示與偏好設定
              </div>

              {/* Privacy Mode Toggle Option */}
              <button
                onClick={() => {
                  playClickSound();
                  onTogglePrivacy();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-xs text-slate-200 transition"
              >
                <div className="flex items-center gap-2">
                  {isPrivacy ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  <span>隱私金錢遮蔽</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isPrivacy ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'}`}>
                  {isPrivacy ? '開啟' : '關閉'}
                </span>
              </button>

              {/* Theme Color Switch Option */}
              <button
                onClick={() => {
                  playClickSound();
                  onToggleTheme();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-xs text-slate-200 transition"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <span>漲跌色彩慣例</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {isRedUp ? '紅漲綠跌(台)' : '綠漲紅跌(美)'}
                </span>
              </button>

              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-b border-white/5 mt-1">
                管理與同步工具
              </div>

              {/* Sync Modal Option */}
              <button
                onClick={() => {
                  playClickSound();
                  setIsToolsOpen(false);
                  if (!isAdmin) {
                    onToggleAdmin();
                  } else {
                    onOpenSyncModal();
                  }
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-xs text-slate-200 transition"
              >
                <div className="flex items-center gap-2">
                  <CloudCog className="w-4 h-4 text-sky-400" />
                  <span>雲端 Google Sheet 同步</span>
                </div>
                {!isAdmin && <Lock className="w-3 h-3 text-amber-400" />}
              </button>

              {/* Admin Unlock Option */}
              <button
                onClick={() => {
                  playClickSound();
                  setIsToolsOpen(false);
                  onToggleAdmin();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-xs text-slate-200 transition"
              >
                <div className="flex items-center gap-2">
                  {isAdmin ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-slate-400" />}
                  <span>管理員解鎖密碼</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isAdmin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {isAdmin ? '已解鎖' : '已鎖定'}
                </span>
              </button>

              {/* Changelog Option */}
              {onOpenChangelog && (
                <button
                  onClick={() => {
                    playClickSound();
                    setIsToolsOpen(false);
                    onOpenChangelog();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-xs text-slate-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>系統版本更新日誌</span>
                  </div>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

