import type { Ticker } from "./types";

export const VENUE_IDS = ["okx", "binance", "bybit", "bitget", "mexc", "gate", "kucoin", "htx"] as const;
export type VenueId = (typeof VENUE_IDS)[number];

export type VenueHealth = Record<VenueId, boolean>;

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normSymbol(raw: string): string | null {
  let s = raw.toUpperCase().replace(/[-_/]/g, "");
  if (s.endsWith("USD") && !s.endsWith("USDT") && !s.endsWith("USDC")) s = `${s}T`;
  if (!s.endsWith("USDT")) return null;
  if (s.includes("DOWN") || s.includes("UPUSDT") || s.includes("BULL") || s.includes("BEAR")) return null;
  if (s.length < 7 || s.length > 16) return null;
  return s;
}

function row(
  symbol: string,
  last: number,
  changePct: number,
  quoteVolume: number,
  bid: number,
  ask: number,
  high: number,
  low: number,
  open: number,
  volume: number,
): Ticker | null {
  if (!symbol || last <= 0 || quoteVolume < 250_000) return null;
  return {
    symbol,
    last,
    open: open || last / (1 + changePct / 100),
    high: high || last,
    low: low || last,
    changePct,
    quoteVolume,
    volume,
    bid: bid || last,
    ask: ask || last,
    venues: [],
  };
}

