# LIMITATIONS (R2)

## Data
1. Latest *complete* provincial year is 2024 for 31 of 42 indicators; 2025 for population, GDP, GDP per capita, primary/secondary/tertiary VA, disposable income (all/urban/rural), consumption, retail sales (as published by NBS on 2026-11-24).
2. Graduate students: NBS provincial database has no provincial series → national-only indicator; no broad “higher-education total” is produced.
3. Counts stored in the NBS database in 万人 (students, physicians, nurses) carry ±50-person rounding; exact-count yearbook tables were not systematically ingested.
4. 65+, 0–14, 15–64 provincial shares in non-census years come from the 1‰ sample survey (large error for small provinces); 2020 = census; 2000/2001/2010 provincial missing.
5. Forest coverage changes only per national forest inventory; repeated values across years are not independent observations.
6. Population-series back-revisions 2011–2019 (7th census) and 2001–2009 (6th census) are taken from the current database / Yearbook 2025; no stand-alone revision notice was located (marked “revision notice not located”).
7. Independent cross-checks (E3) cover 84 values; E4 (revision with notice) 764. Everything else is E2 (read directly from the official database, not independently re-checked).
8. One conflict remains unresolved (Codex, Shanghai 2016 disposable income 54,032 vs NBS 54,305).
9. Grok's R1 dataset could not be imported (ZIP 21.4 MB > 10 MB connector limit); the prompt's “125 physician records” difference was therefore not reproduced.

### R2.1 additions
10. Of the 40 indicators added in R2.1, 10 have independent yearbook checks (43 points, all matching); the other 30 are E2 only.
11. Registered urban unemployment ends in 2021 (official series discontinued); it is not the surveyed unemployment rate.
12. Provincial trade is by location of the trading enterprise and need not sum to the national customs total; USD values were not cross-checked (Yearbook table 11-8 is in RMB).
13. SO₂ (2011/2016 scope changes), medical-insurance enrolment (2016–2019 urban–rural merger) and life expectancy (census years only) carry the caliber breaks shown on their charts.
14. Minimum-living-allowance standards were evaluated and dropped (only 2009–2010 available in the database).
15. R2.1 replaced the R2 version on the production URL at the user's request (2026-11-26); evaluators comparing Round 2 snapshots should use the retained R2 deployment URL listed in deployment/DEPLOYMENT_INFO.md.

## Product
- No geographic map (see research/MAP_COMPLIANCE_RESEARCH.md). No full English UI (data fields bilingual).
- Research Query Engine is rule-based (5 question templates), not an AI assistant.
- Interactive controls need JavaScript hydration; static HTML carries the key numbers for SEO/no-JS.
- Mainland-China network access and WeChat in-app browser **not verified**; mobile tested with Chromium emulation (Pixel 7, 390 px) only.
- Lighthouse indicator page: performance 94, best-practices 96 (font-size audit; source maps not shipped).

## Process / delivery
- First Vercel CLI deploy of the new project became that project's production (no existing deployment touched). Preview deployments are login-protected.
- R2 GitHub repo was made public at the user's request (2026-11-26); data-rights status of the NBS statistics remains pending formal review. Other models' R1 files are not redistributed (hashes + Drive IDs only).
