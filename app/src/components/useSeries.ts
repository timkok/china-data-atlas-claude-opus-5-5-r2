"use client";
import { useEffect, useState } from "react";
import type { SeriesFile } from "@/lib/data";

const cache: Record<string, Promise<SeriesFile>> = {};
export function loadSeries(id: string): Promise<SeriesFile> {
  if (!cache[id]) cache[id] = fetch(`/data/ind/${id}.json`).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
  return cache[id];
}
export function useSeries(id: string) {
  const [data, setData] = useState<SeriesFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { loadSeries(id).then(setData).catch((e) => setError(String(e))); }, [id]);
  return { data, error };
}
