import Search from "@/components/Search";
import HomeFeature from "@/components/HomeFeature";
import { CATEGORIES, EVIDENCE, INDICATORS, PROVINCES, REGION7, SITE, num } from "@/lib/data";

const QUESTIONS = ["哪些省份过去20年人口增长最快？", "比较广东和江苏过去十年GDP变化", "浙江人均收入排名如何变化？", "2020年哪些省份老龄化最严重？", "医疗资源与老龄化之间是否存在相关性？"];
export default function Home() {
  const ev = SITE.stats.evidence as Record<string, number>;
  return (
    <>
      <section className="wrap pt-10 pb-6 grid lg:grid-cols-[3fr_2fr] gap-8 items-end">
        <div>
          <p className="kicker">China Data Atlas · 中国数据地图 · Round 2</p>
          <h1 className="text-3xl sm:text-[42px] font-bold mt-2 leading-tight">中国省级统计数据研究门户</h1>
          <p className="mt-3 text-[var(--muted)] max-w-2xl">{INDICATORS.length} 个指标、31 个省级行政区、{num("earliest_year")}—{num("latest_year")} 年。每个数字都有官方来源、证据等级和版本记录；Round 1 八个数据集的 {num("conflicts").toLocaleString()} 处差异已逐条分类裁决。</p>
          <div className="mt-5 max-w-2xl"><Search /></div>
        </div>
        <aside className="bg-white border border-[var(--line)] rounded-lg p-4 text-sm" aria-label="数据覆盖与质量">
          <div className="font-semibold">数据覆盖与质量</div>
          <dl className="grid grid-cols-2 gap-y-2 mt-2" data-testid="home-stats">
            <dt className="text-[var(--muted)]">公开观测值</dt><dd className="text-right tabular-nums font-semibold">{num("published_observations").toLocaleString()}</dd>
            <dt className="text-[var(--muted)]">核心 / 扩展指标</dt><dd className="text-right tabular-nums font-semibold">{num("core_indicators")} / {num("extension_indicators")}</dd>
            <dt className="text-[var(--muted)]">独立交叉核验（E3）</dt><dd className="text-right tabular-nums">{ev.E3 ?? 0}</dd>
            <dt className="text-[var(--muted)]">修订已裁决（E4）</dt><dd className="text-right tabular-nums">{ev.E4 ?? 0}</dd>
            <dt className="text-[var(--muted)]">未解决冲突</dt><dd className="text-right tabular-nums">{num("conflicts_unresolved")}</dd>
          </dl>
          <a className="underline text-xs mt-2 inline-block" href="/quality/">证据等级与冲突裁决 →</a>
        </aside>
      </section>

      <section className="wrap" aria-labelledby="cat-h"><h2 id="cat-h" className="sr-only">分类</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{CATEGORIES.map((c) => (
          <a key={c.id} href={`/indicators/#${c.id}`} className="block border border-[var(--line)] bg-white rounded-lg p-3 hover:border-[var(--accent)]">
            <div className="font-semibold">{c.zh}</div><div className="text-xs text-[var(--muted)] mt-1">{c.blurb}</div><div className="text-xs mt-2">{INDICATORS.filter((i) => i.category === c.id).length} 个指标</div></a>))}</div>
      </section>

      <section className="wrap mt-10" aria-labelledby="feat-h"><h2 id="feat-h" className="text-xl font-bold mb-3">精选指标：各省最新数据</h2><HomeFeature /></section>

      <section className="wrap mt-12 grid lg:grid-cols-[3fr_2fr] gap-8">
        <div>
          <h2 className="text-xl font-bold mb-1">数据故事</h2>
          <p className="text-xs text-[var(--muted)] mb-3">由公开数据集计算，可复现；事实、计算与推论分开标注。</p>
          <ul className="space-y-3" data-testid="home-stories">{SITE.stories.map((s) => (
            <li key={s.slug} className="border-l-2 border-[var(--accent)] pl-3"><a href={`/stories/${s.slug}/`} className="font-semibold hover:underline">{s.title}</a><div className="text-sm text-[var(--muted)]">{s.facts[0]}</div></li>))}</ul>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-3">热门研究问题</h2>
          <ul className="space-y-2" data-testid="home-questions">{QUESTIONS.map((q) => <li key={q}><a className="chip inline-block" href={`/ask/?q=${encodeURIComponent(q)}`}>{q}</a></li>)}</ul>
          <p className="text-xs text-[var(--muted)] mt-2">由规则化查询引擎回答，显示查询条件、公式和来源。</p>
        </div>
      </section>

      <section className="wrap mt-12" aria-labelledby="prov-h">
        <h2 id="prov-h" className="text-xl font-bold mb-3">按省份浏览</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{REGION7.map((r) => (
          <div key={r} className="bg-white border border-[var(--line)] rounded-lg p-3"><div className="text-xs text-[var(--muted)]">{r}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm">{PROVINCES.filter((p) => p.region7 === r).map((p) => <a key={p.geo_code} className="hover:underline" href={`/provinces/${p.geo_code}/`}>{p.short_zh}</a>)}</div></div>))}
          <a href="/compare/" className="flex items-center justify-center bg-[var(--ink)] text-white rounded-lg p-3 font-semibold">省份综合比较 →</a></div>
      </section>

      <section className="wrap mt-12 grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-3">最新数据年份</h2>
          <table className="tbl" data-testid="latest-table"><caption className="sr-only">各指标最新年份</caption>
            <thead><tr><th>指标</th><th className="text-right">全国</th><th className="text-right">完整省级</th></tr></thead>
            <tbody>{SITE.latest_updates.map((u) => <tr key={u.id}><td><a className="hover:underline" href={`/indicators/${u.id}/`}>{u.name_zh}</a></td><td className="text-right tabular-nums">{u.national ?? "—"}</td><td className="text-right tabular-nums">{u.province ?? "—"}</td></tr>)}</tbody></table>
          <a className="text-sm underline mt-2 inline-block" href="/indicators/">全部 {INDICATORS.length} 个指标 →</a>
        </div>
        <div className="space-y-3 text-sm">
          <h2 className="text-xl font-bold">研究工具</h2>
          <a href="/explorer/" className="block bg-white border border-[var(--line)] rounded-lg p-4 hover:border-[var(--accent)]"><b>数据浏览器</b><div className="text-[var(--muted)]">跨指标折线/散点/气泡、指数化、CAGR、相关系数、CSV/PNG/SVG、分享链接</div></a>
          <a href="/map/" className="block bg-white border border-[var(--line)] rounded-lg p-4 hover:border-[var(--accent)]"><b>地区矩阵与地图合规研究</b><div className="text-[var(--muted)]">年份切换、悬停、点击联动；地理地图的实施条件</div></a>
          <a href="/methodology/" className="block bg-white border border-[var(--line)] rounded-lg p-4 hover:border-[var(--accent)]"><b>方法、来源与引用</b><div className="text-[var(--muted)]">{Object.keys(EVIDENCE).join(" / ")} 证据等级 · 修订版本 · 数据字典</div></a>
        </div>
      </section>
    </>
  );
}
