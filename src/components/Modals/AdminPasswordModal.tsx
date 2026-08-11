import React, { useState } from 'react';
import { Lock, Unlock, Key, X, Check } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface AdminPasswordModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  onUnlock: (password: string) => void;
  onLock: () => void;
  onClose: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  isAdmin,
  onUnlock,
  onLock,
  onClose,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMsg('請輸入金鑰密碼');
      return;
    }
    playClickSound();
    onUnlock(passwordInput.trim());
    setPasswordInput('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-slate-900/80">
          <div className="flex items-center gap-2.5 font-bold text-base text-white">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <span>{isAdmin ? '管理員身分（已解鎖）' : '解鎖管理員權限'}</span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isAdmin ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-300">
              目前系統處於<strong className="text-emerald-400">【解鎖狀態】</strong>，您可以直接編輯部位、備份、或修改雲端同步設定。
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onLock();
                  onClose();
                }}
                className="w-full min-h-[44px] py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>鎖定管理員身分</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              請輸入管理員解鎖密碼，以開啟進階權限（包含雲端金鑰綁定與完整資料導出權限）。
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>解鎖密碼</span>
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="請輸入密碼 (預設可任意輸入)"
                autoFocus
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
              />
              {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-white/5"
              >
                取消
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                <Unlock className="w-4 h-4" />
                <span>立即解鎖</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
