import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-fYIazK-i.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var cache = /* @__PURE__ */ new Map();
function cached(key, ttl, fn) {
	const hit = cache.get(key);
	if (hit && Date.now() - hit.t < ttl) return Promise.resolve(hit.v);
	return fn().then((v) => {
		cache.set(key, {
			t: Date.now(),
			v
		});
		return v;
	});
}
async function getJson(url, timeout = 9e3) {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), timeout);
	try {
		const res = await fetch(url, {
			signal: ctrl.signal,
			headers: { Accept: "application/json" }
		});
		if (!res.ok) throw new Error(`${res.status} ${url}`);
		return await res.json();
	} finally {
		clearTimeout(timer);
	}
}
function num(v) {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : 0;
}
function toOkxSpot(symbol) {
	if (symbol.endsWith("USDT")) return `${symbol.slice(0, -4)}-USDT`;
	if (symbol.endsWith("USDC")) return `${symbol.slice(0, -4)}-USDC`;
	return symbol;
}
function parseBinanceTickers(raw) {
	if (!Array.isArray(raw)) return [];
	const out = [];
	for (const row of raw) {
		const r = row;
		const symbol = String(r.symbol ?? "");
		if (!symbol.endsWith("USDT")) continue;
		if (symbol.includes("_") || symbol.endsWith("DOWNUSDT") || symbol.endsWith("UPUSDT")) continue;
		const quoteVolume = num(r.quoteVolume);
		if (quoteVolume < 5e5) continue;
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
			ask: num(r.askPrice)
		});
	}
	return out.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
}
function parseOkxTickers(raw) {
	const data = raw?.data;
	if (!Array.isArray(data)) return [];
	const out = [];
	for (const row of data) {
		const r = row;
		const inst = String(r.instId ?? "");
		if (!inst.endsWith("-USDT")) continue;
		const last = num(r.last);
		const open = num(r.open24h);
		const quoteVolume = num(r.volCcy24h);
		if (quoteVolume < 5e5 || last <= 0) continue;
		out.push({
			symbol: inst.replaceAll("-", ""),
			last,
			open,
			high: num(r.high24h),
			low: num(r.low24h),
			changePct: open > 0 ? (last - open) / open * 100 : 0,
			quoteVolume,
			volume: num(r.vol24h),
			bid: num(r.bidPx),
			ask: num(r.askPx)
		});
	}
	return out.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
}
var getUniverse_createServerFn_handler = createServerRpc({
	id: "66087b44c4898dd8924b2412aa4b0d04680fda881918579ff268fb46521d61f8",
	name: "getUniverse",
	filename: "src/lib/desk/api.ts"
}, (opts) => getUniverse.__executeServer(opts));
var getUniverse = createServerFn({ method: "GET" }).handler(getUniverse_createServerFn_handler, async () => {
	return cached("universe", 4e3, async () => {
		try {
			const tickers = parseOkxTickers(await getJson("https://www.okx.com/api/v5/market/tickers?instType=SPOT"));
			if (tickers.length > 15) return {
				venue: "okx",
				tickers,
				ts: Date.now()
			};
			throw new Error("thin okx");
		} catch {
			for (const host of ["https://api.binance.us", "https://api.binance.com"]) try {
				const tickers = parseBinanceTickers(await getJson(`${host}/api/v3/ticker/24hr`));
				if (tickers.length > 10) return {
					venue: "binance",
					tickers,
					ts: Date.now()
				};
			} catch {}
			return {
				venue: "okx",
				tickers: [],
				ts: Date.now()
			};
		}
	});
});
async function snapshotOkx(symbol) {
	const spot = toOkxSpot(symbol);
	const swap = `${spot}-SWAP`;
	const base = spot.split("-")[0] ?? "BTC";
	const [books, trades, candles, funding, mark, oi, ls] = await Promise.all([
		getJson(`https://www.okx.com/api/v5/market/books?instId=${spot}&sz=20`),
		getJson(`https://www.okx.com/api/v5/market/trades?instId=${spot}&limit=80`),
		getJson(`https://www.okx.com/api/v5/market/candles?instId=${spot}&bar=15m&limit=96`),
		getJson(`https://www.okx.com/api/v5/public/funding-rate?instId=${swap}`).catch(() => null),
		getJson(`https://www.okx.com/api/v5/public/mark-price?instId=${swap}`).catch(() => null),
		getJson(`https://www.okx.com/api/v5/public/open-interest?instId=${swap}`).catch(() => null),
		getJson(`https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=${base}&period=1H`).catch(() => null)
	]);
	const bookRow = books.data?.[0];
	const tradeRows = trades.data ?? [];
	const candleRows = candles.data ?? [];
	const fundRow = funding?.data?.[0];
	const markRow = mark?.data?.[0];
	const oiRow = oi?.data?.[0];
	const lsRows = ls?.data ?? [];
	const prints = tradeRows.slice().reverse().map((t) => ({
		id: String(t.tradeId),
		price: num(t.px),
		qty: num(t.sz),
		time: num(t.ts),
		isBuyerMaker: String(t.side) === "sell"
	}));
	const klines = candleRows.slice().reverse().map((k) => ({
		t: num(k[0]),
		o: num(k[1]),
		h: num(k[2]),
		l: num(k[3]),
		c: num(k[4]),
		v: num(k[5])
	}));
	const last = prints[prints.length - 1]?.price || klines[klines.length - 1]?.c || 0;
	const ratio = lsRows[0] ? num(lsRows[0][1]) : 0;
	const globalLs = ratio ? {
		ratio,
		longAccount: ratio / (1 + ratio),
		shortAccount: 1 / (1 + ratio)
	} : null;
	return {
		symbol,
		venue: "okx",
		last,
		depth: {
			bids: (bookRow?.bids ?? []).map((l) => ({
				price: num(l[0]),
				qty: num(l[1])
			})),
			asks: (bookRow?.asks ?? []).map((l) => ({
				price: num(l[0]),
				qty: num(l[1])
			}))
		},
		trades: prints,
		klines,
		funding: {
			rate: fundRow ? num(fundRow.fundingRate) : null,
			mark: markRow ? num(markRow.markPx) : null,
			index: null,
			nextFundingTime: fundRow ? num(fundRow.fundingTime) : null
		},
		openInterest: oiRow ? num(oiRow.oiCcy ?? oiRow.oi) : null,
		globalLs,
		topLs: null
	};
}
async function snapshotBinance(host, symbol) {
	const [depth, trades, klines] = await Promise.all([
		getJson(`${host}/api/v3/depth?symbol=${symbol}&limit=20`),
		getJson(`${host}/api/v3/trades?symbol=${symbol}&limit=80`),
		getJson(`${host}/api/v3/klines?symbol=${symbol}&interval=15m&limit=96`)
	]);
	const d = depth;
	const tr = Array.isArray(trades) ? trades : [];
	const kl = Array.isArray(klines) ? klines : [];
	const prints = tr.map((t) => ({
		id: String(t.id),
		price: num(t.price),
		qty: num(t.qty),
		time: num(t.time),
		isBuyerMaker: Boolean(t.isBuyerMaker)
	}));
	const candles = kl.map((k) => ({
		t: num(k[0]),
		o: num(k[1]),
		h: num(k[2]),
		l: num(k[3]),
		c: num(k[4]),
		v: num(k[5])
	}));
	return {
		symbol,
		venue: "binance",
		last: prints[prints.length - 1]?.price || candles[candles.length - 1]?.c || 0,
		depth: {
			bids: (d.bids ?? []).map(([p, q]) => ({
				price: num(p),
				qty: num(q)
			})),
			asks: (d.asks ?? []).map(([p, q]) => ({
				price: num(p),
				qty: num(q)
			}))
		},
		trades: prints,
		klines: candles,
		funding: {
			rate: null,
			mark: null,
			index: null,
			nextFundingTime: null
		},
		openInterest: null,
		globalLs: null,
		topLs: null
	};
}
var getSnapshot_createServerFn_handler = createServerRpc({
	id: "f252ece4e77eced02d9e12efeb563da73c54fb1875c0f358ade133f88f2004ea",
	name: "getSnapshot",
	filename: "src/lib/desk/api.ts"
}, (opts) => getSnapshot.__executeServer(opts));
var getSnapshot = createServerFn({ method: "POST" }).validator((input) => ({ symbol: String(input?.symbol ?? "BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20) || "BTCUSDT" })).handler(getSnapshot_createServerFn_handler, async ({ data }) => {
	const symbol = data.symbol;
	return cached(`snap:${symbol}`, 2500, async () => {
		try {
			const snap = await snapshotOkx(symbol);
			if (snap.depth.bids.length || snap.trades.length) return snap;
			throw new Error("empty okx");
		} catch (err) {
			try {
				return await snapshotBinance("https://api.binance.us", symbol);
			} catch {
				return {
					symbol,
					venue: "okx",
					last: 0,
					depth: {
						bids: [],
						asks: []
					},
					trades: [],
					klines: [],
					funding: {
						rate: null,
						mark: null,
						index: null,
						nextFundingTime: null
					},
					openInterest: null,
					globalLs: null,
					topLs: null,
					error: err instanceof Error ? err.message : "snapshot failed"
				};
			}
		}
	});
});
var getMacro_createServerFn_handler = createServerRpc({
	id: "144ddc71608f67875a9b2dd84e38eed39524ac58c5e637c48b2867af37b28fbf",
	name: "getMacro",
	filename: "src/lib/desk/api.ts"
}, (opts) => getMacro.__executeServer(opts));
var getMacro = createServerFn({ method: "GET" }).handler(getMacro_createServerFn_handler, async () => {
	return cached("macro", 6e4, async () => {
		const [fg, ...searches] = await Promise.allSettled([
			getJson("https://api.alternative.me/fng/?limit=1"),
			getJson("https://gamma-api.polymarket.com/public-search?q=bitcoin"),
			getJson("https://gamma-api.polymarket.com/public-search?q=ethereum"),
			getJson("https://gamma-api.polymarket.com/public-search?q=crypto")
		]);
		let fearGreed = null;
		if (fg.status === "fulfilled") {
			const row = fg.value.data?.[0];
			if (row) fearGreed = {
				value: Number(row.value),
				label: row.value_classification
			};
		}
		const polymarket = [];
		const seen = /* @__PURE__ */ new Set();
		for (const s of searches) {
			if (s.status !== "fulfilled") continue;
			const events = s.value.events ?? [];
			for (const ev of events) {
				const markets = ev.markets ?? [];
				for (const r of markets) {
					const q = String(r.question ?? ev.title ?? "");
					if (!q || seen.has(q)) continue;
					seen.add(q);
					let prices = [];
					const op = r.outcomePrices;
					if (typeof op === "string") try {
						prices = JSON.parse(op).map((x) => Number(x));
					} catch {
						prices = [];
					}
					else if (Array.isArray(op)) prices = op.map((x) => Number(x));
					let outcomes = [];
					if (typeof r.outcomes === "string") try {
						outcomes = JSON.parse(r.outcomes);
					} catch {
						outcomes = [];
					}
					else if (Array.isArray(r.outcomes)) outcomes = r.outcomes.map(String);
					polymarket.push({
						question: q,
						outcomes,
						prices,
						volume: num(r.volume24hr ?? r.volume)
					});
					if (polymarket.length >= 8) break;
				}
				if (polymarket.length >= 8) break;
			}
		}
		return {
			fearGreed,
			btcDominance: null,
			totalMcap: null,
			polymarket
		};
	});
});
//#endregion
export { getMacro_createServerFn_handler, getSnapshot_createServerFn_handler, getUniverse_createServerFn_handler };
