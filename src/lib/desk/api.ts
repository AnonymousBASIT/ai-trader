import { createServerFn } from "@tanstack/react-start";
import type {
  Bar,
  Candle,
  CarryRow,
  LongShort,
  Macro,
  NewsItem,
  Onchain,
  PositionRow,
  Pulse,
  Snapshot,
  Ticker,
  TradePrint,
  TrendingCoin,
} from "./types";

type CacheEntry<T> = { t: number; v: T };
const cache = new Map<string, CacheEntry<unknown>>();

function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.t < ttl) return Promise.resolve(hit.v);
  const inflight = inflightMap.get(key) as Promise<T> | undefined;
  if (inflight) return inflight;
  const p = fn()
    .then((v) => {
      cache.set(key, { t: Date.now(), v });
      inflightMap.delete(key);
      return v;
    })
    .catch((err) => {
      inflightMap.delete(key);
      throw err;
    });
  inflightMap.set(key, p);
  return p;
}

const inflightMap = new Map<string, Promise<unknown>>();

async function getJson(url: string, timeout = 9000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json, application/rss+xml, text/xml, */*",
        "User-Agent": "Mozilla/5.0 (compatible; ATLAS-Desk/1.0)",
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getText(url: string, timeout = 9000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/rss+xml, text/xml, application/xml, */*",
        "User-Agent": "Mozilla/5.0 (compatible; ATLAS-Desk/1.0)",
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function emptySnap(symbol: string, error?: string): Snapshot {
  return {
    symbol,
    venue: "okx",
    last: 0,
    depth: { bids: [], asks: [] },
    trades: [],
    klines: [],
    funding: { rate: null, mark: null, index: null, nextFundingTime: null },
    openInterest: null,
    oiChangePct: null,
    oiHistory: [],
    globalLs: null,
    lsHistory: [],
    topLs: null,
    takerBuy: null,
    takerSell: null,
    marginLs: null,
    error,
  };
}

function series(raw: unknown, col = 1): number[] {
  const data = (raw as { data?: unknown[][] } | null)?.data;
  if (!Array.isArray(data)) return [];
  return data.map((row) => num(row[col])).filter((n) => Number.isFinite(n));
}

function toLs(ratio: number): LongShort | null {
  if (!ratio) return null;
  return {
    ratio,
    longAccount: ratio / (1 + ratio),
    shortAccount: 1 / (1 + ratio),
  };
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toOkxSpot(symbol: string): string {
  if (symbol.endsWith("USDT")) return `${symbol.slice(0, -4)}-USDT`;
  if (symbol.endsWith("USDC")) return `${symbol.slice(0, -4)}-USDC`;
  return symbol;
}

const BARS: Bar[] = ["1m", "5m", "15m", "1H", "4H"];
const BINANCE_BAR: Record<Bar, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1H": "1h",
  "4H": "4h",
};

function parseBinanceTickers(raw: unknown): Ticker[] {
  if (!Array.isArray(raw)) return [];
  const out: Ticker[] = [];
  for (const row of raw) {
    const r = row as Record<string, unknown>;
    const symbol = String(r.symbol ?? "");
    if (!symbol.endsWith("USDT")) continue;
    if (symbol.includes("_") || symbol.endsWith("DOWNUSDT") || symbol.endsWith("UPUSDT")) continue;
    const quoteVolume = num(r.quoteVolume);
    if (quoteVolume < 500_000) continue;
    out.push({
      symbol,
      last: num(r.lastPrice),
      open: num(r.openPrice),
      high: num(r.highPrice),
      low: num(r.lowPrice),
      changePct: num(r.priceChangePercent),
      quoteVolume,
      volume: num(r.volume),
      bid: num(r.bidPrice),
      ask: num(r.askPrice),
    });
  }
  return out.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
}

function parseOkxTickers(raw: unknown): Ticker[] {
  const data = (raw as { data?: unknown[] })?.data;
  if (!Array.isArray(data)) return [];
  const out: Ticker[] = [];
  for (const row of data) {
    const r = row as Record<string, unknown>;
    const inst = String(r.instId ?? "");
    if (!inst.endsWith("-USDT")) continue;
    const last = num(r.last);
    const open = num(r.open24h);
    const quoteVolume = num(r.volCcy24h);
    if (quoteVolume < 500_000 || last <= 0) continue;
    out.push({
      symbol: inst.replaceAll("-", ""),
      last,
      open,
      high: num(r.high24h),
      low: num(r.low24h),
      changePct: open > 0 ? ((last - open) / open) * 100 : 0,
      quoteVolume,
      volume: num(r.vol24h),
      bid: num(r.bidPx),
      ask: num(r.askPx),
    });
  }
  return out.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
}

export const getUniverse = createServerFn({ method: "POST" }).handler(async () => {
  return cached("universe", 4000, async () => {
    try {
      const raw = await getJson("https://www.okx.com/api/v5/market/tickers?instType=SPOT");
      const tickers = parseOkxTickers(raw);
      if (tickers.length > 15) return { venue: "okx" as const, tickers, ts: Date.now() };
      throw new Error("thin okx");
    } catch {
      const hosts = ["https://api.binance.us", "https://api.binance.com"];
      for (const host of hosts) {
        try {
          const raw = await getJson(`${host}/api/v3/ticker/24hr`);
          const tickers = parseBinanceTickers(raw);
          if (tickers.length > 10) return { venue: "binance" as const, tickers, ts: Date.now() };
        } catch {
          /* next */
        }
      }
      return { venue: "okx" as const, tickers: [] as Ticker[], ts: Date.now() };
    }
  });
});

async function snapshotOkx(symbol: string, bar: Bar): Promise<Snapshot> {
  const spot = toOkxSpot(symbol);
  const swap = `${spot}-SWAP`;
  const base = spot.split("-")[0] ?? "BTC";

  const [books, trades, candles, funding, mark, oi, ls, oiHist, taker, margin] = await Promise.all([
    getJson(`https://www.okx.com/api/v5/market/books?instId=${spot}&sz=20`),
    getJson(`https://www.okx.com/api/v5/market/trades?instId=${spot}&limit=80`),
    getJson(`https://www.okx.com/api/v5/market/candles?instId=${spot}&bar=${bar}&limit=96`),
    getJson(`https://www.okx.com/api/v5/public/funding-rate?instId=${swap}`).catch(() => null),
    getJson(`https://www.okx.com/api/v5/public/mark-price?instId=${swap}`).catch(() => null),
    getJson(`https://www.okx.com/api/v5/public/open-interest?instId=${swap}`).catch(() => null),
    getJson(
      `https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=${base}&period=5m`,
    ).catch(() => null),
    getJson(
      `https://www.okx.com/api/v5/rubik/stat/contracts/open-interest-history?instId=${swap}&period=5m`,
    ).catch(() => null),
    getJson(
      `https://www.okx.com/api/v5/rubik/stat/taker-volume?ccy=${base}&instType=CONTRACTS&period=5m`,
    ).catch(() => null),
    getJson(
      `https://www.okx.com/api/v5/rubik/stat/margin/loan-ratio?ccy=${base}&period=1H`,
    ).catch(() => null),
  ]);

  const bookRow = (books as { data?: Array<{ bids?: string[][]; asks?: string[][] }> }).data?.[0];
  const tradeRows = ((trades as { data?: Array<Record<string, unknown>> }).data ?? []) as Array<
    Record<string, unknown>
  >;
  const candleRows = ((candles as { data?: unknown[][] }).data ?? []) as unknown[][];
  const fundRow = (funding as { data?: Array<Record<string, unknown>> } | null)?.data?.[0];
  const markRow = (mark as { data?: Array<Record<string, unknown>> } | null)?.data?.[0];
  const oiRow = (oi as { data?: Array<Record<string, unknown>> } | null)?.data?.[0];

  const prints: TradePrint[] = tradeRows
    .slice()
    .reverse()
    .map((t) => ({
      id: String(t.tradeId),
      price: num(t.px),
      qty: num(t.sz),
      time: num(t.ts),
      isBuyerMaker: String(t.side) === "sell",
    }));

  const klines: Candle[] = candleRows
    .slice()
    .reverse()
    .map((k) => ({
      t: num(k[0]),
      o: num(k[1]),
      h: num(k[2]),
      l: num(k[3]),
      c: num(k[4]),
      v: num(k[5]),
    }));

  const last = prints[prints.length - 1]?.price || klines[klines.length - 1]?.c || 0;
  const lsHistory = series(ls, 1).slice(0, 24).reverse();
  const globalLs = toLs(lsHistory[lsHistory.length - 1] ?? 0);
  const oiUsd = series(oiHist, 3).slice(0, 24).reverse();
  const oiChangePct =
    oiUsd.length >= 7 && oiUsd[oiUsd.length - 7] > 0
      ? ((oiUsd[oiUsd.length - 1] - oiUsd[oiUsd.length - 7]) / oiUsd[oiUsd.length - 7]) * 100
      : null;
  const takerRows = ((taker as { data?: unknown[][] } | null)?.data ?? []) as unknown[][];
  const takerSell = takerRows[0] ? num(takerRows[0][1]) : null;
  const takerBuy = takerRows[0] ? num(takerRows[0][2]) : null;
  const marginHist = series(margin, 1);
  const marginLs = marginHist[0] || null;

  return {
    symbol,
    venue: "okx",
    last,
    depth: {
      bids: (bookRow?.bids ?? []).map((l) => ({ price: num(l[0]), qty: num(l[1]) })),
      asks: (bookRow?.asks ?? []).map((l) => ({ price: num(l[0]), qty: num(l[1]) })),
    },
    trades: prints,
    klines,
    funding: {
      rate: fundRow ? num(fundRow.fundingRate) : null,
      mark: markRow ? num(markRow.markPx) : null,
      index: null,
      nextFundingTime: fundRow ? num(fundRow.fundingTime) : null,
    },
    openInterest: oiRow ? num(oiRow.oiCcy ?? oiRow.oi) : null,
    oiChangePct,
    oiHistory: oiUsd,
    globalLs,
    lsHistory,
    topLs: null,
    takerBuy,
    takerSell,
    marginLs,
  };
}

async function snapshotBinance(host: string, symbol: string, bar: Bar): Promise<Snapshot> {
  const interval = BINANCE_BAR[bar];
  const [depth, trades, klines] = await Promise.all([
    getJson(`${host}/api/v3/depth?symbol=${symbol}&limit=20`),
    getJson(`${host}/api/v3/trades?symbol=${symbol}&limit=80`),
    getJson(`${host}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=96`),
  ]);
  const d = depth as { bids?: string[][]; asks?: string[][] };
  const tr = (Array.isArray(trades) ? trades : []) as Array<Record<string, unknown>>;
  const kl = (Array.isArray(klines) ? klines : []) as unknown[][];
  const prints: TradePrint[] = tr.map((t) => ({
    id: String(t.id),
    price: num(t.price),
    qty: num(t.qty),
    time: num(t.time),
    isBuyerMaker: Boolean(t.isBuyerMaker),
  }));
  const candles: Candle[] = kl.map((k) => ({
    t: num(k[0]),
    o: num(k[1]),
    h: num(k[2]),
    l: num(k[3]),
    c: num(k[4]),
    v: num(k[5]),
  }));
  return {
    symbol,
    venue: "binance",
    last: prints[prints.length - 1]?.price || candles[candles.length - 1]?.c || 0,
    depth: {
      bids: (d.bids ?? []).map(([p, q]) => ({ price: num(p), qty: num(q) })),
      asks: (d.asks ?? []).map(([p, q]) => ({ price: num(p), qty: num(q) })),
    },
    trades: prints,
    klines: candles,
    funding: { rate: null, mark: null, index: null, nextFundingTime: null },
    openInterest: null,
    oiChangePct: null,
    oiHistory: [],
    globalLs: null,
    lsHistory: [],
    topLs: null,
    takerBuy: null,
    takerSell: null,
    marginLs: null,
  };
}

export const getSnapshot = createServerFn({ method: "POST" })
  .validator((input: { symbol: string; bar?: string }) => ({
    symbol:
      String(input?.symbol ?? "BTCUSDT")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 20) || "BTCUSDT",
    bar: (BARS.includes(input?.bar as Bar) ? input.bar : "15m") as Bar,
  }))
  .handler(async ({ data }) => {
    const { symbol, bar } = data;
    return cached(`snap:${symbol}:${bar}`, 2500, async (): Promise<Snapshot> => {
      try {
        const snap = await snapshotOkx(symbol, bar);
        if (snap.depth.bids.length || snap.trades.length) return snap;
        throw new Error("empty okx");
      } catch (err) {
        try {
          return await snapshotBinance("https://api.binance.us", symbol, bar);
        } catch {
          return emptySnap(symbol, err instanceof Error ? err.message : "snapshot failed");
        }
      }
    });
  });

