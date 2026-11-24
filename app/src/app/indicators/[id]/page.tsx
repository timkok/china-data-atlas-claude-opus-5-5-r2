import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, GEO, INDICATORS, SITE, citation, fmt, getIndicator, isRate } from "@/lib/data";
import { readSeries } from "@/lib/server";
import { CALIBER_BREAKS, AGG_NOTE } from "@/lib/caliber";
import RankingSection from "@/components/RankingSection";
import TrendSection from "@/components/TrendSection";
import RegionalSection from "@/components/RegionalSection";
import DataTable from "@/components/DataTable";
import CopyButton from "@/components/CopyButton";
import DistributionSection from "@/components/DistributionSection";
import MovesSection from "@/components/MovesSection";
import QualityCard from "@/components/QualityCard";
import ProvenancePanel from "@/components/ProvenancePanel";

export function generateStaticParams() { return INDICATORS.map((i) => ({ id: i.id })); }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params; const ind = getIndicator(id); if (!ind) return {};
  const title = `${ind.name_zh}：${ind.has_province ? "31省排名、" : ""}历史趋势与数据下载（${ind.first_year}—${ind.latest_province_year_any ?? ind.latest_national_year}）`;
  const description = `${ind.name_zh}（${ind.unit}）。全国最新 ${ind.latest_national_year ?? "—"} 年 ${fmt(ind.national_latest, ind.unit)} ${ind.unit}${ind.latest_province_year ? `；最新完整省级年份 ${ind.latest_province_year}` : ""}。${ind.findings[0]?.zh ?? ""} 来源：国家统计局；证据等级与修订版本可查。`;
  return { title, description, alternates: { canonical: `/indicators/${id}/` }, openGraph: { title, description, url: `/indicators/${id}/` } };
}

