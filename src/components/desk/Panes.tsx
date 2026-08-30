import { Candles } from "@/components/desk/Candles";
import { Depth } from "@/components/desk/Depth";
import { Bars, CvdMeter, DepthMountain, FlashNum, Heatmap, LongShortBar } from "@/components/desk/Live";
import { Metric, Panel } from "@/components/desk/Metric";
import {
  BEFORE_KINDS,
  bookImbalance,
  buildHarvest,
  fragilityScore,
  lsDivergence,
  relativeStrength,
  rsi14,
  spreadBps,
  tapeDelta,
  valueArea,
} from "@/lib/desk/engine";
import {
  fmtApr,
  fmtFunding,
  fmtPct,
  fmtPx,
  fmtUsd,
  fmtVol,
  signedClass,
} from "@/lib/desk/format";
import { TIPS } from "@/lib/desk/tooltips";
import type {
  AlphaCandidate,
  Bar,
  CarryRow,
  Macro,
  PositionRow,
  Pulse,
  RadarAlert,
  Snapshot,
  Ticker,
} from "@/lib/desk/types";
import { cn } from "@/lib/utils";

const BARS: Bar[] = ["1m", "5m", "15m", "1H", "4H"];

export function OverviewPane({
  ticker,
  snap,
  macro,
  candidate,
  bar,
  onBar,
  onTrade,
  btc,
  early,
}: {
  ticker: Ticker | undefined;
  snap: Snapshot | null;
  macro: Macro | null;
  candidate: AlphaCandidate | null;
  bar: Bar;
  onBar: (b: Bar) => void;
  onTrade: (c: AlphaCandidate) => void;
  btc: Ticker | undefined;
  early: RadarAlert[];
}) {
  const imb = bookImbalance(snap);
  const spr = spreadBps(snap);
  const tape = snap ? tapeDelta(snap.trades) : null;
  const va = snap ? valueArea(snap.klines) : null;
  const frag = fragilityScore(snap);
  const last = snap?.last || ticker?.last || 0;
  const rsi = snap ? rsi14(snap.klines) : null;
  const rs = ticker ? relativeStrength(ticker, btc) : 0;

  return (
    <div className="grid min-h-0 gap-3 lg:grid-cols-3">
      <Panel title="Selected" className="lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-label uppercase tracking-widest text-faint">{ticker?.symbol ?? "—"}</div>
            <div className="font-mono text-hero leading-none tracking-tight">
              <FlashNum n={last} format={fmtPx} className={ticker && ticker.changePct >= 0 ? "text-up" : "text-down"} />
            </div>
            <div className="mt-2 flex gap-3 font-mono text-sm">
              <span className={ticker && ticker.changePct >= 0 ? "text-up" : "text-down"}>
                {fmtPct(ticker?.changePct)}
              </span>
              <span className={rs >= 0 ? "text-up" : "text-down"}>vs BTC {fmtPct(rs, 1)}</span>
            </div>
            {snap?.globalLs ? (
              <div className="mt-3 max-w-xs">
                <LongShortBar
                  longPct={snap.globalLs.longAccount * 100}
                  sub={`Open accounts · ratio ${snap.globalLs.ratio.toFixed(2)}`}
                />
              </div>
            ) : null}
          </div>
          <Bars value={bar} bars={BARS} onChange={(b) => onBar(b as Bar)} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric tip="volume" label="Turnover" value={fmtVol(ticker?.quoteVolume)} />
          <Metric tip="spread" label="Spread" value={spr != null ? `${spr.toFixed(1)} bp` : "—"} />
          <Metric
            tip="imbalance"
            label="Book imb"
            value={imb != null ? imb.toFixed(2) : "—"}
            tone={imb != null && imb >= 1.8 ? "up" : imb != null && imb <= 0.55 ? "down" : undefined}
          />
          <Metric
            tip="cvd"
            label="Tape CVD"
            value={tape ? tape.cvd.toFixed(3) : "—"}
            tone={tape && tape.cvd > 0 ? "up" : tape && tape.cvd < 0 ? "down" : undefined}
          />
          <Metric tip="vwap" label="Tape VWAP" value={fmtPx(tape?.vwap)} />
          <Metric
            tip="rsi"
            label="RSI 14"
            value={rsi != null ? rsi.toFixed(0) : "—"}
            tone={rsi != null && rsi > 70 ? "down" : rsi != null && rsi < 30 ? "up" : undefined}
          />
          <Metric
            tip="fragility"
            label="Fragility"
            value={frag.toFixed(0)}
            tone={frag >= 60 ? "warn" : undefined}
          />
          <Metric
            tip="fear"
            label="Fear greed"
            value={macro?.fearGreed ? `${macro.fearGreed.value}` : "—"}
            sub={macro?.fearGreed?.label}
          />
          <Metric tip="poc" label="POC" value={fmtPx(va?.poc)} />
          <Metric tip="vah" label="VAH" value={fmtPx(va?.vah)} />
          <Metric tip="val" label="VAL" value={fmtPx(va?.val)} />
          <Metric tip="rs" label="vs BTC" value={fmtPct(rs, 1)} tone={rs >= 0 ? "up" : "down"} />
        </div>
        {early.length ? (
          <div className="mt-3 space-y-1.5">
            {early.slice(0, 3).map((a) => (
              <p key={a.id} className="font-mono text-data text-warn">
                {a.kind} · {a.message}
              </p>
            ))}
          </div>
        ) : null}
        <div className="mt-4">
          <Candles data={snap?.klines ?? []} poc={va?.poc} vah={va?.vah} val={va?.val} />
        </div>
      </Panel>
      <Panel title="Alpha ticket" tip="alpha" className="desk-enter-2">
        {candidate ? (
          <div className="flex h-full flex-col gap-3">
            <p className="font-mono text-lg">
              <span className={candidate.side === "LONG" ? "text-up" : "text-down"}>{candidate.side}</span>{" "}
              {candidate.symbol}
            </p>
            <p className="text-sm leading-relaxed text-muted">{candidate.reasons.join(" · ")}</p>
            <div className="grid grid-cols-2 gap-3">
              <Metric tip="rr" label="R:R" value={candidate.rr.toFixed(1)} />
              <Metric label="Size" value={fmtUsd(candidate.sizeUsd, 0)} />
              <Metric label="Stop" value={fmtPx(candidate.sl)} />
              <Metric label="TP1" value={fmtPx(candidate.tp1)} />
            </div>
            <button
              type="button"
              onClick={() => onTrade(candidate)}
              className="pressable mt-auto rounded-sm bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
            >
              Paper this ticket
            </button>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            No ALPHA ticket. The rifle stays quiet until book, tape, funding, RSI, and positioning agree. Use
            RADAR for the fast lane — it never places size.
          </p>
        )}
      </Panel>
    </div>
  );
}