export const getCarry = createServerFn({ method: "GET" }).handler(async () => {
  return cached("carry", 20_000, async (): Promise<CarryRow[]> => {
    const raw = await getJson("https://www.okx.com/api/v5/market/tickers?instType=SWAP");
    const data = ((raw as { data?: Array<Record<string, unknown>> }).data ?? []).filter((r) =>
      String(r.instId).endsWith("-USDT-SWAP"),
    );
    const top = data
      .map((r) => ({
        instId: String(r.instId),
        last: num(r.last),
        vol: num(r.volCcy24h),
      }))
      .sort((a, b) => b.vol - a.vol)
      .slice(0, 28);

    const rows = await Promise.all(
      top.map(async (r) => {
        try {
          const f = await getJson(`https://www.okx.com/api/v5/public/funding-rate?instId=${r.instId}`);
          const row = (f as { data?: Array<Record<string, unknown>> }).data?.[0];
          const funding = row ? num(row.fundingRate) : 0;
          return {
            symbol: r.instId.replace("-USDT-SWAP", "USDT"),
            funding,
            apr: funding * 3 * 365 * 100,
            last: r.last,
            vol: r.vol,
          } satisfies CarryRow;
        } catch {
          return null;
        }
      }),
    );

    return rows
      .filter((r): r is CarryRow => r != null && Math.abs(r.funding) >= 0.00005)
      .sort((a, b) => Math.abs(b.funding) - Math.abs(a.funding));
  });
});

