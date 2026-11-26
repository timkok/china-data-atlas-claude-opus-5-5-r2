"use client";
import { useEffect, useState } from "react";
import EChart from "./EChart";
import { loadSeries } from "./useSeries";
import { GEO, INDICATORS, PROVINCES, fmt, getIndicator, isRate, type SeriesFile } from "@/lib/data";
import { SERIES, axisCommon } from "./theme";

const KW: [RegExp, string][] = [
  [/老龄|65岁|老年|aging|elderly/i, "population_65plus"], [/医师|医生|doctor|physician/i, "physicians_per_1000"], [/床位|病床|bed/i, "hospital_beds_per_1000"], [/护士|nurse/i, "nurses_per_1000"],
  [/人均\s*GDP|人均地区生产总值|人均生产总值|gdp per capita/i, "gdp_per_capita"], [/GDP|生产总值|经济总量/i, "gdp"], [/人均.*收入|可支配收入|收入|income/i, "disposable_income"],
  [/消费支出|consumption/i, "consumption_expenditure_per_capita"], [/零售|社零|retail/i, "retail_sales"], [/城镇化|urbani/i, "urbanization_rate"], [/出生率|出生|birth/i, "birth_rate"],
  [/死亡率|death/i, "death_rate"], [/自然增长/i, "natural_growth_rate"], [/高校|大学数|universit/i, "higher_education_institutions"], [/大学生|在校生|本专科/i, "higher_education_students"],
  [/人口|population/i, "population"], [/城乡收入|收入比/i, "urban_rural_income_ratio"], [/第三产业|服务业/i, "tertiary_share"],
];
const EXAMPLES = ["哪些省份过去20年人口增长最快？", "比较广东和江苏过去十年GDP变化", "浙江人均收入排名如何变化？", "2020年哪些省份老龄化最严重？", "医疗资源与老龄化之间是否存在相关性？", "Which provinces have the fastest population growth?"];

type Plan = { kind: "growth" | "compare" | "rank_change" | "top" | "corr"; inds: string[]; geos: string[]; from?: number; to?: number; year?: number; n: number; desc: string };

function parse(q: string): Plan | { error: string } {
  const inds: string[] = [];
  const text = q.replace(/医疗资源/g, "医师");
  for (const [re, id] of KW) if (re.test(text) && !inds.includes(id)) { inds.push(id); }
  // prefer the more specific match if both GDP and per-capita matched
  if (inds.includes("gdp_per_capita")) { const k = inds.indexOf("gdp"); if (k >= 0 && !/[^均]GDP|GDP变化|生产总值变化/.test(text.replace(/人均\s*GDP/gi, ""))) inds.splice(k, 1); }
  if (inds.includes("disposable_income") && inds.includes("urban_rural_income_ratio")) inds.splice(inds.indexOf("disposable_income"), 1);
  const geos = PROVINCES.filter((p) => q.includes(p.short_zh) || q.toLowerCase().includes(p.name_en.toLowerCase())).map((p) => p.geo_code);
  const yearM = q.match(/(20\d\d)年?/); const nM = q.match(/过去\s*(\d+|十|二十|五|三)\s*年|past (\d+) years|last (\d+) years/i);
  const cn: Record<string, number> = { 十: 10, 二十: 20, 五: 5, 三: 3 };
  const span = nM ? (cn[nM[1]] ?? +(nM[1] || nM[2] || nM[3])) : null;
  const topN = (q.match(/前\s*(\d+)/) || [])[1];
  if (/相关|correlat|关系/i.test(q)) {
    if (inds.length < 2) return { error: "相关性分析需要识别出两个指标（例如“老龄化”和“医师”）。" };
    return { kind: "corr", inds: inds.slice(0, 2), geos: [], year: yearM ? +yearM[1] : undefined, n: 31, desc: "两指标横截面 Pearson 相关" };
  }
  if (!inds.length) return { error: "未识别出指标。可用关键词：人口、出生率、城镇化、老龄化、GDP、人均GDP、收入、消费、零售、高校、医师、床位、护士……" };
  if (/排名.*变化|rank/i.test(q) && geos.length >= 1) return { kind: "rank_change", inds: [inds[0]], geos: geos.slice(0, 3), n: 31, desc: "历年31省降序排名" };
  if (geos.length >= 2 || (/比较|compare/i.test(q) && geos.length)) return { kind: "compare", inds: [inds[0]], geos: geos.slice(0, 5), from: span ? 2025 - span : 2015, n: geos.length, desc: "多省趋势与增幅" };
  if (/最快|增长|growth|fastest/i.test(q)) return { kind: "growth", inds: [inds[0]], geos: [], from: span ? 2025 - span : 2005, n: topN ? +topN : 10, desc: "两端年份增幅排名" };
  return { kind: "top", inds: [inds[0]], geos: [], year: yearM ? +yearM[1] : undefined, n: topN ? +topN : 10, desc: "指定年份31省排名" };
}