export function FlowPane({ snap, bar, onBar }: { snap: Snapshot | null; bar: Bar; onBar: (b: Bar) => void }) {
  const tape = snap ? tapeDelta(snap.trades) : null;
  const va = snap ? valueArea(snap.klines) : null;
  return (
    <div className="grid min-h-0 gap-3 lg:grid-cols-2">
      <Panel title="Order book" tip="imbalance" className="min-h-64">
        <Depth bids={snap?.depth.bids ?? []} asks={snap?.depth.asks ?? []} />
        <DepthMountain bids={snap?.depth.bids ?? []} asks={snap?.depth.asks ?? []} />
      </Panel>
      <Panel title="Tape" tip="cvd" className="min-h-64">
        <div className="mb-2 grid grid-cols-3 gap-2">
          <Metric tip="cvd" label="CVD" value={tape ? tape.cvd.toFixed(3) : "—"} />
          <Metric label="Buy notional" value={fmtVol(tape?.buy)} tone="up" />
          <Metric label="Sell notional" value={fmtVol(tape?.sell)} tone="down" />
        </div>
        <CvdMeter buy={tape?.buy ?? 0} sell={tape?.sell ?? 0} />
        <div className="desk-scroll mt-3 max-h-64 overflow-auto font-mono text-data">
          {(snap?.trades ?? [])
            .slice()
            .reverse()
            .slice(0, 40)
            .map((t) => (
              <div key={t.id} className="flex justify-between border-b border-border/50 py-0.5">
                <span className={t.isBuyerMaker ? "text-down" : "text-up"}>{fmtPx(t.price)}</span>
                <span className="text-muted">{t.qty}</span>
              </div>
            ))}
        </div>
      </Panel>
      <Panel title={`${bar} candles · volume profile`} className="lg:col-span-2">
        <div className="mb-2 flex justify-end">
          <Bars value={bar} bars={BARS} onChange={(b) => onBar(b as Bar)} />
        </div>
        <Candles data={snap?.klines ?? []} poc={va?.poc} vah={va?.vah} val={va?.val} />
        <p className="mt-2 text-label text-muted">Dashed steel = POC. Green = VAH. Red = VAL.</p>
      </Panel>
    </div>
  );
}

