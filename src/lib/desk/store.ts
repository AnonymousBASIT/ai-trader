import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DAILY_HALT, FEE, SLIPPAGE, STARTING_CASH, alertToCandidate, scanRadar } from "./engine";
import type {
  AlphaCandidate,
  Bar,
  PaperFill,
  PaperPosition,
  PaperState,
  RadarAlert,
  Section,
  Side,
  Snapshot,
  SortMode,
  Ticker,
} from "./types";

type DeskState = {
  symbol: string;
  section: Section;
  helpOpen: boolean;
  helpSeen: boolean;
  query: string;
  paper: PaperState;
  alerts: RadarAlert[];
  prevTickers: Ticker[] | null;
  halt: string | null;
  sparks: Record<string, number[]>;
  bar: Bar;
  sortMode: SortMode;
  autoPaper: boolean;
  setSymbol: (s: string) => void;
  setSection: (s: Section) => void;
  setQuery: (q: string) => void;
  setHelpOpen: (v: boolean) => void;
  setBar: (b: Bar) => void;
  setSortMode: (m: SortMode) => void;
  markHelpSeen: () => void;
  ingestTickers: (tickers: Ticker[]) => void;
  ingestForesight: (fresh: RadarAlert[]) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
  setAutoPaper: (v: boolean) => void;
  executeAlert: (id: string) => string | null;
  openPaper: (c: AlphaCandidate) => string | null;
  markToMarket: (snap: Snapshot | null, tickers: Ticker[]) => void;
  closePosition: (id: string, price: number, note: string) => void;
  resetPaper: () => void;
};

function emptyPaper(): PaperState {
  return {
    cash: STARTING_CASH,
    equity: STARTING_CASH,
    positions: [],
    fills: [],
    dailyPnl: 0,
    highWater: STARTING_CASH,
  };
}

function fillPrice(side: Side, last: number, closing: boolean) {
  if (!closing) return side === "LONG" ? last * (1 + SLIPPAGE) : last * (1 - SLIPPAGE);
  return side === "LONG" ? last * (1 - SLIPPAGE) : last * (1 + SLIPPAGE);
}

function mtmEquity(cash: number, positions: PaperPosition[], pxOf: (s: string) => number) {
  return (
    cash +
    positions.reduce((sum, p) => {
      const last = pxOf(p.symbol) || p.entry;
      return sum + last * p.qty;
    }, 0)
  );
}

function autoFill(get: () => DeskState, set: (p: Partial<DeskState> | ((s: DeskState) => Partial<DeskState>)) => void, incoming: RadarAlert[]) {
  if (!get().autoPaper) return;
  for (const a of incoming) {
    if ((a.score ?? 0) < 3 || a.executed) continue;
    if (get().paper.positions.some((p) => p.symbol === a.symbol)) continue;
    const c = alertToCandidate(a, get().paper.equity);
    if (!c) continue;
    const err = get().openPaper(c);
    if (!err) {
      set({
        alerts: get().alerts.map((x) => (x.id === a.id ? { ...x, executed: true } : x)),
      });
    }
  }
}

