import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Search, Loader2, Target, X } from 'lucide-react';
import { StockPosition, MarketType } from '../../types';
import { BUILTIN_STOCK_DICTIONARY } from '../../data/stockDictionary';
import { playClickSound } from '../../utils/audio';

interface StockModalProps {
  isOpen: boolean;
  editStock: StockPosition | null;
  usdTwdRate: number;
  onClose: () => void;
  onSave: (stockData: {
    editId: string;
    symbol: string;
    name: string;
    market: MarketType;
    shares: number;
    cost: number;
    buyDate: string;
    buyRate: number;
  }) => void;
}

export const StockModal: React.FC<StockModalProps> = ({
  isOpen,
  editStock,
  usdTwdRate,
  onClose,
  onSave,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [market, setMarket] = useState<MarketType>('tse');
  const [shares, setShares] = useState('');
  const [cost, setCost] = useState('');
  const [buyDate, setBuyDate] = useState('');
  const [buyRate, setBuyRate] = useState('');
  const [livePrice, setLivePrice] = useState<string>('--');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string; market: MarketType }>>([]);
  const [showResults, setShowResults] = useState(false);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editStock) {
      setSymbol(editStock.symbol);
      setName(editStock.name);
      setMarket(editStock.market);
      setShares(String(editStock.shares));
      setCost(String(editStock.cost));
      setBuyDate(editStock.buyDate || new Date().toISOString().slice(0, 10));
      setBuyRate(String(editStock.buyRate || usdTwdRate));
      setSearchInput(`${editStock.symbol} ${editStock.name}`);
    } else {
      setSymbol('');
      setName('');
      setMarket('tse');
      setShares('');
      setCost('');
      setBuyDate(new Date().toISOString().slice(0, 10));
      setBuyRate(String(usdTwdRate || 31.5));
      setSearchInput('');
      setLivePrice('--');
    }
  }, [editStock, usdTwdRate, isOpen]);

  const fetchLivePreview = async (sym: string, mkt: MarketType) => {
    if (!sym) return;
    setLivePrice('查詢中...');
    try {
      const s = mkt === 'tse' ? `${sym}.TW` : mkt === 'otc' ? `${sym}.TWO` : sym;
      const res = await fetch(`/api/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: [s] }),
      });
      const data = await res.json();
      const q = data?.results?.[0];
      if (q && typeof q.regularMarketPrice === 'number') {
        setLivePrice(`$${q.regularMarketPrice} ${mkt === 'us' ? 'USD' : 'NT$'}`);
      } else {
        setLivePrice('無即時報價');
      }
    } catch {
      setLivePrice('查詢逾時');
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (!val.trim()) {
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(async () => {
      const q = val.toLowerCase();
      const localMatches = BUILTIN_STOCK_DICTIONARY.filter(
        (item) => item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
      );

      if (localMatches.length > 0) {
        setSearchResults(localMatches.slice(0, 8));
        setIsSearching(false);
      } else {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.results)) {
            setSearchResults(data.results.slice(0, 8));
          } else {
            setSearchResults([]);
          }
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }
    }, 200);
  };

  const selectSuggestion = (sSymbol: string, sName: string, sMarket: MarketType) => {
    playClickSound();
    setSymbol(sSymbol);
    setName(sName);
    setMarket(sMarket);
    setSearchInput(`${sSymbol} | ${sName}`);
    setShowResults(false);
    fetchLivePreview(sSymbol, sMarket);
  };

  const costNum = parseFloat(cost) || 0;
  const currency = market === 'us' ? 'USD' : 'NT$';
  const tpPrice = costNum > 0 ? `$${(costNum * 1.1).toFixed(2)} ${currency}` : '--';
  const slPrice = costNum > 0 ? `$${(costNum * 0.95).toFixed(2)} ${currency}` : '--';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      editId: editStock ? editStock.id : '',
      symbol: symbol.trim().toUpperCase(),
      name: name.trim(),
      market,
      shares: Number(shares),
      cost: Number(cost),
      buyDate: buyDate || new Date().toISOString().slice(0, 10),
      buyRate: market === 'us' ? Number(buyRate) || usdTwdRate : 1,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-sky-400" />
            {editStock ? '編輯監控部位' : '新增監控部位'}
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

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Search Input */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-300 font-semibold text-xs tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-sky-400" /> 智慧搜尋標的 (台美股) *
              </label>
              {isSearching && (
                <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> 搜尋中
                </span>
              )}
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="例如: 台積電 / 2330 / NVDA / 兆聯實業"
              className="w-full glass-input rounded-xl px-4 py-3 text-white font-medium outline-none text-sm"
            />

            {/* Auto-complete Dropdown */}
            {showResults && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-800/95 border border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-white/5 backdrop-blur-xl">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">
                    找不到符合標的。可直接手動輸入代號與名稱。
                  </div>
                ) : (
                  searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSuggestion(item.symbol, item.name, item.market)}
                      className="w-full text-left p-3.5 hover:bg-white/5 cursor-pointer flex justify-between items-center text-sm transition"
                    >
                      <div>
                        <span className="font-bold text-white mr-3">{item.name}</span>
                        <span className="text-sky-400 font-mono font-bold">{item.symbol}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {item.market === 'us' ? '美股' : item.market === 'otc' ? '上櫃' : '上市'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Live Price Reference */}
          <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-white/5 space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                即時參考價:{' '}
                <strong className="text-white font-mono tabular-nums text-sm tracking-wide">
                  {livePrice}
                </strong>
              </span>
              <span className="text-slate-400 font-medium">
                當前匯率:{' '}
                <strong className="text-amber-400 font-mono tabular-nums text-sm tracking-wide">
                  {usdTwdRate.toFixed(2)}
                </strong>
              </span>
            </div>
          </div>

          {/* Market, Symbol, Name Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-900/30 p-4 rounded-2xl border border-white/5">
            <div>
              <label className="block text-slate-400 mb-1.5">市場類別</label>
              <select
                value={market}
                onChange={(e) => {
                  playClickSound();
                  const m = e.target.value as MarketType;
                  setMarket(m);
                  fetchLivePreview(symbol, m);
                }}
                className="w-full glass-input rounded-lg px-3 py-2.5 text-sky-400 font-bold outline-none cursor-pointer"
              >
                <option value="tse">台股上市</option>
                <option value="otc">台股上櫃</option>
                <option value="us">美股</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5">股票代號</label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => {
                  const s = e.target.value.toUpperCase();
                  setSymbol(s);
                  fetchLivePreview(s, market);
                }}
                placeholder="代號"
                className="w-full glass-input rounded-lg px-3 py-2.5 text-white font-bold uppercase outline-none tracking-wider"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5">股票名稱</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="名稱"
                className="w-full glass-input rounded-lg px-3 py-2.5 text-white font-medium outline-none"
              />
            </div>
          </div>

          {/* Shares, Cost, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1.5 text-xs">持有股數 *</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                required
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="填寫股數"
                className="w-full glass-input rounded-xl px-4 py-3 text-white outline-none text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 text-xs">
                買入均價 * <span className="text-[10px] text-amber-400">(配股填0)</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="買入成本"
                className="w-full glass-input rounded-xl px-4 py-3 text-white outline-none text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 text-xs">買入日期</label>
              <input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 text-white outline-none text-sm font-mono tabular-nums"
              />
            </div>
          </div>

          {/* US Buy Rate Input */}
          {market === 'us' && (
            <div>
              <label className="block text-amber-400/90 mb-1.5 text-xs font-medium">
                買入當時匯率 (USD/TWD) *
              </label>
              <input
                type="number"
                step="0.01"
                value={buyRate}
                onChange={(e) => setBuyRate(e.target.value)}
                placeholder="例如: 32.15"
                className="w-full bg-amber-900/10 border border-amber-500/20 text-amber-300 rounded-xl px-4 py-3 outline-none text-sm font-mono tabular-nums"
              />
            </div>
          )}

          {/* Risk Control Estimations */}
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
            <div className="text-sky-400 font-semibold flex items-center gap-1.5">
              <Target className="w-4 h-4" /> 風控估算價 (估算)
            </div>
            <div className="flex justify-between items-center bg-slate-950/50 px-3 py-2 rounded-lg">
              <span className="text-slate-400 font-medium">停利 Target (+10%)</span>
              <strong className="text-emerald-400 font-mono tabular-nums text-sm">{tpPrice}</strong>
            </div>
            <div className="flex justify-between items-center bg-slate-950/50 px-3 py-2 rounded-lg">
              <span className="text-slate-400 font-medium">停損 Stop-Loss (-5%)</span>
              <strong className="text-rose-400 font-mono tabular-nums text-sm">{slPrice}</strong>
            </div>
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
              type="submit"
              className="w-2/3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold text-sm transition shadow-[0_0_15px_rgba(56,189,248,0.3)] btn-interact"
            >
              確認儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
