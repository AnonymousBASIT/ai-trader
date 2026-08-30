import { useEffect, useRef, useState } from "react";
import { fmtPct, fmtPx } from "@/lib/desk/format";
import type { Ticker } from "@/lib/desk/types";
import { cn } from "@/lib/utils";

export function FlashNum({
  n,
  format,
  className,
}: {
  n: number;
  format: (n: number) => string;
  className?: string;
}) {
  const prev = useRef(n);
  const [dir, setDir] = useState<"" | "up" | "down">("");
  useEffect(() => {
    if (n !== prev.current && Number.isFinite(prev.current) && prev.current !== 0) {
      setDir(n > prev.current ? "up" : "down");
      const t = window.setTimeout(() => setDir(""), 480);
      prev.current = n;
      return () => window.clearTimeout(t);
    }
    prev.current = n;
  }, [n]);
  return (
    <span className={cn("inline-block px-0.5 tabular", dir === "up" && "flash-up", dir === "down" && "flash-down", className)}>
      {Number.isFinite(n) ? format(n) : "—"}
    </span>
  );
}

export function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="inline-block h-4 w-10" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 40;
  const h = 16;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const up = values[values.length - 1] >= values[0];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-4 w-10" aria-hidden>
      <polyline
        fill="none"
        stroke={up ? "var(--color-up)" : "var(--color-down)"}
        strokeWidth="1.4"
        points={pts}
      />
    </svg>
  );
}

export function TickerTape({ tickers }: { tickers: Ticker[] }) {
  const row = tickers.slice(0, 24);
  if (!row.length) return null;
  const loop = [...row, ...row];
  return (
    <div className="overflow-hidden border-b border-border bg-surface-2/60">
      <div className="tape-track flex w-max gap-6 py-1.5 pr-6 font-mono text-data">
        {loop.map((t, i) => (
          <span key={`${t.symbol}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-muted">{t.symbol.replace("USDT", "")}</span>
            <span className="text-fg">{fmtPx(t.last)}</span>
            <span className={t.changePct >= 0 ? "text-up" : "text-down"}>{fmtPct(t.changePct, 1)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Heatmap({
  tickers,
  symbol,
  onSelect,
}: {
  tickers: Ticker[];
  symbol: string;
  onSelect: (s: string) => void;
}) {
  const cells = tickers.slice(0, 72);
  return (
    <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8">
      {cells.map((t) => {
        const mag = Math.min(1, Math.abs(t.changePct) / 14);
        const bg =
          t.changePct >= 0
            ? `color-mix(in oklab, var(--color-up) ${Math.round(18 + mag * 55)}%, var(--color-surface-2))`
            : `color-mix(in oklab, var(--color-down) ${Math.round(18 + mag * 55)}%, var(--color-surface-2))`;
        return (
          <button
            key={t.symbol}
            type="button"
            onClick={() => onSelect(t.symbol)}
            className={cn(
              "heat-cell min-h-14 rounded-sm px-1.5 py-1.5 text-left font-mono",
              t.symbol === symbol && "ring-1 ring-accent",
            )}
            style={{ background: bg }}
          >
            <div className="truncate text-label text-fg">{t.symbol.replace("USDT", "")}</div>
            <div className={cn("text-data tabular", t.changePct >= 0 ? "text-fg" : "text-fg")}>
              {fmtPct(t.changePct, 1)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function CvdMeter({ buy, sell }: { buy: number; sell: number }) {
  const tot = buy + sell;
  const buyPct = tot > 0 ? (buy / tot) * 100 : 50;
  return (
    <div className="mt-2">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="bg-up transition-[width] duration-300" style={{ width: `${buyPct}%` }} />
        <div className="bg-down transition-[width] duration-300" style={{ width: `${100 - buyPct}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-label text-muted">
        <span className="text-up">buy {buyPct.toFixed(0)}%</span>
        <span className="text-down">sell {(100 - buyPct).toFixed(0)}%</span>
      </div>
    </div>
  );
}

export function DepthMountain({
  bids,
  asks,
}: {
  bids: { price: number; qty: number }[];
  asks: { price: number; qty: number }[];
}) {
  if (!bids.length || !asks.length) return null;
  const acc = (levels: { price: number; qty: number }[], reverse: boolean) => {
    let s = 0;
    const rows = reverse ? [...levels].reverse() : levels;
    return rows.map((l) => {
      s += l.qty * l.price;
      return { price: l.price, acc: s };
    });
  };
  const b = acc(bids.slice(0, 16), true);
  const a = acc(asks.slice(0, 16), false);
  const max = Math.max(b[b.length - 1]?.acc ?? 1, a[a.length - 1]?.acc ?? 1);
  const minP = b[0]?.price ?? 0;
  const maxP = a[a.length - 1]?.price ?? 1;
  const span = maxP - minP || 1;
  const w = 320;
  const h = 72;
  const x = (p: number) => ((p - minP) / span) * w;
  const y = (v: number) => h - (v / max) * (h - 4);
  const bidPath = `M ${x(b[0].price)} ${h} ` + b.map((p) => `L ${x(p.price)} ${y(p.acc)}`).join(" ") + ` L ${x(b[b.length - 1].price)} ${h} Z`;
  const askPath = `M ${x(a[0].price)} ${h} ` + a.map((p) => `L ${x(p.price)} ${y(p.acc)}`).join(" ") + ` L ${x(a[a.length - 1].price)} ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-16 w-full" aria-label="Cumulative depth">
      <path d={bidPath} fill="var(--color-up)" opacity="0.28" />
      <path d={askPath} fill="var(--color-down)" opacity="0.28" />
    </svg>
  );
}

export function Bars({
  value,
  bars,
  onChange,
}: {
  value: string;
  bars: string[];
  onChange: (b: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {bars.map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => onChange(b)}
          className={cn(
            "pressable min-h-11 rounded-xs px-2.5 font-mono text-label",
            value === b ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
          )}
        >
          {b}
        </button>
      ))}
    </div>
  );
}

export function LongShortBar({ longPct, sub }: { longPct: number; sub?: string }) {
  const shortPct = 100 - longPct;
  return (
    <div>
      <div className="flex justify-between font-mono text-label">
        <span className="text-up">LONG {longPct.toFixed(0)}%</span>
        <span className="text-down">SHORT {shortPct.toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 flex h-3 overflow-hidden rounded-full bg-surface-2">
        <div className="bg-up transition-[width] duration-500" style={{ width: `${longPct}%` }} />
        <div className="bg-down transition-[width] duration-500" style={{ width: `${shortPct}%` }} />
      </div>
      {sub ? <p className="mt-1.5 text-label text-muted">{sub}</p> : null}
    </div>
  );
}
