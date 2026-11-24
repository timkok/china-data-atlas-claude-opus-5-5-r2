import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, EVIDENCE, GEO, PROVINCES, fmt, getIndicator } from "@/lib/data";
import { readProvince } from "@/lib/server";
import Sparkline from "@/components/Sparkline";

export function generateStaticParams() { return PROVINCES.map((p) => ({ code: p.geo_code })); }
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params; const g = GEO[code]; if (!g) return {};
  return { title: `${g.name_zh}统计数据：人口、经济、收入、教育、医疗与全国比较`, description: `${g.name_zh}最新可用的人口、人均GDP、居民收入、高等教育与医疗资源等指标、全国排名与历史变化，来源国家统计局，标注证据等级。`, alternates: { canonical: `/provinces/${code}/` } };
}
const KEY = ["population", "gdp_per_capita", "disposable_income", "urbanization_rate", "population_65plus", "physicians_per_1000"];
export default async function ProvincePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; const g = GEO[code]; if (!g || g.level !== "province") notFound();
  const d = readProvince(code); const R = Object.fromEntries(d.rows.map((r) => [r.id, r]));
  const pop = R.population; const s = pop?.series || {};
  const pop2015 = s["2015"], popL = pop?.value;
  const peers = PROVINCES.filter((p) => p.region7 === g.region7 && p.geo_code !== code);
  return (
    <div className="wrap pt-8">
      <nav className="text-xs text-[var(--muted)]"><a href="/">首页</a> / <a href="/provinces/">省份</a> / {g.short_zh}</nav>
      <h1 className="text-3xl font-bold mt-2">{g.name_zh}</h1>
      <p className="text-sm text-[var(--muted)]">{g.name_en} · 行政区划代码 {g.geo_code} · {g.region7}地区 · 国家统计局四大区域：{g.zone4}</p>
      <section className="mt-6 grid md:grid-cols-3 gap-4" aria-label="要点">
        {KEY.map((k) => { const r = R[k]; const ind = getIndicator(k); if (!r || !ind) return null;
          return (<a key={k} href={`/indicators/${k}/`} className="block bg-white border border-[var(--line)] rounded-lg p-4 hover:border-[var(--accent)]" data-testid={`prov-key-${k}`}>
            <div className="text-xs text-[var(--muted)]">{ind.name_zh} · {r.year}年</div>
            <div className="text-2xl font-semibold tabular-nums">{fmt(r.value, ind.unit)} <span className="text-sm font-normal">{ind.unit}</span></div>
            <div className="text-xs mt-1">全国第 {r.rank ?? "—"} 位 · 全国 {fmt(r.national, ind.unit)}</div>
            <Sparkline series={r.series} /></a>); })}
      </section>
      {pop2015 && popL ? <p className="mt-4 text-sm">人口变化：2015年 {fmt(pop2015, "万人")} 万人 → {pop.year}年 {fmt(popL, "万人")} 万人（{((popL / pop2015 - 1) * 100).toFixed(1)}%）。</p> : null}
      {CATEGORIES.map((c) => { const rows = d.rows.filter((r) => getIndicator(r.id)?.category === c.id); if (!rows.length) return null; return (
        <section key={c.id} className="sec"><h2>{c.zh}</h2>
          <div className="overflow-x-auto"><table className="tbl mt-2" data-testid="province-table">
            <thead><tr><th>指标</th><th className="text-right">最新值</th><th>单位</th><th className="text-right">年份</th><th className="text-right">全国排名</th><th className="text-right">全国同年</th><th className="text-right">与全国比</th><th>证据</th></tr></thead>
            <tbody>{rows.map((r) => { const ind = getIndicator(r.id)!; const rel = r.value !== null && r.national ? (r.value / r.national - 1) * 100 : null; const comparable = !["sum"].includes(ind.agg);
              return (<tr key={r.id} data-ind={r.id}><td><a className="hover:underline" href={`/indicators/${r.id}/#rankings`}>{ind.name_zh}</a></td>
                <td className="text-right tabular-nums font-semibold" data-value={r.value ?? ""}>{fmt(r.value, ind.unit)}</td><td className="text-xs">{ind.unit}</td><td className="text-right tabular-nums">{r.year}</td>
                <td className="text-right tabular-nums">{r.rank ? `${r.rank}/31` : "—"}</td><td className="text-right tabular-nums">{fmt(r.national, ind.unit)}</td>
                <td className="text-right tabular-nums text-xs">{comparable && rel !== null ? `${rel >= 0 ? "+" : ""}${rel.toFixed(1)}%` : <span className="text-[var(--muted)]" title="总量指标与全国总量不可直接比较">—</span>}</td>
                <td><span className={`text-[10px] px-1 rounded ${EVIDENCE[r.evidence || "E2"]?.tone}`}>{r.evidence}</span></td></tr>); })}</tbody></table></div>
        </section>); })}
      <section className="sec"><h2>与其他省份比较</h2>
        <div className="flex flex-wrap gap-2 mt-2">{peers.map((p) => <a key={p.geo_code} className="chip" href={`/compare/?p=${code},${p.geo_code}`}>与{p.short_zh}比较</a>)}<a className="chip" href={`/compare/?p=${code},440000,320000`}>自定义比较 →</a></div>
      </section>
      <p className="text-xs text-[var(--muted)] mt-6">来源：国家统计局“国家数据”分省年度数据（证据等级见每行）。排名为降序，不代表优劣。“与全国比”仅对人均、比率类指标计算。</p>
    </div>
  );
}
