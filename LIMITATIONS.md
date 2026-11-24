# LIMITATIONS (honest list)

## Data
1. **Latest provincial year differs by indicator**: 2025 for population, GDP, GDP per capita, disposable income, retail sales; 2024 for the rest (yearbook-based statistics for 2025 not yet released on 2026-11-24). National values exist for 2025 for most indicators.
2. **65+ share** — provincial values in non-census years are computed from the annual 1‰ population sample survey (sample counts), small provinces (Tibet, Qinghai, Ningxia) have large sampling error; 2020 uses the 7th census bulletin (different caliber); 2000/2001/2010/2025 provincial values are not available from the sources used.
3. **Urbanization** — 2015–2024 are official ratios hand-transcribed from Yearbook 2025 table 2-6 (bound-checked); 2005–2014 and national 2000–2004/2025 are computed from 万人-rounded counts (±≤0.2 pp for small provinces). Provincial 2025 urban population was not yet published.
4. **Physicians per 1,000** — computed with the current (post-7th-census revised) resident population; Yearbook values for ≤2020 use pre-revision population and are 0.01–0.03 higher nationally. Documented, not hidden.
5. **GDP** — 2025 values are preliminary; 2024 values are final-verified (differ from the Yearbook 2025 preliminary figures; NBS notice of 2025-12-26 confirms the national revision; provincial revisions not individually confirmed by a second source).
6. **Disposable income** starts in 2013 (integrated household survey); earlier values in the database are a different/back-estimated caliber and are excluded.
7. **Hospital beds per 1,000** — provincial series effectively starts 2008 (2009 missing in the database).
8. **Verification depth** — 72 values individually verified against independent official publications (≥5 for every core indicator); 7,085 more are `partially_verified` (indicator-level). Provincial 2025 values were not checked against provincial communiqués (only news reprints found; not used as evidence).
9. **Publication dates** are blank in many rows: the database does not state per-value publication dates; we do not guess.

## Licensing / redistribution
- Data authenticity: verified as described. Legal access: public pages/endpoints, no login, no captcha, rate-limited.
- Redistribution: no explicit open-data licence was found for the NBS database. Statistical values are shown with attribution for research/citation; **status = pending review**. Yearbook images (© 中国统计出版社) and copies of web pages are kept only as local evidence (excluded from git and the public site; included in the private Drive delivery as evidence).
- The GitHub repository was made public at the user's request (2026-11-24). It contains the derived dataset and raw NBS API responses (official statistics with attribution) but no yearbook images or copied web pages. Redistribution status remains pending review.

## Product
- No geographic map (compliance; see methodology). No English UI yet (data fields are bilingual). No scatter/cross-indicator chart or PNG/SVG export yet.
- Interactive controls work after JavaScript hydration; on slow networks a tap made before hydration does nothing (observed once in testing on the deployed site).
- Mainland-China network access and WeChat in-app browser compatibility were **not** verified. Mobile tested only in Chromium mobile emulation (390 px).
- Deployment: Vercel CLI made the first deploy of this new project its Production deployment (no pre-existing production was touched); Preview deployments are protected by Vercel Authentication (HTTP 302 for anonymous users), so the public, tested URL is the project's production domain.
