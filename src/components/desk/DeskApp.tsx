import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  FlowPane,
  DerivativesPane,
  HarvestPane,
  HelpPane,
  OverviewPane,
  PaperPane,
  PredictionsPane,
  RadarPane,
} from "@/components/desk/Panes";
import { Watchlist } from "@/components/desk/Watchlist";
import { TickerTape } from "@/components/desk/Live";
import { SignalPanel } from "@/components/desk/SignalPanel";
import { getCarry, getMacro, getPositions, getPulse } from "@/lib/desk/api";
import { fetchSnapshot, fetchUniverse } from "@/lib/desk/market";
import { BEFORE_KINDS, buildAlpha, scanForesight } from "@/lib/desk/engine";
import { clockUtc, fmtPct, fmtUsd, normalizeSymbol } from "@/lib/desk/format";
import { useDesk } from "@/lib/desk/store";
import type { Section } from "@/lib/desk/types";
import { cn } from "@/lib/utils";

const SECTIONS: { id: Section; key: string; label: string }[] = [
  { id: "overview", key: "1", label: "Overview" },
  { id: "flow", key: "2", label: "Order flow" },
  { id: "derivatives", key: "3", label: "Derivatives" },
  { id: "predictions", key: "4", label: "Foresight" },
  { id: "radar", key: "5", label: "Radar" },
  { id: "paper", key: "6", label: "Paper" },
  { id: "harvest", key: "7", label: "Harvest" },
  { id: "help", key: "8", label: "Help" },
];

