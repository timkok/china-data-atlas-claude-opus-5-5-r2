"use client";
import { useMemo, useState } from "react";
import EChart from "./EChart";
import { GEO, fmt, getIndicator } from "@/lib/data";
import { INK, axisCommon, seqColor } from "./theme";

const TABS = ["population", "gdp_per_capita", "disposable_income", "population_65plus", "urbanization_rate", "physicians_per_1000"];

export default function HomeFeature() {
  const [id, setId] = useState(TABS[0]);
  const ind = getIndicator(id)!;
  const rows = ind.ranking.filter((r) => r.value !== null) as { geo: string; rank: number; value: number }[];
  const vals = rows.map((r) => r.value);
  const option = useMemo(() => ({
    animation: false,
    grid: { left: 8, right: 8, top: 24, bottom: 56, containLabel: true },
    tooltip: { trigger: "item", formatter: (p: { name: string; value: number }) => `${p.name}<br/>${ind.latest_province_year}年 <b>${fmt(p.value, ind.unit)}</b> ${ind.unit}` },
    xAxis: { type: "category", data: rows.map((r) => GEO[r.geo].short_zh), ...axisCommon, axisLabel: { interval: 0, rotate: 60, fontSize: 10, color: INK } },
    yAxis: { type: "value", ...axisCommon },
    series: [{ type: "bar", barMaxWidth: 18, data: rows.map((r) => ({ name: GEO[r.geo].short_zh, value: r.value, itemStyle: { color: seqColor(r.value, Math.min(...vals), Math.max(...vals)) } })),
      markLine: ind.national_latest !== null && ind.latest_national_year === ind.latest_province_year ? { symbol: "none", lineStyle: { color: INK, type: "dashed" }, label: { formatter: `全国 ${fmt(ind.national_latest, ind.unit)}`, fontSize: 10, position: "insideEndTop" }, data: [{ yAxis: ind.national_latest }] } : undefined }],
  }), [ind, rows, vals]);
  return (
    <div className="bg-white border border-[var(--line)] rounded-lg p-4" data-testid="home-feature">
      <div role="tablist" aria-label="选择指标" className="flex flex-wrap gap-1 mb-2">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={t === id} className={`chip ${t === id ? "chip-on" : ""}`} onClick={() => setId(t)}>{getIndicator(t)!.name_zh}</button>)}
      </div>
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <h3 className="font-semibold">{ind.latest_province_year}年各省{ind.name_zh}（{ind.unit}）</h3>
        <a className="text-sm underline" href={`/indicators/${id}/`}>打开完整指标页 →</a>
      </div>
      <EChart option={option} height={340} label={`${ind.latest_province_year}年各省${ind.name_zh}条形图`} />
      <p className="text-[11px] text-[var(--muted)]">来源：国家统计局 · {ind.source.province_table}。按数值从高到低排列，虚线为全国值（同年时显示）。</p>
    </div>
  );
}
