# DELIVERY_REPORT — China Data Atlas | 中国数据地图 · Round 1

## 1. Model
**Claude Opus 5.5**, model ID **claude-opus-5-5** (stated by the runtime configuration), running in Claude Code (Claude desktop app) on macOS. Run id `china-data-atlas-claude-opus-5-5-r1-run3-20261124` (an earlier run by the same model exists in a separate Drive folder; it was not opened or reused).

## 2–5. Links
| | URL |
|---|---|
| Google Drive folder | https://drive.google.com/drive/folders/1vGwrABTN7SaRX31Fet0A8ekE6MmTPUfd |
| GitHub repository (public) | https://github.com/timkok/china-data-atlas-claude-opus-5-5-r1-run3 |
| Pull request | https://github.com/timkok/china-data-atlas-claude-opus-5-5-r1-run3/pull/1 |
| Live site (public, tested) | https://china-data-atlas-claude-opus-5-5-r1-run3.vercel.app |
| Vercel preview (login-protected) | https://china-data-atlas-claude-opus-5-5-r1-run3-2uz6shdnv.vercel.app |

## 6–8. Indicators (12 core + 2 extension)
Columns: years = first year with any value (national or provincial) — latest provincial year; independent checks = individually matched / total reference points (see `reports/data_validation_samples.csv`).

| id | 指标 | type | unit | years | latest prov. year | latest national | valid obs. | independent checks | official table |
|---|---|---|---|---|---|---|---|---|---|
| population | 年末常住人口 | 核心 | 万人 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 8/8 | 年末常住人口 |
| birth_rate | 人口出生率 | 核心 | ‰ | 2000—2024 | 2024 (31/31) | 2025 | 799 | 7/7 | 人口出生率 |
| urbanization_rate | 常住人口城镇化率 | 核心 | % | 2000—2024 | 2024 (31/31) | 2025 | 646 | 7/7 | 城镇人口 / 年末常住人口 |
| population_65plus | 65岁及以上人口占比 | 核心 | % | 2000—2024 | 2024 (31/31) | 2025 | 708 | 8/8 | 人口年龄构成和抚养比 |
| gdp | 地区生产总值（现价） | 核心 | 亿元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 5/10 | 地区生产总值 |
| gdp_per_capita | 人均地区生产总值（现价） | 核心 | 元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 3/8 | 人均地区生产总值 |
| disposable_income | 居民人均可支配收入 | 核心 | 元 | 2013—2025 | 2025 (31/31) | 2025 | 416 | 8/8 | 居民人均可支配收入 |
| retail_sales | 社会消费品零售总额 | 核心 | 亿元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 7/7 | 社会消费品零售总额 |
| higher_education_students | 普通高等教育本专科在校生数 | 核心 | 人 | 2000—2024 | 2024 (31/31) | 2025 | 801 | 7/7 | 普通、职业高等学校和普通、职业本专科学生情况 |
| higher_education_institutions | 普通高等学校数量 | 核心 | 所 | 2000—2024 | 2024 (31/31) | 2024 | 800 | 6/6 | 普通、职业高等学校和普通、职业本专科学生情况 |
| physicians_per_1000 | 每千人口执业（助理）医师数 | 核心 | 人/千人 | 2000—2024 | 2024 (31/31) | 2025 | 801 | 6/7 | 年末常住人口 |
| hospital_beds_per_1000 | 每千人口医疗卫生机构床位数 | 核心 | 张/千人 | 2002—2024 | 2024 (31/31) | 2024 | 519 | 6/6 | 每万人口医疗卫生机构床位数 |
| death_rate | 人口死亡率（扩展） | 扩展 | ‰ | 2000—2024 | 2024 (31/31) | 2025 | 799 | 0/0 | 人口死亡率 |
| natural_growth_rate | 人口自然增长率（扩展） | 扩展 | ‰ | 2000—2024 | 2024 (31/31) | 2025 | 799 | 0/0 | 人口自然增长率 |

