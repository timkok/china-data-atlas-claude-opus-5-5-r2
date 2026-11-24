import type { Metadata } from "next";
import { SITE } from "@/lib/data";
export const metadata: Metadata = { title: "数据故事", description: "基于官方统计数据、可复现计算的专题分析。", alternates: { canonical: "/stories/" } };
export default function Stories() {
  return (<div className="wrap pt-8 max-w-4xl"><h1 className="text-2xl font-bold">数据故事</h1>
    <p className="text-sm text-[var(--muted)] mt-1">每篇都由公开数据集在构建时计算，给出研究问题、方法、事实与局限；事实与推论分开标注。</p>
    <ul className="mt-6 space-y-4">{SITE.stories.map((s) => <li key={s.slug}><a href={`/stories/${s.slug}/`} className="block bg-white border border-[var(--line)] rounded-lg p-4 hover:border-[var(--accent)]">
      <div className="font-semibold text-lg">{s.title}</div><div className="text-sm text-[var(--muted)]">{s.question}</div><div className="text-xs mt-1">{s.years[0]}{s.years[1] !== s.years[0] ? `—${s.years[1]}` : ""} · {s.indicators.join(", ")}</div></a></li>)}</ul></div>);
}
