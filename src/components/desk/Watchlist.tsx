import { Spark } from "@/components/desk/Live";
import { relativeStrength } from "@/lib/desk/engine";
import { fmtPct, fmtPx, fmtVol } from "@/lib/desk/format";
import type { RadarAlert, SortMode, Ticker } from "@/lib/desk/types";
import { cn } from "@/lib/utils";

export function Watchlist({
  tickers,
  symbol,
  query,
  alerts,
  sparks,
  sortMode,
  onSort,
  onSelect,
}: {
  tickers: Ticker[];
  symbol: string;
  query: string;
  alerts: RadarAlert[];
  sparks: Record<string, number[]>;
  sortMode: SortMode;
  onSort: (m: SortMode) => void;
  onSelect: (s: string) => void;
}) {
  const flagged = new Set(alerts.slice(0, 40).map((a) => a.symbol));
  const btc = tickers.find((t) => t.symbol === "BTCUSDT");
  const q = query.trim().toUpperCase();
  const filtered = q ? tickers.filter((t) => t.symbol.includes(q)) : [...tickers];
  const rows = filtered
    .sort((a, b) => {
      if (sortMode === "vol") return b.quoteVolume - a.quoteVolume;
      if (sortMode === "rs") return Math.abs(relativeStrength(b, btc)) - Math.abs(relativeStrength(a, btc));
      return Math.abs(b.changePct) - Math.abs(a.changePct);
    })
    .slice(0, 180);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex gap-1 px-2 py-1.5">
        {(
          [
            ["move", "Move"],
            ["vol", "Vol"],
            ["rs", "vs BTC"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onSort(id)}
            className={cn(
              "pressable min-h-8 rounded-xs px-2 text-label uppercase tracking-wider",
              sortMode === id ? "bg-surface-2 text-fg" : "text-faint hover:text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1 text-label uppercase tracking-wider text-faint">
        <span>Pair</span>
        <span>Last</span>
        <span>{sortMode === "rs" ? "RS" : "24h"}</span>
      </div>
      <div className="desk-scroll min-h-0 flex-1 overflow-auto">
        {rows.map((t) => {
          const hot = flagged.has(t.symbol);
          const active = t.symbol === symbol;
          const rs = relativeStrength(t, btc);
          const shown = sortMode === "rs" ? rs : t.changePct;
          return (
            <button
              key={t.symbol}
              type="button"
              onClick={() => onSelect(t.symbol)}
              className={cn(
                "pressable grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-border/60 px-3 py-1.5 text-left font-mono text-data",
                active ? "bg-surface-2" : "hover:bg-surface-2/70",
                hot && "bg-warn/10",
              )}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                {hot ? <span className="size-1.5 shrink-0 rounded-full bg-warn live-dot" /> : null}
                <span className="truncate text-fg">{t.symbol.replace("USDT", "")}</span>
                <Spark values={sparks[t.symbol] ?? []} />
              </span>
              <span className="tabular text-fg">{fmtPx(t.last)}</span>
              <span className={cn("w-16 text-right tabular", shown >= 0 ? "text-up" : "text-down")}>
                {fmtPct(shown, 1)}
              </span>
            </button>
          );
        })}
        {rows.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted">No pairs match. Try BTC, SOL, or PEPE.</p>
        ) : null}
      </div>
      <div className="border-t border-border px-3 py-1.5 font-mono text-label text-muted">
        {rows.length} shown · vol {fmtVol(tickers.reduce((s, t) => s + t.quoteVolume, 0))}
      </div>
    </div>
  );
}
