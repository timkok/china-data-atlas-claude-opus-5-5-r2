"use client";
import { useEffect, useState } from "react";
import EChart from "./EChart";
import { loadSeries } from "./useSeries";
import { GEO, getIndicator, type SeriesFile, type Story } from "@/lib/data";
import { SERIES, axisCommon, INK } from "./theme";

export default function StoryChart({ story }: { story: Story }) {
  const c = story.chart;
  const [s, setS] = useState<SeriesFile | null>(null);
  useEffect(() => { if (c.type === "line" && c.indicator) loadSeries(c.indicator).then(setS); }, [c]);
  let option: object = {};
  if (c.type === "bar" && c.data) {
    option = { grid: { left: 50, right: 10, top: 10, bottom: 50 }, tooltip: {}, xAxis: { type: "category", data: c.data.map((d) => GEO[d.geo].short_zh), axisLabel: { rotate: 60, interval: 0, fontSize: 10 } },
      yAxis: { type: "value", name: c.unit, ...axisCommon }, series: [{ type: "bar", data: c.data.map((d) => ({ value: d.value, itemStyle: { color: d.value < 0 ? "#c2410c" : "#1d5c8f" } })) }] };
  } else if (c.type === "scatter" && c.points) {
    const ix = getIndicator(c.x!)!, iy = getIndicator(c.y!)!;
    option = { grid: { left: 60, right: 20, top: 10, bottom: 40 }, tooltip: { formatter: (p: { data: [number, number, string] }) => `${p.data[2]}: ${p.data[0]}, ${p.data[1]}` },
      xAxis: { type: "value", scale: true, name: `${ix.name_zh}（${ix.unit}）`, nameLocation: "middle", nameGap: 26, ...axisCommon }, yAxis: { type: c.logy ? "log" : "value", scale: true, name: `${iy.name_zh}（${iy.unit}）`, ...axisCommon },
      series: [{ type: "scatter", data: c.points.map((p) => [p.x, p.y, GEO[p.geo].short_zh]), label: { show: true, position: "right", fontSize: 9, formatter: (p: { data: [number, number, string] }) => p.data[2] }, itemStyle: { color: "#1d5c8f" } }] };
  } else if (c.type === "line" && s) {
    const ys = s.years.filter((y) => y >= (c.from ?? 0) && y <= (c.to ?? 9999));
    option = { grid: { left: 64, right: 16, top: 30, bottom: 24 }, legend: { top: 0 }, tooltip: { trigger: "axis" }, xAxis: { type: "category", data: ys.map(String), ...axisCommon }, yAxis: { type: "value", scale: true, ...axisCommon },
      series: (c.geos || []).map((g, i) => ({ name: GEO[g].short_zh, type: "line", connectNulls: false, data: ys.map((y) => s.matrix[g]?.[String(y)] ?? null), itemStyle: { color: g === "000000" ? INK : SERIES[i] } })) };
  }
  return <EChart option={option} height={340} label={story.title} exportName={`story_${story.slug}`} caption="来源：国家统计局 · China Data Atlas（所有数字由公开数据集计算）" />;
}