export const getMacro = createServerFn({ method: "GET" }).handler(async () => {
  return cached("macro", 60_000, async (): Promise<Macro> => {
    const [fg, ...searches] = await Promise.allSettled([
      getJson("https://api.alternative.me/fng/?limit=1"),
      getJson("https://gamma-api.polymarket.com/public-search?q=bitcoin"),
      getJson("https://gamma-api.polymarket.com/public-search?q=ethereum"),
      getJson("https://gamma-api.polymarket.com/public-search?q=crypto"),
    ]);

    let fearGreed: Macro["fearGreed"] = null;
    if (fg.status === "fulfilled") {
      const row = (fg.value as { data?: Array<Record<string, string>> }).data?.[0];
      if (row) fearGreed = { value: Number(row.value), label: row.value_classification };
    }

    const polymarket: Macro["polymarket"] = [];
    const seen = new Set<string>();
    for (const s of searches) {
      if (s.status !== "fulfilled") continue;
      const events = (s.value as { events?: Array<Record<string, unknown>> }).events ?? [];
      for (const ev of events) {
        const markets = (ev.markets as Array<Record<string, unknown>> | undefined) ?? [];
        for (const r of markets) {
          const q = String(r.question ?? ev.title ?? "");
          if (!q || seen.has(q)) continue;
          seen.add(q);
          let prices: number[] = [];
          const op = r.outcomePrices;
          if (typeof op === "string") {
            try {
              prices = (JSON.parse(op) as unknown[]).map((x) => Number(x));
            } catch {
              prices = [];
            }
          } else if (Array.isArray(op)) {
            prices = op.map((x) => Number(x));
          }
          let outcomes: string[] = [];
          if (typeof r.outcomes === "string") {
            try {
              outcomes = JSON.parse(r.outcomes) as string[];
            } catch {
              outcomes = [];
            }
          } else if (Array.isArray(r.outcomes)) {
            outcomes = r.outcomes.map(String);
          }
          polymarket.push({
            question: q,
            outcomes,
            prices,
            volume: num(r.volume24hr ?? r.volume),
          });
          if (polymarket.length >= 8) break;
        }
        if (polymarket.length >= 8) break;
      }
    }

    return { fearGreed, btcDominance: null, totalMcap: null, polymarket };
  });
});

