"use client";
import { useMemo, useState } from "react";
import EChart from "./EChart";
import { GEO, PROVINCES, REGION7, fmt, type Indicator, type SeriesFile } from "@/lib/data";
import { INK, axisCommon, seqColor } from "./theme";

type Row = { geo: string; value: number; rank: number; prevRank: number | null };

export function rankRows(matrix: SeriesFile["matrix"], year: number, prevYear: number | null): { rows: Row[]; missing: string[] } {
  const vals = PROVINCES.map((p) => ({ geo: p.geo_code, value: matrix[p.geo_code]?.[String(year)] ?? null }));
  const present = vals.filter((v) => v.value !== null) as { geo: string; value: number }[];
  const missing = vals.filter((v) => v.value === null).map((v) => v.geo);
  const rankOf = (arr: { geo: string; value: number }[]) => {
    const s = [...arr].sort((a, b) => b.value - a.value);
    const r: Record<string, number> = {};
    s.forEach((x, i) => { r[x.geo] = i > 0 && x.value === s[i - 1].value ? r[s[i - 1].geo] : i + 1; }); // competition ranking for ties
    return r;
  };
  const cur = rankOf(present);
  let prev: Record<string, number> | null = null;
  if (prevYear !== null) {
    const pv = PROVINCES.map((p) => ({ geo: p.geo_code, value: matrix[p.geo_code]?.[String(prevYear)] ?? null })).filter((v) => v.value !== null) as { geo: string; value: number }[];
    if (pv.length === 31) prev = rankOf(pv);
  }
  return { rows: present.map((p) => ({ geo: p.geo, value: p.value, rank: cur[p.geo], prevRank: prev ? prev[p.geo] ?? null : null })), missing };
}

