import type { Metadata } from "next";
import CrossExplorer from "@/components/CrossExplorer";
import DataTable from "@/components/DataTable";
export const metadata: Metadata = { title: "数据浏览器（跨指标分析）", description: "任选指标、省份与年份：折线、条形、散点、气泡图，指数化、增速、CAGR、相关系数，CSV/PNG/SVG 导出与分享链接。", alternates: { canonical: "/explorer/" } };
export default function Explorer() {
  return (<div className="wrap pt-8"><h1 className="text-2xl font-bold">数据浏览器</h1>
    <p className="text-sm text-[var(--muted)] mt-1 mb-4">所有视图使用同一标准化数据层（canonical candidate，默认只含证据等级 E2 及以上）。不同口径或不同年份的数据不会被静默混合。</p>
    <CrossExplorer />
    <section className="sec mt-8"><h2>完整数据表</h2><DataTable initialIndicators={["population"]} allowIndicatorPick /></section></div>);
}