Caliber notes: resident (常住) not registered population; disposable income ≠ consumption; GDP current prices (no real growth shown); students = 普通、职业本专科 (no postgraduates/adult/online); beds = all medical & health institutions. Provincial series start later than national for urbanization (2005), 65+ (2002, gaps 2010 & 2025), beds (2008). Details: [LIMITATIONS.md](LIMITATIONS.md), `reports/coverage_matrix.csv`.

**Core indicators available: 12/12. Latest-year provincial coverage: 31/31 for all 12. Continuity since 2015: 100 % of years complete for all 12.** Extension indicators (death rate, natural growth rate) are flagged and not counted.

## 9. Data integrity & quality
- 10,416 valid observations (8,818 core) · 0 missing values filled · 688 explicit empty rows kept as missing.
- Quality gate (`reports/data_quality_report.json`): **0 errors**, 2 warning classes reviewed: year-on-year outliers (real: 2001–03 HE expansion, 2010 census, 2020 birth drop, Shanghai 2015 1 % survey) and the national–provincial population gap (active military; larger before 2011 because provincial data were not back-revised).
- Independent verification: 89 reference points from 7 official publications → **78 exact/within-rounding matches**, 10 GDP/GDP-pc 2024 differences explained by NBS final verification (confirmed nationally by NBS notice 2025-12-26), 1 explained denominator-vintage difference, **0 unexplained**. 78 rows `verified`, 7,911 `partially_verified`.
- Problems found by verification and fixed: physician ratio precision, urbanization rounding (switched to official ratios), pre-2013 income caliber, missing 2020 census 65+ data.

## 10. Product features
Home (value proposition, search, 4 categories, interactive feature chart, data-generated findings, latest-year table, trust/coverage stats, explorer entry); indicator pages `/indicators/[id]/` with A Summary (national value + year, provincial year, comparable YoY only, coverage, findings), B/D distribution & ranking (bar chart, competition ranking with ties, rank change, national baseline, region filter, asc/desc, 7-region matrix labelled “not a map”, explicit no-data state), C trends (multi-province, year range, gaps not interpolated, caliber-break markers, value/index mode labelled derived), E regional comparison (sum / population-weighted / none per indicator, multi-province bar), F data table (search, sort, filters, per-row provenance dialog, CSV = filtered rows), G methodology & citation; region pages (all indicators + rank for a province); data explorer (multi-indicator); methodology; about; sitemap/robots/canonical/OG.

## 11. Browser tests (Playwright 1.60, Chromium)
| Run | Passed | Failed | Skipped |
|---|---|---|---|
| Local static build | 36 | 0 | 1 (Task H is mobile-only) |
| Deployed public URL | 36 | 0 | 1 (same) |
Covers the 20 required checks (home, search, direct URL, year switch, province select, region filter, multi-province trend, ranking correctness vs CSV, chart table vs data, CSV download content, no-data state, negatives & ties, source links, console errors, 1440/768/390 layouts, horizontal overflow, keyboard, refresh, static assets, performance) + SEO HTML checks. Data/unit tests (pytest): 16 passed. Lighthouse 12 mobile (public URL) — performance/accessibility/best-practices/SEO: home 98/100/100/100; indicator 96/100/100/100; explorer 97/100/100/100.

## 12. Acceptance tasks (deployed site; also pass locally) — `reports/acceptance_test_results.csv`
| Task | Result | Clicks | Data year |
|---|---|---|---|
| A Guangdong population + source | Pass | 2 | 2025 |
| B JS/ZJ/GD population since 2015 | Pass | 2 | 2015–2025 |
| C 2020 65+ ranking, census caliber | Pass | 2 | 2020 (census) |
| D latest provincial GDP per capita | Pass | 1 | 2025 (preliminary, current prices) |
| E SD/HN/GD disposable income | Pass | 1 | 2025 |
| F physicians per 1,000 ranking | Pass | 1 | 2024 |
| G filtered CSV vs page | Pass | 5 | 2023–2025 |
| H mobile search/year/source | Pass (Chromium 390 px emulation; no real phone / WeChat) | 4 | 2020 |
| I year without data | Pass | 3 | 2005 |
| J value → official table | Pass | 2 | 2025 |

