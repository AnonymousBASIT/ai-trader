export type Side = "LONG" | "SHORT";
export type BookId = "RADAR" | "ALPHA" | "HARVEST";
export type Bar = "1m" | "5m" | "15m" | "1H" | "4H";
export type SortMode = "move" | "vol" | "rs";
export type Section =
  | "overview"
  | "flow"
  | "derivatives"
  | "predictions"
  | "radar"
  | "paper"
  | "harvest"
  | "help";

export type Ticker = {
  symbol: string;
  last: number;
  open: number;
  high: number;
  low: number;
  changePct: number;
  quoteVolume: number;
  volume: number;
  bid: number;
  ask: number;
  venues?: string[];
};

export type DepthLevel = { price: number; qty: number };
export type TradePrint = {
  id: string;
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean;
};

export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type LongShort = {
  longAccount: number;
  shortAccount: number;
  ratio: number;
};

export type Snapshot = {
  symbol: string;
  venue: "binance" | "okx";
  last: number;
  depth: { bids: DepthLevel[]; asks: DepthLevel[] };
  trades: TradePrint[];
  klines: Candle[];
  funding: {
    rate: number | null;
    mark: number | null;
    index: number | null;
    nextFundingTime: number | null;
  };
  openInterest: number | null;
  oiChangePct: number | null;
  oiHistory: number[];
  globalLs: LongShort | null;
  lsHistory: number[];
  topLs: LongShort | null;
  takerBuy: number | null;
  takerSell: number | null;
  marginLs: number | null;
  error?: string;
};

export type Macro = {
  fearGreed: { value: number; label: string } | null;
  btcDominance: number | null;
  totalMcap: number | null;
  polymarket: Array<{
    question: string;
    outcomes: string[];
    prices: number[];
    volume: number;
  }>;
  error?: string;
};

export type RadarKind = "PUMP" | "DUMP" | "VOLUME" | "MOVER" | "RS" | "PRE" | "LEV" | "CROWD" | "NEWS" | "CHAIN" | "SEARCH";

export type RadarAlert = {
  id: string;
  ts: number;
  symbol: string;
  kind: RadarKind;
  message: string;
  changePct: number;
  quoteVolume: number;
  side?: Side;
  score?: number;
  entry?: number;
  sl?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  rr?: number;
  sizeUsd?: number;
  executed?: boolean;
};

export type AlphaCandidate = {
  symbol: string;
  side: Side;
  score: number;
  reasons: string[];
  rr: number;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  sizeUsd: number;
};

export type HarvestIdea = {
  symbol: string;
  funding: number;
  apr: number;
  action: string;
  why: string;
};

export type CarryRow = {
  symbol: string;
  funding: number;
  apr: number;
  last: number;
  vol: number;
};

export type PositionRow = {
  symbol: string;
  ratio: number;
  longPct: number;
  shortPct: number;
  shift: number;
};

export type NewsItem = {
  title: string;
  source: string;
  url: string;
  ts: number;
  tickers: string[];
};

export type TrendingCoin = {
  symbol: string;
  name: string;
  score: number;
  changePct: number;
};

export type Onchain = {
  mempoolCount: number;
  fastestFee: number;
  hashrateEh: number;
  stableUsd: number | null;
  stableDelta: number | null;
};

export type Pulse = {
  news: NewsItem[];
  trending: TrendingCoin[];
  onchain: Onchain;
};

export type PaperFill = {
  id: string;
  ts: number;
  symbol: string;
  side: Side;
  qty: number;
  price: number;
  fee: number;
  book: BookId;
  note: string;
};

export type PaperPosition = {
  id: string;
  symbol: string;
  side: Side;
  qty: number;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  book: BookId;
  openedAt: number;
  unrealized: number;
};

export type PaperState = {
  cash: number;
  equity: number;
  positions: PaperPosition[];
  fills: PaperFill[];
  dailyPnl: number;
  highWater: number;
};
