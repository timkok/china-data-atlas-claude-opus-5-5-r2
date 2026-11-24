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
