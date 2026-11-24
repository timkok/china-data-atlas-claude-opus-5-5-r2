import { EVIDENCE, type Indicator } from "@/lib/data";
export default function QualityCard({ ind }: { ind: Indicator }) {
  const total = Object.values(ind.evidence).reduce((a, b) => a + b, 0) || 1;
  const checks = [
    { ok: true, t: "官方来源：国家统计局（数据库原始响应已保存）" },
    { ok: ind.latest_province_coverage === 1, t: `最新完整省级年份覆盖 ${Math.round(ind.latest_province_coverage * 31)}/31` },
    { ok: (ind.evidence.E3 || 0) + (ind.evidence.E4 || 0) >= 5, t: `独立交叉核验 / 修订裁决：${(ind.evidence.E3 || 0) + (ind.evidence.E4 || 0)} 个数据点` },
    { ok: ind.unresolved_conflicts === 0, t: ind.unresolved_conflicts === 0 ? "与各模型R1数据的差异均已解释" : `${ind.unresolved_conflicts} 处与R1数据的差异仍未解决（不影响本平台取值）` },
    { ok: !!ind.definition_zh, t: "指标定义与口径已说明" },
  ];
  return (
    <div className="bg-white border border-[var(--line)] rounded-lg p-4 text-sm" data-testid="quality-card">
      <h3 className="font-semibold">数据质量</h3>
      <div className="flex h-2 rounded overflow-hidden mt-2" aria-label="证据等级构成">
        {["E4", "E3", "E2"].map((k) => <div key={k} className={EVIDENCE[k].tone} style={{ width: `${((ind.evidence[k] || 0) / total) * 100}%` }} title={`${EVIDENCE[k].label}: ${ind.evidence[k] || 0}`} />)}
      </div>
      <ul className="mt-2 space-y-1">{Object.entries(ind.evidence).sort().map(([k, v]) => <li key={k} className="flex justify-between text-xs"><span className={`px-1 rounded ${EVIDENCE[k]?.tone}`}>{EVIDENCE[k]?.label}</span><span className="tabular-nums">{v}</span></li>)}</ul>
      <ul className="mt-3 space-y-0.5 text-xs">{checks.map((c, i) => <li key={i}>{c.ok ? "✓" : "△"} {c.t}</li>)}</ul>
      <a className="text-xs underline mt-2 inline-block" href="/quality/">证据等级说明 →</a>
    </div>
  );
}
