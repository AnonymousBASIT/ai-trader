import type { Candle } from "@/lib/desk/types";

export function Candles({ data, poc, vah, val }: { data: Candle[]; poc?: number; vah?: number; val?: number }) {
  if (data.length < 2) {
    return <div className="flex h-40 items-center text-sm text-muted">Waiting for candles…</div>;
  }
  const w = 640;
  const h = 180;
  const pad = 8;
  const highs = data.map((d) => d.h);
  const lows = data.map((d) => d.l);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = max - min || 1;
  const cw = (w - pad * 2) / data.length;
  const y = (px: number) => pad + ((max - px) / span) * (h - pad * 2);
  const volMax = Math.max(...data.map((d) => d.v), 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" role="img" aria-label="Price candles">
      {poc != null ? (
        <line x1={0} x2={w} y1={y(poc)} y2={y(poc)} stroke="currentColor" className="text-accent" strokeDasharray="3 3" strokeWidth="1" />
      ) : null}
      {vah != null ? (
        <line x1={0} x2={w} y1={y(vah)} y2={y(vah)} stroke="currentColor" className="text-up" strokeOpacity={0.35} />
      ) : null}
      {val != null ? (
        <line x1={0} x2={w} y1={y(val)} y2={y(val)} stroke="currentColor" className="text-down" strokeOpacity={0.35} />
      ) : null}
      {data.map((d, i) => {
        const x = pad + i * cw + cw / 2;
        const up = d.c >= d.o;
        const color = up ? "var(--color-up)" : "var(--color-down)";
        const bodyTop = y(Math.max(d.o, d.c));
        const bodyBot = y(Math.min(d.o, d.c));
        const bh = Math.max(1, bodyBot - bodyTop);
        const vh = (d.v / volMax) * 18;
        return (
          <g key={d.t}>
            <line x1={x} x2={x} y1={y(d.h)} y2={y(d.l)} stroke={color} strokeWidth="1" />
            <rect x={x - Math.max(0.6, cw * 0.28)} y={bodyTop} width={Math.max(1.2, cw * 0.56)} height={bh} fill={color} />
            <rect x={x - Math.max(0.4, cw * 0.2)} y={h - vh} width={Math.max(0.8, cw * 0.4)} height={vh} fill={color} opacity={0.25} />
          </g>
        );
      })}
    </svg>
  );
}