const BASES = [
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "DOGE",
  "PEPE",
  "AVAX",
  "LINK",
  "SUI",
  "ADA",
  "TON",
  "NEAR",
  "BNB",
  "WIF",
  "ARB",
];

const NAME_TO_BASE: Record<string, string> = {
  BITCOIN: "BTC",
  ETHEREUM: "ETH",
  SOLANA: "SOL",
  RIPPLE: "XRP",
  DOGECOIN: "DOGE",
  CARDANO: "ADA",
  AVALANCHE: "AVAX",
  CHAINLINK: "LINK",
  POLYGON: "POL",
  LITECOIN: "LTC",
};

function tickersIn(title: string): string[] {
  const u = title.toUpperCase();
  const hit = new Set<string>();
  for (const [name, base] of Object.entries(NAME_TO_BASE)) {
    if (u.includes(name)) hit.add(base);
  }
  for (const b of BASES) {
    if (new RegExp(`\\b${b}\\b`).test(u) || u.includes(`$${b}`)) hit.add(b);
  }
  return [...hit];
}

function decodeHtml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">");
}

function rssTag(xml: string, tag: string): string {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, "i"));
  if (cdata) return cdata[1].trim();
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return plain ? plain[1].replace(/<[^>]+>/g, "").trim() : "";
}

