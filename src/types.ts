export type MarketType = 'tse' | 'otc' | 'us';

export interface TransactionRecord {
  id: string;
  buyDate: string;
  shares: number;
  cost: number; // cost in local currency of stock (TWD or USD)
  buyRate: number; // USD/TWD rate at time of buy
}

export interface StockPosition {
  id: string;
  symbol: string;
  name: string;
  market: MarketType;
  transactions: TransactionRecord[];
  shares: number;
  cost: number; // weighted avg cost
  buyDate: string;
  buyRate: number; // weighted avg buy rate
  price: number | null;
  prevClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fetchError?: boolean;
  priceChanged?: 'up' | 'down' | null;
}

export interface MarketIndex {
  id: string;
  name: string;
  symbol: string;
  price: number | null;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate?: string;
  source?: string;
}

export interface ChartTarget {
  symbol: string;
  market: MarketType;
  name: string;
}

export interface IntradayData {
  symbol: string;
  market: MarketType;
  name: string;
  prevClose: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  latestPrice: number;
  totalVolume: number;
  estimatedVolume: number;
  limitUpPrice: number;
  limitDownPrice: number;
  amplitudePct: number;
  rangePct: number;
  labels: string[];
  prices: number[];
  volumes?: number[];
}

export interface ApiStatusItem {
  name: string;
  status: 'OK' | 'ERROR' | 'PENDING' | 'DISABLED';
  ms: number;
  error: string | null;
  endpoint?: string;
}

export interface ApiHealthStatus {
  cloud: ApiStatusItem;
  yahoo: ApiStatusItem;
  twse: ApiStatusItem;
  tpex: ApiStatusItem;
  search: ApiStatusItem;
  fx: ApiStatusItem;
}

export interface AIAnalysisResult {
  summary: string;
  riskRating: '低風險' | '中等風險' | '高風險' | '極高風險';
  allocationComment: string;
  topOpportunities: string[];
  riskWarnings: string[];
  actionAdvice: string;
  timestamp: string;
}
