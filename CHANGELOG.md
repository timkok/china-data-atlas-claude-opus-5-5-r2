# CHANGELOG

## R1 (2026-11-23 → 2026-11-24) — methodology 1.0.0
- Research of The Maps Daily, Our World in Data, NBS 国家数据; legacy NBS API 403 documented.
- Pipeline: polite cached NBS client (curl), config-driven 14 indicators, cross-catalog formulas, manual-import template with bound check, census 2020 parser.
- Validation: 83 independent reference points (Yearbook 2025, 2025 communiqué, 2024 GDP final notice, census bulletin).
  Findings fixed during validation: physicians/1000 switched from integer per-10k to counts ÷ population; urbanization switched to official ratios for 2015–2024; disposable income limited to 2013+; GDP 2024 marked `revised`; 2020 census 65+ added.
- Site: static Next.js, indicator pages A–G, regions, explorer with CSV, methodology, sitemap.
- QA: Tailwind v4 arbitrary-value bug (`bg-[--ink]` ignored → white-on-white toggle) found by Lighthouse and fixed; contrast of region matrix tiles fixed; mobile tap targets enlarged.
- Deployment to new Vercel project `china-data-atlas-claude-opus-5-5-r1-run3`.
