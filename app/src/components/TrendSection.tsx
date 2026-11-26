"use client";
import { useMemo, useState } from "react";
import EChart from "./EChart";
import { GEO, PROVINCES, fmt, type Indicator, type SeriesFile } from "@/lib/data";
import { INK, SERIES, axisCommon } from "./theme";
import { CALIBER_BREAKS } from "@/lib/caliber";

const DEFAULT_CMP: Record<string, string[]> = { default: ["440000", "320000", "330000"] };

export default function TrendSection({ ind, series, initialGeos }: { ind: Indicator; series: SeriesFile; initialGeos?: string[] }) {
  const years = series.years;
  const [from, setFrom] = useState(Math.max(years[0], 2000));
  const [to, setTo] = useState(years[years.length - 1]);
  const [geos, setGeos] = useState<string[]>(initialGeos?.length ? initialGeos : DEFAULT_CMP.default);
  const [showNat, setShowNat] = useState(true);
  const [mode, setMode] = useState<"value" | "index" | "yoy">("value");
  const [logY, setLogY] = useState(false);
  const ys = years.filter((y) => y >= from && y <= to);
  const breaks = (CALIBER_BREAKS[ind.id] || []).filter((b) => b.year >= from && b.year <= to);

  const option = useMemo(() => {
    const list = [...(showNat ? ["000000"] : []), ...geos];
    const base = (g: string) => {
      const first = ys.find((y) => series.matrix[g]?.[String(y)] != null);
      return first !== undefined ? (series.matrix[g][String(first)] as number) : null;
    };
    return {
      animation: false,
      grid: { left: 56, right: 24, top: 40, bottom: 32 },
      legend: { top: 0, textStyle: { fontSize: 11 } },
      tooltip: { trigger: "axis", valueFormatter: (v: number | null) => (v == null ? "无数据" : mode === "index" ? v.toFixed(1) : mode === "yoy" ? v.toFixed(2) + "%" : fmt(v, ind.unit)) },
      xAxis: { type: "category", data: ys.map(String), ...axisCommon, boundaryGap: false },
      yAxis: { type: logY && mode === "value" ? "log" : "value", scale: true, name: mode === "index" ? "首个观测年=100" : mode === "yoy" ? "比上年变化 %" : ind.unit, nameTextStyle: { fontSize: 11, color: "#56606b" }, ...axisCommon },
      series: list.map((g, i) => {
        const b = base(g);
        return {
          name: GEO[g].short_zh, type: "line", connectNulls: false, showSymbol: true, symbolSize: 5,
          lineStyle: { width: g === "000000" ? 2.5 : 1.8, type: g === "000000" ? "dashed" : "solid" },
          itemStyle: { color: g === "000000" ? INK : SERIES[(i - (showNat ? 1 : 0)) % SERIES.length] },
          data: ys.map((y) => {
            const v = series.matrix[g]?.[String(y)] ?? null;
            if (v === null) return null;
            if (mode === "yoy") { const p = series.matrix[g]?.[String(y - 1)] ?? null; return p ? +((v / p - 1) * 100).toFixed(2) : null; }
            return mode === "index" && b ? +(v / b * 100).toFixed(2) : v;
          }),
          markLine: i === 0 && breaks.length ? { symbol: "none", silent: true, lineStyle: { color: "#b45309", type: "dotted" }, label: { formatter: (p: { data: { name: string } }) => p.data.name, fontSize: 10, color: "#b45309" }, data: breaks.map((bk) => ({ xAxis: String(bk.year), name: bk.short })) } : undefined,
        };
      }),
    };
  }, [geos, ys, showNat, series, ind.unit, mode, breaks, logY]);

  const toggle = (g: string) => setGeos((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : cur.length >= 8 ? cur : [...cur, g]));
  const gaps = geos.flatMap((g) => ys.filter((y) => series.matrix[g]?.[String(y)] == null).map((y) => `${GEO[g].short_zh} ${y}`));

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end mb-3">
        <label className="text-sm">起始年<select data-testid="trend-from" className="ctl ml-2" value={from} onChange={(e) => setFrom(Math.min(Number(e.target.value), to))}>{years.map((y) => <option key={y}>{y}</option>)}</select></label>
        <label className="text-sm">结束年<select data-testid="trend-to" className="ctl ml-2" value={to} onChange={(e) => setTo(Math.max(Number(e.target.value), from))}>{years.map((y) => <option key={y}>{y}</option>)}</select></label>
        <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={showNat} onChange={(e) => setShowNat(e.target.checked)} />显示全国</label>
        <div role="radiogroup" aria-label="显示方式" className="flex text-sm border border-[var(--line)] rounded overflow-hidden">
          <button role="radio" aria-checked={mode === "value"} className={`px-2 py-1 ${mode === "value" ? "bg-[var(--ink)] text-white" : ""}`} onClick={() => setMode("value")}>实际数值</button>
          <button role="radio" aria-checked={mode === "yoy"} className={`px-2 py-1 ${mode === "yoy" ? "bg-[var(--ink)] text-white" : ""}`} onClick={() => setMode("yoy")} data-testid="mode-yoy">变化率（衍生）</button>
          <button role="radio" aria-checked={mode === "index"} className={`px-2 py-1 ${mode === "index" ? "bg-[var(--ink)] text-white" : ""}`} onClick={() => setMode("index")}>指数（衍生）</button>
        </div>
        <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={logY} disabled={mode !== "value"} onChange={(e) => setLogY(e.target.checked)} data-testid="log-toggle" />对数坐标</label>
      </div>
      <details className="mb-3" open>
        <summary className="text-sm cursor-pointer">选择省份（最多8个，已选 {geos.length}）</summary>
        <div className="flex flex-wrap gap-1 mt-2" data-testid="province-picker">
          {PROVINCES.map((p) => (
            <button key={p.geo_code} aria-pressed={geos.includes(p.geo_code)} onClick={() => toggle(p.geo_code)}
              className={`chip ${geos.includes(p.geo_code) ? "chip-on" : ""}`}>{p.short_zh}</button>
          ))}
        </div>
      </details>
      <EChart option={option} height={380} label={`${ind.name_zh}历史趋势：${geos.map((g) => GEO[g].short_zh).join("、")}`} exportName={`${ind.id}_trend`} caption={`来源：国家统计局 · ${ind.name_zh}（${ind.unit}）· China Data Atlas`} />
      <p className="text-[11px] text-[var(--muted)] mt-2">圆点 = 实际观测年份；线条断开 = 该年份无官方数据（不插值）。{mode === "index" ? "指数模式为衍生计算：各序列以所选区间首个观测年=100。" : mode === "yoy" ? "变化率 = 本年 ÷ 上年 − 1（衍生；名义值，跨口径断点的变化率不可解读）。" : ""}</p>
      {gaps.length > 0 && <p className="text-[11px] text-[var(--muted)]" data-testid="trend-gaps">所选范围内缺失：{gaps.slice(0, 20).join("、")}{gaps.length > 20 ? ` 等 ${gaps.length} 处` : ""}</p>}
      {breaks.length > 0 && <ul className="text-[11px] text-amber-800 mt-1">{breaks.map((b) => <li key={b.year}>▲ {b.year}：{b.note}</li>)}</ul>}
      <div className="overflow-x-auto mt-3">
        <table className="tbl text-xs" data-testid="trend-table">
          <caption className="sr-only">趋势数据表</caption>
          <thead><tr><th>地区</th>{ys.map((y) => <th key={y} className="text-right">{y}</th>)}</tr></thead>
          <tbody>
            {[...(showNat ? ["000000"] : []), ...geos].map((g) => (
              <tr key={g}><td>{GEO[g].short_zh}</td>{ys.map((y) => <td key={y} className="text-right tabular-nums">{fmt(series.matrix[g]?.[String(y)], ind.unit)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
