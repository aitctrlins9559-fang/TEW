import React from 'react';
import { Terminal, Activity, CheckCircle2, ShieldAlert, Lock, Wifi } from 'lucide-react';
import { ApiHealthStatus, ApiStatusItem } from '../types';
import { playClickSound } from '../utils/audio';

interface ApiDebugPanelProps {
  apiHealth: ApiHealthStatus;
  lastSyncTime: string;
  quoteSuccessCount: number;
  totalCount: number;
  lastCloudWriteTime: string;
  onRunDiagnostics: () => void;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

export const ApiDebugPanel: React.FC<ApiDebugPanelProps> = ({
  apiHealth,
  lastSyncTime,
  quoteSuccessCount,
  totalCount,
  lastCloudWriteTime,
  onRunDiagnostics,
  isAdmin = true,
  onToggleAdmin,
}) => {
  const items: ApiStatusItem[] = [
    apiHealth.cloud,
    apiHealth.yahoo,
    apiHealth.twse,
    apiHealth.tpex,
    apiHealth.search,
    apiHealth.fx,
  ];

  let hasError = false;
  const errors: string[] = [];

  items.forEach((api) => {
    if (api.status === 'ERROR') {
      hasError = true;
      errors.push(`${api.name}: ${api.error || '不明錯誤'}`);
    }
  });

  // When NOT in Admin Mode, show a clean, simple connection status bar
  if (!isAdmin) {
    return (
      <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Wifi className="w-4 h-4" /> API 連線狀態：正常運作中
          </div>

          <div className="text-slate-300 font-mono flex items-center gap-3">
            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
              📊 報價成功率: <strong className="text-emerald-400">{quoteSuccessCount}/{totalCount}</strong> 檔
            </span>
            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
              ⏱️ 最後同步: <strong className="text-sky-400">{lastSyncTime || '已更新'}</strong>
            </span>
          </div>
        </div>

        {onToggleAdmin && (
          <button
            onClick={() => {
              playClickSound();
              onToggleAdmin();
            }}
            className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 btn-interact shrink-0 ml-auto md:ml-0"
            title="輸入管理員密碼解鎖完整 API 診斷台與雲端網址"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>解鎖完整診斷 Console</span>
          </button>
        )}
      </div>
    );
  }

  // Full Admin Debug Console
  return (
    <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 space-y-4 shadow-2xl">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
          <Terminal className="w-4 h-4" /> API Debug Console (戰情診斷中心)
        </div>
        <button
          onClick={() => {
            playClickSound();
            onRunDiagnostics();
          }}
          className="text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition btn-interact flex items-center gap-1.5"
        >
          <Activity className="w-3.5 h-3.5" /> 執行診斷測試
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
        {items.map((api, idx) => {
          const isOk = api.status === 'OK';
          const isDis = api.status === 'DISABLED';
          const colorClass = isOk
            ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
            : isDis
            ? 'text-slate-400 border-slate-500/20 bg-slate-500/5'
            : 'text-rose-400 border-rose-500/20 bg-rose-500/5';

          return (
            <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${colorClass}`}>
              <span>● {api.name}</span>
              <span className="font-bold">
                {api.status} <span className="text-[10px] text-slate-400 font-normal">({api.ms}ms)</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2 text-xs font-mono">
        <div className="flex flex-wrap justify-between text-slate-400 border-b border-white/5 pb-2 gap-2">
          <span>
            最後同步時間: <strong className="text-white">{lastSyncTime || '--'}</strong>
          </span>
          <span>
            股票報價成功率:{' '}
            <strong className="text-emerald-400">
              {quoteSuccessCount} / {totalCount} 成功
            </strong>
          </span>
          <span>
            雲端最後寫入: <strong className="text-indigo-400">{lastCloudWriteTime || '--'}</strong>
          </span>
        </div>

        {hasError && (
          <div className="text-rose-400 pt-1 space-y-1">
            {errors.map((err, i) => (
              <div key={i}>❌ {err}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