type Result = { title: string; plan: Plan; formula: string; rows: { label: string; values: (string | number)[] }[]; cols: string[]; option?: object; notes: string[]; sources: string[] };

function lastFull(s: SeriesFile) { const ys = s.years.filter((y) => PROVINCES.every((p) => s.matrix[p.geo_code]?.[String(y)] != null)); return ys[ys.length - 1]; }
function pearson(x: number[], y: number[]) { const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n; let a = 0, b = 0, c = 0; x.forEach((v, i) => { a += (v - mx) * (y[i] - my); b += (v - mx) ** 2; c += (y[i] - my) ** 2; }); return a / Math.sqrt(b * c); }

async function run(plan: Plan): Promise<Result | { error: string }> {
  const S = await Promise.all(plan.inds.map(loadSeries));
  const ind = getIndicator(plan.inds[0])!; const s = S[0];
  const src = plan.inds.map((i) => `国家统计局 · ${getIndicator(i)!.source.province_table || getIndicator(i)!.source.national_table}`);
  const V = (g: string, y: number, k = 0) => S[k].matrix[g]?.[String(y)] ?? null;
  if (plan.kind === "growth") {
    const to = lastFull(s); const from = Math.max(plan.from!, Math.min(...s.years));
    const rows = PROVINCES.map((p) => ({ g: p.geo_code, a: V(p.geo_code, from), b: V(p.geo_code, to) })).filter((r) => r.a !== null && r.b !== null).map((r) => ({ ...r, pct: (r.b! / r.a! - 1) * 100 })).sort((x, y) => y.pct - x.pct);
    if (!rows.length) return { error: `${from}年或${to}年缺少数据，无法计算。` };
    return { title: `${from}—${to}年${ind.name_zh}增幅排名`, plan: { ...plan, from, to }, formula: `增幅 = ${ind.name_zh}(${to}) ÷ ${ind.name_zh}(${from}) − 1`, cols: [`${from}`, `${to}`, "增幅"],
      rows: rows.map((r) => ({ label: GEO[r.g].short_zh, values: [fmt(r.a, ind.unit), fmt(r.b, ind.unit), `${r.pct.toFixed(1)}%`] })),
      option: { grid: { left: 56, right: 16, top: 10, bottom: 50 }, xAxis: { type: "category", data: rows.map((r) => GEO[r.g].short_zh), axisLabel: { rotate: 60, interval: 0, fontSize: 10 } }, yAxis: { type: "value", name: "%", ...axisCommon }, tooltip: {}, series: [{ type: "bar", data: rows.map((r) => +r.pct.toFixed(2)), itemStyle: { color: "#1d5c8f" } }] },
      notes: [`n = ${rows.length} 个省份（两端年份均有数据）；缺失省份不参与，不插补。`, isRate(ind.unit) ? "注意：率类指标的“增幅”是相对变化。" : "名义值（价值量未扣除价格因素）。"], sources: src };
  }
  if (plan.kind === "top") {
    const year = plan.year && s.years.includes(plan.year) ? plan.year : lastFull(s);
    if (plan.year && plan.year !== year) return { error: `${plan.year}年没有${ind.name_zh}的省级数据（最近完整年份 ${lastFull(s)}）。本引擎不估算缺失年份。` };
    const rows = PROVINCES.map((p) => ({ g: p.geo_code, v: V(p.geo_code, year) })).filter((r) => r.v !== null).sort((a, b) => b.v! - a.v!);
    const notes = [`${year}年，${rows.length} 个省份有数据。`];
    if (ind.id === "population_65plus" && year === 2020) notes.push("2020年为第七次人口普查口径（与其他年份抽样调查口径不同）。");
    return { title: `${year}年${ind.name_zh}最高的省份`, plan: { ...plan, year }, formula: `按 ${ind.name_zh}（${ind.unit}）降序排列`, cols: ["名次", "数值"],
      rows: rows.slice(0, plan.n).map((r, i) => ({ label: GEO[r.g].short_zh, values: [i + 1, fmt(r.v, ind.unit)] })), notes, sources: src,
      option: { grid: { left: 60, right: 30, top: 10, bottom: 20 }, yAxis: { type: "category", inverse: true, data: rows.slice(0, plan.n).map((r) => GEO[r.g].short_zh) }, xAxis: { type: "value", scale: true, ...axisCommon }, tooltip: {}, series: [{ type: "bar", data: rows.slice(0, plan.n).map((r) => r.v), itemStyle: { color: "#1d5c8f" } }] } };
  }
  if (plan.kind === "compare") {
    const ys = s.years.filter((y) => y >= plan.from!);
    const rows = plan.geos.map((g) => { const ok = ys.filter((y) => V(g, y) !== null); const a = ok[0], b = ok[ok.length - 1]; return { g, a, b, va: V(g, a), vb: V(g, b) }; });
    return { title: `${plan.geos.map((g) => GEO[g].short_zh).join("、")} ${ind.name_zh} ${ys[0]}—${ys[ys.length - 1]}`, plan, formula: "增幅 = 末年 ÷ 首年 − 1；CAGR = (末年 ÷ 首年)^(1/年数) − 1", cols: ["首年", "末年", "增幅", "CAGR"],
      rows: rows.map((r) => ({ label: GEO[r.g].short_zh, values: [`${r.a}: ${fmt(r.va, ind.unit)}`, `${r.b}: ${fmt(r.vb, ind.unit)}`, r.va && r.vb ? `${((r.vb / r.va - 1) * 100).toFixed(1)}%` : "—", r.va && r.vb && r.b! > r.a! ? `${((Math.pow(r.vb / r.va, 1 / (r.b! - r.a!)) - 1) * 100).toFixed(2)}%` : "—"] })),
      option: { grid: { left: 64, right: 16, top: 30, bottom: 24 }, legend: { top: 0 }, tooltip: { trigger: "axis" }, xAxis: { type: "category", data: ys.map(String) }, yAxis: { type: "value", scale: true, ...axisCommon },
        series: plan.geos.map((g, i) => ({ name: GEO[g].short_zh, type: "line", data: ys.map((y) => V(g, y)), itemStyle: { color: SERIES[i] } })) },
      notes: ["名义值；GDP 2024年为最终核实数、2025年为初步核算数。", "首尾年为区间内实际有数据的年份。"], sources: src };
  }
  if (plan.kind === "rank_change") {
    const ys = s.years.filter((y) => PROVINCES.every((p) => V(p.geo_code, y) !== null));
    const rank = (g: string, y: number) => { const v = V(g, y)!; return 1 + PROVINCES.filter((p) => V(p.geo_code, y)! > v).length; };
    return { title: `${plan.geos.map((g) => GEO[g].short_zh).join("、")}：${ind.name_zh}全国排名变化`, plan, formula: "名次 = 1 + 当年数值高于该省的省份数（并列同名次）", cols: ys.map(String),
      rows: plan.geos.map((g) => ({ label: GEO[g].short_zh, values: ys.map((y) => rank(g, y)) })),
      option: { grid: { left: 40, right: 16, top: 30, bottom: 24 }, legend: { top: 0 }, tooltip: { trigger: "axis" }, xAxis: { type: "category", data: ys.map(String) }, yAxis: { type: "value", inverse: true, min: 1, max: 31, name: "名次" },
        series: plan.geos.map((g, i) => ({ name: GEO[g].short_zh, type: "line", data: ys.map((y) => rank(g, y)), itemStyle: { color: SERIES[i] } })) },
      notes: [`仅使用31省数据完整的年份（${ys.length} 年）。`], sources: src };
  }
  // corr
  const common = S[0].years.filter((y) => S[1].years.includes(y) && PROVINCES.every((p) => V(p.geo_code, y, 0) !== null && V(p.geo_code, y, 1) !== null));
  const year = plan.year && common.includes(plan.year) ? plan.year : common[common.length - 1];
  if (!year) return { error: "两个指标没有31省数据完整的共同年份，无法计算相关系数。" };
  const pts = PROVINCES.map((p) => ({ g: p.geo_code, x: V(p.geo_code, year, 0)!, y: V(p.geo_code, year, 1)! }));
  const r = pearson(pts.map((p) => p.x), pts.map((p) => p.y));
  const i1 = getIndicator(plan.inds[0])!, i2 = getIndicator(plan.inds[1])!;
  return { title: `${year}年 ${i1.name_zh} 与 ${i2.name_zh} 的相关性`, plan: { ...plan, year }, formula: "Pearson r = Σ(x−x̄)(y−ȳ) / √(Σ(x−x̄)² Σ(y−ȳ)²)", cols: [i1.name_zh, i2.name_zh],
    rows: pts.map((p) => ({ label: GEO[p.g].short_zh, values: [fmt(p.x, i1.unit), fmt(p.y, i2.unit)] })),
    option: { grid: { left: 56, right: 16, top: 16, bottom: 40 }, tooltip: { formatter: (p: { data: [number, number, string] }) => `${p.data[2]}: ${p.data[0]}, ${p.data[1]}` }, xAxis: { type: "value", scale: true, name: i1.name_zh, nameLocation: "middle", nameGap: 26 }, yAxis: { type: "value", scale: true, name: i2.name_zh },
      series: [{ type: "scatter", data: pts.map((p) => [p.x, p.y, GEO[p.g].short_zh]), label: { show: true, formatter: (p: { data: [number, number, string] }) => p.data[2], position: "right", fontSize: 9 } }] },
    notes: [`r = ${r.toFixed(3)}，n = ${pts.length}，${year}年横截面（两指标共同完整年份）。`, "相关不代表因果；未控制其他变量。", Math.abs(r) < 0.3 ? "|r| < 0.3：线性相关较弱。" : Math.abs(r) < 0.6 ? "0.3 ≤ |r| < 0.6：中等线性相关。" : "|r| ≥ 0.6：较强线性相关。"], sources: src };
}

