import { fetchAllVenues, type UniversePack } from "./venues";
import type { Bar, Candle, LongShort, Snapshot, Ticker, TradePrint } from "./types";

const BARS: Bar[] = ["1m", "5m", "15m", "1H", "4H"];

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toOkxSpot(symbol: string): string {
  if (symbol.endsWith("USDT")) return `${symbol.slice(0, -4)}-USDT`;
  if (symbol.endsWith("USDC")) return `${symbol.slice(0, -4)}-USDC`;
  return symbol;
}

async function getJson(url: string, timeout = 7000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; ATLAS-Desk/1.0)",
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function parseOkxTickers(raw: unknown): Ticker[] {
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

export function parseBinanceTickers(raw: unknown): Ticker[] {
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

function parseGeckoMarkets(raw: unknown): Ticker[] {
  if (!Array.isArray(raw)) return [];
  const out: Ticker[] = [];
  for (const row of raw) {
    const r = row as Record<string, unknown>;
    const base = String(r.symbol ?? "").toUpperCase();
    if (!base || base.length > 10) continue;
    const last = num(r.current_price);
    if (last <= 0) continue;
    const changePct = num(r.price_change_percentage_24h);
    const vol = num(r.total_volume);
    out.push({
      symbol: `${base}USDT`,
      last,
      open: last / (1 + changePct / 100),
      high: num(r.high_24h) || last,
      low: num(r.low_24h) || last,
      changePct,
      quoteVolume: vol,
      volume: vol / last,
      bid: last,
      ask: last,
    });
  }
  return out.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
}

export async function fetchUniverseLive(): Promise<UniversePack> {
  return fetchAllVenues();
}

function series(raw: unknown, col = 1): number[] {
  const data = (raw as { data?: unknown[][] } | null)?.data;
  if (!Array.isArray(data)) return [];
  return data.map((row) => num(row[col])).filter((n) => Number.isFinite(n));
}

function toLs(ratio: number): LongShort | null {
  if (!ratio) return null;
  return { ratio, longAccount: ratio / (1 + ratio), shortAccount: 1 / (1 + ratio) };
}

export async function fetchSnapshotLive(symbol: string, bar: Bar): Promise<Snapshot> {
  const useBar = BARS.includes(bar) ? bar : "15m";
  const spot = toOkxSpot(symbol);
  const swap = `${spot}-SWAP`;
  const base = spot.split("-")[0] ?? "BTC";

  const [books, trades, candles, funding, mark, oi, ls, oiHist, taker, margin] = await Promise.all([
    getJson(`https://www.okx.com/api/v5/market/books?instId=${spot}&sz=20`),
    getJson(`https://www.okx.com/api/v5/market/trades?instId=${spot}&limit=80`),
    getJson(`https://www.okx.com/api/v5/market/candles?instId=${spot}&bar=${useBar}&limit=96`),
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
    getJson(`https://www.okx.com/api/v5/rubik/stat/margin/loan-ratio?ccy=${base}&period=1H`).catch(() => null),
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
  const oiUsd = series(oiHist, 3).slice(0, 24).reverse();
  const takerRows = ((taker as { data?: unknown[][] } | null)?.data ?? []) as unknown[][];

  if (!prints.length && !klines.length && !bookRow?.bids?.length) {
    throw new Error("empty snapshot");
  }

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
    oiChangePct:
      oiUsd.length >= 7 && oiUsd[oiUsd.length - 7] > 0
        ? ((oiUsd[oiUsd.length - 1] - oiUsd[oiUsd.length - 7]) / oiUsd[oiUsd.length - 7]) * 100
        : null,
    oiHistory: oiUsd,
    globalLs: toLs(lsHistory[lsHistory.length - 1] ?? 0),
    lsHistory,
    topLs: null,
    takerBuy: takerRows[0] ? num(takerRows[0][2]) : null,
    takerSell: takerRows[0] ? num(takerRows[0][1]) : null,
    marginLs: series(margin, 1)[0] || null,
  };
}

export async function fetchUniverse(): Promise<UniversePack> {
  try {
    const r = await fetch(`/api/market/universe?t=${Date.now()}`, { cache: "no-store" });
    if (r.ok) {
      const data = (await r.json()) as UniversePack;
      if (data?.tickers && data.tickers.length > 5) {
        return { ...data, ts: data.ts ?? Date.now(), venue: "multi", venues: data.venues ?? {} as UniversePack["venues"] };
      }
    }
  } catch {
    /* fall through */
  }
  return fetchUniverseLive();
}

export async function fetchSnapshot(symbol: string, bar: Bar): Promise<Snapshot> {
  try {
    const r = await fetch(
      `/api/market/snapshot?symbol=${encodeURIComponent(symbol)}&bar=${encodeURIComponent(bar)}&t=${Date.now()}`,
      { cache: "no-store" },
    );
    if (r.ok) {
      const data = (await r.json()) as Snapshot;
      if (data?.last) return data;
    }
  } catch {
    /* fall through */
  }
  return fetchSnapshotLive(symbol, bar);
}
