import site from "@/data/site.json";

export type Region = { geo_code: string; nbs_code: string; level: "national" | "province"; name_zh: string; short_zh: string; name_en: string; region7: string | null; zone4: string | null };
export type Finding = { zh: string; type: "fact" | "calculation" };
export type Indicator = {
  id: string; core: boolean; category: string; name_zh: string; name_en: string; unit: string; agg: string; definition_zh: string; official_name_zh: string;
  years: number[]; first_year: number; province_years: [number, number] | null; latest_province_year: number | null; latest_province_year_any: number | null;
  latest_national_year: number | null; national_latest: number | null; national_prev: number | null; latest_province_coverage: number; valid_observations: number;
  evidence: Record<string, number>; conflicts: Record<string, number>; unresolved_conflicts: number;
  ranking: { geo: string; rank: number | null; value: number | null }[]; findings: Finding[];
  distribution: { median: number; q1: number; q3: number; min: number; max: number; outliers: string[] } | null;
  moves: { geo: string; from: number; to: number; abs: number; pct: number | null }[];
  has_province: boolean; has_national: boolean;
  source: { province_table: string | null; national_table: string | null; province_transformation: string | null; national_transformation: string | null;
    province_orig_unit: string | null; national_orig_unit: string | null; province_cid: string | null; national_cid: string | null;
    province_ids: Record<string, string> | null; national_ids: Record<string, string> | null; province_url: string; national_url: string; retrieved_at: string | null };
};
export type Vintage = { v: number; vintage: string; status: string; source: string; evidence: string };
export type SeriesFile = { id: string; years: number[]; matrix: Record<string, Record<string, number | null>>; status: Record<string, Record<string, string>>; vintages: Record<string, Record<string, Vintage[]>> };
export type Story = { slug: string; title: string; question: string; indicators: string[]; years: number[]; method: string; facts: string[]; limits: string[];
  chart: { type: string; data?: { geo: string; value: number }[]; geos?: string[]; indicator?: string; from?: number; to?: number; second?: string; x?: string; y?: string; year?: number; logy?: boolean; points?: { geo: string; x: number; y: number }[]; unit?: string } };
type Site = { generated_at: string; methodology_version: string; regions: Region[]; indicators: Indicator[]; stories: Story[];
  latest_updates: { id: string; name_zh: string; national: number | null; province: number | null }[]; stats: Record<string, number | Record<string, number>>; conflict_categories: Record<string, number> };

export const SITE = site as unknown as Site;
export const REGIONS = SITE.regions;
export const PROVINCES = REGIONS.filter((r) => r.level === "province");
export const GEO: Record<string, Region> = Object.fromEntries(REGIONS.map((r) => [r.geo_code, r]));
export const INDICATORS = SITE.indicators;
export const CORE = INDICATORS.filter((i) => i.core);
export const getIndicator = (id: string) => INDICATORS.find((i) => i.id === id);
export const num = (k: string) => SITE.stats[k] as number;
export const REGION7 = ["华北", "东北", "华东", "华中", "华南", "西南", "西北"] as const;
export const CATEGORIES = [
  { id: "population", zh: "人口与社会", en: "Population", blurb: "常住人口、出生与死亡、城镇化、年龄结构" },
  { id: "economy", zh: "经济与收入", en: "Economy", blurb: "GDP、产业结构、居民收入与消费、地方财政" },
  { id: "education", zh: "教育", en: "Education", blurb: "高校、本专科、研究生与基础教育在校生" },
  { id: "health", zh: "医疗与健康", en: "Health", blurb: "医师、护士、床位、机构与诊疗服务" },
  { id: "environment", zh: "资源与基础设施", en: "Environment", blurb: "用水、森林覆盖、公路里程" },
];
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
export const STATUS_LABEL: Record<string, string> = { f: "终值", p: "初步", r: "修订", u: "未知" };
export const EVIDENCE: Record<string, { label: string; desc: string; tone: string }> = {
  E0: { label: "E0 无可核证据", desc: "没有可核验的官方来源，不发布", tone: "bg-red-100 text-red-900" },
  E1: { label: "E1 仅有来源定位", desc: "来自其他模型的R1数据，有官方来源定位但未由本平台直接复核，不进入默认视图", tone: "bg-amber-100 text-amber-900" },
  E2: { label: "E2 已直接核对", desc: "本平台直接从官方来源读取（接口/网页/年鉴），并核对口径", tone: "bg-sky-100 text-sky-900" },
  E3: { label: "E3 独立交叉核验", desc: "E2 + 与另一份独立官方出版物逐点核对一致", tone: "bg-emerald-100 text-emerald-900" },
  E4: { label: "E4 冲突已裁决", desc: "存在冲突，已由官方正式修订公告等明确证据解决", tone: "bg-violet-100 text-violet-900" },
};
const DEC: Record<string, number> = { "万人": 0, "‰": 2, "%": 2, "亿元": 1, "元": 0, "人": 0, "所": 0, "个": 0, "人/千人": 2, "张/千人": 2, "万张": 2, "亿人次": 2, "立方米/人": 1, "万公里": 2, "倍": 2 };
export function fmt(v: number | null | undefined, unit?: string, d?: number): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const dd = d ?? (unit ? DEC[unit] ?? 2 : 2);
  return v.toLocaleString("zh-CN", { minimumFractionDigits: dd, maximumFractionDigits: dd });
}
export function citation(ind: Indicator): string {
  const d = (ind.source.retrieved_at || SITE.generated_at).slice(0, 10);
  return `国家统计局. ${ind.official_name_zh}. 国家数据 data.stats.gov.cn. 获取日期 ${d}. 经 China Data Atlas | 中国数据地图 R2 整理（方法版本 ${SITE.methodology_version}）.`;
}
export const isRate = (u: string) => ["%", "‰", "人/千人", "张/千人", "倍", "立方米/人"].includes(u);
