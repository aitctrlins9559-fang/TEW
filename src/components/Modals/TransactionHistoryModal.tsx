import React, { useState } from 'react';
import { History, PlusCircle, X } from 'lucide-react';
import { StockPosition } from '../../types';
import { getTaiwanDateString } from '../../utils/format';
import { playClickSound } from '../../utils/audio';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  stock: StockPosition | null;
  isAdmin: boolean;
  usdTwdRate: number;
  onClose: () => void;
  onAddTransaction: (stockId: string, buyDate: string, shares: number, cost: number) => void;
  onDeleteTransaction: (stockId: string, txId: string) => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  stock,
  isAdmin,
  usdTwdRate,
  onClose,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [addDate, setAddDate] = useState(getTaiwanDateString());
  const [addShares, setAddShares] = useState('');
  const [addCost, setAddCost] = useState('');

  if (!isOpen || !stock) return null;

  const isUS = stock.market === 'us';

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sNum = Number(addShares);
    const cNum = Number(addCost);
    if (sNum <= 0 || cNum < 0) return;

    onAddTransaction(stock.id, addDate || getTaiwanDateString(), sNum, cNum);
    setAddShares('');
    setAddCost('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[65] flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
              <History className="w-5 h-5" /> {stock.name} ({stock.symbol}) 買入歷程
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              總持股：{stock.shares.toLocaleString()} 股 ｜ 加權平均成本：
              {isUS ? `$${stock.cost} USD` : `$${stock.cost} NT$`} ｜ 扣款筆數：
              {stock.transactions.length} 筆
            </p>
          </div>
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

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="uppercase bg-black/40 text-slate-400 font-semibold border-b border-white/5">
              <tr>
                <th className="py-3 px-4">買入日期</th>
                <th className="py-3 px-4">買入股數</th>
                <th className="py-3 px-4">單價 (均價)</th>
                <th className="py-3 px-4">匯率</th>
                <th className="py-3 px-4">小計 (NT$)</th>
                <th className="py-3 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {stock.transactions.map((tx) => {
                const fx = isUS ? tx.buyRate || usdTwdRate : 1;
                const subtotal = tx.shares * tx.cost * fx;

                return (
                  <tr key={tx.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4">{tx.buyDate || '未記錄'}</td>
                    <td className="py-3 px-4">{tx.shares.toLocaleString()} 股</td>
                    <td className="py-3 px-4">{isUS ? `$${tx.cost} USD` : `$${tx.cost}`}</td>
                    <td className="py-3 px-4">{isUS ? tx.buyRate || usdTwdRate : '1.0'}</td>
                    <td className="py-3 px-4 font-bold text-white">
                      ${Math.round(subtotal).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteTransaction(stock.id, tx.id)}
                        className="text-rose-400 hover:text-rose-300 font-sans text-xs bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded hover:bg-rose-500/20 transition"
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

        {/* Add DCA Transaction Form */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-sky-500/20 space-y-3">
            <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" /> 快速新增定期定額 / 買入記錄
            </div>
            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">日期</label>
                <input
                  type="date"
                  required
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">股數</label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  placeholder="股數"
                  value={addShares}
                  onChange={(e) => setAddShares(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-white outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">買入單價</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="單價"
                  value={addCost}
                  onChange={(e) => setAddCost(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-white outline-none font-mono"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-lg transition btn-interact"
                >
                  新增此筆
                </button>
              </div>
            </form>
          </div>
      </div>
    </div>
  );
};