export const useDesk = create<DeskState>()(
  persist(
    (set, get) => ({
      symbol: "BTCUSDT",
      section: "overview",
      helpOpen: false,
      helpSeen: false,
      query: "",
      paper: emptyPaper(),
      alerts: [],
      prevTickers: null,
      halt: null,
      sparks: {},
      bar: "15m",
      sortMode: "move",
      autoPaper: true,
      setSymbol: (s) => set({ symbol: s }),
      setSection: (s) => set({ section: s }),
      setQuery: (q) => set({ query: q }),
      setHelpOpen: (v) => set({ helpOpen: v }),
      setBar: (b) => set({ bar: b }),
      setSortMode: (m) => set({ sortMode: m }),
      setAutoPaper: (v) => set({ autoPaper: v }),
      markHelpSeen: () => set({ helpSeen: true, helpOpen: false, section: "overview" }),
      ingestTickers: (tickers) => {
        const prev = get().prevTickers;
        const fresh = scanRadar(prev, tickers);
        const sparks = { ...get().sparks };
        for (const t of tickers.slice(0, 80)) {
          const hist = sparks[t.symbol] ?? [];
          if (hist[hist.length - 1] !== t.last) {
            sparks[t.symbol] = [...hist, t.last].slice(-24);
          }
        }
        set({
          prevTickers: tickers,
          alerts: [...fresh, ...get().alerts].slice(0, 60),
          sparks,
        });
        autoFill(get, set, fresh);
      },
      ingestForesight: (fresh) => {
        if (!fresh.length) return;
        const have = new Set(get().alerts.map((a) => a.id));
        const add = fresh.filter((a) => !have.has(a.id));
        if (!add.length) return;
        set({ alerts: [...add, ...get().alerts].slice(0, 60) });
        autoFill(get, set, add);
      },
      dismissAlert: (id) => set({ alerts: get().alerts.filter((a) => a.id !== id) }),
      clearAlerts: () => set({ alerts: [] }),
      executeAlert: (id) => {
        const a = get().alerts.find((x) => x.id === id);
        if (!a) return "Missing signal";
        if (a.executed) return "Already filled";
        if (get().paper.positions.some((p) => p.symbol === a.symbol)) return "Already in that name";
        const c = alertToCandidate(a, get().paper.equity);
        if (!c) return "No trade plan on this signal";
        const err = get().openPaper(c);
        if (!err) set({ alerts: get().alerts.map((x) => (x.id === id ? { ...x, executed: true } : x)) });
        return err;
      },
      openPaper: (c) => {
        const { paper, halt } = get();
        if (halt) return halt;
        if (paper.dailyPnl <= DAILY_HALT * Math.max(paper.highWater, STARTING_CASH)) {
          const msg = "Daily loss circuit breaker — no new risk.";
          set({ halt: msg });
          return msg;
        }
        const px = fillPrice(c.side, c.entry, false);
        const notional = Math.min(c.sizeUsd, paper.cash * 0.95);
        if (notional < 50) return "Not enough cash.";
        const fee = notional * FEE;
        const qty = (notional - fee) / px;
        const pos: PaperPosition = {
          id: `${c.symbol}-${Date.now()}`,
          symbol: c.symbol,
          side: c.side,
          qty,
          entry: px,
          sl: c.sl,
          tp1: c.tp1,
          tp2: c.tp2,
          tp3: c.tp3,
          book: "ALPHA",
          openedAt: Date.now(),
          unrealized: 0,
        };
        const fill: PaperFill = {
          id: pos.id + "-in",
          ts: Date.now(),
          symbol: c.symbol,
          side: c.side,
          qty,
          price: px,
          fee,
          book: "ALPHA",
          note: `Open ${c.side} · ${c.reasons[0] ?? "manual"}`,
        };
        set({
          paper: {
            ...paper,
            cash: paper.cash - notional,
            positions: [...paper.positions, pos],
            fills: [fill, ...paper.fills].slice(0, 200),
          },
        });
        return null;
      },
      closePosition: (id, price, note) => {
        const { paper } = get();
        const pos = paper.positions.find((p) => p.id === id);
        if (!pos) return;
        const px = fillPrice(pos.side, price, true);
        const notional = pos.qty * px;
        const fee = notional * FEE;
        const pnl =
          pos.side === "LONG" ? (px - pos.entry) * pos.qty - fee : (pos.entry - px) * pos.qty - fee;
        const fill: PaperFill = {
          id: id + "-out-" + Date.now(),
          ts: Date.now(),
          symbol: pos.symbol,
          side: pos.side,
          qty: pos.qty,
          price: px,
          fee,
          book: pos.book,
          note,
        };
        const cash = paper.cash + notional - fee;
        const positions = paper.positions.filter((p) => p.id !== id);
        set({
          paper: {
            ...paper,
            cash,
            equity: cash + positions.reduce((s, p) => s + (p.unrealized || 0) + p.qty * p.entry, 0),
            positions,
            fills: [fill, ...paper.fills].slice(0, 200),
            dailyPnl: paper.dailyPnl + pnl,
            highWater: Math.max(paper.highWater, cash),
          },
        });
      },
      markToMarket: (snap, tickers) => {
        const pxOf = (sym: string) => {
          if (snap && snap.symbol === sym && snap.last) return snap.last;
          return tickers.find((t) => t.symbol === sym)?.last ?? 0;
        };
        const { paper } = get();
        const still: PaperPosition[] = [];
        const fills: PaperFill[] = [];
        let cash = paper.cash;
        let dailyPnl = paper.dailyPnl;

        for (const p of paper.positions) {
          const last = pxOf(p.symbol);
          const u = last ? (p.side === "LONG" ? (last - p.entry) * p.qty : (p.entry - last) * p.qty) : p.unrealized;
          const hitSl = last > 0 && (p.side === "LONG" ? last <= p.sl : last >= p.sl);
          const hitTp = last > 0 && (p.side === "LONG" ? last >= p.tp1 : last <= p.tp1);
          if (hitSl || hitTp) {
            const px = fillPrice(p.side, last, true);
            const notional = p.qty * px;
            const fee = notional * FEE;
            const pnl =
              p.side === "LONG" ? (px - p.entry) * p.qty - fee : (p.entry - px) * p.qty - fee;
            cash += notional - fee;
            dailyPnl += pnl;
            fills.push({
              id: p.id + "-auto-" + Date.now(),
              ts: Date.now(),
              symbol: p.symbol,
              side: p.side,
              qty: p.qty,
              price: px,
              fee,
              book: p.book,
              note: hitSl ? "Stop hit" : "TP1 hit",
            });
          } else {
            still.push({ ...p, unrealized: u });
          }
        }

        const equity = mtmEquity(cash, still, pxOf);
        const halt =
          equity <= paper.highWater * (1 + DAILY_HALT) ? "Daily loss circuit breaker armed." : get().halt;

        set({
          halt,
          paper: {
            cash,
            equity,
            positions: still,
            fills: [...fills, ...paper.fills].slice(0, 200),
            dailyPnl,
            highWater: Math.max(paper.highWater, equity),
          },
        });
      },
      resetPaper: () => set({ paper: emptyPaper(), halt: null }),
    }),
    {
      name: "atlas-desk-v1",
      skipHydration: true,
      partialize: (s) => ({
        symbol: s.symbol,
        helpSeen: s.helpSeen,
        paper: s.paper,
        bar: s.bar,
        sortMode: s.sortMode,
      }),
    },
  ),
);