export default async function IndicatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ind = getIndicator(id); if (!ind) notFound();
  const series = readSeries(id); const pop = readSeries("population");
  const cat = CATEGORIES.find((c) => c.id === ind.category)!;
  const breaks = CALIBER_BREAKS[id] || [];
  const yoyBreak = breaks.some((b) => b.year === ind.latest_national_year);
  const yoy = ind.national_latest !== null && ind.national_prev !== null && !yoyBreak ? ind.national_latest - ind.national_prev : null;
  const rate = isRate(ind.unit);
  const related = INDICATORS.filter((i) => i.category === ind.category && i.id !== id).slice(0, 8);
  const cite = citation(ind);
  const top3 = ind.ranking.filter((r) => r.value !== null).slice(0, 3);
  const lp = ind.latest_province_year;
  return (
    <article className="wrap pt-6">
      <nav aria-label="面包屑" className="text-xs text-[var(--muted)]"><a href="/">首页</a> / <a href={`/indicators/#${cat.id}`}>{cat.zh}</a> / {ind.name_zh}</nav>
      <header className="mt-2 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold">{ind.name_zh}</h1>
        <p className="text-sm text-[var(--muted)]">{ind.name_en} · 单位：{ind.unit} · {ind.core ? "12项核心指标" : "扩展指标"} · 数据更新：{ind.source.retrieved_at?.slice(0, 10)}</p>
        <nav aria-label="页内导航" className="flex gap-3 text-sm mt-3 overflow-x-auto whitespace-nowrap pb-1">
          <a href="#summary">概览</a>{ind.has_province && <><a href="#map">地区分布</a><a href="#rankings">排名</a></>}<a href="#trend">趋势</a>{ind.has_province && <><a href="#distribution">分布与变化</a><a href="#regional">地区比较</a></>}<a href="#data">数据</a><a href="#provenance">版本与冲突</a><a href="#methodology">方法</a>
        </nav>
      </header>

      <section id="summary" className="sec" aria-labelledby="h-sum">
        <h2 id="h-sum">概览</h2>
        <div className="grid lg:grid-cols-[2fr_3fr_2fr] gap-6 mt-3">
          <div className="bg-white border border-[var(--line)] rounded-lg p-4">
            <div className="text-xs text-[var(--muted)]">全国 · {ind.latest_national_year ?? "—"}年 <span className="ml-1 px-1 rounded bg-[var(--paper)]">实际数值</span></div>
            <div className="text-4xl font-bold tabular-nums mt-1" data-testid="national-latest">{fmt(ind.national_latest, ind.unit)} <span className="text-base font-normal">{ind.unit}</span></div>
            <div className="text-sm mt-1" data-testid="yoy">
              {yoy !== null ? <>比上年{yoy >= 0 ? (rate ? "提高" : "增加") : (rate ? "下降" : "减少")} {fmt(Math.abs(yoy), ind.unit)} {ind.unit === "%" ? "个百分点" : ind.unit === "‰" ? "个千分点" : ind.unit}{!rate && ind.national_prev ? `（${((ind.national_latest! / ind.national_prev - 1) * 100).toFixed(1)}%）` : ""}<span className="text-[11px] text-[var(--muted)]"> · 衍生计算</span></> : <span className="text-[var(--muted)]">{yoyBreak ? "该年存在口径变化，不计算同比" : "无可比上一年数据"}</span>}
            </div>
            <dl className="grid grid-cols-2 gap-2 mt-4 text-sm">
              <div><dt className="text-xs text-[var(--muted)]">最新全国年份</dt><dd className="font-semibold">{ind.latest_national_year ?? "无全国值"}</dd></div>
              <div><dt className="text-xs text-[var(--muted)]">最新完整省级年份</dt><dd className="font-semibold" data-testid="latest-prov-year">{lp ?? "无省级数据"}</dd></div>
              <div><dt className="text-xs text-[var(--muted)]">省级覆盖</dt><dd className="font-semibold">{Math.round(ind.latest_province_coverage * 31)} / 31</dd></div>
              <div><dt className="text-xs text-[var(--muted)]">年份范围</dt><dd className="font-semibold">{ind.first_year}—{ind.latest_province_year_any ?? ind.latest_national_year}</dd></div>
            </dl>
            {(id === "gdp" || id === "gdp_per_capita") && <p className="text-[11px] text-amber-800 mt-3">2025年为初步核算数；2024年为最终核实数。现价（名义）口径。</p>}
          </div>
          <div>
            <h3 className="font-semibold">定义与统计意义</h3>
            <p className="text-sm mt-1">{ind.definition_zh}</p>
            <p className="text-xs text-[var(--muted)] mt-1">官方指标名称：{ind.official_name_zh}</p>
            <h3 className="font-semibold mt-4">关键发现 <span className="text-xs font-normal text-[var(--muted)]">（由数据自动计算）</span></h3>
            <ul className="text-sm mt-1 space-y-1 list-disc pl-5" data-testid="findings">{ind.findings.map((f, i) => <li key={i}>{f.zh}{f.type === "calculation" && <span className="text-[10px] text-[var(--muted)]"> [计算]</span>}</li>)}</ul>
            {lp && <p className="text-sm mt-3">{lp}年排名前三：{top3.map((r) => `${GEO[r.geo].short_zh} ${fmt(r.value, ind.unit)}`).join("、")}（{ind.unit}）。</p>}
          </div>
          <QualityCard ind={ind} />
        </div>
      </section>

      {ind.has_province && lp && (
        <section id="map" className="sec" aria-labelledby="h-map">
          <span id="rankings" className="block -mt-16 pt-16" aria-hidden />
          <h2 id="h-map">地区分布与排名</h2>
          <p className="text-xs text-[var(--muted)] mb-4">地图合规研究未能确认可用于交互着色的审图边界，本平台使用排序条形图、排名表与按七大地区分组的地区矩阵（非地图）。<a className="underline" href="/map/">地图合规研究与替换接口</a></p>
          <RankingSection ind={ind} series={series} initialYear={lp} />
        </section>
      )}

      <section id="trend" className="sec" aria-labelledby="h-trend">
        <h2 id="h-trend">历史趋势</h2>
        <p className="text-xs text-[var(--muted)] mb-3">可切换实际数值 / 变化率 / 指数、线性 / 对数坐标；断开处表示官方无数据。</p>
        <TrendSection ind={ind} series={series} initialGeos={ind.has_province ? undefined : []} />
      </section>

      {ind.has_province && lp && (
        <>
          <section id="distribution" className="sec" aria-labelledby="h-dist">
            <h2 id="h-dist">分布、异常值与关键变化</h2>
            <div className="grid lg:grid-cols-2 gap-8 mt-3"><DistributionSection ind={ind} /><MovesSection ind={ind} /></div>
          </section>
          <section id="regional" className="sec" aria-labelledby="h-reg">
            <h2 id="h-reg">地区比较</h2>
            <RegionalSection ind={ind} series={series} pop={pop} initialYear={lp} />
          </section>
        </>
      )}

      <section id="data" className="sec" aria-labelledby="h-data">
        <h2 id="h-data">数据表与下载</h2>
        <p className="text-xs text-[var(--muted)] mb-3">下载的 CSV 与当前筛选逐行一致，包含来源、单位、状态与证据等级。字段说明见 <a className="underline" href="/methodology/#dictionary">数据字典</a>。</p>
        <DataTable initialIndicators={[id]} initialSeries={{ [id]: series }} />
      </section>

      <section id="provenance" className="sec" aria-labelledby="h-prov">
        <h2 id="h-prov">数据版本、冲突与裁决</h2>
        <ProvenancePanel ind={ind} series={series} />
      </section>

      <section id="methodology" className="sec" aria-labelledby="h-meth">
        <h2 id="h-meth">方法与来源</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm mt-3">
          <div>
            <h3 className="font-semibold">数据来源</h3>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {ind.source.province_table && <li>省级：国家统计局“国家数据”·{ind.source.province_table}（原始单位 {ind.source.province_orig_unit}）。<a className="underline" href={ind.source.province_url} target="_blank" rel="noopener noreferrer">官方查询页 ↗</a></li>}
              {ind.source.national_table && <li>全国：国家统计局“国家数据”·{ind.source.national_table}（原始单位 {ind.source.national_orig_unit}）。<a className="underline" href={ind.source.national_url} target="_blank" rel="noopener noreferrer">官方查询页 ↗</a></li>}
              {!ind.source.national_table && <li>无全国值：全国口径与省级口径不可比，本平台不生成。</li>}
              {!ind.source.province_table && <li>无省级值：国家数据分省数据库未发布该指标。</li>}
            </ul>
            <h3 className="font-semibold mt-4">获取与转换</h3>
            <p className="mt-1">公开查询接口获取（无登录、无绕过、限速、原始响应保存并计算 SHA-256）。转换：省级 <code>{ind.source.province_transformation ?? "—"}</code>；全国 <code>{ind.source.national_transformation ?? "—"}</code>（v = 官方原值）。</p>
            <h3 className="font-semibold mt-4">地区汇总规则</h3><p className="mt-1">{AGG_NOTE[ind.agg] ?? AGG_NOTE.none}</p>
          </div>
          <div>
            <h3 className="font-semibold">口径变化与修订</h3>
            {breaks.length ? <ul className="list-disc pl-5 mt-1">{breaks.map((b) => <li key={b.year}>{b.year}年：{b.note}</li>)}</ul> : <p className="mt-1">未发现需要标注的口径断点。</p>}
            <h3 className="font-semibold mt-4">推荐引用</h3>
            <p className="mt-1 text-xs bg-white border border-[var(--line)] rounded p-2" data-testid="citation">{cite}</p>
            <CopyButton text={cite} />
          </div>
        </div>
        {related.length > 0 && <div className="mt-6 text-sm"><h3 className="font-semibold">相关指标与进一步研究</h3><div className="flex flex-wrap gap-2 mt-2">{related.map((r) => <a key={r.id} className="chip" href={`/indicators/${r.id}/`}>{r.name_zh}</a>)}<a className="chip" href={`/explorer/?i=${id}`}>在 Explorer 中做跨指标分析 →</a></div></div>}
        <p className="text-[11px] text-[var(--muted)] mt-4">方法版本 {SITE.methodology_version} · 获取 {SITE.generated_at}</p>
      </section>
    </article>
  );
}
