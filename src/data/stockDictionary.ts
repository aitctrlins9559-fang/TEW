import { MarketType } from '../types';

export interface StockDictItem {
  symbol: string;
  name: string;
  market: MarketType;
}

export const BUILTIN_STOCK_DICTIONARY: StockDictItem[] = [
  // === 台灣熱門 ETF ===
  { symbol: '0050', name: '元大台灣50', market: 'tse' },
  { symbol: '0056', name: '元大高股息', market: 'tse' },
  { symbol: '00878', name: '國泰永續高股息', market: 'tse' },
  { symbol: '00919', name: '群益台灣精選高息', market: 'tse' },
  { symbol: '00929', name: '復華台灣科技優息', market: 'tse' },
  { symbol: '00940', name: '元大台灣價值高息', market: 'tse' },
  { symbol: '006208', name: '富邦台50', market: 'tse' },
  { symbol: '00713', name: '元大台灣高息低波', market: 'tse' },
  { symbol: '00939', name: '統一台灣高息動能', market: 'tse' },
  { symbol: '00941', name: '中信上游半導體', market: 'tse' },
  { symbol: '00923', name: '群益台ESG低碳50', market: 'tse' },
  { symbol: '00891', name: '中信關鍵半導體', market: 'tse' },
  { symbol: '00881', name: '國泰台灣5G+', market: 'tse' },
  { symbol: '00900', name: '富邦特選高股息30', market: 'tse' },
  { symbol: '00915', name: '凱基優選高股息30', market: 'tse' },
  { symbol: '00918', name: '大華優利高股息30', market: 'tse' },
  { symbol: '00934', name: '中信成長高股息', market: 'tse' },
  { symbol: '00936', name: '台新永續高息中小', market: 'tse' },
  { symbol: '00632R', name: '元大台灣50反1', market: 'tse' },

  // === 台股權值股與半導體/AI概念股 (上市 TSE) ===
  { symbol: '2330', name: '台積電', market: 'tse' },
  { symbol: '2317', name: '鴻海', market: 'tse' },
  { symbol: '2454', name: '聯發科', market: 'tse' },
  { symbol: '2308', name: '台達電', market: 'tse' },
  { symbol: '2382', name: '廣達', market: 'tse' },
  { symbol: '3231', name: '緯創', market: 'tse' },
  { symbol: '2376', name: '技嘉', market: 'tse' },
  { symbol: '2356', name: '英業達', market: 'tse' },
  { symbol: '3017', name: '奇鋐', market: 'tse' },
  { symbol: '3324', name: '雙鴻', market: 'tse' },
  { symbol: '6669', name: '緯穎', market: 'tse' },
  { symbol: '3661', name: '世芯-KY', market: 'tse' },
  { symbol: '3443', name: '創意', market: 'tse' },
  { symbol: '2379', name: '瑞昱', market: 'tse' },
  { symbol: '3034', name: '聯詠', market: 'tse' },
  { symbol: '2303', name: '聯電', market: 'tse' },
  { symbol: '3008', name: '大立光', market: 'tse' },
  { symbol: '2357', name: '華碩', market: 'tse' },
  { symbol: '2324', name: '仁寶', market: 'tse' },
  { symbol: '2327', name: '國巨', market: 'tse' },
  { symbol: '2301', name: '光寶科', market: 'tse' },
  { symbol: '2408', name: '南亞科', market: 'tse' },
  { symbol: '2337', name: '旺宏', market: 'tse' },
  { symbol: '2344', name: '華邦電', market: 'tse' },
  { symbol: '3037', name: '欣興', market: 'tse' },
  { symbol: '3189', name: '景碩', market: 'tse' },
  { symbol: '8046', name: '南電', market: 'tse' },
  { symbol: '3035', name: '智原', market: 'tse' },
  { symbol: '2345', name: '智邦', market: 'tse' },
  { symbol: '3711', name: '日月光投控', market: 'tse' },
  { symbol: '6415', name: '矽力*-KY', market: 'tse' },
  { symbol: '6691', name: '洋基工程', market: 'tse' },
  { symbol: '6944', name: '兆聯實業', market: 'tse' },

  // === 台股航運、鋼鐵、水泥、化學傳產 ===
  { symbol: '2603', name: '長榮', market: 'tse' },
  { symbol: '2609', name: '陽明', market: 'tse' },
  { symbol: '2615', name: '萬海', market: 'tse' },
  { symbol: '2618', name: '長榮航', market: 'tse' },
  { symbol: '2610', name: '華航', market: 'tse' },
  { symbol: '2002', name: '中鋼', market: 'tse' },
  { symbol: '1101', name: '台泥', market: 'tse' },
  { symbol: '1301', name: '台塑', market: 'tse' },
  { symbol: '1303', name: '南亞', market: 'tse' },
  { symbol: '1326', name: '台化', market: 'tse' },
  { symbol: '6505', name: '台塑化', market: 'tse' },
  { symbol: '2207', name: '和泰車', market: 'tse' },
  { symbol: '2201', name: '裕隆', market: 'tse' },
  { symbol: '2912', name: '統一超', market: 'tse' },
  { symbol: '1216', name: '統一', market: 'tse' },

  // === 台股金融股 (金控/銀行) ===
  { symbol: '2881', name: '富邦金', market: 'tse' },
  { symbol: '2882', name: '國泰金', market: 'tse' },
  { symbol: '2891', name: '中信金', market: 'tse' },
  { symbol: '2886', name: '兆豐金', market: 'tse' },
  { symbol: '2884', name: '玉山金', market: 'tse' },
  { symbol: '2892', name: '第一金', market: 'tse' },
  { symbol: '2880', name: '華南金', market: 'tse' },
  { symbol: '2885', name: '元大金', market: 'tse' },
  { symbol: '2883', name: '凱基金', market: 'tse' },
  { symbol: '2887', name: '台新金', market: 'tse' },
  { symbol: '5880', name: '合庫金', market: 'tse' },
  { symbol: '2890', name: '永豐金', market: 'tse' },
  { symbol: '5876', name: '上海商銀', market: 'tse' },
  { symbol: '2801', name: '彰銀', market: 'tse' },
  { symbol: '2834', name: '臺企銀', market: 'tse' },

  // === 台股熱門上櫃 (OTC) ===
  { symbol: '6488', name: '環球晶', market: 'otc' },
  { symbol: '8299', name: '群聯', market: 'otc' },
  { symbol: '3293', name: '鈊象', market: 'otc' },
  { symbol: '5274', name: '信驊', market: 'otc' },
  { symbol: '3529', name: '力旺', market: 'otc' },
  { symbol: '3131', name: '弘塑', market: 'otc' },
  { symbol: '3583', name: '辛耘', market: 'otc' },
  { symbol: '6187', name: '萬潤', market: 'otc' },
  { symbol: '6223', name: '旺矽', market: 'otc' },
  { symbol: '3374', name: '精材', market: 'otc' },
  { symbol: '5347', name: '世界', market: 'otc' },
  { symbol: '8069', name: '元太', market: 'otc' },
  { symbol: '6274', name: '台燿', market: 'otc' },
  { symbol: '3081', name: '聯亞', market: 'otc' },
  { symbol: '4966', name: '譜瑞-KY', market: 'otc' },
  { symbol: '3680', name: '家登', market: 'otc' },
  { symbol: '6121', name: '新普', market: 'otc' },
  { symbol: '5483', name: '中美晶', market: 'otc' },
  { symbol: '8454', name: '富邦媒', market: 'otc' },

  // === 美股巨頭與熱門 ETF ===
  { symbol: 'NVDA', name: 'NVIDIA 輝達', market: 'us' },
  { symbol: 'TSM', name: '台積電 ADR', market: 'us' },
  { symbol: 'AAPL', name: 'Apple 蘋果', market: 'us' },
  { symbol: 'MSFT', name: 'Microsoft 微軟', market: 'us' },
  { symbol: 'GOOGL', name: 'Alphabet 谷歌', market: 'us' },
  { symbol: 'AMZN', name: 'Amazon 亞馬遜', market: 'us' },
  { symbol: 'META', name: 'Meta 臉書', market: 'us' },
  { symbol: 'TSLA', name: 'Tesla 特斯拉', market: 'us' },
  { symbol: 'AMD', name: 'AMD 超微', market: 'us' },
  { symbol: 'AVGO', name: 'Broadcom 博通', market: 'us' },
  { symbol: 'PLTR', name: 'Palantir', market: 'us' },
  { symbol: 'SMCI', name: '超微電腦', market: 'us' },
  { symbol: 'INTC', name: 'Intel 英特爾', market: 'us' },
  { symbol: 'ARM', name: 'Arm 控股', market: 'us' },
  { symbol: 'QQQ', name: 'Invesco QQQ ETF', market: 'us' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', market: 'us' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', market: 'us' },
  { symbol: 'VT', name: 'Vanguard Total World ETF', market: 'us' },
  { symbol: 'SOXX', name: 'iShares 半導體 ETF', market: 'us' },
  { symbol: 'TQQQ', name: 'ProShares 3倍做多納指', market: 'us' },
  { symbol: 'SQQQ', name: 'ProShares 3倍做空納指', market: 'us' },
];

/**
 * 依代號或名稱快速檢索台美股中文資訊
 */
export function lookupStockInfo(query: string): StockDictItem | undefined {
  const q = query.trim().toUpperCase();
  if (!q) return undefined;

  // 1. Exact symbol match
  const exactSym = BUILTIN_STOCK_DICTIONARY.find((item) => item.symbol.toUpperCase() === q);
  if (exactSym) return exactSym;

  // 2. Exact name match
  const exactName = BUILTIN_STOCK_DICTIONARY.find((item) => item.name === query.trim());
  if (exactName) return exactName;

  // 3. Partial match
  return BUILTIN_STOCK_DICTIONARY.find(
    (item) => item.symbol.toUpperCase().includes(q) || item.name.includes(query.trim())
  );
}

/**
 * 智慧搜尋股票，優先返回帶有繁體中文名稱的完整項目
 */
export function searchLocalDictionary(query: string, maxLimit = 10): StockDictItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return BUILTIN_STOCK_DICTIONARY.filter(
    (item) => item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
  ).slice(0, maxLimit);
}
