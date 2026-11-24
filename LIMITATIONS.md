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

## Product
- No geographic map (see research/MAP_COMPLIANCE_RESEARCH.md). No full English UI (data fields bilingual).
- Research Query Engine is rule-based (5 question templates), not an AI assistant.
- Interactive controls need JavaScript hydration; static HTML carries the key numbers for SEO/no-JS.
- Mainland-China network access and WeChat in-app browser **not verified**; mobile tested with Chromium emulation (Pixel 7, 390 px) only.
- Lighthouse indicator page: performance 94, best-practices 96 (font-size audit; source maps not shipped).

## Process / delivery
- First Vercel CLI deploy of the new project became that project's production (no existing deployment touched). Preview deployments are login-protected.
- R2 GitHub repo is private (data-rights review pending). Other models' R1 files are not redistributed (hashes + Drive IDs only).
