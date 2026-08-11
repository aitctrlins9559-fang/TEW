import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// CORS headers for local / proxy requests
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Utility helper to fetch JSON with timeout
async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// 1. USD/TWD Exchange Rate Endpoint
app.get('/api/fx', async (_req, res) => {
  try {
    const data = await fetchWithTimeout('https://open.er-api.com/v6/latest/USD', 5000);
    const twdRate = data?.rates?.TWD || 31.5;
    res.json({ success: true, rate: twdRate });
  } catch {
    // Fallback if er-api is down
    res.json({ success: true, rate: 31.5, fallback: true });
  }
});

// 2. Real-time Quotes Endpoint (TWSE MIS Batch + Yahoo Finance Multi-Host Fallback)
async function fetchYahooChart(sym: string, interval = '1m', range = '1d', timeoutMs = 6000) {
  const hosts = ['query2.finance.yahoo.com', 'query1.finance.yahoo.com'];
  for (const host of hosts) {
    try {
      const url = `https://${host}/v8/finance/chart/${encodeURIComponent(sym)}?interval=${interval}&range=${range}`;
      const data = await fetchWithTimeout(url, timeoutMs);
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && typeof meta.regularMarketPrice === 'number') {
        return {
          symbol: sym,
          regularMarketPrice: meta.regularMarketPrice,
          regularMarketPreviousClose: meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice,
          regularMarketDayHigh: meta.regularMarketDayHigh || meta.regularMarketPrice,
          regularMarketDayLow: meta.regularMarketDayLow || meta.regularMarketPrice,
          rawChart: data,
        };
      }
    } catch {
      // try next host
    }
  }
  return null;
}

async function fetchTwseBatch(symbols: string[]) {
  const twItems: { original: string; code: string }[] = [];
  symbols.forEach((sym) => {
    const clean = sym.replace(/\.(TW|TWO)$/i, '').trim().toUpperCase();
    if (/^\d{4,6}[A-Z]?$/i.test(clean)) {
      twItems.push({ original: sym, code: clean });
    }
  });

  if (twItems.length === 0) return [];

  const exChParts: string[] = [];
  twItems.forEach((item) => {
    exChParts.push(`tse_${item.code}.tw`);
    exChParts.push(`otc_${item.code}.tw`);
  });

  try {
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${encodeURIComponent(exChParts.join('|'))}&_=${Date.now()}`;
    const data = await fetchWithTimeout(url, 6000);
    const msgArray = data?.msgArray || [];

    const results: any[] = [];
    twItems.forEach((item) => {
      const match = msgArray.find((m: any) => m.c === item.code && (m.z || m.y || m.a || m.b));
      if (match) {
        let price = parseFloat(match.z);
        if (isNaN(price) || price <= 0) {
          if (match.a && match.a !== '-') price = parseFloat(match.a.split('_')[0]);
          if ((isNaN(price) || price <= 0) && match.b && match.b !== '-') price = parseFloat(match.b.split('_')[0]);
          if (isNaN(price) || price <= 0) price = parseFloat(match.y);
        }
        const prevClose = parseFloat(match.y) || price;
        const dayHigh = parseFloat(match.h) || price;
        const dayLow = parseFloat(match.l) || price;

        if (price > 0) {
          results.push({
            symbol: item.original,
            regularMarketPrice: price,
            regularMarketPreviousClose: prevClose,
            regularMarketDayHigh: dayHigh,
            regularMarketDayLow: dayLow,
          });
          if (item.original !== item.code) {
            results.push({
              symbol: item.code,
              regularMarketPrice: price,
              regularMarketPreviousClose: prevClose,
              regularMarketDayHigh: dayHigh,
              regularMarketDayLow: dayLow,
            });
          }
        }
      }
    });
    return results;
  } catch {
    return [];
  }
}

app.post('/api/quote', async (req, res) => {
  try {
    const { symbols } = req.body as { symbols: string[] };
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.json({ success: true, results: [] });
    }

    // 1. Try TWSE MIS Batch for Taiwan stocks
    const twseResults = await fetchTwseBatch(symbols);
    const foundSyms = new Set(twseResults.map((r) => r.symbol.toUpperCase()));

    // 2. Fetch missing / US stocks from Yahoo Finance
    const missingSymbols = symbols.filter((sym) => {
      const upper = sym.toUpperCase();
      const bare = upper.replace(/\.(TW|TWO)$/i, '');
      return !foundSyms.has(upper) && !foundSyms.has(bare);
    });

    const yahooResults = await Promise.all(
      missingSymbols.map((sym) => fetchYahooChart(sym, '1m', '1d', 6000))
    );

    const validYahoo = yahooResults.filter(Boolean);

    const combinedResults = [...twseResults, ...validYahoo];
    res.json({ success: true, results: combinedResults });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 3. Market Indices Endpoint
app.get('/api/indices', async (_req, res) => {
  const indexSymbols = ['^TWII', '^N225', '^KS11', '^DJI', '^GSPC', '^IXIC'];
  try {
    // Try TWSE MIS for ^TWII (tse_t00.tw)
    let twiiResult: any = null;
    try {
      const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_t00.tw&_=${Date.now()}`;
      const data = await fetchWithTimeout(url, 4000);
      const match = data?.msgArray?.[0];
      if (match) {
        const price = parseFloat(match.z) || parseFloat(match.y);
        const prevClose = parseFloat(match.y) || price;
        if (price > 0) {
          const change = price - prevClose;
          const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
          twiiResult = {
            symbol: '^TWII',
            price,
            prevClose,
            change,
            changePct,
          };
        }
      }
    } catch {
      // ignore
    }

    const results = await Promise.all(
      indexSymbols.map(async (sym) => {
        if (sym === '^TWII' && twiiResult) return twiiResult;
        try {
          const chartData = await fetchYahooChart(sym, '1m', '1d', 5000);
          if (chartData && typeof chartData.regularMarketPrice === 'number') {
            const price = chartData.regularMarketPrice;
            const prevClose = chartData.regularMarketPreviousClose;
            const change = price - prevClose;
            const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
            return {
              symbol: sym,
              price,
              prevClose,
              change,
              changePct,
            };
          }
        } catch {
          // ignore
        }
        return null;
      })
    );

    res.json({ success: true, results: results.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 4. Stock Search Endpoint
app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ success: true, results: [] });

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=zh-Hant-TW&region=TW&quotesCount=10&newsCount=0`;
    const data = await fetchWithTimeout(url, 5000);
    const quotes = data?.quotes || [];

    const results = quotes
      .filter((item: { quoteType?: string }) => item.quoteType === 'EQUITY' || item.quoteType === 'ETF')
      .map((item: { symbol: string; shortname?: string; longname?: string }) => {
        let symbol = item.symbol;
        let market: 'tse' | 'otc' | 'us' = 'us';
        if (symbol.endsWith('.TW')) {
          symbol = symbol.slice(0, -3);
          market = 'tse';
        } else if (symbol.endsWith('.TWO')) {
          symbol = symbol.slice(0, -4);
          market = 'otc';
        }
        return {
          symbol,
          name: item.shortname || item.longname || symbol,
          market,
        };
      });

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 5. Financial News Endpoint
app.get('/api/news', async (_req, res) => {
  try {
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://tw.stock.yahoo.com/rss')}`;
    const data = await fetchWithTimeout(url, 6000);
    if (data?.status === 'ok' && Array.isArray(data.items)) {
      const items = data.items.slice(0, 15).map((item: { title: string; link: string; pubDate?: string }) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
      }));
      return res.json({ success: true, items });
    }
    res.json({ success: true, items: [] });
  } catch (error) {
    res.json({ success: false, error: (error as Error).message, items: [] });
  }
});

