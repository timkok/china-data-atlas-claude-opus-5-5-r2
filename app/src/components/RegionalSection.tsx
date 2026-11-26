"use client";
import { useMemo, useState } from "react";
import EChart from "./EChart";
import { GEO, PROVINCES, REGION7, fmt, type Indicator, type SeriesFile } from "@/lib/data";
import { AGG_NOTE } from "@/lib/caliber";
import { SERIES, axisCommon, INK } from "./theme";

export function aggregate(ind: Indicator, series: SeriesFile, pop: SeriesFile, region: string, year: number): { value: number | null; n: number; complete: boolean } {
  const ps = PROVINCES.filter((p) => p.region7 === region);
  const vals = ps.map((p) => series.matrix[p.geo_code]?.[String(year)] ?? null);
  const complete = vals.every((v) => v !== null);
  if (!complete || ind.agg === "none") return { value: null, n: vals.filter((v) => v !== null).length, complete };
  if (ind.agg === "sum") return { value: (vals as number[]).reduce((a, b) => a + b, 0), n: ps.length, complete };
  const w = ps.map((p) => pop.matrix[p.geo_code]?.[String(year)] ?? null);
  if (w.some((x) => x === null)) return { value: null, n: ps.length, complete: false };
  const sw = (w as number[]).reduce((a, b) => a + b, 0);
  return { value: (vals as number[]).reduce((a, v, i) => a + v * (w[i] as number), 0) / sw, n: ps.length, complete };
}

export default function RegionalSection({ ind, series, pop, initialYear }: { ind: Indicator; series: SeriesFile; pop: SeriesFile; initialYear: number }) {
  const years = series.years.filter((y) => PROVINCES.some((p) => series.matrix[p.geo_code]?.[String(y)] != null));
  const [year, setYear] = useState(initialYear);
  const [picked, setPicked] = useState<string[]>(["370000", "410000", "440000"]);
  const rows = REGION7.map((r) => {
    const a = aggregate(ind, series, pop, r, year);
    const pv = PROVINCES.filter((p) => p.region7 === r).map((p) => series.matrix[p.geo_code]?.[String(year)]).filter((v): v is number => v != null).sort((x, y) => x - y);
    const med = pv.length ? (pv.length % 2 ? pv[(pv.length - 1) / 2] : (pv[pv.length / 2 - 1] + pv[pv.length / 2]) / 2) : null;
    return { region: r, ...a, min: pv[0] ?? null, max: pv[pv.length - 1] ?? null, median: med, members: PROVINCES.filter((p) => p.region7 === r).map((p) => p.short_zh).join("、") };
  });
  const nat = series.matrix["000000"]?.[String(year)] ?? null;
  const option = useMemo(() => {
    const cats = picked.map((g) => GEO[g].short_zh);
    return {
      animation: false, grid: { left: 56, right: 16, top: 16, bottom: 28 },
      tooltip: { trigger: "axis", valueFormatter: (v: number) => fmt(v, ind.unit) },
      xAxis: { type: "category", data: cats, ...axisCommon }, yAxis: { type: "value", ...axisCommon },
      series: [{ type: "bar", barMaxWidth: 36, data: picked.map((g, i) => ({ value: series.matrix[g]?.[String(year)] ?? null, itemStyle: { color: SERIES[i % SERIES.length] } })),
        label: { show: true, position: "top", fontSize: 10, formatter: (p: { value: number }) => fmt(p.value, ind.unit) },
        markLine: nat !== null ? { symbol: "none", lineStyle: { color: INK, type: "dashed" }, label: { formatter: "全国", fontSize: 10 }, data: [{ yAxis: nat }] } : undefined }],
    };
  }, [picked, series, year, ind.unit, nat]);
  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end mb-3">
        <label className="text-sm">年份<select data-testid="regional-year" className="ctl ml-2" value={year} onChange={(e) => setYear(Number(e.target.value))}>{[...years].reverse().map((y) => <option key={y}>{y}</option>)}</select></label>
      </div>
      <p className="text-xs text-[var(--muted)] mb-2" data-testid="agg-rule">汇总规则：{AGG_NOTE[ind.agg]}</p>
      <div className="overflow-x-auto">
        <table className="tbl" data-testid="regional-table">
          <caption className="sr-only">七大地区比较</caption>
          <thead><tr><th>地区</th><th>包含省份</th>{ind.agg !== "none" && <th className="text-right">地区汇总</th>}<th className="text-right">区内最低</th><th className="text-right">区内中位数</th><th className="text-right">区内最高</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.region}><td className="font-medium">{r.region}</td><td className="text-xs text-[var(--muted)]">{r.members}</td>
              {ind.agg !== "none" && <td className="text-right tabular-nums">{r.value === null ? <span className="text-[var(--muted)]" title="区内有省份缺数据，不生成汇总">不完整</span> : fmt(r.value, ind.unit)}</td>}
              <td className="text-right tabular-nums">{fmt(r.min, ind.unit)}</td><td className="text-right tabular-nums">{fmt(r.median, ind.unit)}</td><td className="text-right tabular-nums">{fmt(r.max, ind.unit)}</td></tr>
          ))}</tbody>
        </table>
      </div>
      <p className="text-[11px] text-[var(--muted)] mt-1">七大地区为常用地理分区（华北、东北、华东、华中、华南、西南、西北），用于展示便利，不是官方统计分组；国家统计局官方使用东部、中部、西部、东北四大区域。单位：{ind.unit}。</p>
      <h3 className="text-base font-semibold mt-6">多省比较（{year}年）</h3>
      <div className="flex flex-wrap gap-1 my-2" data-testid="compare-picker">
        {PROVINCES.map((p) => <button key={p.geo_code} aria-pressed={picked.includes(p.geo_code)} className={`chip ${picked.includes(p.geo_code) ? "chip-on" : ""}`} onClick={() => setPicked((c) => c.includes(p.geo_code) ? c.filter((x) => x !== p.geo_code) : [...c, p.geo_code].slice(-8))}>{p.short_zh}</button>)}
      </div>
      <EChart option={option} height={300} label={`${year}年多省${ind.name_zh}比较`} />
    </div>
  );
}