async function getJson(url: string, timeout = 5000): Promise<unknown> {
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
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function parseOkx(raw: unknown): Ticker[] {
  const data = (raw as { data?: unknown[] })?.data;
  if (!Array.isArray(data)) return [];
  const out: Ticker[] = [];
  for (const item of data) {
    const r = item as Record<string, unknown>;
    const symbol = normSymbol(String(r.instId ?? ""));
    if (!symbol) continue;
    const last = num(r.last);
    const open = num(r.open24h);
    const t = row(
      symbol,
      last,
      open > 0 ? ((last - open) / open) * 100 : 0,
      num(r.volCcy24h),
      num(r.bidPx),
      num(r.askPx),
      num(r.high24h),
      num(r.low24h),
      open,
      num(r.vol24h),
    );
    if (t) out.push(t);
  }
  return out;
}

function parseBinance(raw: unknown): Ticker[] {
  if (!Array.isArray(raw)) return [];
  const out: Ticker[] = [];
  for (const item of raw) {
    const r = item as Record<string, unknown>;
    const symbol = normSymbol(String(r.symbol ?? ""));
    if (!symbol) continue;
    const t = row(
      symbol,
      num(r.lastPrice),
      num(r.priceChangePercent),
      num(r.quoteVolume),
      num(r.bidPrice),
      num(r.askPrice),
      num(r.highPrice),
      num(r.lowPrice),
      num(r.openPrice),
      num(r.volume),
    );
    if (t) out.push(t);
  }
  return out;
}

function parseBybit(raw: unknown): Ticker[] {
  const list = (raw as { result?: { list?: unknown[] } })?.result?.list;
  if (!Array.isArray(list)) return [];
  const out: Ticker[] = [];
  for (const item of list) {
    const r = item as Record<string, unknown>;
    const symbol = normSymbol(String(r.symbol ?? ""));
    if (!symbol) continue;
    const chg = num(r.price24hPcnt);
    const t = row(
      symbol,
      num(r.lastPrice),
      Math.abs(chg) <= 1 ? chg * 100 : chg,
      num(r.turnover24h),
      num(r.bid1Price),
      num(r.ask1Price),
      num(r.highPrice24h),
      num(r.lowPrice24h),
      0,
      num(r.volume24h),
    );
    if (t) out.push(t);
  }
  return out;
}

function parseBitget(raw: unknown): Ticker[] {
  const data = (raw as { data?: unknown[] })?.data;
  if (!Array.isArray(data)) return [];
  const out: Ticker[] = [];
  for (const item of data) {
    const r = item as Record<string, unknown>;
    const symbol = normSymbol(String(r.symbol ?? ""));
    if (!symbol) continue;
    const t = row(
      symbol,
      num(r.lastPr),
      num(r.change24h) * 100,
      num(r.usdtVolume || r.quoteVolume),
      num(r.bidPr),
      num(r.askPr),
      num(r.high24h),
      num(r.low24h),
      num(r.open),
      num(r.baseVolume),
    );
    if (t) out.push(t);
  }
  return out;
}

function parseMexc(raw: unknown): Ticker[] {
  if (!Array.isArray(raw)) return [];
  const out: Ticker[] = [];
  for (const item of raw) {
    const r = item as Record<string, unknown>;
    const symbol = normSymbol(String(r.symbol ?? ""));
    if (!symbol) continue;
    let chg = num(r.priceChangePercent);
    if (Math.abs(chg) <= 1) chg *= 100;
    const t = row(
      symbol,
      num(r.lastPrice),
      chg,
      num(r.quoteVolume),
      num(r.bidPrice),
      num(r.askPrice),
      num(r.highPrice),
      num(r.lowPrice),
      num(r.openPrice),
      num(r.volume),
    );
    if (t) out.push(t);
  }
  return out;
}

function parseGate(raw: unknown): Ticker[] {
  if (!Array.isArray(raw)) return [];
  const out: Ticker[] = [];
  for (const item of raw) {
    const r = item as Record<string, unknown>;
    const symbol = normSymbol(String(r.currency_pair ?? ""));
    if (!symbol) continue;
    const t = row(
      symbol,
      num(r.last),
      num(r.change_percentage),
      num(r.quote_volume),
      num(r.highest_bid),
      num(r.lowest_ask),
      num(r.high_24h),
      num(r.low_24h),
      0,
      num(r.base_volume),
    );
    if (t) out.push(t);
  }
  return out;
}

function parseKucoin(raw: unknown): Ticker[] {
  const list = (raw as { data?: { ticker?: unknown[] } })?.data?.ticker;
  if (!Array.isArray(list)) return [];
  const out: Ticker[] = [];
  for (const item of list) {
    const r = item as Record<string, unknown>;
    const symbol = normSymbol(String(r.symbol ?? ""));
    if (!symbol) continue;
    const t = row(
      symbol,
      num(r.last),
      num(r.changeRate) * 100,
      num(r.volValue),
      num(r.buy),
      num(r.sell),
      num(r.high),
      num(r.low),
      num(r.open),
      num(r.vol),
    );
    if (t) out.push(t);
  }
  return out;
}

function parseHtx(raw: unknown): Ticker[] {
  const data = (raw as { data?: unknown[] })?.data;
  if (!Array.isArray(data)) return [];
  const out: Ticker[] = [];
  for (const item of data) {
    const r = item as Record<string, unknown>;
    const symbol = normSymbol(String(r.symbol ?? ""));
    if (!symbol) continue;
    const last = num(r.close);
    const open = num(r.open);
    const t = row(
      symbol,
      last,
      open > 0 ? ((last - open) / open) * 100 : 0,
      num(r.vol),
      num(r.bid),
      num(r.ask),
      num(r.high),
      num(r.low),
      open,
      num(r.amount),
    );
    if (t) out.push(t);
  }
  return out;
}

const FEEDS: { id: VenueId; url: string; parse: (raw: unknown) => Ticker[] }[] = [
  { id: "okx", url: "https://www.okx.com/api/v5/market/tickers?instType=SPOT", parse: parseOkx },
  { id: "binance", url: "https://api.binance.us/api/v3/ticker/24hr", parse: parseBinance },
  { id: "bybit", url: "https://api.bybit.com/v5/market/tickers?category=spot", parse: parseBybit },
  { id: "bitget", url: "https://api.bitget.com/api/v2/spot/market/tickers", parse: parseBitget },
  { id: "mexc", url: "https://api.mexc.com/api/v3/ticker/24hr", parse: parseMexc },
  { id: "gate", url: "https://api.gateio.ws/api/v4/spot/tickers", parse: parseGate },
  { id: "kucoin", url: "https://api.kucoin.com/api/v1/market/allTickers", parse: parseKucoin },
  { id: "htx", url: "https://api.huobi.pro/market/tickers", parse: parseHtx },
];

function merge(parts: { id: VenueId; tickers: Ticker[] }[]): Ticker[] {
  const map = new Map<
    string,
    { lastW: number; volW: number; chgW: number; bid: number; ask: number; high: number; low: number; open: number; volume: number; venues: string[] }
  >();
  for (const part of parts) {
    for (const t of part.tickers) {
      const cur = map.get(t.symbol) ?? {
        lastW: 0,
        volW: 0,
        chgW: 0,
        bid: 0,
        ask: 0,
        high: 0,
        low: 0,
        open: 0,
        volume: 0,
        venues: [],
      };
      const w = Math.max(t.quoteVolume, 1);
      cur.lastW += t.last * w;
      cur.chgW += t.changePct * w;
      cur.volW += w;
      cur.bid = cur.bid ? Math.max(cur.bid, t.bid) : t.bid;
      cur.ask = cur.ask ? Math.min(cur.ask, t.ask) || t.ask : t.ask;
      cur.high = Math.max(cur.high, t.high);
      cur.low = cur.low ? Math.min(cur.low, t.low) : t.low;
      cur.open = t.open || cur.open;
      cur.volume += t.volume;
      cur.venues.push(part.id);
      map.set(t.symbol, cur);
    }
  }
  const out: Ticker[] = [];
  for (const [symbol, c] of map) {
    if (c.volW < 800_000) continue;
    out.push({
      symbol,
      last: c.lastW / c.volW,
      open: c.open,
      high: c.high,
      low: c.low,
      changePct: c.chgW / c.volW,
      quoteVolume: c.volW,
      volume: c.volume,
      bid: c.bid,
      ask: c.ask,
      venues: c.venues,
    });
  }
  return out.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 220);
}

export type UniversePack = {
  venue: "multi";
  tickers: Ticker[];
  ts: number;
  venues: VenueHealth;
};

let cache: { t: number; v: UniversePack } | null = null;

export async function fetchAllVenues(): Promise<UniversePack> {
  if (cache && Date.now() - cache.t < 2800) return cache.v;
  const venues = Object.fromEntries(VENUE_IDS.map((id) => [id, false])) as VenueHealth;
  const settled = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const raw = await getJson(f.url);
      const tickers = f.parse(raw);
      if (tickers.length < 8) throw new Error("thin");
      return { id: f.id, tickers };
    }),
  );
  const parts: { id: VenueId; tickers: Ticker[] }[] = [];
  settled.forEach((s, i) => {
    const id = FEEDS[i].id;
    if (s.status === "fulfilled") {
      venues[id] = true;
      parts.push(s.value);
    }
  });
  const tickers = merge(parts);
  if (!tickers.length) throw new Error("universe offline");
  const pack: UniversePack = { venue: "multi", tickers, ts: Date.now(), venues };
  cache = { t: Date.now(), v: pack };
  return pack;
}
