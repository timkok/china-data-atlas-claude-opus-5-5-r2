# China Data Atlas | 中国数据地图 — Claude Opus 5.5 · Round 1 (run 3)

**Make China's Data Accessible, Understandable, Traceable and Explorable.**

A real, traceable statistics product for mainland China's 31 provincial-level regions: 12 core indicators
(population, economy, education, health) + 2 extension indicators, 2000–2025, every value traceable to an official
National Bureau of Statistics (NBS) table, independently spot-checked against other official publications.

- Live site: https://china-data-atlas-claude-opus-5-5-r1-run3.vercel.app (also https://china-data-atlas-claude-opus-5-5-r1.vercel.app)
- Repository (public): https://github.com/timkok/china-data-atlas-claude-opus-5-5-r1-run3
- Delivery report: [DELIVERY_REPORT.md](DELIVERY_REPORT.md) · Limitations: [LIMITATIONS.md](LIMITATIONS.md) · Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)

## Layout
```
config/                 indicators.json (indicator config: sources, formulas, aggregation) · regions.json (codes, 7 regions)
pipeline/ingestion/     nbs_client.py (polite cached client) · fetch_nbs.py · parse_census2020.py · groups.py
pipeline/transformations/ build_observations.py · export_metadata.py · export_site_data.py (DuckDB/Parquet/site JSON)
pipeline/validation/    quality_checks.py · validate_samples.py · reference_values_yearbook2025.csv · compile_reports.py
data/raw/               nbs_api_cache/ (every API response, with URL/body/timestamp) · manual/ (auditable transcription) · evidence notes
data/normalized/        observations.csv  ← the unified comparison file
data/metadata/          indicators.csv · regions.csv · sources.csv · data_dictionary.csv
data/processed/         atlas.duckdb · observations.parquet
app/                    Next.js 16 static site (TypeScript, Tailwind v4, ECharts 5)
tests/                  data/ + unit/ (pytest) · e2e/ (Playwright: 20 functional checks + acceptance tasks A–J)
reports/                coverage_matrix.csv · data_validation_samples.csv · data_quality_report.json · browser_test_report*.json
                        acceptance_test_results.csv · source_access_log.csv · lighthouse-*.report.{html,json}
screenshots/            desktop 1440 / tablet 768 / mobile 390 + acceptance evidence
```

## Reproduce
Requirements: Python ≥3.11 (stdlib only; optional `duckdb`, `pytest`), Node ≥20, `curl`.
```bash
# 1) data (offline from the saved raw cache; delete data/raw/nbs_api_cache to re-fetch politely from NBS)
python3 pipeline/ingestion/fetch_nbs.py            # uses cache when present (≥1.2 s between live requests)
python3 pipeline/ingestion/parse_census2020.py      # needs data/raw/census2020/bulletin5.html (see data/raw/README.md)
python3 pipeline/transformations/build_observations.py
python3 pipeline/validation/validate_samples.py
python3 pipeline/transformations/build_observations.py   # second pass applies verification status
python3 pipeline/validation/quality_checks.py      # exit 1 on any ERROR
python3 pipeline/transformations/export_metadata.py
python3 pipeline/transformations/export_site_data.py
# 2) site
cd app && npm ci && NEXT_PUBLIC_SITE_URL=https://your-domain npm run build   # static export in app/out
# 3) tests
python3 -m pytest tests/data tests/unit -q
cd app && npx playwright install chromium && npm run test:e2e              # BASE_URL=https://… to test a deployment
```
Serve locally: `python3 -m http.server 4318 --directory app/out`.