export function DerivativesPane({
  snap,
  positions,
  onSelect,
}: {
  snap: Snapshot | null;
  positions: PositionRow[];
  onSelect: (s: string) => void;
}) {
  const div = lsDivergence(snap?.globalLs ?? null, snap?.topLs ?? null);
  const frag = fragilityScore(snap);
  const g = snap?.globalLs;
  const takerTot = (snap?.takerBuy ?? 0) + (snap?.takerSell ?? 0);
  const takerLong = takerTot > 0 && snap?.takerBuy != null ? (snap.takerBuy / takerTot) * 100 : null;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Open long vs short" tip="retailLs">
        {g ? (
          <LongShortBar
            longPct={g.longAccount * 100}
            sub={`Ratio ${g.ratio.toFixed(3)} · ${g.longAccount >= 0.55 ? "crowd is long" : g.longAccount <= 0.45 ? "crowd is short" : "balanced"}`}
          />
        ) : (
          <p className="text-sm text-muted">No perp account ratio for this name.</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Metric
            tip="oi"
            label="OI 30m"
            value={snap?.oiChangePct != null ? fmtPct(snap.oiChangePct, 2) : "—"}
            tone={
              snap?.oiChangePct != null && snap.oiChangePct > 1
                ? "warn"
                : snap?.oiChangePct != null && snap.oiChangePct < -1
                  ? "muted"
                  : undefined
            }
          />
          <Metric tip="oi" label="Open interest" value={fmtVol(snap?.openInterest)} />
          <Metric
            label="Taker long"
            value={takerLong != null ? `${takerLong.toFixed(0)}%` : "—"}
            tone={takerLong != null && takerLong >= 58 ? "up" : takerLong != null && takerLong <= 42 ? "down" : undefined}
          />
          <Metric label="Margin L/S" value={snap?.marginLs != null ? snap.marginLs.toFixed(2) : "—"} />
        </div>
        {snap?.takerBuy != null && snap.takerSell != null ? (
          <div className="mt-3">
            <CvdMeter buy={snap.takerBuy} sell={snap.takerSell} />
          </div>
        ) : null}
        <p className={cn("mt-4 text-sm leading-relaxed", div.diverging ? "text-warn" : "text-muted")}>{div.note}</p>
      </Panel>
      <Panel title="Perpetual carry" tip="funding">
        <div className="grid grid-cols-2 gap-4">
          <Metric tip="funding" label="Funding / 8h" value={fmtFunding(snap?.funding.rate)} />
          <Metric tip="fundingApr" label="Carry" value={fmtApr(snap?.funding.rate)} />
          <Metric label="Mark" value={fmtPx(snap?.funding.mark)} />
          <Metric
            tip="fragility"
            label="Fragility"
            value={frag.toFixed(0)}
            tone={frag >= 60 ? "warn" : undefined}
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Rising OI with a quiet price is leverage loading — that is before the move, not after. Crowded longs plus
          rich funding is squeeze fuel.
        </p>
      </Panel>
      <Panel title="Universe positioning" tip="crowdBoard" className="lg:col-span-2">
        <div className="desk-scroll max-h-80 overflow-auto">
          {positions.length === 0 ? (
            <p className="text-sm text-muted">Loading account long/short on liquid perps…</p>
          ) : (
            positions.map((p) => (
              <button
                key={p.symbol}
                type="button"
                onClick={() => onSelect(p.symbol)}
                className="pressable grid w-full grid-cols-[5rem_1fr_4rem] items-center gap-3 border-b border-border py-2 text-left"
              >
                <span className="font-mono text-data">{p.symbol.replace("USDT", "")}</span>
                <LongShortBar longPct={p.longPct} />
                <span className={cn("font-mono text-data tabular", p.shift >= 0 ? "text-up" : "text-down")}>
                  {p.shift >= 0 ? "+" : ""}
                  {p.shift.toFixed(2)}
                </span>
              </button>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

export function PredictionsPane({
  macro,
  tickers,
  pulse,
  onSelect,
}: {
  macro: Macro | null;
  tickers: Ticker[];
  pulse: Pulse | null;
  onSelect: (s: string) => void;
}) {
  const total = tickers.reduce((s, t) => s + t.quoteVolume, 0);
  const btc = tickers.find((t) => t.symbol === "BTCUSDT")?.quoteVolume ?? 0;
  const share = total > 0 ? (btc / total) * 100 : null;
  const map = new Map(tickers.map((t) => [t.symbol.replace("USDT", ""), t]));
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Panel title="On-chain · BTC" tip="onchain">
        <div className="grid gap-4">
          <Metric
            tip="onchain"
            label="Mempool"
            value={pulse ? pulse.onchain.mempoolCount.toLocaleString() : "—"}
            sub="Unconfirmed Bitcoin transactions"
          />
          <Metric label="Fastest fee" value={pulse ? `${pulse.onchain.fastestFee} sat/vB` : "—"} />
          <Metric
            label="Hashrate"
            value={pulse?.onchain.hashrateEh ? `${pulse.onchain.hashrateEh.toFixed(0)} EH/s` : "—"}
          />
          <Metric
            tip="fear"
            label="Fear & greed"
            value={macro?.fearGreed ? String(macro.fearGreed.value) : "—"}
            sub={macro?.fearGreed?.label}
            tone={
              macro?.fearGreed && macro.fearGreed.value <= 25
                ? "up"
                : macro?.fearGreed && macro.fearGreed.value >= 75
                  ? "down"
                  : undefined
            }
          />
          <Metric
            label="BTC share of tape"
            value={share != null ? `${share.toFixed(1)}%` : "—"}
            sub="Venue USDT turnover, not global dominance"
          />
        </div>
      </Panel>
      <Panel title="Search heat — before the tape" tip="search">
        <div className="desk-scroll max-h-96 space-y-2 overflow-auto">
          {(pulse?.trending ?? []).map((c) => {
            const t = map.get(c.symbol);
            const quiet = Math.abs(c.changePct) < 6;
            return (
              <button
                key={c.symbol + c.name}
                type="button"
                onClick={() => t && onSelect(t.symbol)}
                className="pressable flex w-full items-center justify-between gap-2 border-b border-border py-2 text-left"
              >
                <div>
                  <div className="font-mono text-sm">{c.symbol}</div>
                  <div className="text-label text-muted">{c.name}</div>
                </div>
                <div className="text-right font-mono text-data">
                  <div className={c.changePct >= 0 ? "text-up" : "text-down"}>{fmtPct(c.changePct, 1)}</div>
                  {quiet ? <div className="text-warn">attention first</div> : <div className="text-faint">already moving</div>}
                </div>
              </button>
            );
          })}
          {!pulse?.trending?.length ? <p className="text-sm text-muted">Loading CoinGecko search trending…</p> : null}
        </div>
      </Panel>
      <Panel title="News before mainstream" tip="news">
        <div className="desk-scroll max-h-96 space-y-3 overflow-auto">
          {(pulse?.news ?? []).map((n) => (
            <a
              key={n.url + n.title}
              href={n.url || undefined}
              target="_blank"
              rel="noreferrer"
              className="block border-b border-border pb-2 hover:text-accent"
            >
              <p className="text-sm text-fg">{n.title}</p>
              <div className="mt-1 flex flex-wrap gap-2 font-mono text-label text-muted">
                <span>{n.source}</span>
                {n.tickers.map((tk) => (
                  <span key={tk} className="text-warn">
                    {tk}
                  </span>
                ))}
              </div>
            </a>
          ))}
          {!pulse?.news?.length ? (
            <p className="text-sm text-muted">Waiting on CoinTelegraph / Decrypt headlines…</p>
          ) : null}
        </div>
      </Panel>
      <Panel title="Prediction markets" tip="polymarket" className="lg:col-span-3">
        <div className="desk-scroll max-h-64 space-y-3 overflow-auto">
          {(macro?.polymarket ?? []).map((m) => (
            <div key={m.question} className="border-b border-border pb-3">
              <p className="text-sm text-fg">{m.question}</p>
              <div className="mt-1 flex flex-wrap gap-3 font-mono text-data text-muted">
                {m.outcomes.map((o, i) => (
                  <span key={o}>
                    {o}{" "}
                    <span className="text-fg">{m.prices[i] != null ? `${(m.prices[i] * 100).toFixed(0)}¢` : "—"}</span>
                  </span>
                ))}
                <span>vol {fmtVol(m.volume)}</span>
              </div>
            </div>
          ))}
          {!macro?.polymarket?.length ? (
            <p className="text-sm text-muted">No live crypto-tagged markets returned.</p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

export function RadarPane({
  alerts,
  tickers,
  symbol,
  onSelect,
}: {
  alerts: RadarAlert[];
  tickers: Ticker[];
  symbol: string;
  onSelect: (s: string) => void;
}) {
  const before = alerts.filter((a) => BEFORE_KINDS.has(a.kind));
  const after = alerts.filter((a) => !BEFORE_KINDS.has(a.kind));
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      <Panel title="Universe heat" tip="heatmap" className="lg:col-span-3">
        <Heatmap tickers={tickers} symbol={symbol} onSelect={onSelect} />
      </Panel>
      <Panel title="Before the print" tip="foresight" className="lg:col-span-2">
        <AlertList alerts={before} empty="Waiting on leverage, crowding, search, news, and book walls — these fire while price is still quiet." onSelect={onSelect} />
      </Panel>
      <Panel title="After — already moving" tip="radar" className="lg:col-span-5">
        <AlertList alerts={after} empty="No burst, volume jump, or 24h outlier yet." onSelect={onSelect} />
      </Panel>
    </div>
  );
}

function AlertList({
  alerts,
  empty,
  onSelect,
}: {
  alerts: RadarAlert[];
  empty: string;
  onSelect: (s: string) => void;
}) {
  return (
    <div className="desk-scroll max-h-[22rem] overflow-auto">
      {alerts.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        alerts.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.symbol)}
            className="pressable flex w-full items-start justify-between gap-3 border-b border-border py-2 text-left hover:bg-surface-2"
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-xs px-1.5 py-0.5 text-label uppercase",
                    a.kind === "PUMP" || a.kind === "MOVER"
                      ? "bg-up/15 text-up"
                      : a.kind === "DUMP"
                        ? "bg-down/15 text-down"
                        : "bg-warn/15 text-warn",
                  )}
                >
                  {a.kind}
                </span>
                <span className="font-mono text-sm">{a.symbol}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{a.message}</p>
            </div>
            <span className={cn("font-mono text-sm tabular", signedClass(a.changePct))}>{fmtPct(a.changePct)}</span>
          </button>
        ))
      )}
    </div>
  );
}

export function PaperPane({
  equity,
  cash,
  dailyPnl,
  positions,
  fills,
  halt,
  onClose,
  onReset,
  lastPx,
}: {
  equity: number;
  cash: number;
  dailyPnl: number;
  positions: import("@/lib/desk/types").PaperPosition[];
  fills: import("@/lib/desk/types").PaperFill[];
  halt: string | null;
  onClose: (id: string) => void;
  onReset: () => void;
  lastPx: (sym: string) => number;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Paper book" tip="paper">
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Equity" value={fmtUsd(equity)} />
          <Metric label="Cash" value={fmtUsd(cash)} />
          <Metric
            tip="circuit"
            label="Day P&L"
            value={fmtUsd(dailyPnl)}
            tone={dailyPnl > 0 ? "up" : dailyPnl < 0 ? "down" : undefined}
          />
        </div>
        {halt ? <p className="mt-3 text-sm text-warn">{halt}</p> : null}
        <div className="mt-4 desk-scroll max-h-64 overflow-auto">
          {positions.length === 0 ? (
            <p className="text-sm text-muted">No open risk. ALPHA tickets paper from Overview when the rifle actually fires.</p>
          ) : (
            positions.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-border py-2 font-mono text-data">
                <div>
                  <span className={p.side === "LONG" ? "text-up" : "text-down"}>{p.side}</span> {p.symbol}
                  <div className="text-muted">
                    {fmtPx(p.entry)} → {fmtPx(lastPx(p.symbol))} · u {fmtUsd(p.unrealized)}
                  </div>
                </div>
                <button type="button" className="text-xs text-accent" onClick={() => onClose(p.id)}>
                  Flatten
                </button>
              </div>
            ))
          )}
        </div>
        <button type="button" onClick={onReset} className="mt-3 text-xs text-faint hover:text-muted">
          Reset $100,000 paper
        </button>
      </Panel>
      <Panel title="Fills">
        <div className="desk-scroll max-h-96 overflow-auto font-mono text-data">
          {fills.length === 0 ? (
            <p className="text-sm text-muted">Fills pay 5 bps slippage and 4 bps fee. Stops and TP1 are working.</p>
          ) : (
            fills.map((f) => (
              <div key={f.id} className="border-b border-border py-2">
                <div className="flex justify-between">
                  <span>
                    {f.side} {f.symbol}
                  </span>
                  <span>{fmtPx(f.price)}</span>
                </div>
                <div className="text-muted">{f.note}</div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

export function HarvestPane({
  snap,
  symbol,
  carry,
  onSelect,
}: {
  snap: Snapshot | null;
  symbol: string;
  carry: CarryRow[];
  onSelect: (s: string) => void;
}) {
  const idea = snap ? buildHarvest(symbol, snap) : null;
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      <Panel title="This name" tip="harvest" className="lg:col-span-2">
        {idea ? (
          <div className="space-y-3">
            <p className="font-mono text-lg text-warn">{idea.action}</p>
            <p className="text-sm leading-relaxed text-muted">{idea.why}</p>
            <div className="grid grid-cols-2 gap-3">
              <Metric tip="funding" label="Funding" value={fmtFunding(idea.funding)} />
              <Metric tip="fundingApr" label="Gross carry" value={`${idea.apr.toFixed(1)}% APR`} />
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            Funding is quiet on this name. The board on the right scans the most liquid perps for rich carry.
          </p>
        )}
      </Panel>
      <Panel title="Carry board — liquid perps" tip="carryScan" className="lg:col-span-3">
        <div className="desk-scroll max-h-[28rem] overflow-auto">
          {carry.length === 0 ? (
            <p className="text-sm text-muted">Scanning perpetual funding on the most traded USDT swaps…</p>
          ) : (
            carry.map((r) => (
              <button
                key={r.symbol}
                type="button"
                onClick={() => onSelect(r.symbol)}
                className={cn(
                  "pressable flex w-full items-center justify-between gap-3 border-b border-border py-2 text-left font-mono text-data hover:bg-surface-2",
                  r.symbol === symbol && "bg-surface-2",
                )}
              >
                <span>{r.symbol.replace("USDT", "")}</span>
                <span className={r.funding >= 0 ? "text-warn" : "text-up"}>{fmtFunding(r.funding)}</span>
                <span className="text-muted">{r.apr >= 0 ? "+" : ""}{r.apr.toFixed(0)}% APR</span>
                <span className="text-faint">{fmtVol(r.vol)}</span>
              </button>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

export function HelpPane({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Panel title="How to read this desk">
      <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted">
        <p className="text-fg">
          ATLAS watches every liquid USDT pair at once. The left column is the universe. Type a ticker in the
          command bar and every pane re-scopes. Green is bid/up. Red is offer/down. Amber means something unusual
          is happening — look, do not blindly trade.
        </p>
        <p>
          Three books, on purpose. <span className="text-fg">RADAR</span> notices pumps in seconds and never
          sizes. <span className="text-fg">ALPHA</span> is a rare directional ticket when live book, tape,
          funding, and positioning agree. <span className="text-fg">HARVEST</span> collects funding instead of
          predicting direction.
        </p>
        <p>
          Radar is a heat map plus two lanes: <span className="text-fg">Before</span> (leverage, crowding,
          search, news) and <span className="text-fg">After</span> (the print already happened). Derivatives
          shows live long vs short open accounts. Foresight is on-chain, headlines, and search heat.
        </p>
        <p>
          Every number here is from public exchange and prediction-market APIs. There is no fake AI score stuck
          at 50. If a field is a dash, the venue did not return it — usually because the alt has no perp.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-sm bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
        >
          Got it — run the desk
        </button>
      </div>
    </Panel>
  );
}