function parseRss(xml: string, source: string): NewsItem[] {
  const out: NewsItem[] = [];
  const chunks = xml.split(/<item[\s>]/i).slice(1);
  for (const chunk of chunks.slice(0, 12)) {
    const title = decodeHtml(rssTag(chunk, "title"));
    if (!title) continue;
    const link = rssTag(chunk, "link") || rssTag(chunk, "guid");
    const date = rssTag(chunk, "pubDate");
    out.push({
      title,
      source,
      url: link,
      ts: date ? Date.parse(date) || 0 : 0,
      tickers: tickersIn(title),
    });
  }
  return out;
}

export const getPositions = createServerFn({ method: "GET" }).handler(async () => {
  return cached("positions", 30_000, async (): Promise<PositionRow[]> => {
    const rows = await Promise.all(
      BASES.map(async (base) => {
        try {
          const raw = await getJson(
            `https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=${base}&period=5m`,
          );
          const hist = series(raw, 1).slice(0, 12);
          const ratio = hist[0] ?? 0;
          if (!ratio) return null;
          const older = hist[Math.min(6, hist.length - 1)] ?? ratio;
          return {
            symbol: `${base}USDT`,
            ratio,
            longPct: (ratio / (1 + ratio)) * 100,
            shortPct: (1 / (1 + ratio)) * 100,
            shift: ratio - older,
          } satisfies PositionRow;
        } catch {
          return null;
        }
      }),
    );
    return rows
      .filter((r): r is PositionRow => r != null)
      .sort((a, b) => Math.abs(b.longPct - 50) - Math.abs(a.longPct - 50));
  });
});

export const getPulse = createServerFn({ method: "GET" }).handler(async () => {
  return cached("pulse", 45_000, async (): Promise<Pulse> => {
    const [trending, fees, mempool, hash, ct, decrypt] = await Promise.allSettled([
      getJson("https://api.coingecko.com/api/v3/search/trending"),
      getJson("https://blockstream.info/api/fee-estimates"),
      getText("https://blockchain.info/q/unconfirmedcount"),
      getText("https://blockchain.info/q/hashrate"),
      getText("https://cointelegraph.com/rss"),
      getText("https://decrypt.co/feed"),
    ]);

    const coins: TrendingCoin[] = [];
    if (trending.status === "fulfilled") {
      const list = ((trending.value as { coins?: Array<{ item?: Record<string, unknown> }> }).coins ?? []).slice(
        0,
        12,
      );
      for (const row of list) {
        const item = row.item ?? {};
        const data = (item.data as Record<string, unknown> | undefined) ?? {};
        const ch = data.price_change_percentage_24h as Record<string, number> | number | undefined;
        const usd = typeof ch === "number" ? ch : (ch?.usd ?? 0);
        coins.push({
          symbol: String(item.symbol ?? "").toUpperCase(),
          name: String(item.name ?? ""),
          score: num(item.score),
          changePct: num(usd),
        });
      }
    }

    const onchain: Onchain = {
      mempoolCount: 0,
      fastestFee: 0,
      hashrateEh: 0,
      stableUsd: null,
      stableDelta: null,
    };
    if (fees.status === "fulfilled") {
      const est = fees.value as Record<string, number>;
      onchain.fastestFee = num(est["1"] ?? est["2"]);
    }
    if (mempool.status === "fulfilled") {
      onchain.mempoolCount = num(mempool.value.trim());
    }
    if (hash.status === "fulfilled") {
      onchain.hashrateEh = num(hash.value.trim()) / 1e9;
    }

    const news: NewsItem[] = [];
    if (ct.status === "fulfilled") news.push(...parseRss(ct.value, "CoinTelegraph"));
    if (decrypt.status === "fulfilled") news.push(...parseRss(decrypt.value, "Decrypt"));
    news.sort((a, b) => b.ts - a.ts);

    return { news: news.slice(0, 16), trending: coins, onchain };
  });
});
