import type { Bar, Snapshot, Ticker } from "./types";

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return (await res.json()) as T;
}

export type UniverseFeed = {
  venue: "okx" | "binance";
  tickers: Ticker[];
  ts: number;
};

export async function loadUniverse(): Promise<UniverseFeed> {
  return readJson<UniverseFeed>(`/api/desk/universe?t=${Date.now()}`, { method: "GET" });
}

export async function loadSnapshot(symbol: string, bar: Bar): Promise<Snapshot> {
  const q = new URLSearchParams({
    symbol,
    bar,
    t: String(Date.now()),
  });
  return readJson<Snapshot>(`/api/desk/snapshot?${q.toString()}`);
}