## 13. Screenshots
`screenshots/homepage-{desktop,tablet,mobile}.png`, `indicator-*.png`, `data-explorer-*.png`, `acceptance-*.png` — all produced by the actual test runs.

## 14. Map compliance
No geographic map. No boundary dataset with a confirmed 审图号 and licence for interactive recolouring was found; unverified GeoJSON was not used. Replacement: ranked bars, ranking tables and a 7-region tile matrix labelled as non-geographic.

## 15. Redistribution
Authenticity: verified. Legal access: yes (public pages/endpoints, no login/captcha bypass, ≥1.2 s rate limit, cache; legacy API 403 and Henan bureau 403 not circumvented). Redistribution licence: **not confirmed → pending review**. Site shows statistics with attribution; yearbook images and page copies are not in git or on the site (private Drive evidence only). GitHub repo made public at the user's request (2026-11-24); it contains the derived dataset and raw NBS API responses, but no yearbook images or copied web pages.

## 16. Architecture, dependencies, how to run
See [ARCHITECTURE.md](ARCHITECTURE.md) and [README.md](README.md). Python stdlib pipeline (+duckdb, pytest), Next.js 16 static export, ECharts 5, Tailwind 4, Playwright 1.60.

## 17. Problems met and how they were solved
1. New NBS portal is an SPA; legacy API 403 → discovered the page's own public JSON endpoints via browser network inspection.
2. Python urllib hung ~25 s per streaming request → switched to curl subprocess (380 requests in ~8 min).
3. Yearbook tables only as images → read images for independent verification; one hand transcription (urbanization) with automated bound checks.
4. Validation exposed precision/caliber problems (see §9) → fixed at source.
5. Tailwind v4 `bg-[--var]` silently ignored → white-on-white toggle found by Lighthouse; fixed project-wide.
6. Vercel: first deploy became production of the new project; preview protected; deploy “Blocked” inside git repo; alias pinning → documented in deployment/DEPLOYMENT_INFO.md.

## 18. Not done
English UI; scatter/cross-indicator analysis, PNG/SVG export, share links (V0.5); geographic map; provincial 2025 communiqué checks for all provinces; WeChat / mainland-network verification; GDP-per-capita still only 3 individually confirmed points.

## 19. Next priorities
1) Add provincial communiqué parsers for the latest year (second source for every province). 2) V0.5 cross-indicator explorer (scatter, CAGR) on the existing DuckDB. 3) English UI. 4) Obtain a compliant standard base map or keep the matrix. 5) Scheduled GitHub Action that re-fetches, diffs and opens a PR (never auto-overwrites manual/verified rows).

## 20. Resources
Wall-clock ≈ 4 h of active work across two sessions (a usage limit interrupted the first). ≈ 400 NBS API requests, 21 other official pages. Token/cost figures are not available to the model.

## Strict status classification
| Status | Items |
|---|---|
| Implemented & Verified | Data pipeline, 12 core indicators, validation samples, quality gate, all site sections, CSV export, search, acceptance A–J, deployment, Lighthouse |
| Implemented but Not Verified | Mainland-China access, WeChat browser, real-device mobile |
| Partially Implemented | Independent verification depth for GDP per capita (3 points); bilingual (data bilingual, UI Chinese only) |
| Not Implemented | V0.5 scatter/export/share links; English UI |
| Blocked by Environment | Henan communiqué (403); NBS legacy API (403); Yearbook 2026 not yet published |
| Out of Scope | V1.0 AI assistant; geographic map (compliance) |

## If only three outcomes could be kept
1. **`data/normalized/observations.csv` + raw API cache + pipeline** — every number reproducible from saved official responses, with formula and original value per row.
2. **`reports/data_validation_samples.csv`** — independent evidence that the numbers are right, including the documented revisions; this is what makes the dataset citable.
3. **The indicator page template** — one config-driven page that shows year, caliber, source and missingness honestly for any new indicator.

## Next round
Keep: data model, provenance UI, validation approach, static architecture. Improve: verification breadth (provincial latest-year sources), cross-indicator analysis, English. Redesign: the update workflow (scheduled fetch → diff → PR review) and a compliant map strategy.
