import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
export const ROOT = path.resolve(__dirname, "..", "..");
export function readCsv(file: string): Record<string, string>[] {
  const txt = fs.readFileSync(file, "utf-8").replace(/^﻿/, "");
  const lines = txt.trim().split("\n");
  const parse = (l: string) => { const out: string[] = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out; };
  const head = parse(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(parse(l).map((v, i) => [head[i], v])));
}
let _obs: Record<string, string>[] | null = null;
export const OBS = () => (_obs ||= readCsv(path.join(ROOT, "data/canonical_candidate/observations.csv")).filter((r) => r.publish_default === "true"));
export function obsValue(ind: string, geo: string, year: number): string | undefined {
  return OBS().find((r) => r.indicator_id === ind && r.geo_code === geo && r.year === String(year))?.value;
}
export function collectErrors(page: Page): string[] {
  const errs: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  return errs;
}
export function recordAcceptance(task: string, r: { result: "Pass" | "Partial" | "Fail" | "Not Run"; steps: string; clicks: number | string; data_year: string; verification: string; evidence: string; failure_reason?: string }) {
  const dir = path.join(ROOT, "reports/acceptance"); fs.mkdirSync(dir, { recursive: true });
  const env = process.env.BASE_URL ? "deployed" : "local";
  fs.writeFileSync(path.join(dir, `${env}-${task}.json`), JSON.stringify({ task, environment: process.env.BASE_URL || "local static build", ...r, failure_reason: r.failure_reason || "" }, null, 1));
}
export const SHOT = (name: string) => path.join(ROOT, "screenshots", name);