export function DeskApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [clock, setClock] = useState("");
  const symbol = useDesk((s) => s.symbol);
  const section = useDesk((s) => s.section);
  const query = useDesk((s) => s.query);
  const alerts = useDesk((s) => s.alerts);
  const paper = useDesk((s) => s.paper);
  const halt = useDesk((s) => s.halt);
  const helpOpen = useDesk((s) => s.helpOpen);
  const setSymbol = useDesk((s) => s.setSymbol);
  const setSection = useDesk((s) => s.setSection);
  const setQuery = useDesk((s) => s.setQuery);
  const ingestTickers = useDesk((s) => s.ingestTickers);
  const ingestForesight = useDesk((s) => s.ingestForesight);
  const dismissAlert = useDesk((s) => s.dismissAlert);
  const clearAlerts = useDesk((s) => s.clearAlerts);
  const openPaper = useDesk((s) => s.openPaper);
  const closePosition = useDesk((s) => s.closePosition);
  const markToMarket = useDesk((s) => s.markToMarket);
  const resetPaper = useDesk((s) => s.resetPaper);
  const markHelpSeen = useDesk((s) => s.markHelpSeen);
  const setHelpOpen = useDesk((s) => s.setHelpOpen);
  const bar = useDesk((s) => s.bar);
  const setBar = useDesk((s) => s.setBar);
  const sortMode = useDesk((s) => s.sortMode);
  const setSortMode = useDesk((s) => s.setSortMode);
  const sparks = useDesk((s) => s.sparks);
  const [signalsOpen, setSignalsOpen] = useState(false);

  useEffect(() => {
    void useDesk.persist.rehydrate();
  }, []);

  useEffect(() => {
    const tick = () => setClock(clockUtc());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const universe = useQuery({
    queryKey: ["universe"],
    queryFn: fetchUniverse,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    retry: 2,
    networkMode: "always",
  });

  const snapQ = useQuery({
    queryKey: ["snap", symbol, bar],
    queryFn: () => fetchSnapshot(symbol, bar),
    refetchInterval: 2500,
    refetchIntervalInBackground: true,
    staleTime: 0,
    retry: 1,
    networkMode: "always",
  });

  const macroQ = useQuery({
    queryKey: ["macro"],
    queryFn: () => getMacro(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    networkMode: "always",
  });

  const carryQ = useQuery({
    queryKey: ["carry"],
    queryFn: () => getCarry(),
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
    networkMode: "always",
  });

  const pulseQ = useQuery({
    queryKey: ["pulse"],
    queryFn: () => getPulse(),
    refetchInterval: 45_000,
    refetchIntervalInBackground: true,
    networkMode: "always",
  });

  const posQ = useQuery({
    queryKey: ["positions"],
    queryFn: () => getPositions(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    networkMode: "always",
  });

  const tickersRaw = universe.data?.tickers ?? [];
  const heldTickers = useRef<typeof tickersRaw>([]);
  if (tickersRaw.length) heldTickers.current = tickersRaw;
  const tickers = tickersRaw.length ? tickersRaw : heldTickers.current;
  const snap = snapQ.data ?? null;
  const ticker = tickers.find((t) => t.symbol === symbol);

  useEffect(() => {
    const id = window.setInterval(() => {
      void universe.refetch();
      void snapQ.refetch();
    }, 4000);
    return () => window.clearInterval(id);
  }, [universe.refetch, snapQ.refetch]);

  useEffect(() => {
    if (!useDesk.getState().helpSeen) setHelpOpen(true);
  }, [setHelpOpen]);

  useEffect(() => {
    if (universe.data?.tickers) ingestTickers(universe.data.tickers);
  }, [universe.data, ingestTickers]);

  const early = useMemo(
    () =>
      scanForesight({
        snap,
        tickers,
        pulse: pulseQ.data ?? null,
      }),
    [snap, tickers, pulseQ.data],
  );

  useEffect(() => {
    ingestForesight(early);
  }, [early, ingestForesight]);

  useEffect(() => {
    if (paper.positions.length) markToMarket(snap, tickers);
  }, [snap, tickers, markToMarket, paper.positions.length]);

  const candidate = useMemo(() => {
    if (!snap || snap.error) return null;
    return buildAlpha(symbol, snap, paper.equity);
  }, [snap, symbol, paper.equity]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        setHelpOpen(false);
        setSignalsOpen(false);
      }
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const hit = SECTIONS.find((s) => s.key === e.key || e.key === `F${s.key}`);
      if (hit) {
        e.preventDefault();
        setSection(hit.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSection, setHelpOpen]);

  function loadSymbol(raw: string) {
    const next = normalizeSymbol(raw);
    const match =
      tickers.find((t) => t.symbol === next) ||
      tickers.find((t) => t.symbol.startsWith(raw.toUpperCase().replace(/[^A-Z0-9]/g, "")));
    setSymbol(match?.symbol ?? next);
    setQuery("");
  }

  const feedTs = universe.data?.ts ?? universe.dataUpdatedAt ?? 0;
  const feedAge = Date.now() - feedTs;
  const feedOk =
    tickers.length > 0 &&
    (universe.isFetching || universe.isRefetching || feedAge < 45_000);

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <div className="flex items-baseline gap-2 pr-3">
          <span className="text-sm font-medium tracking-[0.22em] text-accent">ATLAS</span>
          <span className="hidden text-label uppercase tracking-widest text-faint sm:inline">Desk</span>
        </div>
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = inputRef.current?.value ?? query;
            if (v.trim()) loadSymbol(v);
          }}
        >
          <label className="sr-only" htmlFor="cmd">
            Ticker
          </label>
          <span className="font-mono text-warn">/</span>
          <input
            id="cmd"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a ticker · SOL · PEPE · BTCUSDT"
            className="min-w-0 flex-1 bg-transparent font-mono text-sm text-fg outline-none placeholder:text-faint"
            autoComplete="off"
            spellCheck={false}
          />
        </form>
        <div className="hidden font-mono text-data text-muted md:block">{clock || "—"}</div>
        <button
          type="button"
          onClick={() => setSignalsOpen(true)}
          className="pressable min-h-11 rounded-xs bg-surface-2 px-2.5 font-mono text-data text-warn lg:hidden"
        >
          SIG {alerts.length}
        </button>
      </header>
      <TickerTape tickers={tickers} />

      <nav className="desk-scroll flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              "pressable min-h-11 shrink-0 rounded-xs px-2.5 py-2 text-xs tracking-wide transition-colors duration-150",
              section === s.id ? "bg-accent/15 text-fg" : "text-muted hover:text-fg",
            )}
          >
            <span className="mr-1.5 font-mono text-faint">{s.key}</span>
            {s.label}
          </button>
        ))}
      </nav>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(200px,260px)_1fr_minmax(240px,300px)]">
        <aside className="hidden min-h-0 border-r border-border bg-surface lg:flex lg:flex-col">
          <div className="border-b border-border px-3 py-2 text-label uppercase tracking-widest text-muted">
            Universe · {tickers.length} pairs
          </div>
          <Watchlist
            tickers={tickers}
            symbol={symbol}
            query={query}
            alerts={alerts}
            sparks={sparks}
            sortMode={sortMode}
            onSort={setSortMode}
            onSelect={(s) => {
              setSymbol(s);
              setQuery("");
            }}
          />
        </aside>

        <main className="desk-scroll min-h-0 overflow-auto p-3">
          {universe.isError ? (
            <p className="mb-3 text-sm text-down">Universe feed failed. Retrying public APIs…</p>
          ) : null}
          {universe.isPending ? (
            <p className="mb-3 text-sm text-muted">Loading the universe from public venues…</p>
          ) : null}
          {helpOpen && section !== "help" ? (
            <div className="mb-3 flex items-start justify-between gap-3 rounded-md bg-surface-2 px-3 py-2 text-sm text-muted">
              <p>
                Left column is every liquid pair. Right column keeps every signal until you clear it — nothing
                pops and vanishes.
              </p>
              <button type="button" className="shrink-0 text-accent" onClick={markHelpSeen}>
                Dismiss
              </button>
            </div>
          ) : null}
          {snap?.error ? <p className="mb-3 text-sm text-warn">Snapshot: {snap.error}</p> : null}

          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 lg:hidden">
            <div>
              <div className="font-mono text-lg">{symbol}</div>
              <div className={ticker && ticker.changePct >= 0 ? "font-mono text-up" : "font-mono text-down"}>
                {ticker ? fmtPct(ticker.changePct) : "—"}
              </div>
            </div>
            <select
              className="max-w-48 rounded-sm bg-surface-2 px-2 py-2 text-sm"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {(tickers.length ? tickers : [{ symbol, last: 0, changePct: 0 } as (typeof tickers)[number]])
                .slice(0, 80)
                .map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
            </select>
          </div>

          {section === "overview" ? (
            <OverviewPane
              ticker={ticker}
              snap={snap}
              macro={macroQ.data ?? null}
              candidate={candidate}
              bar={bar}
              onBar={setBar}
              btc={tickers.find((t) => t.symbol === "BTCUSDT")}
              early={early}
              onTrade={(c) => {
                const err = openPaper(c);
                if (err) toast.error(err);
                else {
                  toast.success(`Paper ${c.side} ${c.symbol}`);
                  setSection("paper");
                }
              }}
            />
          ) : null}
          {section === "flow" ? <FlowPane snap={snap} bar={bar} onBar={setBar} /> : null}
          {section === "derivatives" ? (
            <DerivativesPane
              snap={snap}
              positions={posQ.data ?? []}
              onSelect={(s) => {
                setSymbol(s);
                setQuery("");
              }}
            />
          ) : null}
          {section === "predictions" ? (
            <PredictionsPane
              macro={macroQ.data ?? null}
              tickers={tickers}
              pulse={pulseQ.data ?? null}
              onSelect={(s) => {
                setSymbol(s);
                setSection("overview");
              }}
            />
          ) : null}
          {section === "radar" ? (
            <RadarPane
              alerts={alerts}
              tickers={tickers}
              symbol={symbol}
              onSelect={(s) => {
                setSymbol(s);
                setSection("overview");
              }}
            />
          ) : null}
          {section === "paper" ? (
            <PaperPane
              equity={paper.equity}
              cash={paper.cash}
              dailyPnl={paper.dailyPnl}
              positions={paper.positions}
              fills={paper.fills}
              halt={halt}
              lastPx={(sym) =>
                (snap && snap.symbol === sym && snap.last) || tickers.find((t) => t.symbol === sym)?.last || 0
              }
              onClose={(id) => {
                const pos = paper.positions.find((p) => p.id === id);
                const px =
                  (pos && snap && snap.symbol === pos.symbol && snap.last) ||
                  (pos && tickers.find((t) => t.symbol === pos.symbol)?.last) ||
                  pos?.entry ||
                  0;
                closePosition(id, px, "Manual flatten");
              }}
              onReset={resetPaper}
            />
          ) : null}
          {section === "harvest" ? (
            <HarvestPane
              snap={snap}
              symbol={symbol}
              carry={carryQ.data ?? []}
              onSelect={(s) => {
                setSymbol(s);
                setSection("overview");
              }}
            />
          ) : null}
          {section === "help" ? <HelpPane onDismiss={markHelpSeen} /> : null}
        </main>

        <aside className="hidden min-h-0 border-l border-border lg:flex lg:flex-col">
          <SignalPanel
            alerts={alerts}
            onSelect={(s) => {
              setSymbol(s);
              setQuery("");
              setSection("overview");
            }}
            onDismiss={dismissAlert}
            onClear={clearAlerts}
          />
        </aside>
      </div>

      {signalsOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-bg/70"
            aria-label="Close signals"
            onClick={() => setSignalsOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l border-border shadow-border">
            <SignalPanel
              alerts={alerts}
              onSelect={(s) => {
                setSymbol(s);
                setQuery("");
                setSection("overview");
                setSignalsOpen(false);
              }}
              onDismiss={dismissAlert}
              onClear={clearAlerts}
              onClose={() => setSignalsOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-3 py-1.5 font-mono text-label text-muted">
        <div className="flex items-center gap-3">
          <span className={cn("flex items-center gap-1.5", feedOk ? "text-up" : "text-down")}>
            <span className={cn("size-1.5 rounded-full", feedOk ? "bg-up live-dot" : "bg-down")} />
            {feedOk ? "LIVE" : "STALE"}
          </span>
          <span>{universe.data?.venue?.toUpperCase() ?? "—"}</span>
          <span>{tickers.length} names</span>
          <span className="hidden sm:inline">
            {feedTs ? `${Math.max(0, Math.round(feedAge / 1000))}s` : "—"}
          </span>
          <span className="hidden sm:inline">{symbol}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Paper {fmtUsd(paper.equity, 0)} · {paper.positions.length} open
          </span>
          <button
            type="button"
            onClick={() => setSignalsOpen(true)}
            className="text-warn lg:pointer-events-none"
          >
            Signals {alerts.length}
          </button>
          {candidate ? <span className="text-warn">ALPHA {candidate.side}</span> : <span>ALPHA quiet</span>}
          <span className="hidden md:inline text-warn">
            Before {alerts.filter((a) => BEFORE_KINDS.has(a.kind)).length}
          </span>
        </div>
      </footer>
    </div>
  );
}
