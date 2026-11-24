import type { Metadata } from "next";
import { EVIDENCE, INDICATORS, SITE, num } from "@/lib/data";
export const metadata: Metadata = { title: "数据质量、证据等级与冲突裁决", description: "统一证据等级 E0—E4、Round 1 多模型数据冲突的分类与裁决、数据版本说明。", alternates: { canonical: "/quality/" } };
export default function Quality() {
  const ev = SITE.stats.evidence as Record<string, number>;
  return (<div className="wrap pt-8 max-w-5xl text-sm leading-7">
    <h1 className="text-2xl font-bold">数据质量、证据等级与冲突裁决</h1>
    <section className="sec"><h2>证据等级（与获取方式分开记录）</h2>
      <table className="tbl mt-2" data-testid="evidence-table"><thead><tr><th>等级</th><th>含义</th><th className="text-right">候选库记录数</th><th>默认公开</th></tr></thead>
        <tbody>{Object.entries(EVIDENCE).map(([k, v]) => <tr key={k}><td><span className={`px-1 rounded ${v.tone}`}>{v.label}</span></td><td>{v.desc}</td><td className="text-right tabular-nums">{ev[k] ?? 0}</td><td>{["E2", "E3", "E4"].includes(k) ? "是" : "否"}</td></tr>)}</tbody></table>
      <p className="text-xs text-[var(--muted)] mt-2">两个模型从同一官方数据库取得相同数字 <b>不算</b> 独立验证；抽样核验只提高被抽查记录本身的等级。获取方式（API / HTML / Manual / Derived / R1-import）单独记录在 extraction_method 字段。</p></section>
    <section className="sec"><h2>Round 1 多模型数据冲突（{num("conflicts")} 条差异）</h2>
      <p>导入 {num("r1_datasets")} 个 Round 1 数据集，以 indicator_id + geo_code + year 为键逐条比较。差异不等于错误，按证据分类：</p>
      <table className="tbl mt-2" data-testid="conflict-summary"><thead><tr><th>类别</th><th className="text-right">数量</th></tr></thead><tbody>{Object.entries(SITE.conflict_categories).sort((a, b) => b[1] - a[1]).map(([k, v]) => <tr key={k}><td>{k}</td><td className="text-right tabular-nums">{v}</td></tr>)}</tbody></table>
      <p className="mt-2">未解决：<b>{num("conflicts_unresolved")}</b> 条（保留候选值与证据，不影响本平台默认取值）。裁决规则：采用最新正式核实的官方数值；旧版本保存为历史版本；<b>不多数投票、不取平均</b>。</p>
      <p className="mt-2"><a className="underline" href="/downloads/conflicts.csv">下载全部冲突与裁决 CSV</a> · <a className="underline" href="/downloads/vintages.csv">数据版本 CSV</a></p></section>
    <section className="sec"><h2>按指标</h2>
      <table className="tbl mt-2"><thead><tr><th>指标</th><th className="text-right">E2</th><th className="text-right">E3</th><th className="text-right">E4</th><th className="text-right">冲突</th><th className="text-right">未解决</th></tr></thead>
        <tbody>{INDICATORS.map((i) => <tr key={i.id}><td><a className="underline" href={`/indicators/${i.id}/#provenance`}>{i.name_zh}</a></td><td className="text-right">{i.evidence.E2 ?? 0}</td><td className="text-right">{i.evidence.E3 ?? 0}</td><td className="text-right">{i.evidence.E4 ?? 0}</td><td className="text-right">{Object.values(i.conflicts).reduce((a, b) => a + b, 0)}</td><td className="text-right">{i.unresolved_conflicts}</td></tr>)}</tbody></table></section>
    <section className="sec"><h2>主要修订依据</h2><ul className="list-disc pl-5">
      <li><a className="underline" href="https://www.stats.gov.cn/sj/zxfb/202512/t20251226_1962144.html" target="_blank" rel="noopener noreferrer">国家统计局关于2024年国内生产总值最终核实的公告（2025-12-26）</a></li>
      <li><a className="underline" href="https://www.stats.gov.cn/sj/zxfb/202412/t20241227_1957915.html" target="_blank" rel="noopener noreferrer">国家统计局关于修订2023年国内生产总值数据的公告（2024-12-27）</a></li>
      <li><a className="underline" href="https://www.stats.gov.cn/sj/zxfb/202302/t20230203_1900533.html" target="_blank" rel="noopener noreferrer">国家统计局关于修订2018年国内生产总值数据的公告（2019-11-22）</a></li>
      <li>人口相关序列（2011—2019）按第七次人口普查回溯修订：以《中国统计年鉴2025》刊载的修订后序列为准；未找到单独修订公告，标为“修订（公告未定位）”。</li></ul></section>
  </div>);
}
