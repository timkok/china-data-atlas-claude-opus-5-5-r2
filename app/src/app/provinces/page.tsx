import type { Metadata } from "next";
import { PROVINCES, REGION7 } from "@/lib/data";
export const metadata: Metadata = { title: "31个省级行政区", description: "按七大地区浏览中国大陆31个省级行政区的统计数据与全国比较。", alternates: { canonical: "/provinces/" } };
export default function Provinces() {
  return (<div className="wrap pt-8"><h1 className="text-2xl font-bold">省份</h1>
    <p className="text-sm text-[var(--muted)] mt-1">统计覆盖中国大陆31个省级行政区（GB/T 2260）。香港、澳门特别行政区和台湾省的数据不在国家统计局分省数据库统计范围内；这是统计覆盖说明，不涉及地理归属判断。</p>
    {REGION7.map((r) => (<section key={r} className="mt-6"><h2 className="font-semibold">{r}</h2>
      <div className="flex flex-wrap gap-2 mt-2">{PROVINCES.filter((p) => p.region7 === r).map((p) => <a key={p.geo_code} className="chip" href={`/provinces/${p.geo_code}/`}>{p.name_zh}</a>)}</div></section>))}
    <p className="mt-8"><a className="btn btn-primary" href="/compare/">省份综合比较 →</a></p></div>);
}
