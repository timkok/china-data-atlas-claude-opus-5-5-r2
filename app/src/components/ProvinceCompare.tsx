"use client";
import { useEffect, useMemo, useState } from "react";
import EChart from "./EChart";
import { loadSeries } from "./useSeries";
import { GEO, PROVINCES, fmt, getIndicator, type SeriesFile } from "@/lib/data";
import { SERIES, axisCommon, INK } from "./theme";

const METRICS = ["population", "urbanization_rate", "population_65plus", "birth_rate", "gdp", "gdp_per_capita", "disposable_income", "consumption_expenditure_per_capita", "tertiary_share",
  "higher_education_institutions", "higher_education_students", "physicians_per_1000", "nurses_per_1000", "hospital_beds_per_1000"];
const TRENDS = ["population", "gdp_per_capita", "disposable_income", "population_65plus"];

export default function ProvinceCompare() {
  const [geos, setGeos] = useState<string[]>(["440000", "320000", "330000"]);
  const [from, setFrom] = useState(2015);
  const [data, setData] = useState<Record<string, SeriesFile>>({});
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("p");
    if (q) { const g = q.split(",").filter((x) => GEO[x] && x !== "000000").slice(0, 5); if (g.length >= 2) setGeos(g); }
    METRICS.forEach((m) => getIndicator(m) && loadSeries(m).then((s) => setData((d) => ({ ...d, [m]: s }))));
  }, []);
  useEffect(() => { window.history.replaceState(null, "", `/compare/?p=${geos.join(",")}`); }, [geos]);
  const toggle = (g: string) => setGeos((s) => (s.includes(g) ? (s.length > 2 ? s.filter((x) => x !== g) : s) : s.length >= 5 ? s : [...s, g]));
  const latestCommon = (m: string) => {
    const s = data[m]; if (!s) return null;
    const ys = s.years.filter((y) => geos.every((g) => s.matrix[g]?.[String(y)] != null)); return ys.length ? ys[ys.length - 1] : null;
  };
  const opt = (m: string) => {
    const s = data[m]; const ind = getIndicator(m)!; if (!s) return {};
    const ys = s.years.filter((y) => y >= from);
    return { animation: false, grid: { left: 56, right: 12, top: 30, bottom: 24 }, legend: { top: 0, textStyle: { fontSize: 10 } }, tooltip: { trigger: "axis", valueFormatter: (v: number) => fmt(v, ind.unit) },
      xAxis: { type: "category", data: ys.map(String), ...axisCommon }, yAxis: { type: "value", scale: true, ...axisCommon },
      series: [...geos, "000000"].map((g, i) => ({ name: GEO[g].short_zh, type: "line", connectNulls: false, symbolSize: 4, data: ys.map((y) => s.matrix[g]?.[String(y)] ?? null),
        itemStyle: { color: g === "000000" ? INK : SERIES[i % SERIES.length] }, lineStyle: { type: g === "000000" ? "dashed" : "solid", width: g === "000000" ? 1.5 : 2 } })) };
  };
  const table = useMemo(() => METRICS.filter((m) => getIndicator(m)).map((m) => {
    const ind = getIndicator(m)!; const y = latestCommon(m); const s = data[m];
    const vals = geos.map((g) => (y && s ? s.matrix[g]?.[String(y)] ?? null : null));
    const nat = y && s ? s.matrix["000000"]?.[String(y)] ?? null : null;
    const max = Math.max(...(vals.filter((v) => v !== null) as number[]));
    return { m, ind, y, vals, nat, max, own: ind.latest_province_year };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [data, geos]);
  return (
    <div data-testid="province-compare">
      <div className="flex flex-wrap gap-1 mb-3" role="group" aria-label="选择2—5个省份">
        {PROVINCES.map((p) => <button key={p.geo_code} data-geo={p.geo_code} aria-pressed={geos.includes(p.geo_code)} className={`chip ${geos.includes(p.geo_code) ? "chip-on" : ""}`} onClick={() => toggle(p.geo_code)}>{p.short_zh}</button>)}
      </div>
      <p className="text-xs text-[var(--muted)] mb-3">已选 {geos.length} 个（2—5个）。每行使用所选省份<strong>共同可比的最新年份</strong>；若与该指标最新年份不同，会标出。</p>
      <div className="overflow-x-auto"><table className="tbl" data-testid="compare-table">
        <thead><tr><th>指标</th><th>年份</th>{geos.map((g) => <th key={g} className="text-right">{GEO[g].short_zh}</th>)}<th className="text-right">全国</th></tr></thead>
        <tbody>{table.map((r) => (
          <tr key={r.m} className="h-9"><td className="whitespace-nowrap min-w-[11rem]"><a className="hover:underline" href={`/indicators/${r.m}/`}>{r.ind.name_zh}</a> <span className="text-[10px] text-[var(--muted)]">{r.ind.unit}</span></td>
            <td className="tabular-nums text-xs whitespace-nowrap min-w-[3.5rem]">{r.y ?? "—"}{r.y && r.own && r.y !== r.own ? <span className="text-amber-700" title={`该指标最新省级年份为 ${r.own}`}> *</span> : null}</td>
            {r.vals.map((v, i) => <td key={i} className={`text-right tabular-nums whitespace-nowrap min-w-[6.5rem] ${v === r.max ? "font-semibold" : ""}`}>{fmt(v, r.ind.unit)}</td>)}
            <td className="text-right tabular-nums whitespace-nowrap min-w-[6.5rem] text-[var(--muted)]">{fmt(r.nat, r.ind.unit)}</td></tr>))}</tbody></table></div>
      <p className="text-[11px] text-[var(--muted)] mt-1">加粗 = 所选省份中最高（不代表优劣）。* = 共同可比年份早于该指标最新年份。</p>
      <div className="flex items-center gap-2 mt-6 mb-2 text-sm"><h3 className="font-semibold">{from}年以来的变化</h3>
        <label>起始年<select className="ctl ml-1" value={from} onChange={(e) => setFrom(+e.target.value)}>{[2000, 2005, 2010, 2013, 2015, 2018, 2020].map((y) => <option key={y}>{y}</option>)}</select></label></div>
      <div className="grid md:grid-cols-2 gap-6">
        {TRENDS.map((m) => <div key={m} data-testid={`compare-trend-${m}`}><h4 className="text-sm font-semibold">{getIndicator(m)!.name_zh}（{getIndicator(m)!.unit}）</h4>
          <EChart option={opt(m)} height={240} label={`${geos.map((g) => GEO[g].short_zh).join("、")}${getIndicator(m)!.name_zh}趋势`} exportName={`compare_${m}`} /></div>)}
      </div>
    </div>
  );
}
