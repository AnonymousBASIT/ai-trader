import type { DepthLevel } from "@/lib/desk/types";
import { fmtPx } from "@/lib/desk/format";

export function Depth({ bids, asks }: { bids: DepthLevel[]; asks: DepthLevel[] }) {
  const rows = Math.max(bids.length, asks.length, 1);
  const maxBid = Math.max(...bids.map((l) => l.qty * l.price), 1);
  const maxAsk = Math.max(...asks.map((l) => l.qty * l.price), 1);
  const n = Math.min(rows, 12);

  return (
    <div className="grid grid-cols-2 gap-2 font-mono text-data">
      <div>
        <div className="mb-1 text-label uppercase tracking-wider text-up">Bids</div>
        {bids.slice(0, n).map((l) => (
          <div key={l.price} className="relative flex justify-between py-0.5">
            <span
              className="depth-bar absolute inset-y-0 right-0 bg-up/20"
              style={{ width: `${Math.min(100, (l.qty * l.price * 100) / maxBid)}%` }}
            />
            <span className="relative text-up">{fmtPx(l.price)}</span>
            <span className="relative text-muted">{l.qty.toPrecision(4)}</span>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-1 text-label uppercase tracking-wider text-down">Asks</div>
        {asks.slice(0, n).map((l) => (
          <div key={l.price} className="relative flex justify-between py-0.5">
            <span
              className="depth-bar absolute inset-y-0 left-0 bg-down/20"
              style={{ width: `${Math.min(100, (l.qty * l.price * 100) / maxAsk)}%` }}
            />
            <span className="relative text-down">{fmtPx(l.price)}</span>
            <span className="relative text-muted">{l.qty.toPrecision(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
