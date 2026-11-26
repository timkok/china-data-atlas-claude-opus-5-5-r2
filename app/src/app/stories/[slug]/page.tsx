import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE, getIndicator } from "@/lib/data";
import StoryChart from "@/components/StoryChart";
export function generateStaticParams() { return SITE.stories.map((s) => ({ slug: s.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const s = SITE.stories.find((x) => x.slug === slug); if (!s) return {};
  return { title: s.title, description: `${s.question} ${s.facts[0] ?? ""}`, alternates: { canonical: `/stories/${slug}/` } };
}
export default async function Story({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const s = SITE.stories.find((x) => x.slug === slug); if (!s) notFound();
  return (<article className="wrap pt-8 max-w-3xl" data-testid="story">
    <nav className="text-xs text-[var(--muted)]"><a className="inline-block py-1.5 pr-2 hover:underline" href="/stories/">← 数据故事</a></nav>
    <h1 className="text-3xl font-bold mt-2">{s.title}</h1>
    <p className="mt-2 text-lg">研究问题：{s.question}</p>
    <div className="mt-4"><StoryChart story={s} /></div>
    <h2 className="text-lg font-semibold mt-6">事实（由数据计算）</h2>
    <ul className="list-disc pl-5 mt-1 space-y-1" data-testid="story-facts">{s.facts.map((f) => <li key={f}>{f}</li>)}</ul>
    <h2 className="text-lg font-semibold mt-6">方法与复现</h2><p className="text-sm mt-1" data-testid="story-method">{s.method}</p>
    <p className="text-sm mt-1">使用指标：{s.indicators.map((i) => <a key={i} className="underline mr-2" href={`/indicators/${i}/`}>{getIndicator(i)?.name_zh}</a>)} · 计算脚本：<code>pipeline/transformations/export_site_data_r2.py</code> · 数据：<a className="underline" href="/downloads/observations.csv">observations.csv</a></p>
    <h2 className="text-lg font-semibold mt-6">局限与推论边界</h2><ul className="list-disc pl-5 mt-1 text-sm">{s.limits.map((l) => <li key={l}>{l}</li>)}</ul>
    <p className="text-xs text-[var(--muted)] mt-6">来源：国家统计局“国家数据”。本文不包含任何未经数据支持的数字。</p>
  </article>);
}