export default function QueryEngine() {
  const [q, setQ] = useState(EXAMPLES[0]);
  const [res, setRes] = useState<Result | { error: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async (text: string) => {
    setBusy(true); const p = parse(text);
    setRes("error" in p ? p : await run(p)); setBusy(false);
    window.history.replaceState(null, "", `/ask/?q=${encodeURIComponent(text)}`);
  };
  useEffect(() => { const u = new URLSearchParams(window.location.search).get("q"); if (u) { setQ(u); go(u); } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div data-testid="query-engine">
      <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="flex gap-2">
        <label htmlFor="ask" className="sr-only">研究问题</label>
        <input id="ask" className="ctl flex-1 text-base" value={q} onChange={(e) => setQ(e.target.value)} data-testid="ask-input" />
        <button className="btn btn-primary" disabled={busy} data-testid="ask-run">{busy ? "查询中…" : "查询"}</button>
      </form>
      <div className="flex flex-wrap gap-1 mt-2">{EXAMPLES.map((e) => <button key={e} className="chip text-xs" onClick={() => { setQ(e); go(e); }}>{e}</button>)}</div>
      {res && "error" in res && <p className="mt-4 p-3 border border-amber-300 bg-amber-50 rounded text-sm" data-testid="ask-refusal">无法回答：{res.error}</p>}
      {res && !("error" in res) && (
        <div className="mt-5" data-testid="ask-result">
          <h3 className="text-lg font-semibold">{res.title}</h3>
          <details className="text-xs mt-1" open><summary className="cursor-pointer">实际执行的查询</summary>
            <pre className="bg-[var(--paper)] p-2 rounded overflow-x-auto" data-testid="ask-plan">{JSON.stringify(res.plan, null, 1)}</pre></details>
          <p className="text-sm mt-1">公式：<code>{res.formula}</code></p>
          {res.option && <EChart option={res.option} height={320} label={res.title} exportName="query_result" />}
          <div className="overflow-x-auto mt-2"><table className="tbl text-xs"><thead><tr><th>地区</th>{res.cols.map((c) => <th key={c} className="text-right">{c}</th>)}</tr></thead>
            <tbody>{res.rows.map((r) => <tr key={r.label}><td>{r.label}</td>{r.values.map((v, i) => <td key={i} className="text-right tabular-nums">{v}</td>)}</tr>)}</tbody></table></div>
          <ul className="text-xs text-[var(--muted)] mt-2 list-disc pl-5">{res.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          <p className="text-xs mt-1">来源：{res.sources.join("；")}（证据等级 ≥ E2，见各指标页）</p>
        </div>)}
      <p className="text-[11px] text-[var(--muted)] mt-6">这是规则化的 Research Query Engine（固定问题模板 + 数据库查询），不是通用 AI 助手，不调用任何大模型 API。识别不了的问题会明确拒绝，而不是猜测。接口 <code>parse() → run()</code> 预留给未来的 LLM 查询规划器。{INDICATORS.length} 个指标可查询。</p>
    </div>
  );
}
