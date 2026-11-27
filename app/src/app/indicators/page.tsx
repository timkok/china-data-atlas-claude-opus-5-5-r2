import type { Metadata } from "next";
import { CATEGORIES, INDICATORS, fmt } from "@/lib/data";
export const metadata: Metadata = { title: "全部指标", description: `${CATEGORIES.map((c) => c.zh).join("、")}共${INDICATORS.length}个指标（12项核心 + ${INDICATORS.length - 12}项扩展）的分省数据。`, alternates: { canonical: "/indicators/" } };
export default function Indicators() {
  return (
    <div className="wrap pt-8">
      <h1 className="text-2xl font-bold">全部指标</h1>
      <p className="text-sm text-[var(--muted)] mt-1">12项核心指标 + 2项扩展指标（扩展指标单独标识，不计入核心指标）。</p>
      {CATEGORIES.map((c) => (
        <section key={c.id} id={c.id} className="sec">
          <h2>{c.zh} <span className="text-sm font-normal text-[var(--muted)]">{c.en}</span></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {INDICATORS.filter((i) => i.category === c.id).map((i) => (
              <a key={i.id} href={`/indicators/${i.id}/`} className="block bg-white border border-[var(--line)] rounded-lg p-4 hover:border-[var(--accent)]" data-testid="indicator-card">
                <div className="font-semibold">{i.name_zh}{!i.core && <span className="ml-2 text-[10px] px-1 rounded bg-amber-100 text-amber-900">扩展</span>}</div>
                <div className="text-xs text-[var(--muted)]">{i.name_en}</div>
                <div className="mt-2 text-sm">全国 {i.latest_national_year ?? "—"}年：<b className="tabular-nums">{fmt(i.national_latest, i.unit)}</b> {i.unit}</div>
                <div className="text-xs text-[var(--muted)]">省级最新 {i.latest_province_year ?? "无"} · {i.first_year}—{i.latest_province_year_any ?? i.latest_national_year}</div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
