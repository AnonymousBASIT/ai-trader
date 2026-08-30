import type {
  AlphaCandidate,
  CarryRow,
  HarvestIdea,
  LongShort,
  Pulse,
  RadarAlert,
  Side,
  Snapshot,
  Ticker,
  TradePrint,
} from "./types";

export function bookImbalance(snap: Snapshot | null): number | null {
  if (!snap) return null;
  const bid = snap.depth.bids.slice(0, 10).reduce((s, l) => s + l.qty * l.price, 0);
  const ask = snap.depth.asks.slice(0, 10).reduce((s, l) => s + l.qty * l.price, 0);
  if (ask <= 0) return null;
  return bid / ask;
}

export function spreadBps(snap: Snapshot | null): number | null {
  if (!snap) return null;
  const bid = snap.depth.bids[0]?.price;
  const ask = snap.depth.asks[0]?.price;
  if (!bid || !ask) return null;
  const mid = (bid + ask) / 2;
  if (mid <= 0) return null;
  return ((ask - bid) / mid) * 10000;
}

export function tapeDelta(trades: TradePrint[]): { cvd: number; buy: number; sell: number; vwap: number } {
  let cvd = 0;
  let buy = 0;
  let sell = 0;
  let notional = 0;
  let qty = 0;
  for (const t of trades) {
    const n = t.price * t.qty;
    if (t.isBuyerMaker) {
      cvd -= t.qty;
      sell += n;
    } else {
      cvd += t.qty;
      buy += n;
    }
    notional += n;
    qty += t.qty;
  }
  return { cvd, buy, sell, vwap: qty > 0 ? notional / qty : 0 };
}

