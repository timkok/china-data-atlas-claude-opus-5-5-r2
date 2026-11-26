"use client";
import { useEffect, useState } from "react";
import { GEO, fmt, type Indicator, type SeriesFile } from "@/lib/data";

type Conflict = { conflict_id: string; geo_code: string; year: string; canonical_value: string; r1_model: string; r1_value: string; r1_source: string; r1_verification_claim: string; category: string; resolution: string; evidence_url: string; explanation: string };
const MODEL: Record<string, string> = { gemini4neon: "Gemini 4 Neon", codex_gpt6: "Codex GPT-6", claude_r1a: "Claude Opus 5.5（R1首次运行）", gemini: "Gemini（版本未知）", astra: "GPT-6 Astra Pro", muse: "Muse Spark 1.3", gpt62: "GPT-6.2" };

export default function ProvenancePanel({ ind, series }: { ind: Indicator; series: SeriesFile }) {
  const [conf, setConf] = useState<Conflict[] | null>(null);
  const [cat, setCat] = useState("全部");
  const [geo, setGeo] = useState("全部");
  useEffect(() => { fetch(`/data/conflicts/${ind.id}.json`).then((r) => r.json()).then(setConf).catch(() => setConf([])); }, [ind.id]);
  const vkeys = Object.entries(series.vintages || {}).sort(([a], [b]) => (a === "000000" ? -1 : b === "000000" ? 1 : a.localeCompare(b))).flatMap(([g, ys]) => Object.entries(ys).map(([y, v]) => ({ g, y, v })));
  const cats = conf ? Array.from(new Set(conf.map((c) => c.category))) : [];
  const shown = (conf || []).filter((c) => (cat === "全部" || c.category === cat) && (geo === "全部" || c.geo_code === geo)).slice(0, 60);
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div data-testid="vintages">
        <h3 className="font-semibold">数据版本（{vkeys.length} 个数值有多个历史版本）</h3>
        <p className="text-xs text-[var(--muted)]">“current”为本平台采用的当前官方数据库版本；“superseded”为早期出版物中的旧版本（例如初步核算数、经济普查前数值），保留以便研究修订。</p>
        <div className="max-h-80 overflow-y-auto mt-2 border border-[var(--line)] rounded">
          <table className="tbl text-xs"><thead><tr><th>地区</th><th>年份</th><th className="text-right">数值</th><th>版本</th></tr></thead>
            <tbody>{vkeys.slice(0, 120).map(({ g, y, v }) => v.map((x, i) => (
              <tr key={`${g}${y}${i}`} className={x.status === "current" ? "font-semibold" : "text-[var(--muted)]"}>
                {i === 0 && <td rowSpan={v.length}>{GEO[g]?.short_zh}</td>}{i === 0 && <td rowSpan={v.length}>{y}</td>}
                <td className="text-right tabular-nums">{fmt(x.v, ind.unit)}</td><td>{x.status === "current" ? "当前官方值" : "旧版本"} · {x.vintage.replace(/earlier publication per (\w+)/, (_, m) => `R1 ${MODEL[m] || m} 引用的早期出版物`)}{x.evidence ? <> · <a className="underline" href={x.evidence} target="_blank" rel="noopener noreferrer">修订依据</a></> : null}</td></tr>)))}
            </tbody></table>
          {vkeys.length === 0 && <p className="p-3 text-xs text-[var(--muted)]">本指标没有记录到不同版本的数值。</p>}
        </div>
      </div>
      <div data-testid="conflicts">
        <h3 className="font-semibold">与 Round 1 各模型数据的差异（{conf?.length ?? "…"} 条）</h3>
        <p className="text-xs text-[var(--muted)]">差异不等于错误。每条均按证据分类；本平台取值不靠多数投票。</p>
        <div className="flex gap-2 mt-2 text-sm">
          <select className="ctl" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="差异类别" data-testid="conflict-category"><option>全部</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="ctl" value={geo} onChange={(e) => setGeo(e.target.value)} aria-label="地区"><option>全部</option><option value="000000">全国</option>{Object.values(GEO).filter((g) => g.level === "province").map((g) => <option key={g.geo_code} value={g.geo_code}>{g.short_zh}</option>)}</select>
        </div>
        <div className="max-h-80 overflow-y-auto mt-2 border border-[var(--line)] rounded">
          <table className="tbl text-xs"><thead><tr><th>地区·年</th><th className="text-right">本平台</th><th>R1模型</th><th className="text-right">R1值</th><th>类别 / 裁决</th></tr></thead>
            <tbody>{shown.map((c) => (
              <tr key={c.conflict_id} title={c.explanation}><td>{GEO[c.geo_code]?.short_zh} {c.year}</td><td className="text-right tabular-nums">{fmt(+c.canonical_value, ind.unit)}</td><td>{MODEL[c.r1_model] || c.r1_model}</td>
                <td className="text-right tabular-nums">{fmt(+c.r1_value, ind.unit)}</td>
                <td><span className={c.resolution.startsWith("resolved") ? "" : "text-red-700 font-semibold"}>{c.category}</span><br /><span className="text-[10px] text-[var(--muted)]">{c.explanation.slice(0, 80)}</span>{c.evidence_url && <> · <a className="underline text-[10px]" href={c.evidence_url} target="_blank" rel="noopener noreferrer">证据</a></>}</td></tr>))}
            </tbody></table>
          {conf && conf.length === 0 && <p className="p-3 text-xs text-[var(--muted)]">没有差异记录（R1中只有本平台或数值完全一致）。</p>}
        </div>
        <a className="text-xs underline" href={`/downloads/conflicts.csv`}>下载全部冲突记录 CSV</a>
      </div>
    </div>
  );
}
