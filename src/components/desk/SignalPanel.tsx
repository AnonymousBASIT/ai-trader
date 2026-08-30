import { BEFORE_KINDS } from "@/lib/desk/engine";
import { fmtPct, fmtPx, fmtUsd } from "@/lib/desk/format";
import type { RadarAlert } from "@/lib/desk/types";
import { cn } from "@/lib/utils";

function age(ts: number) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

function kindClass(kind: RadarAlert["kind"]) {
  if (kind === "PUMP" || kind === "MOVER") return "bg-up/15 text-up";
  if (kind === "DUMP") return "bg-down/15 text-down";
  return "bg-warn/15 text-warn";
}

function Row({
  a,
  onSelect,
  onDismiss,
  onExecute,
}: {
  a: RadarAlert;
  onSelect: (s: string) => void;
  onDismiss: (id: string) => void;
  onExecute: (id: string) => void;
}) {
  const fresh = Date.now() - a.ts < 20_000;
  return (
    <div className={cn("sig-ticket border-b border-border/80 px-2 py-2.5", fresh && "bg-warn/10", a.executed && "opacity-70")}>
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => onSelect(a.symbol)} className="pressable min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className={cn("rounded-xs px-1 py-0.5 text-label uppercase", kindClass(a.kind))}>{a.kind}</span>
            {a.side ? (
              <span className={cn("text-label uppercase", a.side === "LONG" ? "text-up" : "text-down")}>{a.side}</span>
            ) : null}
            <span className="truncate font-mono text-data text-fg">{a.symbol.replace("USDT", "")}</span>
            {a.score ? <span className="font-mono text-label text-faint">{a.score}σ</span> : null}
            <span className="ml-auto shrink-0 font-mono text-label text-faint">{age(a.ts)}</span>
          </div>
          <p className="mt-1 text-data leading-snug text-muted">{a.message}</p>
          {a.entry && a.sl && a.tp1 ? (
            <div className="mt-2 grid grid-cols-4 gap-1 font-mono text-label">
              <div>
                <div className="text-faint">IN</div>
                <div className="text-fg">{fmtPx(a.entry)}</div>
              </div>
              <div>
                <div className="text-faint">SL</div>
                <div className="text-down">{fmtPx(a.sl)}</div>
              </div>
              <div>
                <div className="text-faint">TP1</div>
                <div className="text-up">{fmtPx(a.tp1)}</div>
              </div>
              <div>
                <div className="text-faint">R:R</div>
                <div className="text-warn">{(a.rr ?? 0).toFixed(1)}</div>
              </div>
            </div>
          ) : null}
          <div className="mt-1 flex gap-2 font-mono text-label text-faint">
            <span className={a.changePct >= 0 ? "text-up" : "text-down"}>{fmtPct(a.changePct)}</span>
            {a.sizeUsd ? <span>risk {fmtUsd(a.sizeUsd, 0)}</span> : null}
            {a.executed ? <span className="text-up">FILLED</span> : null}
          </div>
        </button>
        <div className="flex flex-col">
          {!a.executed && a.side ? (
            <button
              type="button"
              onClick={() => onExecute(a.id)}
              className="pressable min-h-11 rounded-xs bg-accent/20 px-2 text-label uppercase tracking-wide text-accent"
            >
              Fill
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Dismiss signal"
            onClick={() => onDismiss(a.id)}
            className="pressable min-h-11 min-w-11 text-faint hover:text-fg"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export function SignalPanel({
  alerts,
  autoPaper,
  onAuto,
  onSelect,
  onDismiss,
  onClear,
  onExecute,
  onClose,
}: {
  alerts: RadarAlert[];
  autoPaper: boolean;
  onAuto: (v: boolean) => void;
  onSelect: (s: string) => void;
  onDismiss: (id: string) => void;
  onClear: () => void;
  onExecute: (id: string) => void;
  onClose?: () => void;
}) {
  const before = alerts.filter((a) => BEFORE_KINDS.has(a.kind));
  const after = alerts.filter((a) => !BEFORE_KINDS.has(a.kind));
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div>
          <div className="text-label uppercase tracking-widest text-muted">Signals</div>
          <div className="font-mono text-data text-fg">
            {alerts.length} live · {before.length} before
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAuto(!autoPaper)}
            className={cn(
              "pressable min-h-11 rounded-xs px-2 text-label uppercase tracking-wide",
              autoPaper ? "bg-up/15 text-up" : "text-muted",
            )}
          >
            Auto {autoPaper ? "on" : "off"}
          </button>
          {alerts.length ? (
            <button type="button" onClick={onClear} className="pressable min-h-11 px-2 text-label text-muted hover:text-fg">
              Clear
            </button>
          ) : null}
          {onClose ? (
            <button type="button" onClick={onClose} className="pressable min-h-11 min-w-11 text-muted lg:hidden">
              ×
            </button>
          ) : null}
        </div>
      </div>
      <p className="border-b border-border px-3 py-1.5 text-label leading-snug text-faint">
        Only high-conviction prints. Each ticket has entry, stop, TP1–3. Auto fills paper at 0.5% equity risk.
      </p>
      <div className="desk-scroll min-h-0 flex-1 overflow-auto">
        {alerts.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted">Quiet tape. Waiting for a real setup — not every wiggle.</p>
        ) : (
          <>
            {before.length ? (
              <div className="px-3 py-1.5 text-label uppercase tracking-widest text-warn">Before the print</div>
            ) : null}
            {before.map((a) => (
              <Row key={a.id} a={a} onSelect={onSelect} onDismiss={onDismiss} onExecute={onExecute} />
            ))}
            {after.length ? (
              <div className="px-3 py-1.5 text-label uppercase tracking-widest text-muted">Already moving</div>
            ) : null}
            {after.map((a) => (
              <Row key={a.id} a={a} onSelect={onSelect} onDismiss={onDismiss} onExecute={onExecute} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