export function rsi14(klines: Snapshot["klines"]): number | null {
  if (klines.length < 16) return null;
  let gain = 0;
  let loss = 0;
  for (let i = klines.length - 14; i < klines.length; i++) {
    const d = klines[i].c - klines[i - 1].c;
    if (d >= 0) gain += d;
    else loss -= d;
  }
  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

export function valueArea(klines: Snapshot["klines"]): { poc: number; vah: number; val: number } | null {
  if (!klines.length) return null;
  const bins = new Map<number, number>();
  let step = 0;
  for (const k of klines) step += k.h - k.l || 0;
  step = Math.max(step / klines.length / 8, 1e-12);
  for (const k of klines) {
    const lo = Math.min(k.l, k.h);
    const hi = Math.max(k.l, k.h);
    const n = Math.max(1, Math.round((hi - lo) / step));
    const q = k.v / n;
    for (let i = 0; i < n; i++) {
      const px = lo + i * step;
      const key = Math.round(px / step);
      bins.set(key, (bins.get(key) ?? 0) + q);
    }
  }
  const entries = [...bins.entries()].sort((a, b) => a[0] - b[0]);
  if (!entries.length) return null;
  const total = entries.reduce((s, e) => s + e[1], 0);
  let pocIdx = 0;
  for (let i = 1; i < entries.length; i++) if (entries[i][1] > entries[pocIdx][1]) pocIdx = i;
  let acc = entries[pocIdx][1];
  let lo = pocIdx;
  let hi = pocIdx;
  const target = total * 0.7;
  while (acc < target && (lo > 0 || hi < entries.length - 1)) {
    const left = lo > 0 ? entries[lo - 1][1] : -1;
    const right = hi < entries.length - 1 ? entries[hi + 1][1] : -1;
    if (right >= left) {
      hi += 1;
      acc += entries[hi][1];
    } else {
      lo -= 1;
      acc += entries[lo][1];
    }
  }
  return {
    poc: entries[pocIdx][0] * step,
    val: entries[lo][0] * step,
    vah: entries[hi][0] * step,
  };
}

export function lsDivergence(globalLs: LongShort | null, topLs: LongShort | null) {
  if (!globalLs || !topLs) return { diverging: false, note: "Need both retail and top-trader ratios." };
  const g = globalLs.ratio;
  const t = topLs.ratio;
  if (g > 1.3 && t < 0.9) {
    return {
      diverging: true,
      note: "Retail heavily long, large traders leaning short — distribution.",
    };
  }
  if (g < 0.77 && t > 1.1) {
    return {
      diverging: true,
      note: "Retail heavily short, large traders leaning long — accumulation.",
    };
  }
  return { diverging: false, note: "Retail and large traders are not in conflict." };
}

export function fragilityScore(snap: Snapshot | null): number {
  if (!snap) return 0;
  let s = 20;
  const f = snap.funding.rate;
  if (f != null) {
    const abs = Math.abs(f);
    if (abs > 0.001) s += 35;
    else if (abs > 0.0005) s += 22;
    else if (abs > 0.0002) s += 10;
  }
  const div = lsDivergence(snap.globalLs, snap.topLs);
  if (div.diverging) s += 20;
  if (snap.globalLs && (snap.globalLs.ratio > 1.6 || snap.globalLs.ratio < 0.6)) s += 15;
  const r = rsi14(snap.klines);
  if (r != null && (r > 75 || r < 25)) s += 10;
  if (snap.oiChangePct != null && Math.abs(snap.oiChangePct) > 1.5) s += 12;
  if (snap.takerBuy != null && snap.takerSell != null && snap.takerSell > 0) {
    const t = snap.takerBuy / snap.takerSell;
    if (t > 1.8 || t < 0.55) s += 10;
  }
  return Math.max(0, Math.min(100, s));
}

export function relativeStrength(t: Ticker, btc: Ticker | undefined): number {
  if (!btc) return t.changePct;
  return t.changePct - btc.changePct;
}

export function planTrade({
  symbol,
  last,
  side,
  equity,
  reasons,
  score,
  slPct = 0.012,
}: {
  symbol: string;
  last: number;
  side: Side;
  equity: number;
  reasons: string[];
  score: number;
  slPct?: number;
}): AlphaCandidate {
  const sl = side === "LONG" ? last * (1 - slPct) : last * (1 + slPct);
  const tp1 = side === "LONG" ? last * (1 + slPct * 2.2) : last * (1 - slPct * 2.2);
  const tp2 = side === "LONG" ? last * (1 + slPct * 3.6) : last * (1 - slPct * 3.6);
  const tp3 = side === "LONG" ? last * (1 + slPct * 5.5) : last * (1 - slPct * 5.5);
  const riskFrac = slPct;
  const sizeUsd = Math.min(Math.max(equity * 0.005 / riskFrac, 80), equity * 0.03, 4000);
  return {
    symbol,
    side,
    score,
    reasons,
    rr: 2.2,
    entry: last,
    sl,
    tp1,
    tp2,
    tp3,
    sizeUsd,
  };
}

export function alertToCandidate(a: RadarAlert, equity: number): AlphaCandidate | null {
  if (!a.side || !a.entry || !a.sl || !a.tp1) return null;
  const sizeUsd = a.sizeUsd && a.sizeUsd > 0 ? Math.min(a.sizeUsd, equity * 0.03) : Math.min(equity * 0.02, 4000);
  return {
    symbol: a.symbol,
    side: a.side,
    score: a.score ?? 1,
    reasons: [a.message],
    rr: a.rr ?? 2.2,
    entry: a.entry,
    sl: a.sl,
    tp1: a.tp1,
    tp2: a.tp2 ?? a.tp1,
    tp3: a.tp3 ?? a.tp1,
    sizeUsd,
  };
}

function stamp(
  base: Omit<RadarAlert, "entry" | "sl" | "tp1" | "tp2" | "tp3" | "rr" | "sizeUsd"> & { side: Side; score: number },
  last: number,
): RadarAlert {
  const p = planTrade({
    symbol: base.symbol,
    last,
    side: base.side,
    equity: 100_000,
    reasons: [base.message],
    score: base.score,
  });
  return { ...base, entry: p.entry, sl: p.sl, tp1: p.tp1, tp2: p.tp2, tp3: p.tp3, rr: p.rr, sizeUsd: p.sizeUsd };
}

export function scanRadar(prev: Ticker[] | null, next: Ticker[], now = Date.now()): RadarAlert[] {
  if (!prev) return [];
  const map = new Map(prev.map((t) => [t.symbol, t]));
  const btc = next.find((t) => t.symbol === "BTCUSDT");
  const out: RadarAlert[] = [];
  for (const t of next) {
    const p = map.get(t.symbol);
    if (!p || p.last <= 0) continue;
    const burst = ((t.last - p.last) / p.last) * 100;
    if (Math.abs(burst) >= 1.1 && t.quoteVolume > 8_000_000) {
      out.push(
        stamp(
          {
            id: `${t.symbol}-${now}-burst`,
            ts: now,
            symbol: t.symbol,
            kind: burst > 0 ? "PUMP" : "DUMP",
            message: `${burst > 0 ? "Burst up" : "Burst down"} ${burst.toFixed(2)}% in a few seconds — ${t.venues?.length ?? 1} venues`,
            changePct: burst,
            quoteVolume: t.quoteVolume,
            side: burst > 0 ? "LONG" : "SHORT",
            score: 3,
          },
          t.last,
        ),
      );
    } else if (Math.abs(t.changePct) >= 16 && t.quoteVolume > 15_000_000) {
      out.push(
        stamp(
          {
            id: `${t.symbol}-${Math.floor(now / 300_000)}-mover`,
            ts: now,
            symbol: t.symbol,
            kind: "MOVER",
            message: `24h ${t.changePct >= 0 ? "+" : ""}${t.changePct.toFixed(1)}% on ${fmtM(t.quoteVolume)} USDT across ${t.venues?.length ?? 1} books`,
            changePct: t.changePct,
            quoteVolume: t.quoteVolume,
            side: t.changePct >= 0 ? "LONG" : "SHORT",
            score: 2,
          },
          t.last,
        ),
      );
    }
    if (btc && t.symbol !== "BTCUSDT" && t.quoteVolume > 12_000_000) {
      const rs = t.changePct - btc.changePct;
      if (Math.abs(rs) >= 14) {
        out.push(
          stamp(
            {
              id: `${t.symbol}-${Math.floor(now / 300_000)}-rs`,
              ts: now,
              symbol: t.symbol,
              kind: "RS",
              message: `${rs > 0 ? "Leading" : "Lagging"} BTC by ${Math.abs(rs).toFixed(1)} pts — relative-strength ${rs > 0 ? "long" : "short"}`,
              changePct: rs,
              quoteVolume: t.quoteVolume,
              side: rs > 0 ? "LONG" : "SHORT",
              score: 2,
            },
            t.last,
          ),
        );
      }
    }
  }
  const seen = new Set<string>();
  return out
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || Math.abs(b.changePct) - Math.abs(a.changePct))
    .filter((a) => {
      if (seen.has(a.symbol)) return false;
      seen.add(a.symbol);
      return true;
    })
    .slice(0, 6);
}

