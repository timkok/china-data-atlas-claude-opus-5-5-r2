# PRODUCT_RESEARCH — China Data Atlas | 中国数据地图

Research date: 2026-11-23/24 (America/New_York; server times in CST were 2026-11-24).
Researcher: Claude Opus 5.5 (claude-opus-5-5), Claude Code desktop app.

## 1. Pages actually visited

| # | URL | Visited | How | Notes |
|---|-----|---------|-----|-------|
| 1 | https://themapsdaily.com/ | 2026-11-23 | built-in browser, text + screenshot | Homepage, India edition |
| 2 | https://themapsdaily.com/posts/in-infant-mortality-rate | 2026-11-23 | built-in browser, text | Typical dataset page |
| 3 | https://ourworldindata.org/ | 2026-11-23 | curl (HTTP 200, 276 KB) | Homepage reachable |
| 4 | https://ourworldindata.org/grapher/population | 2026-11-23 | built-in browser, text + screenshot | Grapher chart page |
| 5 | https://data.stats.gov.cn/dg/website/page.html#/pc/national/home | 2026-11-23 | built-in browser | New NBS 国家数据 portal |
| 6 | https://data.stats.gov.cn/dg/website/page.html#/pc/national/fsYearData | 2026-11-23 | built-in browser + network inspection | 分省年度数据 query page |
| 7 | https://data.stats.gov.cn/easyquery.htm?m=QueryData&dbcode=fsnd... | 2026-11-23 | curl | **HTTP 403** — the legacy easyquery API is blocked; not used, not bypassed |
| 8 | https://www.stats.gov.cn/sj/ndsj/2025/indexch.htm (+ left.htm, table images) | 2026-11-23 | curl | 中国统计年鉴2025: tables are published only as JPG images |
| 9 | https://www.stats.gov.cn/sj/ndsj/2026/indexch.htm | 2026-11-23 | curl | **404** — Yearbook 2026 not yet online |

Pages not listed here were not studied and are not described.

## 2. Findings by research topic

| Topic | The Maps Daily (TMD) | Our World in Data (OWID) | NBS 国家数据 (data.stats.gov.cn) |
|---|---|---|---|
| 1. Homepage & IA | Strong value proposition ("Accessible / Understandable / Traceable / Citable"), search box first, topic chips with dataset counts, headline counters (datasets/topics/sources/datapoints) and a live featured chart. | Topic-led navigation ("Browse by topic", Data, Latest). | Portal for data professionals: menus by frequency (月度/季度/年度/普查/地区). No narrative, no "what's interesting" layer. |
| 2. Taxonomy | 20 topics, sub-topics with counts. | Deep topic pages. | Follows yearbook chapters (人口, 国民经济核算, 教育, 卫生...). Precise but bureaucratic. |
| 3. Discovery | Search + topic chips + "recently added". | Search + topic pages + related charts. | Tree navigation; a "查数" search. Users must know the official indicator name. |
| 4. Maps | State choropleth with "better/worse than national" colouring. | World choropleth as a grapher tab. | Has a map module (地图) — official source. |
| 5. Dataset page | Story in parts: How big → Where highest → How changed → Who moved most → Look up any state; then Data / Methodology / Cite / Related. Headline text is generated from data. | "What you should know about this indicator", sources, last updated, next expected update, date range, unit, related research. | Table view with indicator notes (指标解释) shown in a tooltip; no context. |
| 6. Trends | National line + "compare with a state". | Multi-entity line chart, timeline slider. | Line/bar chart toggle per query. |
| 7. Rankings | Top-5/bottom-5 + full table vs national, change vs previous year. | Table tab. | Sort in table only. |
| 8. CSV / Explorer | CSV of exactly the chart, "Data Explorer" with rows/columns count. | Download CSV with full metadata. | Download (Excel/CSV) of queried table. |
| 9. Sources / citation | Every page names publisher + release + coverage + unit + ready citation. | Rich source & processing description. | Authoritative but citation format must be built by the user. |
| 10. SEO / mobile | Server-rendered text, readable headlines. | Good SEO, grapher less pleasant on mobile. | SPA (hash routes) → nothing indexable; desktop-oriented. |
| 11. Updates | "Counts as of [date]". | "Last updated / next expected update". | Release calendar (发布日程) on homepage. |
| 12. Stories | Auto-generated factual headlines ("X has the highest…"). | Long-form research articles. | None. |

## 3. What to borrow / what's lacking / where to go further

**Worth borrowing (concepts, not code, copy or branding):**
- A dataset page that reads as a short sequence of questions (how big, where, how it changed, who moved), with data-generated sentences.
- Stating unit, coverage years, source table and "as of" dates directly next to every chart.
- A one-click citation and a CSV that equals what is on screen.
- OWID's "what you should know about this indicator" block → our 口径说明 box.

**Weaknesses observed:**
- TMD: national vs state year can silently differ; little explanation of definition breaks.
- OWID: aggregates are sums by default; heavy pages on mobile.
- NBS: no story layer, hash-routed SPA (not indexable), indicator names require statistical expertise, national vs provincial years and caliber notes (e.g. national population includes active military) are buried.

**Where China Data Atlas should be better:**
1. Show the national year and the provincial year side by side, always (“全国 2025 · 省级 2025”).
2. Per-value provenance: every cell in the explorer opens the exact NBS table path + API locator.
3. Caliber warnings in context (e.g. 65+ provincial values are sample-survey based; GDP latest year is preliminary; provinces don't sum to national).
4. Honest missing values: gaps shown as gaps, never interpolated.
5. Chinese-first, mobile-first, statically rendered pages (indexable).

## 4. Scope decisions

| Quick wins (done in R1) | Needs further investment |
|---|---|
| 12 core + 2 extension indicators from one official source with independent yearbook cross-check | Province statistical communiqués as second source for latest year |
| Static per-indicator pages with summary, ranking, trends, regional comparison, explorer, methodology | Compliant interactive province map (needs 审图号-approved base map — see LIMITATIONS) |
| CSV that equals the filtered table | Scatter / cross-indicator explorer, PNG/SVG export |
| Data-generated key findings | English UI, AI research assistant (V1.0) |

## 5. Map compliance research conclusion

Publishing maps of China requires an approved map (审图号) under the 《地图管理条例》; boundary data must come from a standard map source (e.g. 自然资源部标准地图服务 bzdt.ch.mnr.gov.cn, which provides static standard map images, not licensed GeoJSON for interactive recolouring). We could not confirm a source of province boundary geometry that is both lawfully licensed for interactive choropleth use and carries a valid 审图号. **Decision: no geographic map in R1.** We use a non-geographic *region matrix* (provinces grouped into the seven regions as equal tiles, explicitly labelled “不是地图”) plus ranked bar charts and ranking tables. This is a deliberate compliance choice, not a missing feature.
