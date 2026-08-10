import { StockPosition, MarketType } from '../types';

export interface DividendInfo {
  annualDividendPerShare: number; // in local currency (TWD or USD)
  dividendYieldPct: number; // %
  frequency: '月配息' | '季配息' | '半年配' | '年配息';
  exMonths: number[]; // e.g. [1, 4, 7, 10] for quarterly
  nextExMonthStr: string; // e.g. "2026/09"
  annualIncomeTWD: number;
  monthlyIncomeTWD: number;
}

export interface KnownDividendProfile {
  annualDps: number; // Dividend per share
  frequency: '月配息' | '季配息' | '半年配' | '年配息';
  exMonths: number[];
}

const KNOWN_DIVIDENDS: Record<string, KnownDividendProfile> = {
  // 高股息 ETF
  '0056': { annualDps: 3.7, frequency: '季配息', exMonths: [1, 4, 7, 10] },
  '00878': { annualDps: 2.1, frequency: '季配息', exMonths: [2, 5, 8, 11] },
  '00919': { annualDps: 2.8, frequency: '季配息', exMonths: [3, 6, 9, 12] },
  '00929': { annualDps: 2.2, frequency: '月配息', exMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  '00940': { annualDps: 0.6, frequency: '月配息', exMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  '00713': { annualDps: 3.5, frequency: '季配息', exMonths: [3, 6, 9, 12] },
  '00915': { annualDps: 2.5, frequency: '季配息', exMonths: [3, 6, 9, 12] },
  '00918': { annualDps: 2.6, frequency: '季配息', exMonths: [3, 6, 9, 12] },
  '00934': { annualDps: 1.6, frequency: '月配息', exMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  '00936': { annualDps: 1.2, frequency: '月配息', exMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },

  // 市值型 ETF
  '0050': { annualDps: 5.0, frequency: '半年配', exMonths: [1, 7] },
  '006208': { annualDps: 3.8, frequency: '半年配', exMonths: [7, 11] },

  // 台股權值股 / 金融股
  '2330': { annualDps: 18.0, frequency: '季配息', exMonths: [3, 6, 9, 12] },
  '2317': { annualDps: 5.4, frequency: '年配息', exMonths: [7] },
  '2454': { annualDps: 55.0, frequency: '半年配', exMonths: [1, 7] },
  '2881': { annualDps: 3.2, frequency: '年配息', exMonths: [7] },
  '2882': { annualDps: 2.8, frequency: '年配息', exMonths: [7] },
  '2891': { annualDps: 1.8, frequency: '年配息', exMonths: [7] },
  '2886': { annualDps: 1.8, frequency: '年配息', exMonths: [8] },
  '2884': { annualDps: 1.3, frequency: '年配息', exMonths: [8] },
  '2892': { annualDps: 1.2, frequency: '年配息', exMonths: [8] },
  '2880': { annualDps: 1.3, frequency: '年配息', exMonths: [8] },
  '2885': { annualDps: 1.4, frequency: '年配息', exMonths: [7] },
  '2890': { annualDps: 1.0, frequency: '年配息', exMonths: [8] },
  '2603': { annualDps: 10.0, frequency: '年配息', exMonths: [6] },
  '2002': { annualDps: 1.0, frequency: '年配息', exMonths: [7] },
  '1101': { annualDps: 1.2, frequency: '年配息', exMonths: [7] },

  // 美股巨頭與美股 ETF (USD)
  'AAPL': { annualDps: 1.0, frequency: '季配息', exMonths: [2, 5, 8, 11] },
  'NVDA': { annualDps: 0.4, frequency: '季配息', exMonths: [3, 6, 9, 12] },
  'MSFT': { annualDps: 3.0, frequency: '季配息', exMonths: [2, 5, 8, 11] },
  'VOO': { annualDps: 6.8, frequency: '季配息', exMonths: [3, 6, 9, 12] },
  'SPY': { annualDps: 7.2, frequency: '季配息', exMonths: [3, 6, 9, 12] },
  'QQQ': { annualDps: 2.8, frequency: '季配息', exMonths: [3, 6, 9, 12] },
  'SCHD': { annualDps: 2.8, frequency: '季配息', exMonths: [3, 6, 9, 12] },
};

/**
 * 取得單一股票的預估股利與殖利率
 */
export function getStockDividendInfo(
  stock: StockPosition,
  usdTwdRate: number
): DividendInfo {
  const symbol = stock.symbol.toUpperCase();
  const currentPrice = typeof stock.price === 'number' && stock.price > 0 ? stock.price : stock.cost;
  const isUS = stock.market === 'us';
  const marketFx = isUS ? usdTwdRate : 1;

  let annualDps = 0;
  let frequency: '月配息' | '季配息' | '半年配' | '年配息' = '年配息';
  let exMonths: number[] = [7];

  if (KNOWN_DIVIDENDS[symbol]) {
    const prof = KNOWN_DIVIDENDS[symbol];
    annualDps = prof.annualDps;
    frequency = prof.frequency;
    exMonths = prof.exMonths;
  } else {
    // Smart fallback estimate based on symbol pattern
    if (symbol.startsWith('009') || symbol.startsWith('008') || symbol.startsWith('007')) {
      // High Yield ETF estimate (~8.0%)
      annualDps = currentPrice * 0.08;
      frequency = '季配息';
      exMonths = [3, 6, 9, 12];
    } else if (symbol.startsWith('005') || symbol.startsWith('006')) {
      // Broad Market ETF estimate (~3.5%)
      annualDps = currentPrice * 0.035;
      frequency = '半年配';
      exMonths = [1, 7];
    } else if (isUS) {
      // US Stock average yield (~1.5%)
      annualDps = currentPrice * 0.015;
      frequency = '季配息';
      exMonths = [3, 6, 9, 12];
    } else {
      // TW Stock average yield (~4.0%)
      annualDps = currentPrice * 0.04;
      frequency = '年配息';
      exMonths = [7];
    }
  }

  const dividendYieldPct = currentPrice > 0 ? (annualDps / currentPrice) * 100 : 0;
  const annualIncomeTWD = stock.shares * annualDps * marketFx;
  const monthlyIncomeTWD = annualIncomeTWD / 12;

  // Calculate next ex-dividend month string
  const currentMonth = new Date().getMonth() + 1; // 1 ~ 12
  const nextExM = exMonths.find((m) => m >= currentMonth) || exMonths[0];
  const nextYear = nextExM < currentMonth ? new Date().getFullYear() + 1 : new Date().getFullYear();
  const nextExMonthStr = `${nextYear}/${nextExM < 10 ? '0' : ''}${nextExM}月`;

  return {
    annualDividendPerShare: annualDps,
    dividendYieldPct,
    frequency,
    exMonths,
    nextExMonthStr,
    annualIncomeTWD,
    monthlyIncomeTWD,
  };
}

export interface PortfolioDividendSummary {
  totalAnnualPassiveIncomeTWD: number;
  totalMonthlyPassiveIncomeTWD: number;
  weightedDividendYieldPct: number;
  monthlyBreakdown: number[]; // 12 months (0 = Jan, 11 = Dec) in TWD
  upcomingReminders: Array<{
    symbol: string;
    name: string;
    frequency: string;
    nextExMonthStr: string;
    estAmountTWD: number;
  }>;
}

/**
 * 計算整體投資組合的年化被動收入與每月分配
 */
export function calculatePortfolioDividends(
  portfolio: StockPosition[],
  usdTwdRate: number
): PortfolioDividendSummary {
  let totalAnnualPassiveIncomeTWD = 0;
  let totalMarketValTWD = 0;
  const monthlyBreakdown = new Array(12).fill(0);
  const reminders: PortfolioDividendSummary['upcomingReminders'] = [];

  portfolio.forEach((stock) => {
    const isUS = stock.market === 'us';
    const marketFx = isUS ? usdTwdRate : 1;
    const currentPrice = typeof stock.price === 'number' && stock.price > 0 ? stock.price : stock.cost;
    const stockMarketVal = stock.shares * currentPrice * marketFx;
    totalMarketValTWD += stockMarketVal;

    const info = getStockDividendInfo(stock, usdTwdRate);
    totalAnnualPassiveIncomeTWD += info.annualIncomeTWD;

    // Distribute into monthly breakdown
    if (info.exMonths.length > 0) {
      const payoutPerEx = info.annualIncomeTWD / info.exMonths.length;
      info.exMonths.forEach((m) => {
        const monthIdx = m - 1; // 0 ~ 11
        monthlyBreakdown[monthIdx] += payoutPerEx;
      });
    }

    if (info.annualIncomeTWD > 0) {
      reminders.push({
        symbol: stock.symbol,
        name: stock.name,
        frequency: info.frequency,
        nextExMonthStr: info.nextExMonthStr,
        estAmountTWD: info.annualIncomeTWD / info.exMonths.length,
      });
    }
  });

  const totalMonthlyPassiveIncomeTWD = totalAnnualPassiveIncomeTWD / 12;
  const weightedDividendYieldPct =
    totalMarketValTWD > 0 ? (totalAnnualPassiveIncomeTWD / totalMarketValTWD) * 100 : 0;

  // Sort upcoming reminders by next ex month
  reminders.sort((a, b) => a.nextExMonthStr.localeCompare(b.nextExMonthStr));

  return {
    totalAnnualPassiveIncomeTWD,
    totalMonthlyPassiveIncomeTWD,
    weightedDividendYieldPct,
    monthlyBreakdown,
    upcomingReminders: reminders,
  };
}
