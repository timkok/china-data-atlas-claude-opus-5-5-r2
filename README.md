# China Data Atlas | 中国数据地图 — Round 2 · Claude Opus 5.5

Cross-model audit of 8 Round 1 datasets, an independent **canonical candidate** database (30,418 official observations, 42 indicators, E0–E4 evidence levels, data vintages), and an upgraded research product.

- Site: https://china-data-atlas-claude-opus-5-5-r2.vercel.app
- Repo (public): https://github.com/timkok/china-data-atlas-claude-opus-5-5-r2
- Reports: [DELIVERY_REPORT.md](DELIVERY_REPORT.md) · [R1_VS_R2.md](R1_VS_R2.md) · [audit/cross_model_audit.md](audit/cross_model_audit.md) · [LIMITATIONS.md](LIMITATIONS.md)

## Key files
| Path | What |
|---|---|
| `data/canonical_candidate/observations.csv` | canonical candidate (all rows; `publish_default=true` = public layer E2+) |
| `data/canonical_candidate/vintages.csv` | every known value per key with vintage (current / superseded) |
| `data/reconciliation/{conflicts,resolved_conflicts,unresolved_conflicts}.csv` | R1 differences, category, ruling, evidence |
| `data/metadata/indicator_crosswalk.csv`, `indicators.csv`, `regions.csv`, `sources.csv`, `data_dictionary.csv` | metadata |
| `data/processed/atlas.duckdb`, `observations.parquet` | queryable stores |
| `data/input_manifest/manifest.csv` | R1 inputs (Drive IDs + SHA-256; files not redistributed) |
| `audit/` | inventory, model comparison, findings, overlap matrix, audit narrative, reuse attribution |
| `research/` | product, map compliance, data sources, data rights |
| `pipeline/` | ingestion, reconciliation, transformations, validation, update |

## Reproduce
```bash
python3 pipeline/ingestion/fetch_nbs.py                 # uses data/raw/nbs_api_cache when present (polite, ≥1.2 s)
python3 pipeline/ingestion/parse_census2020.py
python3 pipeline/transformations/build_observations.py && python3 pipeline/validation/validate_samples.py && python3 pipeline/transformations/build_observations.py
python3 pipeline/validation/quality_checks.py
# R1 inputs must be placed in data/input_r1/<model>/ (see data/input_manifest/manifest.csv) for the next 3 steps
python3 pipeline/reconciliation/import_r1.py && python3 pipeline/reconciliation/compare.py && python3 pipeline/reconciliation/build_canonical.py
python3 pipeline/reconciliation/write_audit.py && python3 pipeline/update/simulate_update.py
python3 pipeline/transformations/export_metadata.py && python3 pipeline/transformations/export_site_data_r2.py
cd app && npm ci && NEXT_PUBLIC_SITE_URL=https://your-domain npm run build
python3 -m pytest tests/data tests/unit -q ; cd app && npm run test:e2e
```
Update workflow: `python3 pipeline/update/update_pipeline.py check` → review `data/staging/<run>/REVIEW.md` → `approve <run>` (adds a new vintage) → rebuild; `rollback <run>` restores the snapshot.