function fmtM(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  return `${(n / 1e3).toFixed(0)}K`;
}

export const BEFORE_KINDS = new Set(["PRE", "LEV", "CROWD", "NEWS", "CHAIN", "SEARCH"]);

function recentPxPct(snap: Snapshot): number | null {
  const k = snap.klines;
  if (k.length < 3) return null;
  const a = k[k.length - 3]?.c;
  const b = k[k.length - 1]?.c;
  if (!a) return null;
  return ((b - a) / a) * 100;
}

function bookWall(snap: Snapshot): { side: "bid" | "ask"; multiple: number } | null {
  const bids = snap.depth.bids.slice(0, 12).map((l) => l.qty * l.price);
  const asks = snap.depth.asks.slice(0, 12).map((l) => l.qty * l.price);
  if (bids.length < 4 || asks.length < 4) return null;
  const med = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)] || 1;
  };
  const bidMult = bids[0] / med(bids.slice(1));
  const askMult = asks[0] / med(asks.slice(1));
  if (bidMult >= 3.2 && bidMult >= askMult) return { side: "bid", multiple: bidMult };
  if (askMult >= 3.2) return { side: "ask", multiple: askMult };
  return null;
}

export function scanForesight({
  snap,
  tickers,
  pulse,
  now = Date.now(),
}: {
  snap: Snapshot | null;
  tickers: Ticker[];
  pulse: Pulse | null;
  now?: number;
}): RadarAlert[] {
  const out: RadarAlert[] = [];
  const bucket = Math.floor(now / 60_000);
  const ticker = snap ? tickers.find((t) => t.symbol === snap.symbol) : undefined;
  const vol = ticker?.quoteVolume ?? 0;

  if (snap && !snap.error) {
    const px = recentPxPct(snap);
    const quiet = px == null || Math.abs(px) < 0.45;
    const last = snap.last || ticker?.last || 0;

    if (last > 0 && snap.oiChangePct != null && snap.oiChangePct >= 2.2 && quiet) {
      out.push(
        stamp(
          {
            id: `${snap.symbol}-${bucket}-lev`,
            ts: now,
            symbol: snap.symbol,
            kind: "LEV",
            message: `Open interest +${snap.oiChangePct.toFixed(1)}% in ~30m while price is still quiet — leverage loading`,
            changePct: px ?? 0,
            quoteVolume: vol,
            side: (snap.takerBuy ?? 0) >= (snap.takerSell ?? 0) ? "LONG" : "SHORT",
            score: 3,
          },
          last,
        ),
      );
    }

    const ls = snap.globalLs;
    const hist = snap.lsHistory;
    if (last > 0 && ls && hist.length >= 4) {
      const prevR = hist[hist.length - 4];
      const crowdingLong = ls.ratio >= 1.55 && ls.ratio > prevR;
      const crowdingShort = ls.ratio <= 0.68 && ls.ratio < prevR;
      if (crowdingLong || crowdingShort) {
        out.push(
          stamp(
            {
              id: `${snap.symbol}-${bucket}-crowd`,
              ts: now,
              symbol: snap.symbol,
              kind: "CROWD",
              message: crowdingLong
                ? `Accounts crowding long (${(ls.longAccount * 100).toFixed(0)}%) — fade the crowded side`
                : `Accounts crowding short (${(ls.shortAccount * 100).toFixed(0)}%) — fade the crowded side`,
              changePct: px ?? 0,
              quoteVolume: vol,
              side: crowdingLong ? "SHORT" : "LONG",
              score: 3,
            },
            last,
          ),
        );
      }
    }

    if (last > 0 && snap.takerBuy != null && snap.takerSell != null && snap.takerSell > 0 && quiet) {
      const t = snap.takerBuy / snap.takerSell;
      if (t >= 2.1 || t <= 0.48) {
        out.push(
          stamp(
            {
              id: `${snap.symbol}-${bucket}-taker`,
              ts: now,
              symbol: snap.symbol,
              kind: "PRE",
              message:
                t >= 2.1
                  ? `Aggressive perp buyers ${t.toFixed(2)}× sellers this 5m — flow before the print`
                  : `Aggressive perp sellers ${(1 / t).toFixed(2)}× buyers this 5m — flow before the print`,
              changePct: px ?? 0,
              quoteVolume: vol,
              side: t >= 2.1 ? "LONG" : "SHORT",
              score: 3,
            },
            last,
          ),
        );
      }
    }

    const wall = bookWall(snap);
    if (last > 0 && wall && wall.multiple >= 4.8) {
      out.push(
        stamp(
          {
            id: `${snap.symbol}-${bucket}-wall`,
            ts: now,
            symbol: snap.symbol,
            kind: "PRE",
            message: `${wall.side === "bid" ? "Bid" : "Ask"} wall ${wall.multiple.toFixed(1)}× the rest of the book — absorption`,
            changePct: px ?? 0,
            quoteVolume: vol,
            side: wall.side === "bid" ? "LONG" : "SHORT",
            score: 3,
          },
          last,
        ),
      );
    }
  }

  if (pulse) {
    const map = new Map(tickers.map((t) => [t.symbol.replace("USDT", ""), t]));
    const trending = pulse.trending
      .filter((c) => {
        const t = map.get(c.symbol);
        return t && Math.abs(c.changePct) < 2.5 && t.quoteVolume > 8_000_000;
      })
      .slice(0, 1);
    for (const c of trending) {
      const t = map.get(c.symbol);
      if (!t) continue;
      out.push(
        stamp(
          {
            id: `${t.symbol}-${bucket}-search`,
            ts: now,
            symbol: t.symbol,
            kind: "SEARCH",
            message: `${c.name} is trending in search while 24h is only ${c.changePct >= 0 ? "+" : ""}${c.changePct.toFixed(1)}%`,
            changePct: c.changePct,
            quoteVolume: t.quoteVolume,
            side: c.changePct >= 0 ? "LONG" : "SHORT",
            score: 2,
          },
          t.last,
        ),
      );
    }
    let newsN = 0;
    for (const n of pulse.news.slice(0, 8)) {
      if (newsN >= 2) break;
      for (const base of n.tickers) {
        const t = map.get(base);
        if (!t || t.quoteVolume < 10_000_000 || Math.abs(t.changePct) >= 5) continue;
        out.push(
          stamp(
            {
              id: `${t.symbol}-${bucket}-news`,
              ts: now,
              symbol: t.symbol,
              kind: "NEWS",
              message: `${n.source}: ${n.title.slice(0, 90)}`,
              changePct: t.changePct,
              quoteVolume: t.quoteVolume,
              side: t.changePct >= 0 ? "LONG" : "SHORT",
              score: 2,
            },
            t.last,
          ),
        );
        newsN += 1;
        break;
      }
    }
    if (pulse.onchain.mempoolCount >= 120_000 || pulse.onchain.fastestFee >= 25) {
      const btc = tickers.find((t) => t.symbol === "BTCUSDT");
      if (btc) {
        out.push(
          stamp(
            {
              id: `BTCUSDT-${bucket}-chain`,
              ts: now,
              symbol: "BTCUSDT",
              kind: "CHAIN",
              message: `Bitcoin mempool ${pulse.onchain.mempoolCount.toLocaleString()} txs · fee ${pulse.onchain.fastestFee} sat/vB`,
              changePct: btc.changePct,
              quoteVolume: btc.quoteVolume,
              side: btc.changePct >= 0 ? "LONG" : "SHORT",
              score: 1,
            },
            btc.last,
          ),
        );
      }
    }
  }

  const seen = new Set<string>();
  return out
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .filter((a) => {
      if (seen.has(`${a.symbol}-${a.kind}`)) return false;
      seen.add(`${a.symbol}-${a.kind}`);
      return true;
    })
    .slice(0, 8);
}

