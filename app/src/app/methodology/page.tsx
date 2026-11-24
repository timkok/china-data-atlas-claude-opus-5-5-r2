import type { Metadata } from "next";
import { INDICATORS, SITE, num } from "@/lib/data";
import { AGG_NOTE, CALIBER_BREAKS } from "@/lib/caliber";
export const metadata: Metadata = { title: "方法、来源与引用", description: "China Data Atlas 的数据来源、获取方式、转换规则、质量检查、独立核验、修订记录与推荐引用格式。", alternates: { canonical: "/methodology/" } };
const DICT: [string, string][] = [["indicator_id", "指标代码"], ["geo_code", "6位行政区划代码（000000=全国）"], ["geo_level", "national / province"], ["year", "统计年份（非发布年份）"], ["value", "数值；空=官方无数据（绝不填0）"], ["unit", "单位"], ["source_table", "官方表格路径"], ["source_locator", "接口参数或表格行列"], ["retrieved_at", "获取时间（ISO 8601, UTC）"], ["data_status", "final / preliminary / revised / unknown"], ["verification_status", "verified（逐点独立核验）/ partially_verified（该指标≥5个独立抽样全部一致或差异已解释）/ unverified"], ["transformation", "转换公式（v=官方原值）"]];
export default function Methodology() {
  return (
    <div className="wrap pt-8 max-w-4xl text-sm leading-7">
      <h1 className="text-2xl font-bold">方法、来源与引用</h1>
      <p className="text-[var(--muted)]">方法版本 {SITE.methodology_version} · 数据获取 {SITE.generated_at}</p>
      <section className="sec"><h2>1. 数据来源</h2>
        <ul className="list-disc pl-5">
          <li><b>R2 数据层</b>：本平台的规范候选库（canonical candidate）由本流程直接从官方来源读取的数据构成；另导入 8 个 Round 1 数据集逐条比较，差异按“四舍五入一致 / 单位差异 / 口径差异 / 官方修订 / 来源不可核 / 冲突”分类裁决，不多数投票、不取平均。见 <a className="underline" href="/quality/">数据质量</a>。</li>
          <li><b>主来源</b>：国家统计局“国家数据”数据库（data.stats.gov.cn）的“分省年度数据”与“年度数据”，通过网页本身使用的公开查询接口获取。不登录、不绕过验证码或访问控制，请求间隔≥1.2秒并本地缓存。旧版 easyquery 接口返回403，未使用。</li>
          <li><b>独立核验来源</b>：《中国统计年鉴2025》表格（官网仅以图片发布）、《2025年国民经济和社会发展统计公报》、《关于2024年国内生产总值最终核实的公告》、《第七次全国人口普查公报（第五号）》。</li>
          <li><b>补充来源</b>：城镇化率2015—2024年采用年鉴表2-6官方比重（人工转录，逐值用城镇人口/总人口校验）；65岁及以上占比2020年省级数据采用七普公报表5-2（程序解析官方网页表格）。</li>
        </ul></section>
      <section className="sec"><h2>2. 处理流程</h2>
        <p>官方来源 → 原始响应缓存（data/raw）→ 抽取 → 按指标配置计算与单位转换 → 质量门检查 → 标准化 observations.csv / DuckDB / Parquet → 静态 JSON → 网页图表。整条流程可由保留的原始证据离线重跑。自动更新只追加新缓存，人工转录与人工核验数据不会被自动覆盖。</p></section>
      <section className="sec"><h2>3. 指标口径与转换</h2>
        <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>指标</th><th>省级转换</th><th>地区汇总</th><th>口径变化</th></tr></thead>
          <tbody>{INDICATORS.map((i) => <tr key={i.id}><td><a className="underline" href={`/indicators/${i.id}/#methodology`}>{i.name_zh}</a>{!i.core && "（扩展）"}</td><td className="font-mono text-xs">{i.source.province_transformation ?? "—"}</td><td className="text-xs">{(AGG_NOTE[i.agg] ?? AGG_NOTE.none).slice(0, 30)}…</td><td className="text-xs">{(CALIBER_BREAKS[i.id] || []).map((b) => `${b.year} ${b.short}`).join("；") || "—"}</td></tr>)}</tbody></table></div>
        <ul className="list-disc pl-5 mt-3">
          <li>常住人口不是户籍人口；居民人均可支配收入不是消费支出；GDP为现价（名义）值，不提供实际增长率；高等教育在校生为普通、职业本专科，不含研究生和成人教育；床位为全部医疗卫生机构床位，不只是医院。</li>
          <li>全国总人口包括现役军人，分省数据不包括，因此31省之和比全国少约200万（2011年以后）；2010年及以前差距更大，因为分省数据未按普查回溯调整。</li>
          <li>各省GDP之和不等于全国GDP；本平台从不以省际加总代替全国值。</li>
          <li>同比变化只在相邻两年均有数据且该年无口径断点时显示。</li>
        </ul></section>
      <section className="sec" id="map"><h2>4. 关于地图</h2>
        <p>在中国公开展示地图需使用经审核的标准地图（审图号）。我们未能确认一份既带有效审图号、又许可用于交互式分区着色的省界几何数据，因此不绘制地理地图，也不使用来源不明的 GeoJSON。替代方案：排序条形图、排名表和按七大地区分组的“地区矩阵”（明确标注“非地图”）。</p></section>
      <section className="sec"><h2>5. 质量检查与独立核验</h2>
        <p>质量门检查数据类型、行政区划代码、年份、单位、唯一键、来源完整性、缺失值不为0、非负与比例范围、年际异常波动、全国与省级加总一致性（仅可加指标）等，当前 {num("qa_errors")} 个错误、{num("qa_warnings")} 类警告（已人工复核，均为真实统计现象，如2001—2003年高校扩招、2020年出生率骤降）。独立核验：以独立官方出版物逐点核对的数据点为 E3（{(SITE.stats.evidence as Record<string, number>).E3} 个），由正式修订公告裁决的为 E4（{(SITE.stats.evidence as Record<string, number>).E4} 个）。<a className="underline" href="/downloads/data_validation_samples.csv">下载核验样本</a> · <a className="underline" href="/downloads/coverage_matrix.csv">覆盖率矩阵</a></p></section>
      <section className="sec"><h2>6. 修订记录</h2>
        <ul className="list-disc pl-5"><li>2024年GDP与人均GDP：数据库为最终核实数（国家统计局2025-12-26公告），与《中国统计年鉴2025》刊载的初步核算数不同，状态标记为 revised。</li><li>2025年GDP与人均GDP为初步核算数（preliminary）。</li><li>每千人口执业（助理）医师：年鉴对2020年及以前年份使用普查前人口作分母；本平台统一使用当前修订后的常住人口，因此2020年及以前全国值低0.01—0.03。</li></ul></section>
      <section className="sec" id="dictionary"><h2>7. 数据字典（CSV 字段）</h2>
        <table className="tbl"><tbody>{DICT.map(([k, v]) => <tr key={k}><td className="font-mono">{k}</td><td>{v}</td></tr>)}</tbody></table></section>
      <section className="sec"><h2>8. 推荐引用</h2>
        <p className="bg-white border border-[var(--line)] rounded p-3">国家统计局.〔指标名称〕. 国家数据 data.stats.gov.cn. 获取日期 {SITE.generated_at.slice(0, 10)}. 经 China Data Atlas | 中国数据地图 整理（方法版本 {SITE.methodology_version}）.</p>
        <p className="text-xs text-[var(--muted)] mt-1">引用时请同时注明统计年份与原始来源；本站不是官方发布渠道。</p></section>
    </div>
  );
}
