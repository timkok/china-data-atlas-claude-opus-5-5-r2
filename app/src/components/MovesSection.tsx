import { GEO, fmt, isRate, type Indicator } from "@/lib/data";
export default function MovesSection({ ind }: { ind: Indicator }) {
  if (!ind.moves.length) return <p className="text-sm text-[var(--muted)]">2015年或最新年份缺少省级数据，无法计算变化。</p>;
  const rate = isRate(ind.unit);
  const sorted = [...ind.moves];
  const up = sorted.slice(0, 5), down = sorted.slice(-5).reverse();
  const row = (m: (typeof sorted)[number]) => (
    <li key={m.geo} className="flex justify-between gap-2 text-sm py-0.5"><span>{GEO[m.geo].short_zh}</span>
      <span className="tabular-nums text-right">{fmt(m.from, ind.unit)} → {fmt(m.to, ind.unit)} <b>{rate ? `${m.abs >= 0 ? "+" : ""}${fmt(m.abs, ind.unit)}` : m.pct !== null ? `${m.pct >= 0 ? "+" : ""}${m.pct.toFixed(1)}%` : ""}</b></span></li>);
  return (
    <div className="grid sm:grid-cols-2 gap-6" data-testid="moves">
      <div><h4 className="text-xs text-[var(--muted)]">2015—{ind.latest_province_year} 增加最多</h4><ul>{up.map(row)}</ul></div>
      <div><h4 className="text-xs text-[var(--muted)]">2015—{ind.latest_province_year} 增加最少 / 下降</h4><ul>{down.map(row)}</ul></div>
      <p className="text-[11px] text-[var(--muted)] sm:col-span-2">{rate ? "率类指标显示差值（百分点 / 千分点等）" : "总量与人均指标显示增幅（名义值）"}；若期间存在口径断点（见“方法与来源”），变化不可直接解读。</p>
    </div>
  );
}
