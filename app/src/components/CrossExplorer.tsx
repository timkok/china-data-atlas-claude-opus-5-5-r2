"use client";
import { useEffect, useMemo, useState } from "react";
import EChart from "./EChart";
import { loadSeries } from "./useSeries";
import { toCsv } from "./DataTable";
import { CATEGORIES, EVIDENCE, GEO, INDICATORS, PROVINCES, REGION7, fmt, getIndicator, type SeriesFile } from "@/lib/data";
import { SERIES, axisCommon, INK } from "./theme";

type Chart = "line" | "bar" | "scatter" | "bubble";
type Tf = "value" | "index" | "yoy";
const LV = ["E2", "E3", "E4"];

function pearson(xs: number[], ys: number[]) {
  const n = xs.length; if (n < 3) return NaN;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let a = 0, b = 0, c = 0; for (let i = 0; i < n; i++) { a += (xs[i] - mx) * (ys[i] - my); b += (xs[i] - mx) ** 2; c += (ys[i] - my) ** 2; }
  return a / Math.sqrt(b * c);
}

export default function CrossExplorer() {
  const [inds, setInds] = useState<string[]>(["population", "gdp_per_capita"]);
  const [geos, setGeos] = useState<string[]>(["440000", "320000", "330000"]);
  const [from, setFrom] = useState(2015);
  const [to, setTo] = useState(2025);
  const [chart, setChart] = useState<Chart>("line");
  const [tf, setTf] = useState<Tf>("value");
  const [baseYear, setBaseYear] = useState(2015);
  const [minE, setMinE] = useState("E2");
  const [year, setYear] = useState(2024);
  const [allProv, setAllProv] = useState(true);
  const [data, setData] = useState<Record<string, SeriesFile>>({});
  const [copied, setCopied] = useState(false);

  // restore state from share link
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const g = (k: string) => q.get(k);
    if (g("i")) setInds(g("i")!.split(",").filter((x) => getIndicator(x)).slice(0, 4));
    if (g("g")) setGeos(g("g")!.split(",").filter((x) => GEO[x]).slice(0, 10));
    if (g("from")) setFrom(+g("from")!); if (g("to")) setTo(+g("to")!);
    if (g("c")) setChart(g("c") as Chart); if (g("t")) setTf(g("t") as Tf); if (g("b")) setBaseYear(+g("b")!);
    if (g("e")) setMinE(g("e")!); if (g("y")) setYear(+g("y")!); if (g("all")) setAllProv(g("all") === "1");
  }, []);
  useEffect(() => { inds.filter((i) => !data[i]).forEach((i) => loadSeries(i).then((s) => setData((d) => ({ ...d, [i]: s })))); }, [inds, data]);
  const shareUrl = () => {
    const q = new URLSearchParams({ i: inds.join(","), g: geos.join(","), from: String(from), to: String(to), c: chart, t: tf, b: String(baseYear), e: minE, y: String(year), all: allProv ? "1" : "0" });
    return `${window.location.origin}/explorer/?${q.toString()}`;
  };
  const ok = (i: string, g: string, y: number) => {
    const st = data[i]?.status[g]?.[String(y)]; if (!st) return false;
    return +st[1] >= +minE[1];
  };
  const val = (i: string, g: string, y: number) => (ok(i, g, y) ? data[i]?.matrix[g]?.[String(y)] ?? null : null);
  const years = useMemo(() => Array.from({ length: to - from + 1 }, (_, k) => from + k), [from, to]);
  const transform = (i: string, g: string, y: number) => {
    const v = val(i, g, y); if (v === null) return null;
    if (tf === "index") { const b = val(i, g, baseYear); return b ? +(v / b * 100).toFixed(2) : null; }
    if (tf === "yoy") { const p = val(i, g, y - 1); return p ? +((v / p - 1) * 100).toFixed(2) : null; }
    return v;
  };

  const scatterGeos = allProv ? PROVINCES.map((p) => p.geo_code) : geos.filter((g) => g !== "000000");
  const pts = useMemo(() => {
    if (inds.length < 2) return [];
    return scatterGeos.map((g) => ({ g, x: val(inds[0], g, year), y: val(inds[1], g, year), z: inds[2] ? val(inds[2], g, year) : null })).filter((p) => p.x !== null && p.y !== null) as { g: string; x: number; y: number; z: number | null }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inds, data, year, scatterGeos.join(), minE]);
  const r = pearson(pts.map((p) => p.x), pts.map((p) => p.y));

  const option = useMemo(() => {
    if (chart === "scatter" || chart === "bubble") {
      const ix = getIndicator(inds[0])!, iy = getIndicator(inds[1]) || ix; const iz = inds[2] ? getIndicator(inds[2]) : null;
      const zs = pts.map((p) => p.z ?? 0); const zmax = Math.max(1, ...zs);
      return {
        animation: false, grid: { left: 64, right: 24, top: 24, bottom: 48 },
        tooltip: { formatter: (p: { data: [number, number, string, number | null] }) => `${p.data[2]}<br/>${ix.name_zh}: ${fmt(p.data[0], ix.unit)}<br/>${iy.name_zh}: ${fmt(p.data[1], iy.unit)}${iz ? `<br/>${iz.name_zh}: ${fmt(p.data[3], iz.unit)}` : ""}` },
        xAxis: { type: "value", scale: true, name: `${ix.name_zh}（${ix.unit}）`, nameLocation: "middle", nameGap: 28, ...axisCommon },
        yAxis: { type: "value", scale: true, name: `${iy.name_zh}（${iy.unit}）`, ...axisCommon },
        series: [{ type: "scatter", data: pts.map((p) => [p.x, p.y, GEO[p.g].short_zh, p.z]), symbolSize: (d: [number, number, string, number | null]) => (chart === "bubble" && d[3] ? 8 + 40 * Math.sqrt(d[3] / zmax) : 10),
          label: { show: true, formatter: (p: { data: [number, number, string] }) => p.data[2], position: "right", fontSize: 10, color: "#56606b" }, itemStyle: { color: "#1d5c8f", opacity: 0.75 } }],
      };
    }
    const lines = inds.flatMap((i, ii) => geos.map((g, gi) => ({ i, g, name: `${GEO[g].short_zh}·${getIndicator(i)!.name_zh}`, color: SERIES[(gi + ii * geos.length) % SERIES.length], dash: ii > 0 })));
    const multiUnit = new Set(inds.map((i) => getIndicator(i)!.unit)).size > 1 && tf === "value";
    return {
      animation: false, grid: { left: 64, right: multiUnit ? 64 : 24, top: 40, bottom: 32 }, legend: { top: 0, type: "scroll", textStyle: { fontSize: 11 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: years.map(String), ...axisCommon },
      yAxis: multiUnit ? inds.slice(0, 2).map((i, k) => ({ type: "value", scale: true, name: getIndicator(i)!.unit, position: k ? "right" : "left", ...axisCommon })) : [{ type: "value", scale: tf !== "value" || chart === "line", name: tf === "index" ? `${baseYear}=100` : tf === "yoy" ? "比上年 %" : getIndicator(inds[0])!.unit, ...axisCommon }],
      series: lines.map((l) => ({ name: l.name, type: chart, yAxisIndex: multiUnit ? Math.min(inds.indexOf(l.i), 1) : 0, connectNulls: false, data: years.map((y) => transform(l.i, l.g, y)),
        itemStyle: { color: l.g === "000000" ? INK : l.color }, lineStyle: { type: l.dash ? "dashed" : "solid" }, barMaxWidth: 14 })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, inds, geos, years, tf, baseYear, data, pts, minE]);

  const rows = useMemo(() => inds.flatMap((i) => geos.flatMap((g) => years.map((y) => ({ ind: i, geo: g, year: y, value: val(i, g, y), status: data[i]?.status[g]?.[String(y)] || "uu" })))).filter((r) => r.value !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inds, geos, years, data, minE]);
  const cagr = (i: string, g: string) => {
    const ys = years.filter((y) => val(i, g, y) !== null); if (ys.length < 2) return null;
    const a = val(i, g, ys[0])!, b = val(i, g, ys[ys.length - 1])!; if (a <= 0 || b <= 0) return null;
    return { v: (Math.pow(b / a, 1 / (ys[ys.length - 1] - ys[0])) - 1) * 100, y0: ys[0], y1: ys[ys.length - 1] };
  };
  const download = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `china-data-atlas_explorer_${inds.join("+")}_${geos.join("+")}_${from}-${to}.csv`; document.body.appendChild(a); a.click(); a.remove();
  };
  const toggle = (arr: string[], x: string, max: number) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x].slice(-max));
  const sameYear = inds.map((i) => data[i] ? Math.max(...PROVINCES.map((p) => Math.max(...Object.entries(data[i].matrix[p.geo_code] || {}).filter(([, v]) => v !== null).map(([y]) => +y), 0))) : 0);

  return (
    <div data-testid="cross-explorer">
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <aside className="space-y-4 text-sm">
          <fieldset><legend className="font-semibold mb-1">1. 指标（最多4个）</legend>
            {CATEGORIES.map((c) => (
              <details key={c.id} open={c.id === "population" || c.id === "economy"} className="mb-1"><summary className="cursor-pointer text-xs text-[var(--muted)] py-2">{c.zh}</summary>
                <div className="flex flex-wrap gap-1 mt-1">{INDICATORS.filter((i) => i.category === c.id).map((i) => (
                  <button key={i.id} aria-pressed={inds.includes(i.id)} className={`chip ${inds.includes(i.id) ? "chip-on" : ""}`} data-ind={i.id} onClick={() => setInds((s) => toggle(s, i.id, 4).length ? toggle(s, i.id, 4) : s)}>{i.name_zh}</button>))}</div>
              </details>))}
          </fieldset>
          <fieldset><legend className="font-semibold mb-1">2. 地区（最多10个）</legend>
            <div className="flex flex-wrap gap-1"><button aria-pressed={geos.includes("000000")} className={`chip ${geos.includes("000000") ? "chip-on" : ""}`} onClick={() => setGeos((s) => toggle(s, "000000", 10))}>全国</button>
              {REGION7.map((r) => <span key={r} className="contents">{PROVINCES.filter((p) => p.region7 === r).map((p) => <button key={p.geo_code} data-geo={p.geo_code} aria-pressed={geos.includes(p.geo_code)} className={`chip ${geos.includes(p.geo_code) ? "chip-on" : ""}`} onClick={() => setGeos((s) => toggle(s, p.geo_code, 10))}>{p.short_zh}</button>)}</span>)}</div>
          </fieldset>
          <fieldset className="grid grid-cols-2 gap-2"><legend className="font-semibold mb-1 col-span-2">3. 年份与质量</legend>
            <label>从<select className="ctl w-full" value={from} onChange={(e) => setFrom(+e.target.value)} data-testid="x-from">{Array.from({ length: 26 }, (_, k) => 2000 + k).map((y) => <option key={y}>{y}</option>)}</select></label>
            <label>到<select className="ctl w-full" value={to} onChange={(e) => setTo(+e.target.value)} data-testid="x-to">{Array.from({ length: 26 }, (_, k) => 2000 + k).map((y) => <option key={y}>{y}</option>)}</select></label>
            <label className="col-span-2">最低证据等级<select className="ctl w-full" value={minE} onChange={(e) => setMinE(e.target.value)} data-testid="x-evidence">{LV.map((l) => <option key={l} value={l}>{EVIDENCE[l].label}</option>)}</select></label>
          </fieldset>
        </aside>
        <div>
          <div className="flex flex-wrap gap-2 items-center mb-2 text-sm" role="group" aria-label="图表类型">
            {(["line", "bar", "scatter", "bubble"] as Chart[]).map((c) => <button key={c} className={`chip ${chart === c ? "chip-on" : ""}`} onClick={() => setChart(c)} data-testid={`chart-${c}`}>{{ line: "折线", bar: "条形", scatter: "散点", bubble: "气泡" }[c]}</button>)}
            {(chart === "line" || chart === "bar") && <>
              <span className="mx-1 text-[var(--muted)]">|</span>
              {(["value", "index", "yoy"] as Tf[]).map((t) => <button key={t} className={`chip ${tf === t ? "chip-on" : ""}`} onClick={() => setTf(t)}>{{ value: "实际值", index: "指数化", yoy: "同比增速" }[t]}</button>)}
              {tf === "index" && <label>基期<select className="ctl ml-1" value={baseYear} onChange={(e) => setBaseYear(+e.target.value)}>{years.map((y) => <option key={y}>{y}</option>)}</select>=100</label>}
            </>}
            {(chart === "scatter" || chart === "bubble") && <>
              <label>年份<select className="ctl ml-1" value={year} onChange={(e) => setYear(+e.target.value)} data-testid="x-year">{Array.from({ length: 26 }, (_, k) => 2000 + k).reverse().map((y) => <option key={y}>{y}</option>)}</select></label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={allProv} onChange={(e) => setAllProv(e.target.checked)} />全部31省</label>
            </>}
          </div>
          {(chart === "scatter" || chart === "bubble") && inds.length < 2 ? <p className="p-6 border border-dashed rounded text-sm">散点图需要至少选择2个指标（x、y；气泡图第3个指标为气泡大小）。</p> :
            <EChart option={option} height={420} label="跨指标分析图" exportName={`explorer_${inds.join("+")}`} caption={`来源：国家统计局 · 证据等级 ≥ ${minE} · China Data Atlas`} />}
          {(chart === "scatter" || chart === "bubble") && inds.length >= 2 && (
            <div className="text-sm bg-white border border-[var(--line)] rounded p-3 mt-2" data-testid="correlation">
              <b>Pearson 相关系数 r = {Number.isNaN(r) ? "样本不足" : r.toFixed(3)}</b>，样本数 n = {pts.length}（{year}年横截面；任一指标缺失或低于所选证据等级的省份被排除，未插补）。
              <p className="text-xs text-[var(--muted)] mt-1">相关不代表因果。两个指标须为同一统计年度；若某指标最新年份不同（{inds.map((i, k) => `${getIndicator(i)!.name_zh} 最新 ${sameYear[k] || "?"}`).join("；")}），请选择共同年份。</p>
            </div>)}
          {(chart === "line" || chart === "bar") && (
            <div className="overflow-x-auto mt-3"><table className="tbl text-xs" data-testid="cagr-table"><caption className="text-left text-xs text-[var(--muted)] mb-1">区间年均增长率（CAGR，衍生；名义值；以区间内首尾实际观测年计算）</caption>
              <thead><tr><th>地区</th>{inds.map((i) => <th key={i} className="text-right">{getIndicator(i)!.name_zh}</th>)}</tr></thead>
              <tbody>{geos.map((g) => <tr key={g}><td>{GEO[g].short_zh}</td>{inds.map((i) => { const c = cagr(i, g); return <td key={i} className="text-right tabular-nums">{c ? `${c.v.toFixed(2)}% (${c.y0}–${c.y1})` : "—"}</td>; })}</tr>)}</tbody></table></div>)}
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn btn-primary" onClick={download} data-testid="x-csv">下载筛选结果 CSV（{rows.length} 行）</button>
            <button className="btn" data-testid="x-share" onClick={() => { const u = shareUrl(); navigator.clipboard?.writeText(u); window.history.replaceState(null, "", u.replace(window.location.origin, "")); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "已复制分享链接" : "复制分享链接"}</button>
            <a className="btn" href="/downloads/observations.csv">完整数据集 CSV</a>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-2">推荐引用：国家统计局（国家数据），经 China Data Atlas R2 整理，指标：{inds.map((i) => getIndicator(i)!.name_zh).join("、")}，{from}—{to}，证据等级 ≥ {minE}。</p>
        </div>
      </div>
    </div>
  );
}
