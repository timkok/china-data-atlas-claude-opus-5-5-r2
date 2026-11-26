"use client";
import { useEffect, useMemo, useState } from "react";
import { EVIDENCE, GEO, INDICATORS, REGION7, REGIONS, STATUS_LABEL, fmt, getIndicator, type SeriesFile } from "@/lib/data";
import { loadSeries } from "./useSeries";

type Row = { ind: string; geo: string; year: number; value: number | null; status: string };
const PAGE = 50;

export function toCsv(rows: Row[]): string {
  const head = ["indicator_id", "indicator_name_zh", "geo_code", "geo_name_zh", "geo_level", "year", "value", "unit", "data_status", "evidence_level", "source_agency", "source_table", "source_url", "transformation", "dataset_version"];
  const esc = (s: string | number) => { const t = String(s); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const lines = rows.map((r) => {
    const ind = getIndicator(r.ind)!; const g = GEO[r.geo]; const nat = g.level === "national";
    const st = r.value === null ? "unknown" : ({ f: "final", p: "preliminary", r: "revised", u: "unknown" } as Record<string, string>)[r.status[0]] || "unknown";
    const vs = r.value === null ? "" : `E${r.status[1] || "?"}`;
    return [r.ind, ind.name_zh, r.geo, g.name_zh, g.level, r.year, r.value === null ? "" : r.value, ind.unit, st, vs, "国家统计局 National Bureau of Statistics of China",
      (nat ? ind.source.national_table : ind.source.province_table) || "", (nat ? ind.source.national_url : ind.source.province_url) || "", (nat ? ind.source.national_transformation : ind.source.province_transformation) || "", `NBS-DB@${(ind.source.retrieved_at || "").slice(0, 10)}`].map(esc).join(",");
  });
  return "﻿" + [head.join(","), ...lines].join("\n");
}

export default function DataTable({ initialIndicators, initialSeries, allowIndicatorPick = false, initialGeo }: { initialIndicators: string[]; initialSeries?: Record<string, SeriesFile>; allowIndicatorPick?: boolean; initialGeo?: string }) {
  const [inds, setInds] = useState<string[]>(initialIndicators);
  const [data, setData] = useState<Record<string, SeriesFile>>(initialSeries || {});
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("全部");
  const [level, setLevel] = useState<"all" | "province" | "national">("all");
  const allYears = useMemo(() => Array.from(new Set(inds.flatMap((i) => data[i]?.years || []))).sort(), [inds, data]);
  const [from, setFrom] = useState<number>(2015);
  const [to, setTo] = useState<number>(2025);
  const [hideMissing, setHideMissing] = useState(true);
  const [sort, setSort] = useState<{ k: "year" | "value" | "geo" | "ind"; d: 1 | -1 }>({ k: "year", d: -1 });
  const [page, setPage] = useState(0);
  const [srcRow, setSrcRow] = useState<Row | null>(null);

  useEffect(() => {
    if (initialGeo) setQ(GEO[initialGeo]?.short_zh || "");
  }, [initialGeo]);
  useEffect(() => {
    inds.filter((i) => !data[i]).forEach((i) => loadSeries(i).then((s) => setData((d) => ({ ...d, [i]: s }))));
  }, [inds, data]);

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const i of inds) {
      const s = data[i]; if (!s) continue;
      for (const r of REGIONS) {
        if (level !== "all" && r.level !== level) continue;
        if (region !== "全部" && r.region7 !== region) continue;
        if (q && !(r.name_zh.includes(q) || r.short_zh.includes(q) || r.name_en.toLowerCase().includes(q.toLowerCase()) || r.geo_code.startsWith(q))) continue;
        for (const y of s.years) {
          if (y < from || y > to) continue;
          const v = s.matrix[r.geo_code]?.[String(y)] ?? null;
          if (hideMissing && v === null) continue;
          out.push({ ind: i, geo: r.geo_code, year: y, value: v, status: s.status[r.geo_code]?.[String(y)] || "uu" });
        }
      }
    }
    const k = sort.k;
    out.sort((a, b) => {
      const c = k === "year" ? a.year - b.year : k === "value" ? (a.value ?? -Infinity) - (b.value ?? -Infinity) : k === "geo" ? a.geo.localeCompare(b.geo) : a.ind.localeCompare(b.ind);
      return c * sort.d || a.geo.localeCompare(b.geo) || b.year - a.year;
    });
    return out;
  }, [inds, data, q, region, level, from, to, hideMissing, sort]);

  useEffect(() => setPage(0), [q, region, level, from, to, hideMissing, inds]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const download = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `china-data-atlas_${inds.join("+")}_${from}-${to}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  const th = (k: typeof sort.k, label: string, right = false) => (
    <th className={right ? "text-right" : ""} aria-sort={sort.k === k ? (sort.d === 1 ? "ascending" : "descending") : "none"}>
      <button className="font-semibold" onClick={() => setSort((s) => ({ k, d: s.k === k ? (s.d === 1 ? -1 : 1) : -1 }))}>{label}{sort.k === k ? (sort.d === 1 ? " ↑" : " ↓") : ""}</button>
    </th>
  );

  return (
    <div data-testid="data-explorer">
      {allowIndicatorPick && (
        <fieldset className="mb-3">
          <legend className="text-sm font-medium mb-1">指标（可多选）</legend>
          <div className="flex flex-wrap gap-1">
            {INDICATORS.map((i) => <button key={i.id} aria-pressed={inds.includes(i.id)} className={`chip ${inds.includes(i.id) ? "chip-on" : ""}`} onClick={() => setInds((c) => c.includes(i.id) ? (c.length > 1 ? c.filter((x) => x !== i.id) : c) : [...c, i.id])}>{i.name_zh}{i.core ? "" : " ·扩展"}</button>)}
          </div>
        </fieldset>
      )}
      <div className="flex flex-wrap gap-3 items-end mb-3">
        <label className="text-sm">搜索地区<input data-testid="explorer-search" className="ctl ml-2 w-32" value={q} onChange={(e) => setQ(e.target.value.trim())} placeholder="如：广东 / 44" /></label>
        <label className="text-sm">层级<select className="ctl ml-2" value={level} onChange={(e) => setLevel(e.target.value as typeof level)}><option value="all">全国+省级</option><option value="province">仅省级</option><option value="national">仅全国</option></select></label>
        <label className="text-sm">七大地区<select data-testid="explorer-region" className="ctl ml-2" value={region} onChange={(e) => setRegion(e.target.value)}><option>全部</option>{REGION7.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label className="text-sm">从<select data-testid="explorer-from" className="ctl ml-2" value={from} onChange={(e) => setFrom(Number(e.target.value))}>{allYears.map((y) => <option key={y}>{y}</option>)}</select></label>
        <label className="text-sm">到<select data-testid="explorer-to" className="ctl ml-2" value={to} onChange={(e) => setTo(Number(e.target.value))}>{allYears.map((y) => <option key={y}>{y}</option>)}</select></label>
        <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={!hideMissing} onChange={(e) => setHideMissing(!e.target.checked)} data-testid="show-missing" />显示缺失值</label>
        <button className="btn btn-primary" onClick={download} data-testid="csv-download">下载 CSV（{rows.length} 行）</button>
      </div>
      <div className="overflow-x-auto border border-[var(--line)] rounded">
        <table className="tbl" data-testid="explorer-table">
          <caption className="sr-only">数据表</caption>
          <thead><tr>{th("ind", "指标")}{th("geo", "地区")}{th("year", "年份")}{th("value", "数值", true)}<th>单位</th><th>状态</th><th>来源</th></tr></thead>
          <tbody>
            {view.map((r) => {
              const ind = getIndicator(r.ind)!;
              return (
                <tr key={`${r.ind}-${r.geo}-${r.year}`} data-row={`${r.ind}|${r.geo}|${r.year}`}>
                  <td className="text-xs">{ind.name_zh}</td>
                  <td>{GEO[r.geo].short_zh}{GEO[r.geo].level === "national" && <span className="ml-1 text-[10px] px-1 rounded bg-[var(--ink)] text-white">全国</span>}</td>
                  <td className="tabular-nums">{r.year}</td>
                  <td className="text-right tabular-nums" data-value={r.value ?? ""}>{r.value === null ? <span className="text-[var(--muted)]" title="官方来源该年份无数据，未插值">缺失</span> : fmt(r.value, ind.unit)}</td>
                  <td className="text-xs">{ind.unit}</td>
                  <td className="text-xs">{r.value === null ? "—" : <>{STATUS_LABEL[r.status[0]] || ""} · <span className={`px-1 rounded ${EVIDENCE["E" + r.status[1]]?.tone || ""}`} title={EVIDENCE["E" + r.status[1]]?.desc}>E{r.status[1]}</span></>}</td>
                  <td><button className="text-xs underline" onClick={() => setSrcRow(r)} data-testid="source-btn">查看来源</button></td>
                </tr>
              );
            })}
            {view.length === 0 && <tr><td colSpan={7} className="text-center text-sm py-6 text-[var(--muted)]" data-testid="explorer-empty">没有符合条件的数据。官方来源在该范围内无数据时，本平台不生成数值。</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-2 text-sm">
        <button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>上一页</button>
        <span>第 {page + 1} / {pages} 页 · 共 {rows.length} 行</span>
        <button className="btn" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>下一页</button>
      </div>
      {srcRow && <SourceDialog row={srcRow} onClose={() => setSrcRow(null)} />}
    </div>
  );
}

function SourceDialog({ row, onClose }: { row: Row; onClose: () => void }) {
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, [onClose]);
  const ind = getIndicator(row.ind)!; const nat = GEO[row.geo].level === "national";
  const ids = nat ? ind.source.national_ids : ind.source.province_ids;
  return (
    <div role="dialog" aria-modal="true" aria-label="数据来源" className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-2" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="bg-white rounded-lg max-w-lg w-full p-4 text-sm" onClick={(e) => e.stopPropagation()} data-testid="source-dialog">
        <div className="flex justify-between"><h4 className="font-semibold">数据来源 · {GEO[row.geo].name_zh} {row.year}年 {ind.name_zh}</h4><button autoFocus onClick={onClose} aria-label="关闭">✕</button></div>
        <dl className="mt-3 grid grid-cols-[6rem_1fr] gap-y-1.5 text-xs">
          <dt className="text-[var(--muted)]">数值</dt><dd>{row.value === null ? "缺失（官方无数据）" : `${fmt(row.value, ind.unit)} ${ind.unit}`}</dd>
          <dt className="text-[var(--muted)]">来源机构</dt><dd>国家统计局（National Bureau of Statistics of China）</dd>
          <dt className="text-[var(--muted)]">数据库</dt><dd>国家数据 · {nat ? "年度数据" : "分省年度数据"}</dd>
          <dt className="text-[var(--muted)]">表格路径</dt><dd>{nat ? ind.source.national_table : ind.source.province_table}</dd>
          <dt className="text-[var(--muted)]">原始单位</dt><dd>{nat ? ind.source.national_orig_unit : ind.source.province_orig_unit}</dd>
          <dt className="text-[var(--muted)]">转换</dt><dd className="font-mono">{nat ? ind.source.national_transformation : ind.source.province_transformation}</dd>
          <dt className="text-[var(--muted)]">定位信息</dt><dd className="font-mono break-all">cid={nat ? ind.source.national_cid : ind.source.province_cid}; ids={Object.values(ids || {}).join("|")}; da={GEO[row.geo].nbs_code}; {row.year}YY</dd>
          <dt className="text-[var(--muted)]">获取日期</dt><dd>{ind.source.retrieved_at?.slice(0, 10)}</dd>
          <dt className="text-[var(--muted)]">状态</dt><dd>{STATUS_LABEL[row.status[0]]}</dd>
          <dt className="text-[var(--muted)]">证据等级</dt><dd data-testid="evidence-level">{EVIDENCE["E" + row.status[1]]?.label} — {EVIDENCE["E" + row.status[1]]?.desc}</dd>
          <dt className="text-[var(--muted)]">数据版本</dt><dd>NBS-DB@{(ind.source.retrieved_at || "").slice(0, 10)}（当前官方数据库版本）</dd>
        </dl>
        <a className="btn btn-primary mt-3 inline-block" href={(nat ? ind.source.national_url : ind.source.province_url) || "https://data.stats.gov.cn/"} target="_blank" rel="noopener noreferrer">打开国家统计局官方查询页 ↗</a>
        <p className="text-[11px] text-[var(--muted)] mt-2">在官方页面按上述“表格路径”选择指标与地区即可看到同一数值。</p>
      </div>
    </div>
  );
}
