import fs from "node:fs";
import path from "node:path";
import type { SeriesFile } from "./data";
export function readSeries(id: string): SeriesFile {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "data", "ind", `${id}.json`), "utf-8"));
}
export function readProvince(code: string): { geo: string; rows: { id: string; year: number; value: number | null; national: number | null; rank: number | null; evidence: string | null; series: Record<string, number> }[] } {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "data", "prov", `${code}.json`), "utf-8"));
}
