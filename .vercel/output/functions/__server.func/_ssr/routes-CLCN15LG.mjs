import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Tip, r as cn } from "./router-IT0V90TG.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CLCN15LG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Candles({ data, poc, vah, val }) {
	if (data.length < 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-40 items-center text-sm text-muted",
		children: "Waiting for candles…"
	});
	const w = 640;
	const h = 180;
	const pad = 8;
	const highs = data.map((d) => d.h);
	const lows = data.map((d) => d.l);
	const min = Math.min(...lows);
	const max = Math.max(...highs);
	const span = max - min || 1;
	const cw = 624 / data.length;
	const y = (px) => pad + (max - px) / span * 164;
	const volMax = Math.max(...data.map((d) => d.v), 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${w} ${h}`,
		className: "h-44 w-full",
		role: "img",
		"aria-label": "15-minute candles",
		children: [
			poc != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: 0,
				x2: w,
				y1: y(poc),
				y2: y(poc),
				stroke: "currentColor",
				className: "text-accent",
				strokeDasharray: "3 3",
				strokeWidth: "1"
			}) : null,
			vah != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: 0,
				x2: w,
				y1: y(vah),
				y2: y(vah),
				stroke: "currentColor",
				className: "text-up",
				strokeOpacity: .35
			}) : null,
			val != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: 0,
				x2: w,
				y1: y(val),
				y2: y(val),
				stroke: "currentColor",
				className: "text-down",
				strokeOpacity: .35
			}) : null,
			data.map((d, i) => {
				const x = pad + i * cw + cw / 2;
				const color = d.c >= d.o ? "var(--color-up)" : "var(--color-down)";
				const bodyTop = y(Math.max(d.o, d.c));
				const bodyBot = y(Math.min(d.o, d.c));
				const bh = Math.max(1, bodyBot - bodyTop);
				const vh = d.v / volMax * 18;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						x1: x,
						x2: x,
						y1: y(d.h),
						y2: y(d.l),
						stroke: color,
						strokeWidth: "1"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: x - Math.max(.6, cw * .28),
						y: bodyTop,
						width: Math.max(1.2, cw * .56),
						height: bh,
						fill: color
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: x - Math.max(.4, cw * .2),
						y: h - vh,
						width: Math.max(.8, cw * .4),
						height: vh,
						fill: color,
						opacity: .25
					})
				] }, d.t);
			})
		]
	});
}
function fmtPx(n) {
	if (n == null || !Number.isFinite(n)) return "—";
	const abs = Math.abs(n);
	if (abs >= 1e3) return n.toLocaleString("en-US", {
		maximumFractionDigits: 2,
		minimumFractionDigits: 2
	});
	if (abs >= 1) return n.toLocaleString("en-US", {
		maximumFractionDigits: 4,
		minimumFractionDigits: 2
	});
	if (abs >= .01) return n.toFixed(6);
	return n.toFixed(8);
}
function fmtPct(n, digits = 2) {
	if (n == null || !Number.isFinite(n)) return "—";
	return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
}
function fmtVol(n) {
	if (n == null || !Number.isFinite(n)) return "—";
	const abs = Math.abs(n);
	if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
	if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
	if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
	return n.toFixed(0);
}
function fmtUsd(n, digits = 2) {
	if (n == null || !Number.isFinite(n)) return "—";
	return `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", {
		maximumFractionDigits: digits,
		minimumFractionDigits: digits
	})}`;
}
function fmtFunding(rate) {
	if (rate == null || !Number.isFinite(rate)) return "—";
	return `${(rate * 100).toFixed(4)}%`;
}
function fundingApr(rate) {
	if (rate == null || !Number.isFinite(rate)) return null;
	return rate * 3 * 365 * 100;
}
function fmtApr(rate) {
	const apr = fundingApr(rate);
	if (apr == null) return "—";
	return `${apr >= 0 ? "+" : ""}${apr.toFixed(1)}% APR`;
}
function clockUtc(ts = Date.now()) {
	return new Date(ts).toISOString().slice(11, 19) + " UTC";
}
function signedClass(n) {
	if (n == null || n === 0) return "text-muted";
	return n > 0 ? "text-up" : "text-down";
}
function normalizeSymbol(raw) {
	const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
	if (!s) return "BTCUSDT";
	if (s.endsWith("USDT") || s.endsWith("USDC")) return s;
	return `${s}USDT`;
}
function Depth({ bids, asks }) {
	const rows = Math.max(bids.length, asks.length, 1);
	const maxBid = Math.max(...bids.map((l) => l.qty * l.price), 1);
	const maxAsk = Math.max(...asks.map((l) => l.qty * l.price), 1);
	const n = Math.min(rows, 12);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-2 gap-2 font-mono text-data",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-1 text-label uppercase tracking-wider text-up",
			children: "Bids"
		}), bids.slice(0, n).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative flex justify-between py-0.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute inset-y-0 right-0 bg-up/15",
					style: { width: `${Math.min(100, l.qty * l.price * 100 / maxBid)}%` }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "relative text-up",
					children: fmtPx(l.price)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "relative text-muted",
					children: l.qty.toPrecision(4)
				})
			]
		}, l.price))] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-1 text-label uppercase tracking-wider text-down",
			children: "Asks"
		}), asks.slice(0, n).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative flex justify-between py-0.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute inset-y-0 left-0 bg-down/15",
					style: { width: `${Math.min(100, l.qty * l.price * 100 / maxAsk)}%` }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "relative text-down",
					children: fmtPx(l.price)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "relative text-muted",
					children: l.qty.toPrecision(4)
				})
			]
		}, l.price))] })]
	});
}
var TIPS = {
	last: "Last traded price on the selected venue. This is the print, not a quote.",
	change: "Percent change versus the session open the exchange reports (24h on Binance).",
	volume: "Notional traded in USDT over 24h. Abnormal volume is how pumps start — before price looks obvious.",
	spread: "Ask minus bid, in basis points of mid. Wide spread means you pay more to enter and exit.",
	imbalance: "Bid size in the top 10 levels divided by ask size. Above 2 means the book is bid-heavy. Below 0.5 is offer-heavy. This is inventory, not a crystal ball.",
	cvd: "Cumulative Volume Delta of the last prints. Positive means more aggressive buying (lifts) than selling (hits). Price up while CVD falls is exhaustion.",
	vwap: "Volume-weighted average of the recent tape. Trading above it means buyers are paying up; below it, sellers are hitting down.",
	poc: "Point of Control — the price with the most volume in the loaded candles. Markets often rotate back through it.",
	vah: "Value Area High — top of the region that holds ~70% of volume. Leaving it with volume is a breakout; failing it is a trap.",
	val: "Value Area Low — bottom of the ~70% volume region. Same idea as VAH, inverted.",
	funding: "What longs pay shorts (if positive) every 8 hours on the perpetual. Very high positive funding means the crowd is leveraged long — fuel for a long squeeze.",
	fundingApr: "Funding annualized (rate × 3 × 365). This is the carry you collect if you fade the crowded side and stay hedged.",
	oi: "Open interest — number of outstanding perp contracts. Rising OI with a move means new leverage is being added. Falling OI means the move is covering.",
	retailLs: "Global long/short account ratio. Mostly retail. Extremes are often contrarian — retail max-long is a common local top.",
	smartLs: "Top trader position ratio by size. Large accounts. More useful with them than against them.",
	divergence: "Retail and large traders disagree. Retail long + smart short is a distribution setup. Retail short + smart long is accumulation.",
	fragility: "How loaded the spring is: crowded funding plus one-sided retail plus rising leverage. Above 60, a small print can cascade liquidations.",
	fear: "CNN-style crypto Fear & Greed, 0–100. Extreme fear (<25) has historically been a better long backdrop than extreme greed (>75).",
	polymarket: "Implied probability from people putting real money on an event. Use the 24h jump, not the level. Thin crypto markets — color, not a trigger.",
	radar: "Fast lane. Flags unusual 4-second prints, 24h outliers, and volume. Alerts only — never an order. This is how you stop missing pumps.",
	alpha: "Slow lane. A directional candidate only when several independent live facts agree (book, tape, funding, positioning). You still click to trade.",
	harvest: "Get paid without needing direction. When funding is rich, short the perp and hold spot (or the inverse). You collect the transfer.",
	kelly: "Fraction of equity suggested by win rate and payoff. Capped at 2% here. This is a ceiling, not a target.",
	rr: "Reward / risk using TP1 versus the stop. Below 2.5 the desk will not auto-flag an ALPHA ticket.",
	paper: "Simulated account. Fills pay 5 bps slippage plus 4 bps fee against last. Stops and targets are working orders, not magic.",
	circuit: "Daily loss halt at −3% equity, weekly −7%, monthly −15%. A desk that cannot stop is not a desk.",
	universe: "Every liquid USDT pair the venue lists, not just BTC and ETH. Sorted by how abnormal it is right now."
};
function Metric({ tip, label, value, sub, tone, mono = true }) {
	const color = tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "warn" ? "text-warn" : "text-fg";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-1",
				children: tip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tip, {
					label: TIPS[tip],
					className: "text-label uppercase tracking-wider",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-faint",
						children: "i"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-label uppercase tracking-wider text-faint",
					children: label
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("mt-0.5 truncate text-sm", mono && "font-mono tabular", color),
				children: value
			}),
			sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-0.5 truncate font-mono text-label text-muted",
				children: sub
			}) : null
		]
	});
}
function Panel({ title, tip, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("flex min-h-0 flex-col rounded-md bg-surface shadow-border", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "flex items-center justify-between border-b border-border px-3 py-2",
			children: tip ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, {
				label: TIPS[tip],
				className: "text-label uppercase tracking-widest text-muted",
				children: title
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-label uppercase tracking-widest text-muted",
				children: title
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-0 flex-1 p-3",
			children
		})]
	});
}
function bookImbalance(snap) {
	if (!snap) return null;
	const bid = snap.depth.bids.slice(0, 10).reduce((s, l) => s + l.qty * l.price, 0);
	const ask = snap.depth.asks.slice(0, 10).reduce((s, l) => s + l.qty * l.price, 0);
	if (ask <= 0) return null;
	return bid / ask;
}
function spreadBps(snap) {
	if (!snap) return null;
	const bid = snap.depth.bids[0]?.price;
	const ask = snap.depth.asks[0]?.price;
	if (!bid || !ask) return null;
	const mid = (bid + ask) / 2;
	if (mid <= 0) return null;
	return (ask - bid) / mid * 1e4;
}
function tapeDelta(trades) {
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
	return {
		cvd,
		buy,
		sell,
		vwap: qty > 0 ? notional / qty : 0
	};
}
function valueArea(klines) {
	if (!klines.length) return null;
	const bins = /* @__PURE__ */ new Map();
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
	const target = total * .7;
	while (acc < target && (lo > 0 || hi < entries.length - 1)) {
		const left = lo > 0 ? entries[lo - 1][1] : -1;
		if ((hi < entries.length - 1 ? entries[hi + 1][1] : -1) >= left) {
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
		vah: entries[hi][0] * step
	};
}
function lsDivergence(globalLs, topLs) {
	if (!globalLs || !topLs) return {
		diverging: false,
		note: "Need both retail and top-trader ratios."
	};
	const g = globalLs.ratio;
	const t = topLs.ratio;
	if (g > 1.3 && t < .9) return {
		diverging: true,
		note: "Retail heavily long, large traders leaning short — distribution."
	};
	if (g < .77 && t > 1.1) return {
		diverging: true,
		note: "Retail heavily short, large traders leaning long — accumulation."
	};
	return {
		diverging: false,
		note: "Retail and large traders are not in conflict."
	};
}
function fragilityScore(snap) {
	if (!snap) return 0;
	let s = 20;
	const f = snap.funding.rate;
	if (f != null) {
		const abs = Math.abs(f);
		if (abs > .001) s += 35;
		else if (abs > 5e-4) s += 22;
		else if (abs > 2e-4) s += 10;
	}
	if (lsDivergence(snap.globalLs, snap.topLs).diverging) s += 20;
	if (snap.globalLs && (snap.globalLs.ratio > 1.6 || snap.globalLs.ratio < .6)) s += 15;
	return Math.max(0, Math.min(100, s));
}
function scanRadar(prev, next, now = Date.now()) {
	if (!prev) return [];
	const map = new Map(prev.map((t) => [t.symbol, t]));
	const out = [];
	for (const t of next) {
		const p = map.get(t.symbol);
		if (!p || p.last <= 0) continue;
		const burst = (t.last - p.last) / p.last * 100;
		if (Math.abs(burst) >= .45 && t.quoteVolume > 2e6) out.push({
			id: `${t.symbol}-${now}-burst`,
			ts: now,
			symbol: t.symbol,
			kind: burst > 0 ? "PUMP" : "DUMP",
			message: `${burst > 0 ? "Burst up" : "Burst down"} ${burst.toFixed(2)}% in a few seconds`,
			changePct: burst,
			quoteVolume: t.quoteVolume
		});
		else if (Math.abs(t.changePct) >= 12 && t.quoteVolume > 8e6) out.push({
			id: `${t.symbol}-${now}-mover`,
			ts: now,
			symbol: t.symbol,
			kind: "MOVER",
			message: `24h ${t.changePct >= 0 ? "+" : ""}${t.changePct.toFixed(1)}% on ${fmtM(t.quoteVolume)} USDT`,
			changePct: t.changePct,
			quoteVolume: t.quoteVolume
		});
		else {
			const volJump = p.quoteVolume > 0 ? t.quoteVolume / p.quoteVolume - 1 : 0;
			if (volJump > .04 && t.quoteVolume > 5e6) out.push({
				id: `${t.symbol}-${now}-vol`,
				ts: now,
				symbol: t.symbol,
				kind: "VOLUME",
				message: `Tape accelerating — 24h notional jumped ${(volJump * 100).toFixed(1)}% this poll`,
				changePct: t.changePct,
				quoteVolume: t.quoteVolume
			});
		}
	}
	return out.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 12);
}
function fmtM(n) {
	if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
	if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
	return `${(n / 1e3).toFixed(0)}K`;
}
function buildAlpha(symbol, snap, equity) {
	const last = snap.last || snap.trades[0]?.price;
	if (!last) return null;
	const imb = bookImbalance(snap);
	const tape = tapeDelta(snap.trades);
	const fund = snap.funding.rate;
	const div = lsDivergence(snap.globalLs, snap.topLs);
	const reasons = [];
	let longPts = 0;
	let shortPts = 0;
	if (imb != null && imb >= 1.8) {
		longPts += 1;
		reasons.push(`Book bid-heavy (imbalance ${imb.toFixed(2)})`);
	} else if (imb != null && imb <= .55) {
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
	if (fund != null && fund > 5e-4) {
		shortPts += 1;
		reasons.push(`Funding crowded long (${(fund * 100).toFixed(3)}% / 8h) — squeeze fuel`);
	} else if (fund != null && fund < -3e-4) {
		longPts += 1;
		reasons.push(`Funding crowded short (${(fund * 100).toFixed(3)}% / 8h)`);
	} else if (fund != null && Math.abs(fund) < 15e-5) {
		longPts += .5;
		shortPts += .5;
		reasons.push("Funding is quiet — less crowded");
	}
	if (div.diverging && div.note.includes("accumulation")) {
		longPts += 1;
		reasons.push(div.note);
	} else if (div.diverging && div.note.includes("distribution")) {
		shortPts += 1;
		reasons.push(div.note);
	}
	const side = longPts >= 3 && longPts > shortPts ? "LONG" : shortPts >= 3 && shortPts > longPts ? "SHORT" : null;
	if (!side) return null;
	const score = Math.round(Math.max(longPts, shortPts) * 20);
	const slPct = .01;
	const tp1Pct = .025;
	const sl = side === "LONG" ? last * .99 : last * 1.01;
	const tp1 = side === "LONG" ? last * 1.025 : last * .975;
	const tp2 = side === "LONG" ? last * 1.04 : last * .96;
	const tp3 = side === "LONG" ? last * 1.06 : last * .94;
	return {
		symbol,
		side,
		score,
		reasons,
		rr: tp1Pct / slPct,
		entry: last,
		sl,
		tp1,
		tp2,
		tp3,
		sizeUsd: Math.min(equity * .02, 5e3)
	};
}
function buildHarvest(symbol, snap) {
	const f = snap.funding.rate;
	if (f == null || Math.abs(f) < 1e-4) return null;
	const apr = f * 3 * 365 * 100;
	if (f > 0) return {
		symbol,
		funding: f,
		apr,
		action: "HARVEST LONG SPOT / SHORT PERP",
		why: `Longs are paying ${(f * 100).toFixed(3)}% every 8h. Collect that transfer while staying near delta-neutral. You do not need BTC to go up.`
	};
	return {
		symbol,
		funding: f,
		apr,
		action: "HARVEST SHORT SPOT / LONG PERP",
		why: `Shorts are paying ${Math.abs(f * 100).toFixed(3)}% every 8h. Flip the carry: long the perp, short or underweight spot.`
	};
}
var STARTING_CASH = 1e5;
var SLIPPAGE = 5e-4;
var FEE = 4e-4;
function OverviewPane({ ticker, snap, macro, candidate, onTrade }) {
	const imb = bookImbalance(snap);
	const spr = spreadBps(snap);
	const tape = snap ? tapeDelta(snap.trades) : null;
	const va = snap ? valueArea(snap.klines) : null;
	const frag = fragilityScore(snap);
	const last = snap?.last || ticker?.last || 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid min-h-0 gap-3 lg:grid-cols-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			title: "Selected",
			className: "lg:col-span-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-4 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "last",
						label: "Last",
						value: fmtPx(last)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "change",
						label: "24h",
						value: fmtPct(ticker?.changePct),
						tone: ticker && ticker.changePct >= 0 ? "up" : "down"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "volume",
						label: "Turnover",
						value: fmtVol(ticker?.quoteVolume)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "spread",
						label: "Spread",
						value: spr != null ? `${spr.toFixed(1)} bp` : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "imbalance",
						label: "Book imb",
						value: imb != null ? imb.toFixed(2) : "—",
						tone: imb != null && imb >= 1.8 ? "up" : imb != null && imb <= .55 ? "down" : void 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "cvd",
						label: "Tape CVD",
						value: tape ? tape.cvd.toFixed(3) : "—",
						tone: tape && tape.cvd > 0 ? "up" : tape && tape.cvd < 0 ? "down" : void 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "vwap",
						label: "Tape VWAP",
						value: fmtPx(tape?.vwap)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "fragility",
						label: "Fragility",
						value: frag.toFixed(0),
						tone: frag >= 60 ? "warn" : void 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "poc",
						label: "POC",
						value: fmtPx(va?.poc)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "vah",
						label: "VAH",
						value: fmtPx(va?.vah)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "val",
						label: "VAL",
						value: fmtPx(va?.val)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "fear",
						label: "Fear greed",
						value: macro?.fearGreed ? `${macro.fearGreed.value}` : "—",
						sub: macro?.fearGreed?.label
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Candles, {
					data: snap?.klines ?? [],
					poc: va?.poc,
					vah: va?.vah,
					val: va?.val
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Alpha ticket",
			tip: "alpha",
			children: candidate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-full flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-lg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: candidate.side === "LONG" ? "text-up" : "text-down",
								children: candidate.side
							}),
							" ",
							candidate.symbol
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted",
						children: candidate.reasons.join(" · ")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								tip: "rr",
								label: "R:R",
								value: candidate.rr.toFixed(1)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Size",
								value: fmtUsd(candidate.sizeUsd, 0)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Stop",
								value: fmtPx(candidate.sl)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "TP1",
								value: fmtPx(candidate.tp1)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onTrade(candidate),
						className: "mt-auto rounded-sm bg-accent px-3 py-2 text-sm font-medium text-accent-fg",
						children: "Paper this ticket"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "No ALPHA ticket. The rifle stays quiet until book, tape, funding, and positioning agree. Use RADAR for the fast lane — it never places size."
			})
		})]
	});
}
function FlowPane({ snap }) {
	const tape = snap ? tapeDelta(snap.trades) : null;
	const va = snap ? valueArea(snap.klines) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid min-h-0 gap-3 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Order book",
				tip: "imbalance",
				className: "min-h-64",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Depth, {
					bids: snap?.depth.bids ?? [],
					asks: snap?.depth.asks ?? []
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Tape",
				tip: "cvd",
				className: "min-h-64",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 grid grid-cols-3 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							tip: "cvd",
							label: "CVD",
							value: tape ? tape.cvd.toFixed(3) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Buy notional",
							value: fmtVol(tape?.buy),
							tone: "up"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Sell notional",
							value: fmtVol(tape?.sell),
							tone: "down"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "desk-scroll max-h-72 overflow-auto font-mono text-data",
					children: (snap?.trades ?? []).slice().reverse().slice(0, 40).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between border-b border-border/50 py-0.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: t.isBuyerMaker ? "text-down" : "text-up",
							children: fmtPx(t.price)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: t.qty
						})]
					}, t.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "15m candles · volume profile",
				className: "lg:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Candles, {
					data: snap?.klines ?? [],
					poc: va?.poc,
					vah: va?.vah,
					val: va?.val
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-label text-muted",
					children: "Dashed steel = POC. Green = VAH. Red = VAL."
				})]
			})
		]
	});
}
function DerivativesPane({ snap }) {
	const div = lsDivergence(snap?.globalLs ?? null, snap?.topLs ?? null);
	const frag = fragilityScore(snap);
	const g = snap?.globalLs;
	const t = snap?.topLs;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			title: "Perpetual carry",
			tip: "funding",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "funding",
						label: "Funding / 8h",
						value: fmtFunding(snap?.funding.rate)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "fundingApr",
						label: "Carry",
						value: fmtApr(snap?.funding.rate)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Mark",
						value: fmtPx(snap?.funding.mark)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Index",
						value: fmtPx(snap?.funding.index)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "oi",
						label: "Open interest",
						value: fmtVol(snap?.openInterest)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "fragility",
						label: "Fragility",
						value: frag.toFixed(0),
						tone: frag >= 60 ? "warn" : void 0
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm leading-relaxed text-muted",
				children: "Positive funding means longs pay shorts. When that number is large, the crowd is leveraged the same way — a small print can force a cascade. That is a mechanism, not a slogan."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			title: "Long vs short",
			tip: "divergence",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "retailLs",
						label: "Retail L/S",
						value: g ? g.ratio.toFixed(3) : "—",
						sub: g ? `${(g.longAccount * 100).toFixed(0)}% long accounts` : void 0
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "smartLs",
						label: "Top trader L/S",
						value: t ? t.ratio.toFixed(3) : "—",
						sub: t ? `${(t.longAccount * 100).toFixed(0)}% of large size` : void 0
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("mt-4 text-sm leading-relaxed", div.diverging ? "text-warn" : "text-muted"),
					children: div.note
				}),
				snap && !snap.globalLs ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "No perp positioning for this spot symbol (common on thin alts)."
				}) : null
			]
		})]
	});
}
function PredictionsPane({ macro, tickers }) {
	const total = tickers.reduce((s, t) => s + t.quoteVolume, 0);
	const btc = tickers.find((t) => t.symbol === "BTCUSDT")?.quoteVolume ?? 0;
	const share = total > 0 ? btc / total * 100 : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 lg:grid-cols-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Macro tape",
			className: "lg:col-span-1",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "fear",
						label: "Fear & greed",
						value: macro?.fearGreed ? String(macro.fearGreed.value) : "—",
						sub: macro?.fearGreed?.label,
						tone: macro?.fearGreed && macro.fearGreed.value <= 25 ? "up" : macro?.fearGreed && macro.fearGreed.value >= 75 ? "down" : void 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "BTC share of tape",
						value: share != null ? `${share.toFixed(1)}%` : "—",
						sub: "Of USDT turnover on this venue, not global dominance"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Venue turnover",
						value: fmtUsd(total, 0)
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Prediction markets",
			tip: "polymarket",
			className: "lg:col-span-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "desk-scroll max-h-96 space-y-3 overflow-auto",
				children: [(macro?.polymarket ?? []).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-border pb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg",
						children: m.question
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex flex-wrap gap-3 font-mono text-data text-muted",
						children: [m.outcomes.map((o, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							o,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: m.prices[i] != null ? `${(m.prices[i] * 100).toFixed(0)}¢` : "—"
							})
						] }, o)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["vol ", fmtVol(m.volume)] })]
					})]
				}, m.question)), !macro?.polymarket?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "No live crypto-tagged markets returned. The feed is public and free — it will fill when Polymarket has volume."
				}) : null]
			})
		})]
	});
}
function RadarPane({ alerts, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		title: "Radar — alerts only, no size",
		tip: "radar",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-muted",
			children: TIPS.radar
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "desk-scroll max-h-[28rem] overflow-auto",
			children: alerts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Listening to the whole universe. A burst, a 24h outlier, or accelerating notional will land here."
			}) : alerts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onSelect(a.symbol),
				className: "flex w-full items-start justify-between gap-3 border-b border-border py-2 text-left hover:bg-surface-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("rounded-xs px-1.5 py-0.5 text-label uppercase", a.kind === "PUMP" || a.kind === "MOVER" ? "bg-up/15 text-up" : a.kind === "DUMP" ? "bg-down/15 text-down" : "bg-warn/15 text-warn"),
						children: a.kind
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-sm",
						children: a.symbol
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: a.message
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("font-mono text-sm tabular", signedClass(a.changePct)),
					children: fmtPct(a.changePct)
				})]
			}, a.id))
		})]
	});
}
function PaperPane({ equity, cash, dailyPnl, positions, fills, halt, onClose, onReset, lastPx }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			title: "Paper book",
			tip: "paper",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Equity",
							value: fmtUsd(equity)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Cash",
							value: fmtUsd(cash)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							tip: "circuit",
							label: "Day P&L",
							value: fmtUsd(dailyPnl),
							tone: dailyPnl > 0 ? "up" : dailyPnl < 0 ? "down" : void 0
						})
					]
				}),
				halt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-warn",
					children: halt
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 desk-scroll max-h-64 overflow-auto",
					children: positions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "No open risk. ALPHA tickets paper from Overview when the rifle actually fires."
					}) : positions.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between border-b border-border py-2 font-mono text-data",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: p.side === "LONG" ? "text-up" : "text-down",
								children: p.side
							}),
							" ",
							p.symbol,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-muted",
								children: [
									fmtPx(p.entry),
									" → ",
									fmtPx(lastPx(p.symbol)),
									" · u ",
									fmtUsd(p.unrealized)
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-xs text-accent",
							onClick: () => onClose(p.id),
							children: "Flatten"
						})]
					}, p.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onReset,
					className: "mt-3 text-xs text-faint hover:text-muted",
					children: "Reset $100,000 paper"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Fills",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "desk-scroll max-h-96 overflow-auto font-mono text-data",
				children: fills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Fills pay 5 bps slippage and 4 bps fee. Stops and TP1 are working."
				}) : fills.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-border py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							f.side,
							" ",
							f.symbol
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: fmtPx(f.price) })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-muted",
						children: f.note
					})]
				}, f.id))
			})
		})]
	});
}
function HarvestPane({ snap, symbol }) {
	const idea = snap ? buildHarvest(symbol, snap) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		title: "Harvest — get paid to exist",
		tip: "harvest",
		children: idea ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-xl space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-lg text-warn",
					children: idea.action
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-muted",
					children: idea.why
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "funding",
						label: "Funding",
						value: fmtFunding(idea.funding)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						tip: "fundingApr",
						label: "Gross carry",
						value: `${idea.apr.toFixed(1)}% APR`
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Paper harvest is not auto-opened. Basis and two-leg execution belong on your machine with exchange keys. This pane tells you when the carry is real."
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-xl text-sm leading-relaxed text-muted",
			children: "Funding is quiet on this name (under 0.01% per 8h). Harvest waits for rich carry — that is the closest thing an independent desk gets to market-making without being the exchange."
		})
	});
}
function HelpPane({ onDismiss }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		title: "How to read this desk",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-2xl space-y-4 text-sm leading-relaxed text-muted",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-fg",
					children: "ATLAS watches every liquid USDT pair at once. The left column is the universe. Type a ticker in the command bar and every pane re-scopes. Green is bid/up. Red is offer/down. Amber means something unusual is happening — look, do not blindly trade."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"Three books, on purpose. ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg",
						children: "RADAR"
					}),
					" notices pumps in seconds and never sizes. ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg",
						children: "ALPHA"
					}),
					" is a rare directional ticket when live book, tape, funding, and positioning agree. ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg",
						children: "HARVEST"
					}),
					" collects funding instead of predicting direction."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"Hover any ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg",
						children: "i"
					}),
					" label for a plain-language definition. Keys: / focuses command, 1–8 switch sections, Enter loads a ticker."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Every number here is from public exchange and prediction-market APIs. There is no fake AI score stuck at 50. If a field is a dash, the venue did not return it — usually because the alt has no perp." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onDismiss,
					className: "rounded-sm bg-accent px-3 py-2 text-sm font-medium text-accent-fg",
					children: "Got it — run the desk"
				})
			]
		})
	});
}
function Watchlist({ tickers, symbol, query, alerts, onSelect }) {
	const flagged = new Set(alerts.slice(0, 40).map((a) => a.symbol));
	const q = query.trim().toUpperCase();
	const rows = (q ? tickers.filter((t) => t.symbol.includes(q)) : tickers).slice(0, 180);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 text-label uppercase tracking-wider text-faint",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Pair" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Last" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "24h" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "desk-scroll min-h-0 flex-1 overflow-auto",
				children: [rows.map((t) => {
					const hot = flagged.has(t.symbol);
					const active = t.symbol === symbol;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onSelect(t.symbol),
						className: cn("grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-border/60 px-3 py-1.5 text-left font-mono text-data", active ? "bg-surface-2" : "hover:bg-surface-2/70", hot && "bg-warn/10"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex min-w-0 items-center gap-1.5",
								children: [
									hot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 shrink-0 rounded-full bg-warn" }) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate text-fg",
										children: t.symbol.replace("USDT", "")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-faint",
										children: "USDT"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular text-fg",
								children: fmtPx(t.last)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("w-16 text-right tabular", t.changePct >= 0 ? "text-up" : "text-down"),
								children: fmtPct(t.changePct, 1)
							})
						]
					}, t.symbol);
				}), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-3 py-6 text-sm text-muted",
					children: "No pairs match. Try BTC, SOL, or PEPE."
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-border px-3 py-1.5 font-mono text-label text-muted",
				children: [
					rows.length,
					" shown · vol ",
					fmtVol(tickers.reduce((s, t) => s + t.quoteVolume, 0))
				]
			})
		]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getUniverse = createServerFn({ method: "GET" }).handler(createSsrRpc("66087b44c4898dd8924b2412aa4b0d04680fda881918579ff268fb46521d61f8"));
var getSnapshot = createServerFn({ method: "POST" }).validator((input) => ({ symbol: String(input?.symbol ?? "BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20) || "BTCUSDT" })).handler(createSsrRpc("f252ece4e77eced02d9e12efeb563da73c54fb1875c0f358ade133f88f2004ea"));
var getMacro = createServerFn({ method: "GET" }).handler(createSsrRpc("144ddc71608f67875a9b2dd84e38eed39524ac58c5e637c48b2867af37b28fbf"));
function emptyPaper() {
	return {
		cash: STARTING_CASH,
		equity: STARTING_CASH,
		positions: [],
		fills: [],
		dailyPnl: 0,
		highWater: STARTING_CASH
	};
}
function fillPrice(side, last, closing) {
	if (!closing) return side === "LONG" ? last * (1 + SLIPPAGE) : last * (1 - SLIPPAGE);
	return side === "LONG" ? last * (1 - SLIPPAGE) : last * (1 + SLIPPAGE);
}
function mtmEquity(cash, positions, pxOf) {
	return cash + positions.reduce((sum, p) => {
		return sum + (pxOf(p.symbol) || p.entry) * p.qty;
	}, 0);
}
var useDesk = create()(persist((set, get) => ({
	symbol: "BTCUSDT",
	section: "overview",
	helpOpen: false,
	helpSeen: false,
	query: "",
	paper: emptyPaper(),
	alerts: [],
	prevTickers: null,
	halt: null,
	setSymbol: (s) => set({ symbol: s }),
	setSection: (s) => set({ section: s }),
	setQuery: (q) => set({ query: q }),
	setHelpOpen: (v) => set({ helpOpen: v }),
	markHelpSeen: () => set({
		helpSeen: true,
		helpOpen: false,
		section: "overview"
	}),
	ingestTickers: (tickers) => {
		const prev = get().prevTickers;
		set({
			prevTickers: tickers,
			alerts: [...scanRadar(prev, tickers), ...get().alerts].slice(0, 80)
		});
	},
	openPaper: (c) => {
		const { paper, halt } = get();
		if (halt) return halt;
		if (paper.dailyPnl <= -.03 * Math.max(paper.highWater, 1e5)) {
			const msg = "Daily loss circuit breaker — no new risk.";
			set({ halt: msg });
			return msg;
		}
		const px = fillPrice(c.side, c.entry, false);
		const notional = Math.min(c.sizeUsd, paper.cash * .95);
		if (notional < 50) return "Not enough cash.";
		const fee = notional * FEE;
		const qty = (notional - fee) / px;
		const pos = {
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
			unrealized: 0
		};
		const fill = {
			id: pos.id + "-in",
			ts: Date.now(),
			symbol: c.symbol,
			side: c.side,
			qty,
			price: px,
			fee,
			book: "ALPHA",
			note: `Open ${c.side} · ${c.reasons[0] ?? "manual"}`
		};
		set({ paper: {
			...paper,
			cash: paper.cash - notional,
			positions: [...paper.positions, pos],
			fills: [fill, ...paper.fills].slice(0, 200)
		} });
		return null;
	},
	closePosition: (id, price, note) => {
		const { paper } = get();
		const pos = paper.positions.find((p) => p.id === id);
		if (!pos) return;
		const px = fillPrice(pos.side, price, true);
		const notional = pos.qty * px;
		const fee = notional * FEE;
		const pnl = pos.side === "LONG" ? (px - pos.entry) * pos.qty - fee : (pos.entry - px) * pos.qty - fee;
		const fill = {
			id: id + "-out-" + Date.now(),
			ts: Date.now(),
			symbol: pos.symbol,
			side: pos.side,
			qty: pos.qty,
			price: px,
			fee,
			book: pos.book,
			note
		};
		const cash = paper.cash + notional - fee;
		const positions = paper.positions.filter((p) => p.id !== id);
		set({ paper: {
			...paper,
			cash,
			equity: cash + positions.reduce((s, p) => s + (p.unrealized || 0) + p.qty * p.entry, 0),
			positions,
			fills: [fill, ...paper.fills].slice(0, 200),
			dailyPnl: paper.dailyPnl + pnl,
			highWater: Math.max(paper.highWater, cash)
		} });
	},
	markToMarket: (snap, tickers) => {
		const pxOf = (sym) => {
			if (snap && snap.symbol === sym && snap.last) return snap.last;
			return tickers.find((t) => t.symbol === sym)?.last ?? 0;
		};
		const { paper } = get();
		const still = [];
		const fills = [];
		let cash = paper.cash;
		let dailyPnl = paper.dailyPnl;
		for (const p of paper.positions) {
			const last = pxOf(p.symbol);
			const u = last ? p.side === "LONG" ? (last - p.entry) * p.qty : (p.entry - last) * p.qty : p.unrealized;
			const hitSl = last > 0 && (p.side === "LONG" ? last <= p.sl : last >= p.sl);
			const hitTp = last > 0 && (p.side === "LONG" ? last >= p.tp1 : last <= p.tp1);
			if (hitSl || hitTp) {
				const px = fillPrice(p.side, last, true);
				const notional = p.qty * px;
				const fee = notional * FEE;
				const pnl = p.side === "LONG" ? (px - p.entry) * p.qty - fee : (p.entry - px) * p.qty - fee;
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
					note: hitSl ? "Stop hit" : "TP1 hit"
				});
			} else still.push({
				...p,
				unrealized: u
			});
		}
		const equity = mtmEquity(cash, still, pxOf);
		set({
			halt: equity <= paper.highWater * .97 ? "Daily loss circuit breaker armed." : get().halt,
			paper: {
				cash,
				equity,
				positions: still,
				fills: [...fills, ...paper.fills].slice(0, 200),
				dailyPnl,
				highWater: Math.max(paper.highWater, equity)
			}
		});
	},
	resetPaper: () => set({
		paper: emptyPaper(),
		halt: null
	})
}), {
	name: "atlas-desk-v1",
	skipHydration: true,
	partialize: (s) => ({
		symbol: s.symbol,
		helpSeen: s.helpSeen,
		paper: s.paper
	})
}));
var SECTIONS = [
	{
		id: "overview",
		key: "1",
		label: "Overview"
	},
	{
		id: "flow",
		key: "2",
		label: "Order flow"
	},
	{
		id: "derivatives",
		key: "3",
		label: "Derivatives"
	},
	{
		id: "predictions",
		key: "4",
		label: "Predictions"
	},
	{
		id: "radar",
		key: "5",
		label: "Radar"
	},
	{
		id: "paper",
		key: "6",
		label: "Paper"
	},
	{
		id: "harvest",
		key: "7",
		label: "Harvest"
	},
	{
		id: "help",
		key: "8",
		label: "Help"
	}
];
function DeskApp() {
	const inputRef = (0, import_react.useRef)(null);
	const [clock, setClock] = (0, import_react.useState)("");
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
	const openPaper = useDesk((s) => s.openPaper);
	const closePosition = useDesk((s) => s.closePosition);
	const markToMarket = useDesk((s) => s.markToMarket);
	const resetPaper = useDesk((s) => s.resetPaper);
	const markHelpSeen = useDesk((s) => s.markHelpSeen);
	const setHelpOpen = useDesk((s) => s.setHelpOpen);
	(0, import_react.useEffect)(() => {
		useDesk.persist.rehydrate();
	}, []);
	(0, import_react.useEffect)(() => {
		const tick = () => setClock(clockUtc());
		tick();
		const id = window.setInterval(tick, 1e3);
		return () => window.clearInterval(id);
	}, []);
	const universe = useQuery({
		queryKey: ["universe"],
		queryFn: () => getUniverse(),
		refetchInterval: 4e3
	});
	const snapQ = useQuery({
		queryKey: ["snap", symbol],
		queryFn: () => getSnapshot({ data: { symbol } }),
		refetchInterval: 3e3
	});
	const macroQ = useQuery({
		queryKey: ["macro"],
		queryFn: () => getMacro(),
		refetchInterval: 6e4
	});
	const tickers = universe.data?.tickers ?? [];
	const snap = snapQ.data ?? null;
	const ticker = tickers.find((t) => t.symbol === symbol);
	(0, import_react.useEffect)(() => {
		if (!useDesk.getState().helpSeen) setHelpOpen(true);
	}, [setHelpOpen]);
	(0, import_react.useEffect)(() => {
		if (universe.data?.tickers) ingestTickers(universe.data.tickers);
	}, [universe.data, ingestTickers]);
	const seen = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	(0, import_react.useEffect)(() => {
		for (const a of alerts.slice(0, 6)) {
			if (seen.current.has(a.id)) continue;
			seen.current.add(a.id);
			toast(`${a.kind} ${a.symbol}`, { description: a.message });
		}
	}, [alerts]);
	(0, import_react.useEffect)(() => {
		if (paper.positions.length) markToMarket(snap, tickers);
	}, [
		snap,
		tickers,
		markToMarket,
		paper.positions.length
	]);
	const candidate = (0, import_react.useMemo)(() => {
		if (!snap || snap.error) return null;
		return buildAlpha(symbol, snap, paper.equity);
	}, [
		snap,
		symbol,
		paper.equity
	]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const tag = e.target?.tagName;
			if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
				e.preventDefault();
				inputRef.current?.focus();
				return;
			}
			if (e.key === "Escape") setHelpOpen(false);
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
	function loadSymbol(raw) {
		const next = normalizeSymbol(raw);
		const match = tickers.find((t) => t.symbol === next) || tickers.find((t) => t.symbol.startsWith(raw.toUpperCase().replace(/[^A-Z0-9]/g, "")));
		setSymbol(match?.symbol ?? next);
		setQuery("");
	}
	const feedOk = Boolean(universe.dataUpdatedAt && Date.now() - universe.dataUpdatedAt < 15e3 && tickers.length > 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline gap-2 pr-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium tracking-[0.22em] text-accent",
							children: "ATLAS"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden text-label uppercase tracking-widest text-faint sm:inline",
							children: "Desk"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "flex min-w-0 flex-1 items-center gap-2",
						onSubmit: (e) => {
							e.preventDefault();
							const v = inputRef.current?.value ?? query;
							if (v.trim()) loadSymbol(v);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "sr-only",
								htmlFor: "cmd",
								children: "Ticker"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-warn",
								children: "/"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "cmd",
								ref: inputRef,
								value: query,
								onChange: (e) => setQuery(e.target.value),
								placeholder: "Type a ticker · SOL · PEPE · BTCUSDT",
								className: "min-w-0 flex-1 bg-transparent font-mono text-sm text-fg outline-none placeholder:text-faint",
								autoComplete: "off",
								spellCheck: false
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden font-mono text-data text-muted md:block",
						children: clock || "—"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "desk-scroll flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-1",
				children: SECTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setSection(s.id),
					className: cn("min-h-11 shrink-0 rounded-xs px-2.5 py-2 text-xs tracking-wide", section === s.id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mr-1.5 font-mono text-faint",
						children: s.key
					}), s.label]
				}, s.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid min-h-0 flex-1 lg:grid-cols-[minmax(220px,280px)_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "hidden min-h-0 border-r border-border bg-surface lg:flex lg:flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-b border-border px-3 py-2 text-label uppercase tracking-widest text-muted",
						children: [
							"Universe · ",
							tickers.length,
							" pairs"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Watchlist, {
						tickers,
						symbol,
						query,
						alerts,
						onSelect: (s) => {
							setSymbol(s);
							setQuery("");
						}
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "desk-scroll min-h-0 overflow-auto p-3",
					children: [
						universe.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-3 text-sm text-down",
							children: "Universe feed failed. Retrying public APIs…"
						}) : null,
						universe.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-3 text-sm text-muted",
							children: "Loading the universe from public venues…"
						}) : null,
						helpOpen && section !== "help" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-start justify-between gap-3 rounded-md bg-surface-2 px-3 py-2 text-sm text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Left column is every liquid pair. Type a ticker. Radar never sizes. Hover any label with i." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "shrink-0 text-accent",
								onClick: markHelpSeen,
								children: "Dismiss"
							})]
						}) : null,
						snap?.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-3 text-sm text-warn",
							children: ["Snapshot: ", snap.error]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex flex-wrap items-end justify-between gap-2 lg:hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-mono text-lg",
								children: symbol
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: ticker && ticker.changePct >= 0 ? "font-mono text-up" : "font-mono text-down",
								children: ticker ? fmtPct(ticker.changePct) : "—"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "max-w-48 rounded-sm bg-surface-2 px-2 py-2 text-sm",
								value: symbol,
								onChange: (e) => setSymbol(e.target.value),
								children: (tickers.length ? tickers : [{
									symbol,
									last: 0,
									changePct: 0
								}]).slice(0, 80).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: t.symbol,
									children: t.symbol
								}, t.symbol))
							})]
						}),
						section === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewPane, {
							ticker,
							snap,
							macro: macroQ.data ?? null,
							candidate,
							onTrade: (c) => {
								const err = openPaper(c);
								if (err) toast.error(err);
								else {
									toast.success(`Paper ${c.side} ${c.symbol}`);
									setSection("paper");
								}
							}
						}) : null,
						section === "flow" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowPane, { snap }) : null,
						section === "derivatives" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DerivativesPane, { snap }) : null,
						section === "predictions" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PredictionsPane, {
							macro: macroQ.data ?? null,
							tickers
						}) : null,
						section === "radar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadarPane, {
							alerts,
							onSelect: (s) => {
								setSymbol(s);
								setSection("overview");
							}
						}) : null,
						section === "paper" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaperPane, {
							equity: paper.equity,
							cash: paper.cash,
							dailyPnl: paper.dailyPnl,
							positions: paper.positions,
							fills: paper.fills,
							halt,
							lastPx: (sym) => snap && snap.symbol === sym && snap.last || tickers.find((t) => t.symbol === sym)?.last || 0,
							onClose: (id) => {
								const pos = paper.positions.find((p) => p.id === id);
								const px = pos && snap && snap.symbol === pos.symbol && snap.last || pos && tickers.find((t) => t.symbol === pos.symbol)?.last || pos?.entry || 0;
								closePosition(id, px, "Manual flatten");
							},
							onReset: resetPaper
						}) : null,
						section === "harvest" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HarvestPane, {
							snap,
							symbol
						}) : null,
						section === "help" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelpPane, { onDismiss: markHelpSeen }) : null
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-3 py-1.5 font-mono text-label text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: feedOk ? "text-up" : "text-down",
							children: feedOk ? "LIVE" : "STALE"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: universe.data?.venue?.toUpperCase() ?? "—" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [tickers.length, " names"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: symbol
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"Paper ",
							fmtUsd(paper.equity, 0),
							" · ",
							paper.positions.length,
							" open"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "hidden md:inline",
							children: ["Radar ", alerts.length]
						}),
						candidate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-warn",
							children: ["ALPHA ", candidate.side]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ALPHA quiet" })
					]
				})]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskApp, {});
}
//#endregion
export { Home as component };