// 6. Intraday or Historical Chart Endpoint
app.get('/api/chart', async (req, res) => {
  const symbol = String(req.query.symbol || '').trim();
  const range = String(req.query.range || '1d');
  const interval = String(req.query.interval || '5m');

  if (!symbol) return res.status(400).json({ success: false, error: 'Symbol required' });

  try {
    const chartRes = await fetchYahooChart(symbol, interval, range, 6000);
    if (!chartRes || !chartRes.rawChart) {
      return res.status(404).json({ success: false, error: 'No chart data' });
    }

    const result = chartRes.rawChart?.chart?.result?.[0];
    if (!result) return res.status(404).json({ success: false, error: 'No chart result' });

    res.json({
      success: true,
      meta: result.meta,
      timestamp: result.timestamp || [],
      quotes: result.indicators?.quote?.[0]?.close || [],
      volumes: result.indicators?.quote?.[0]?.volume || [],
      opens: result.indicators?.quote?.[0]?.open || [],
      highs: result.indicators?.quote?.[0]?.high || [],
      lows: result.indicators?.quote?.[0]?.low || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 7. Gemini AI Portfolio Copilot Endpoint
app.post('/api/ai-analysis', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: '未檢測到 GEMINI_API_KEY 環境變數。請至 AI Studio Secrets 設定 panel 配置。',
      });
    }

    const { portfolio, totalValue, totalProfit, totalROI, indices } = req.body;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `你是一位精通台股與美股的資深首席投資顧問 (Chief Investment Officer)。
請針對用戶目前的持股投資組合進行全方位的「AI 戰情分析診斷」：

【用戶投資組合數據】:
- 總估值 (NT$): ${totalValue}
- 未實現損益 (NT$): ${totalProfit}
- 總報酬率 (%): ${totalROI}%
- 持股明細: ${JSON.stringify(portfolio, null, 2)}
- 國際大盤現況: ${JSON.stringify(indices, null, 2)}

請提供結構化的 JSON 診斷報告，內容必須繁體中文，格式嚴格遵循 JSON 規範：
{
  "summary": "一句話精闢總結目前的整體持股健康狀況與走勢表現",
  "riskRating": "低風險 | 中等風險 | 高風險 | 極高風險",
  "allocationComment": "針對台美股比例、個股集中度與產業分散度的詳細講評",
  "topOpportunities": ["潛力亮點或利多因素 1", "潛力亮點 2"],
  "riskWarnings": ["潛在風險點或需要注意的個股 1", "風控提醒 2"],
  "actionAdvice": "具體可執行的操盤建議 (例如：適度止盈、回檔逢低分批加碼、設好停損)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: '你是一位講求數據實證、嚴守風控與專業客觀的資深台美股操盤手顧問。',
      },
    });

    const text = response.text || '{}';
    const resultJson = JSON.parse(text);

    res.json({
      success: true,
      analysis: {
        ...resultJson,
        timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `AI 戰情分析產生失敗：${(error as Error).message}`,
    });
  }
});

// Vite middleware / static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 資產戰情室 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