export default function RankingSection({ ind, series, initialYear }: { ind: Indicator; series: SeriesFile; initialYear: number }) {
  const years = series.years.filter((y) => PROVINCES.some((p) => series.matrix[p.geo_code]?.[String(y)] != null));
  const allYears = series.years;
  const [year, setYear] = useState(initialYear);
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [region, setRegion] = useState<string>("全部");
  const [selected, setSelected] = useState<string | null>(null);
  const prevYear = years.includes(year - 1) ? year - 1 : null;
  const { rows, missing } = useMemo(() => rankRows(series.matrix, year, prevYear), [series, year, prevYear]);
  const nat = series.matrix["000000"]?.[String(year)] ?? null;
  const shown = rows
    .filter((r) => region === "全部" || GEO[r.geo].region7 === region)
    .sort((a, b) => (order === "desc" ? a.rank - b.rank : b.rank - a.rank) || a.geo.localeCompare(b.geo));
  const vals = rows.map((r) => r.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const yearHasData = rows.length > 0;

  const option = useMemo(() => {
    const data = [...shown].reverse();
    return {
      animation: false,
      grid: { left: 64, right: 56, top: 8, bottom: 24 },
      tooltip: { trigger: "item", formatter: (p: { name: string; value: number }) => `${p.name}<br/>${year}年：<b>${fmt(p.value, ind.unit)}</b> ${ind.unit}` },
      xAxis: { type: "value", ...axisCommon, min: ind.unit === "‰" && min < 0 ? "dataMin" : undefined },
      yAxis: { type: "category", data: data.map((r) => GEO[r.geo].short_zh), ...axisCommon, axisLabel: { color: INK, fontSize: 11 } },
      series: [{
        type: "bar", barMaxWidth: 14,
        data: data.map((r) => ({ name: GEO[r.geo].short_zh, value: r.value, itemStyle: { color: r.geo === selected ? "#c2410c" : seqColor(r.value, min, max) } })),
        label: { show: true, position: "right", fontSize: 10, color: "#56606b", formatter: (p: { value: number }) => fmt(p.value, ind.unit) },
        markLine: nat !== null ? { symbol: "none", silent: true, lineStyle: { color: INK, type: "dashed" }, label: { formatter: `全国 ${fmt(nat, ind.unit)}`, color: INK, fontSize: 10 }, data: [{ xAxis: nat }] } : undefined,
      }],
    };
  }, [shown, selected, nat, ind.unit, year, min, max]);

  const selRow = selected ? rows.find((r) => r.geo === selected) : null;
  const statusCode = selected ? series.status[selected]?.[String(year)] : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4" role="group" aria-label="排名筛选">
        <label className="text-sm">年份
          <select data-testid="year-select" className="ctl ml-2" value={year} onChange={(e) => { setYear(Number(e.target.value)); }}>
            {[...allYears].reverse().map((y) => <option key={y} value={y}>{y}{years.includes(y) ? "" : "（无省级数据）"}</option>)}
          </select>
        </label>
        <label className="text-sm">地区
          <select data-testid="region-filter" className="ctl ml-2" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option>全部</option>{REGION7.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <button data-testid="order-toggle" className="btn" onClick={() => setOrder(order === "desc" ? "asc" : "desc")}>
          {order === "desc" ? "降序 ↓（最高在前）" : "升序 ↑（最低在前）"}
        </button>
        <span className="text-xs text-[var(--muted)]">实际观测值 · 单位 {ind.unit} · 全国 {nat === null ? `${year}年无全国数据` : `${year}年 ${fmt(nat, ind.unit)}`}</span>
      </div>

      {!yearHasData ? (
        <div data-testid="no-data" className="rounded border border-dashed border-[var(--line)] p-8 text-center text-sm">
          <p className="font-medium">{year}年官方数据库没有发布该指标的省级数据。</p>
          <p className="text-[var(--muted)] mt-1">本平台不插值、不估算，因此此处不显示任何数值。最近有省级数据的年份：{years[years.length - 1]}。</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
          <div>
            <EChart option={option} height={Math.max(260, shown.length * 20 + 40)} label={`${year}年${ind.name_zh}省级排名条形图`} onClickName={(n) => { const g = PROVINCES.find((p) => p.short_zh === n); if (g) setSelected(g.geo_code); }} />
            {missing.length > 0 && <p className="text-xs text-[var(--muted)] mt-2" data-testid="missing-list">无数据（不参与排名）：{missing.map((g) => GEO[g].short_zh).join("、")}</p>}
          </div>
          <div>
            {selRow && (
              <div className="mb-3 rounded border border-[var(--line)] bg-white p-3 text-sm" data-testid="selected-card" aria-live="polite">
                <div className="flex justify-between"><b>{GEO[selRow.geo].name_zh} · {year}年</b><button className="text-xs underline" onClick={() => setSelected(null)}>关闭</button></div>
                <div className="text-2xl font-semibold tabular-nums mt-1">{fmt(selRow.value, ind.unit)} <span className="text-sm font-normal">{ind.unit}</span></div>
                <div className="text-xs text-[var(--muted)] mt-1">第 {selRow.rank} 名 / {rows.length} · 数据状态：{statusCode?.[0] === "p" ? "初步" : "终值"} · 来源：国家统计局 {ind.source.province_table}</div>
                <a className="text-xs underline" href={`/provinces/${selRow.geo}/`}>查看{GEO[selRow.geo].short_zh}全部指标 →</a>
              </div>
            )}
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto border border-[var(--line)] rounded">
              <table className="tbl" data-testid="ranking-table">
                <caption className="sr-only">{year}年{ind.name_zh}省级排名</caption>
                <thead><tr><th>名次</th><th>地区</th><th className="text-right">{year}年（{ind.unit}）</th>{nat !== null && <th className="text-right">与全国差</th>}<th className="text-right" title={prevYear ? `与${prevYear}年名次比较` : "无可比上一年"}>名次变化</th></tr></thead>
                <tbody>
                  {shown.map((r) => {
                    const tie = rows.filter((x) => x.rank === r.rank).length > 1;
                    const d = r.prevRank !== null ? r.prevRank - r.rank : null;
                    return (
                      <tr key={r.geo} className={r.geo === selected ? "bg-orange-50" : ""} onClick={() => setSelected(r.geo)} style={{ cursor: "pointer" }}>
                        <td className="tabular-nums" data-rank={r.rank}>{r.rank}{tie ? "=" : ""}</td>
                        <td><button className="underline-offset-2 hover:underline text-left" onClick={() => setSelected(r.geo)}>{GEO[r.geo].short_zh}</button> <span className="text-[10px] text-[var(--muted)]">{GEO[r.geo].region7}</span></td>
                        <td className="text-right tabular-nums" data-value={r.value}>{fmt(r.value, ind.unit)}</td>
                        {nat !== null && <td className={`text-right tabular-nums ${r.value - nat >= 0 ? "" : "text-[var(--muted)]"}`}>{(r.value - nat >= 0 ? "+" : "") + fmt(r.value - nat, ind.unit)}</td>}
                        <td className="text-right tabular-nums text-xs">{d === null ? <span className="text-[var(--muted)]">—</span> : d > 0 ? <span style={{ color: "#15803d" }}>↑{d}</span> : d < 0 ? <span style={{ color: "#b91c1c" }}>↓{-d}</span> : "–"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-2">并列名次采用“1,2,2,4”竞争排名，以“=”标示。名次变化仅在上一年31省数据完整时计算。</p>
          </div>
        </div>
      )}
      {yearHasData && <RegionMatrix ind={ind} series={series} year={year} min={min} max={max} onPick={setSelected} selected={selected} />}
    </div>
  );
}

function RegionMatrix({ ind, series, year, min, max, onPick, selected }: { ind: Indicator; series: SeriesFile; year: number; min: number; max: number; onPick: (g: string) => void; selected: string | null }) {
  return (
    <div className="mt-8" data-testid="region-matrix">
      <h3 className="text-base font-semibold">地区矩阵 <span className="text-xs font-normal text-[var(--muted)]">按七大地区分组的示意矩阵，不是地图，不表示任何地理边界</span></h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        {REGION7.map((r) => (
          <div key={r} className="border border-[var(--line)] rounded p-2">
            <div className="text-xs text-[var(--muted)] mb-1">{r}</div>
            <div className="flex flex-wrap gap-1">
              {PROVINCES.filter((p) => p.region7 === r).map((p) => {
                const v = series.matrix[p.geo_code]?.[String(year)] ?? null;
                const bg = v === null ? "repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 4px,#e5e7eb 4px,#e5e7eb 8px)" : seqColor(v, min, max);
                const dark = v !== null && (v - min) / (max - min || 1) >= 4 / 7;
                return (
                  <button key={p.geo_code} onClick={() => onPick(p.geo_code)} title={`${p.name_zh} ${year}年 ${v === null ? "无数据" : fmt(v, ind.unit) + " " + ind.unit}`}
                    className={`w-[74px] h-[46px] rounded text-left px-1.5 py-1 ${selected === p.geo_code ? "ring-2 ring-orange-600" : ""}`} style={{ background: bg, color: dark ? "#fff" : "#1f2933" }}>
                    <div className="text-[11px] leading-tight">{p.short_zh}</div>
                    <div className="text-[11px] font-semibold tabular-nums leading-tight">{v === null ? "无数据" : fmt(v, ind.unit)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[var(--muted)] mt-2">颜色：按{year}年31省最小值到最大值等距分为7级，越深数值越高（不代表好坏）。斜纹 = 无数据。</p>
    </div>
  );
}