export function buildAlpha(symbol: string, snap: Snapshot, equity: number): AlphaCandidate | null {
  const last = snap.last || snap.trades[0]?.price;
  if (!last) return null;
  const imb = bookImbalance(snap);
  const tape = tapeDelta(snap.trades);
  const fund = snap.funding.rate;
  const div = lsDivergence(snap.globalLs, snap.topLs);
  const rsi = rsi14(snap.klines);
  const reasons: string[] = [];
  let longPts = 0;
  let shortPts = 0;

  if (imb != null && imb >= 1.8) {
    longPts += 1;
    reasons.push(`Book bid-heavy (imbalance ${imb.toFixed(2)})`);
  } else if (imb != null && imb <= 0.55) {
    shortPts += 1;
    reasons.push(`Book offer-heavy (imbalance ${imb.toFixed(2)})`);
  }

  if (tape.cvd > 0 && tape.buy > tape.sell) {
    longPts += 1;
    reasons.push("Aggressive buyers dominate the recent tape (CVD > 0)");
  } else if (tape.cvd < 0 && tape.sell > tape.buy) {
    shortPts += 1;
    reasons.push("Aggressive sellers dominate the recent tape (CVD < 0)");
  }

  if (tape.vwap > 0 && last > tape.vwap) {
    longPts += 1;
    reasons.push("Last is above tape VWAP");
  } else if (tape.vwap > 0 && last < tape.vwap) {
    shortPts += 1;
    reasons.push("Last is below tape VWAP");
  }

  if (fund != null && fund > 0.0005) {
    shortPts += 1;
    reasons.push(`Funding crowded long (${(fund * 100).toFixed(3)}% / 8h) — squeeze fuel`);
  } else if (fund != null && fund < -0.0003) {
    longPts += 1;
    reasons.push(`Funding crowded short (${(fund * 100).toFixed(3)}% / 8h)`);
  } else if (fund != null && Math.abs(fund) < 0.00015) {
    longPts += 0.5;
    shortPts += 0.5;
    reasons.push("Funding is quiet — less crowded");
  }

  if (div.diverging && div.note.includes("accumulation")) {
    longPts += 1;
    reasons.push(div.note);
  } else if (div.diverging && div.note.includes("distribution")) {
    shortPts += 1;
    reasons.push(div.note);
  }

  if (rsi != null && rsi < 30) {
    longPts += 1;
    reasons.push(`RSI(14) oversold at ${rsi.toFixed(0)}`);
  } else if (rsi != null && rsi > 70) {
    shortPts += 1;
    reasons.push(`RSI(14) overbought at ${rsi.toFixed(0)}`);
  }

  if (snap.takerBuy != null && snap.takerSell != null && snap.takerSell > 0) {
    const t = snap.takerBuy / snap.takerSell;
    if (t >= 1.6) {
      longPts += 1;
      reasons.push(`Perp takers buying ${t.toFixed(2)}× selling`);
    } else if (t <= 0.62) {
      shortPts += 1;
      reasons.push(`Perp takers selling ${(1 / t).toFixed(2)}× buying`);
    }
  }

  if (snap.globalLs && snap.globalLs.ratio >= 1.7) {
    shortPts += 0.5;
    reasons.push("Retail accounts max-long — crowded");
  } else if (snap.globalLs && snap.globalLs.ratio <= 0.6) {
    longPts += 0.5;
    reasons.push("Retail accounts max-short — crowded");
  }

  const side: Side | null =
    longPts >= 3 && longPts > shortPts ? "LONG" : shortPts >= 3 && shortPts > longPts ? "SHORT" : null;
  if (!side) return null;

  const score = Math.round(Math.max(longPts, shortPts) * 20);
  const slPct = 0.01;
  const tp1Pct = 0.025;
  const sl = side === "LONG" ? last * (1 - slPct) : last * (1 + slPct);
  const tp1 = side === "LONG" ? last * (1 + tp1Pct) : last * (1 - tp1Pct);
  const tp2 = side === "LONG" ? last * (1 + 0.04) : last * (1 - 0.04);
  const tp3 = side === "LONG" ? last * (1 + 0.06) : last * (1 - 0.06);
  const rr = tp1Pct / slPct;
  if (rr < 2.5) return null;

  const sizeUsd = Math.min(equity * 0.02, 5000);
  return {
    symbol,
    side,
    score,
    reasons,
    rr,
    entry: last,
    sl,
    tp1,
    tp2,
    tp3,
    sizeUsd,
  };
}

export function buildHarvest(symbol: string, snap: Snapshot): HarvestIdea | null {
  const f = snap.funding.rate;
  if (f == null || Math.abs(f) < 0.0001) return null;
  const apr = f * 3 * 365 * 100;
  if (f > 0) {
    return {
      symbol,
      funding: f,
      apr,
      action: "HARVEST LONG SPOT / SHORT PERP",
      why: `Longs are paying ${(f * 100).toFixed(3)}% every 8h. Collect that transfer while staying near delta-neutral. You do not need the coin to go up.`,
    };
  }
  return {
    symbol,
    funding: f,
    apr,
    action: "HARVEST SHORT SPOT / LONG PERP",
    why: `Shorts are paying ${Math.abs(f * 100).toFixed(3)}% every 8h. Flip the carry: long the perp, short or underweight spot.`,
  };
}

export function rankCarry(rows: CarryRow[]): CarryRow[] {
  return [...rows].sort((a, b) => Math.abs(b.funding) - Math.abs(a.funding));
}

export const STARTING_CASH = 100_000;
export const SLIPPAGE = 0.0005;
export const FEE = 0.0004;
export const DAILY_HALT = -0.03;
