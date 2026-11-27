# CHANGELOG

## R1 (2026-11-23 → 2026-11-24) — methodology 1.0.0
- Research of The Maps Daily, Our World in Data, NBS 国家数据; legacy NBS API 403 documented.
- Pipeline: polite cached NBS client (curl), config-driven 14 indicators, cross-catalog formulas, manual-import template with bound check, census 2020 parser.
- Validation: 83 independent reference points (Yearbook 2025, 2025 communiqué, 2024 GDP final notice, census bulletin).
  Findings fixed during validation: physicians/1000 switched from integer per-10k to counts ÷ population; urbanization switched to official ratios for 2015–2024; disposable income limited to 2013+; GDP 2024 marked `revised`; 2020 census 65+ added.
- Site: static Next.js, indicator pages A–G, regions, explorer with CSV, methodology, sitemap.
- QA: Tailwind v4 arbitrary-value bug (`bg-[--ink]` ignored → white-on-white toggle) found by Lighthouse and fixed; contrast of region matrix tiles fixed; mobile tap targets enlarged.
- Deployment to new Vercel project `china-data-atlas-claude-opus-5-5-r1-run3`.

## R2 (2026-11-24) — methodology 2.0.0
- Audit: inventoried 10 R1 folders; imported 8 datasets (32,209 rows, 11,527 keys); 19 findings (1 P0, 3 P1 confirmed …); data overlap matrix.
- Reconciliation: 4,247 differences classified (rounding 2,051; revision 1,780; non-verifiable source 254; definition 150; conflicting 12 → 11 resolved by independent official publication, 1 unresolved). No majority voting, no averaging.
- Canonical candidate: observation + source + vintage layers; E0–E4 evidence levels separate from extraction method; DuckDB/Parquet; R1-only values kept as E1/E0 outside default view.
- Data: +30 extension indicators (42 total), all from NBS endpoints; pre-2013 income back-estimates restored with separate methodology_version; 9 more yearbook reference points (E3 = 84).
- Product: indicator detail engine (quality card, distribution/outliers, key changes, change-rate & log, versions & conflicts), province pages, province comparison, cross-indicator Explorer (scatter/bubble/correlation/CAGR/index, CSV/PNG/SVG/share), 6 data stories, Research Query Engine, quality page, map-compliance page + adapter.
- Update pipeline with simulation (9/9 checks) and weekly GitHub Actions check (review-only).
- Fixes found by tests/Lighthouse: mobile Escape did not close source dialog; compare-page CLS 0.43→0; heading order; tap targets.

## R2.1 (2026-11-26) — methodology 2.1.0 — data expansion
- Data: +40 official NBS indicators (82 total), each with 31 provinces + national: real GDP growth, CPI inflation, average wage, real wage growth, registered unemployment, FAI growth, housing price/sales, goods trade & exports (USD), agricultural output, grain, international tourism receipts, insurance premiums, life expectancy, patents (total/invention/per 10k), technology market, broadband, express delivery, health technicians per 10k, pupil–teacher ratio, higher-ed per 100k, fiscal education funding, medical-insurance and pension enrolment, museums & visits, library holdings per capita, electricity, water resources, SO₂, waste treatment, urban green coverage, daily water use, vehicles, private cars (+ per 1,000), freight. New topics: 就业、工资与物价 / 科技与数字 / 社会保障与文化.
- Province ↔ national tables paired by name and reviewed by hand (5 wrong automatic pairings corrected). 1,823 polite API requests, all cached.
- Dropped after evaluation: urban/rural minimum-living-allowance standards (only 2009–2010 in the database).
- Verification: 43 new Yearbook 2025 reference points (9 tables, image SHA-256 in `data/raw/nbs_yearbook_2025/SHA256SUMS`), 43/43 within tolerance. E3 84 → 127.
- Existing 42 indicators: all 33,344 values unchanged (only `methodology_version` and `retrieved_at` updated).
- QA: growth-rate indicators may be negative (quality check + unit test updated).
- Stories: +3 (wage vs housing price, invention-patent geography, private cars per 1,000) → 9.
- Performance: per-indicator detail (ranking, moves, findings, distribution) moved from the client bundle to build-time `site-detail.json`; `site.json` 186 KB → 148 KB despite 2× indicators. Lighthouse mobile (local, gzip): home 94/100/100/100, new indicator page 93/100/100/100, new story 95/100/100/100 (story back-link tap target fixed).
- Tests: pytest 43/43 (9 new), Playwright 62 passed + 1 intentional skip (5 new).
- Deployment: new Vercel **Preview** only; R2 production untouched.
- Promoted to production at the user's request (previous R2 deployment retained for rollback). Live verification: Playwright 62 passed + 1 intentional skip; Lighthouse mobile live 96 / 94 / 98 performance, 100 accessibility, best-practices and SEO. Live run found an empty-CSV race in the explorer; fixed (button disabled until data loads).

