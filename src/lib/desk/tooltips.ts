export const TIPS: Record<string, string> = {
  last: "Last traded price on the selected venue. This is the print, not a quote.",
  change: "Percent change versus the session open the exchange reports (24h on Binance).",
  volume: "Notional traded in USDT over 24h. Abnormal volume is how pumps start — before price looks obvious.",
  spread: "Ask minus bid, in basis points of mid. Wide spread means you pay more to enter and exit.",
  imbalance:
    "Bid size in the top 10 levels divided by ask size. Above 2 means the book is bid-heavy. Below 0.5 is offer-heavy. This is inventory, not a crystal ball.",
  cvd: "Cumulative Volume Delta of the last prints. Positive means more aggressive buying (lifts) than selling (hits). Price up while CVD falls is exhaustion.",
  vwap: "Volume-weighted average of the recent tape. Trading above it means buyers are paying up; below it, sellers are hitting down.",
  poc: "Point of Control — the price with the most volume in the loaded candles. Markets often rotate back through it.",
  vah: "Value Area High — top of the region that holds ~70% of volume. Leaving it with volume is a breakout; failing it is a trap.",
  val: "Value Area Low — bottom of the ~70% volume region. Same idea as VAH, inverted.",
  funding:
    "What longs pay shorts (if positive) every 8 hours on the perpetual. Very high positive funding means the crowd is leveraged long — fuel for a long squeeze.",
  fundingApr: "Funding annualized (rate × 3 × 365). This is the carry you collect if you fade the crowded side and stay hedged.",
  oi: "Open interest — number of outstanding perp contracts. Rising OI with a move means new leverage is being added. Falling OI means the move is covering.",
  retailLs:
    "Global long/short account ratio. Mostly retail. Extremes are often contrarian — retail max-long is a common local top.",
  smartLs:
    "Top trader position ratio by size. Large accounts. More useful with them than against them.",
  divergence:
    "Retail and large traders disagree. Retail long + smart short is a distribution setup. Retail short + smart long is accumulation.",
  fragility:
    "How loaded the spring is: crowded funding plus one-sided retail plus rising leverage. Above 60, a small print can cascade liquidations.",
  fear: "CNN-style crypto Fear & Greed, 0–100. Extreme fear (<25) has historically been a better long backdrop than extreme greed (>75).",
  polymarket:
    "Implied probability from people putting real money on an event. Use the 24h jump, not the level. Thin crypto markets — color, not a trigger.",
  radar:
    "Fast lane. Flags unusual 4-second prints, 24h outliers, and volume. Alerts only — never an order. This is how you stop missing pumps.",
  alpha:
    "Slow lane. A directional candidate only when several independent live facts agree (book, tape, funding, positioning). You still click to trade.",
  harvest:
    "Get paid without needing direction. When funding is rich, short the perp and hold spot (or the inverse). You collect the transfer.",
  kelly:
    "Fraction of equity suggested by win rate and payoff. Capped at 2% here. This is a ceiling, not a target.",
  rr: "Reward / risk using TP1 versus the stop. Below 2.5 the desk will not auto-flag an ALPHA ticket.",
  paper: "Simulated account. Fills pay 5 bps slippage plus 4 bps fee against last. Stops and targets are working orders, not magic.",
  circuit:
    "Daily loss halt at −3% equity, weekly −7%, monthly −15%. A desk that cannot stop is not a desk.",
  rsi: "Wilder RSI on the loaded candles, 14 periods. Below 30 is oversold; above 70 is overbought. It is a stretch meter, not a buy button.",
  heatmap:
    "Every liquid name as a heat cell. Brighter green = larger 24h gain; brighter red = larger loss. Click a cell to re-scope the whole desk.",
  rs: "This name’s 24h percent minus BTC’s 24h percent. Positive means it is leading bitcoin; negative means it is lagging. That is relative strength, not magic.",
  carryScan:
    "Funding on the most liquid USDT perps, ranked by how rich the 8-hour transfer is. Harvest the crowded side — you do not need a direction.",
  universe:
    "Every liquid USDT pair the venue lists, not just BTC and ETH. Sorted by how abnormal it is right now.",
  foresight:
    "Signals that fire while price is still quiet: leverage loading, account crowding, taker flow, book walls, search heat, and headlines. This is the before lane. Pumps are the after lane.",
  onchain:
    "Bitcoin mempool size and fees from mempool.space. A jammed mempool or a fee spike is on-chain heat — often before spot traders notice.",
  search:
    "CoinGecko trending is what people are searching, not what already pumped. A name trending with a quiet 24h is attention before the tape.",
  news: "Headlines from CoinTelegraph and Decrypt as they publish. Tagged to a ticker only when the 24h move is still small — news before it is priced.",
  crowdBoard:
    "OKX long vs short account ratio on liquid perps. The bar is open accounts, not size. Extremes plus a shift are crowding — fuel for a squeeze.",
};

