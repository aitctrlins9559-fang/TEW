import React, { useState, useEffect } from 'react';
import { CloudCog, X } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface SyncModalProps {
  isOpen: boolean;
  currentSyncUrl: string;
  onClose: () => void;
  onSaveSyncUrl: (url: string) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  currentSyncUrl,
  onClose,
  onSaveSyncUrl,
}) => {
  const [inputUrl, setInputUrl] = useState('');

  useEffect(() => {
    setInputUrl(currentSyncUrl);
  }, [currentSyncUrl, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-5 border border-white/10">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2.5">
            <CloudCog className="w-5 h-5" /> 雲端同步設定
          </h3>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-full transition btn-interact"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium tracking-wide">
              Google Apps Script 部署網址 (Web App URL)
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full glass-input rounded-xl px-4 py-3 text-white font-mono text-xs outline-none"
            />
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              請貼上部署好的 Google Apps Script Web App 網址。<br />
              在任何裝置輸入相同網址，即可隨時跨裝置無縫同步持股資料。
            </p>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="w-1/3 glass-input hover:bg-slate-800 text-slate-300 py-3 rounded-xl font-medium text-sm transition btn-interact"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveSyncUrl(inputUrl.trim());
              }}
              className="w-2/3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold text-sm transition shadow-[0_0_15px_rgba(99,102,241,0.3)] btn-interact"
            >
              儲存並載入雲端資料
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
