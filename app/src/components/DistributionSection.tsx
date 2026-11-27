"use client";
import { useMemo } from "react";
import EChart from "./EChart";
import { GEO, fmt, type IndicatorFull } from "@/lib/data";
import { INK, axisCommon } from "./theme";

export default function DistributionSection({ ind }: { ind: IndicatorFull }) {
  const d = ind.distribution;
  const pts = ind.ranking.filter((r) => r.value !== null) as { geo: string; value: number; rank: number }[];
  const option = useMemo(() => d ? ({
    animation: false, grid: { left: 60, right: 20, top: 20, bottom: 30 },
    tooltip: { trigger: "item", formatter: (p: { data: [number, number, string] | number[]; seriesType: string }) => p.seriesType === "scatter" ? `${(p.data as [number, number, string])[2]}：${fmt((p.data as number[])[0], ind.unit)}` : "四分位分布" },
    xAxis: { type: "value", ...axisCommon, scale: true, name: ind.unit },
    yAxis: { type: "category", data: [""], show: false },
    series: [
      { type: "boxplot", data: [[d.min, d.q1, d.median, d.q3, d.max]], itemStyle: { color: "#e8f0f7", borderColor: "#1d5c8f" }, boxWidth: [20, 40] },
      { type: "scatter", data: pts.map((p, i) => [p.value, 0, GEO[p.geo].short_zh, i]), symbolSize: 8, itemStyle: { color: (x: { data: [number, number, string] }) => d.outliers.includes(x.data[2]) ? "#c2410c" : INK, opacity: 0.7 }, jitter: 0 },
    ],
  }) : {}, [d, pts, ind.unit]);
  if (!d) return <p className="text-sm text-[var(--muted)]">本指标没有省级数据，无法展示分布。</p>;
  return (
    <div data-testid="distribution">
      <EChart option={option} height={140} label={`${ind.latest_province_year}年${ind.name_zh}31省分布`} />
      <p className="text-sm mt-2">{ind.latest_province_year}年31省中位数 <b>{fmt(d.median, ind.unit)}</b>，四分位距 {fmt(d.q1, ind.unit)}—{fmt(d.q3, ind.unit)} {ind.unit}。
        {d.outliers.length ? <> 统计意义上的离群省份（超出 1.5×IQR）：<b>{d.outliers.join("、")}</b>。</> : " 没有超出 1.5×IQR 的离群省份。"}</p>
      <p className="text-[11px] text-[var(--muted)]">离群是统计描述，不代表数据错误；每个离群值都可在数据表中追溯来源。</p>
    </div>
  );
}
