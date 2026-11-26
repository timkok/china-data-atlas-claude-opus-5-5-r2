"use client";
import { useEffect, useState } from "react";
import { loadSeries } from "./useSeries";
import { CORE, GEO, PROVINCES, REGION7, fmt, getIndicator, type SeriesFile } from "@/lib/data";
import { SEQ } from "./theme";
import { ACTIVE_ADAPTER } from "./mapAdapter";

export default function MatrixMap() {
  const [id, setId] = useState("population_65plus");
  const [s, setS] = useState<SeriesFile | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => { loadSeries(id).then((x) => { setS(x); const ind = getIndicator(id)!; setYear(ind.latest_province_year); }); }, [id]);
  const ind = getIndicator(id)!;
  const vals = s && year ? PROVINCES.map((p) => s.matrix[p.geo_code]?.[String(year)] ?? null).filter((v): v is number => v !== null).sort((a, b) => a - b) : [];
  const q = (k: number) => vals.length ? vals[Math.min(vals.length - 1, Math.floor((k / SEQ.length) * vals.length))] : 0;
  const breaks = SEQ.map((_, k) => q(k));
  const color = (v: number | null) => v === null ? "" : SEQ[Math.max(0, breaks.filter((b) => v >= b).length - 1)];
  const years = s ? s.years.filter((y) => PROVINCES.some((p) => s.matrix[p.geo_code]?.[String(y)] != null)) : [];
  const show = sel || hover;
  return (
    <div data-testid="matrix-map">
      <div className="flex flex-wrap gap-3 items-end text-sm mb-3">
        <label>指标<select className="ctl ml-2" value={id} onChange={(e) => setId(e.target.value)}>{CORE.map((i) => <option key={i.id} value={i.id}>{i.name_zh}</option>)}</select></label>
        <label>年份<select className="ctl ml-2" value={year ?? ""} onChange={(e) => setYear(+e.target.value)} data-testid="map-year">{[...years].reverse().map((y) => <option key={y}>{y}</option>)}</select></label>
        <span className="text-xs text-[var(--muted)]">视图：{ACTIVE_ADAPTER.id}（非地理示意，不表示任何边界）</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {REGION7.map((r) => (<div key={r} className="border border-[var(--line)] rounded p-2"><div className="text-xs text-[var(--muted)] mb-1">{r}</div>
          <div className="flex flex-wrap gap-1">{PROVINCES.filter((p) => p.region7 === r).map((p) => { const v = s && year ? s.matrix[p.geo_code]?.[String(year)] ?? null : null; const c = color(v);
            const dark = c && SEQ.indexOf(c) >= 4;
            return <button key={p.geo_code} data-geo={p.geo_code} onMouseEnter={() => setHover(p.geo_code)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(p.geo_code)} onClick={() => setSel(p.geo_code)}
              aria-label={`${p.name_zh} ${year}年 ${v === null ? "无数据" : fmt(v, ind.unit) + ind.unit}`}
              className={`w-[74px] h-[46px] rounded text-left px-1.5 py-1 ${sel === p.geo_code ? "ring-2 ring-orange-600" : ""}`}
              style={{ background: v === null ? "repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 4px,#e5e7eb 4px,#e5e7eb 8px)" : c, color: dark ? "#fff" : "#1f2933" }}>
              <div className="text-[11px] leading-tight">{p.short_zh}</div><div className="text-[11px] font-semibold tabular-nums leading-tight">{v === null ? "无数据" : fmt(v, ind.unit)}</div></button>; })}</div></div>))}
      </div>
      <div className="flex flex-wrap items-center gap-1 mt-3 text-[11px]" aria-label="图例">{SEQ.map((c, k) => <span key={c} className="flex items-center gap-1"><span className="inline-block w-5 h-3 rounded" style={{ background: c }} />{fmt(breaks[k], ind.unit)}+</span>)}
        <span className="flex items-center gap-1 ml-2"><span className="inline-block w-5 h-3 rounded" style={{ background: "repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 3px,#e5e7eb 3px,#e5e7eb 6px)" }} />无数据</span><span className="ml-2 text-[var(--muted)]">分位数分级（7级），单位 {ind.unit}</span></div>
      {show && s && year && <div className="mt-3 p-3 bg-white border border-[var(--line)] rounded text-sm" aria-live="polite" data-testid="map-detail"><b>{GEO[show].name_zh}</b> · {year}年 {ind.name_zh}：<b>{fmt(s.matrix[show]?.[String(year)], ind.unit)}</b> {ind.unit}
        · 全国 {fmt(s.matrix["000000"]?.[String(year)], ind.unit)} · <a className="underline" href={`/provinces/${show}/`}>省份详情</a> · <a className="underline" href={`/indicators/${id}/#rankings`}>指标页</a></div>}
    </div>
  );
}
