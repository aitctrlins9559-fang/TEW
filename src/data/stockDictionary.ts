import { MarketType } from '../types';

export interface StockDictItem {
  symbol: string;
  name: string;
  market: MarketType;
}

export const BUILTIN_STOCK_DICTIONARY: StockDictItem[] = [
  // Taiwan ETFs & Major Stocks (TSE)
  { symbol: '0050', name: '元大台灣50', market: 'tse' },
  { symbol: '0056', name: '元大高股息', market: 'tse' },
  { symbol: '00878', name: '國泰永續高股息', market: 'tse' },
  { symbol: '00919', name: '群益台灣精選高息', market: 'tse' },
  { symbol: '00929', name: '復華台灣科技優息', market: 'tse' },
  { symbol: '00940', name: '元大台灣價值高息', market: 'tse' },
  { symbol: '2330', name: '台積電', market: 'tse' },
  { symbol: '2317', name: '鴻海', market: 'tse' },
  { symbol: '2454', name: '聯發科', market: 'tse' },
  { symbol: '2308', name: '台達電', market: 'tse' },
  { symbol: '2382', name: '廣達', market: 'tse' },
  { symbol: '3231', name: '緯創', market: 'tse' },
  { symbol: '2376', name: '技嘉', market: 'tse' },
  { symbol: '6691', name: '洋基工程', market: 'tse' },
  { symbol: '6944', name: '兆聯實業', market: 'tse' },
  { symbol: '2603', name: '長榮', market: 'tse' },
  { symbol: '2609', name: '陽明', market: 'tse' },
  { symbol: '2615', name: '萬海', market: 'tse' },
  { symbol: '2881', name: '富邦金', market: 'tse' },
  { symbol: '2882', name: '國泰金', market: 'tse' },
  { symbol: '2891', name: '中信金', market: 'tse' },
  { symbol: '2886', name: '兆豐金', market: 'tse' },

  // Taiwan OTC (上櫃)
  { symbol: '6488', name: '環球晶', market: 'otc' },
  { symbol: '8299', name: '群聯', market: 'otc' },
  { symbol: '3293', name: '鈊象', market: 'otc' },
  { symbol: '5274', name: '信驊', market: 'otc' },
  { symbol: '3529', name: '力旺', market: 'otc' },

  // US Tech Giants & ETFs (US)
  { symbol: 'NVDA', name: 'NVIDIA 輝達', market: 'us' },
  { symbol: 'TSM', name: '台積電 ADR', market: 'us' },
  { symbol: 'AAPL', name: 'Apple 蘋果', market: 'us' },
  { symbol: 'MSFT', name: 'Microsoft 微軟', market: 'us' },
  { symbol: 'GOOGL', name: 'Alphabet 谷歌', market: 'us' },
  { symbol: 'AMZN', name: 'Amazon 亞馬遜', market: 'us' },
  { symbol: 'META', name: 'Meta', market: 'us' },
  { symbol: 'TSLA', name: 'Tesla 特斯拉', market: 'us' },
  { symbol: 'AMD', name: 'AMD 超微', market: 'us' },
  { symbol: 'AVGO', name: 'Broadcom 博通', market: 'us' },
  { symbol: 'PLTR', name: 'Palantir', market: 'us' },
  { symbol: 'QQQ', name: 'Invesco QQQ ETF', market: 'us' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', market: 'us' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', market: 'us' },
  { symbol: 'VT', name: 'Vanguard Total World ETF', market: 'us' },
  { symbol: 'SOXX', name: 'iShares 半導體 ETF', market: 'us' },
];
