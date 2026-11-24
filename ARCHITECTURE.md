# ARCHITECTURE

```
Official sources ──► Raw evidence ──► Extraction ──► Standardization ──► Validation ──► Versioned DB ──► Static data ──► Site
NBS 国家数据 API      data/raw/          build_          observations.csv   quality_checks   atlas.duckdb     app/src/data/   Next.js static
(分省年度/年度)       nbs_api_cache      observations    (+metadata CSVs)   validate_samples observations.   site.json +     export (56 HTML
Yearbook 2025 images  manual/, census                                       (independent      parquet          public/data/*.  pages), ECharts
Communiqué / notices  2020/                                                  official refs)                    json, CSVs
```

## Key decisions
| Decision | Why | Alternatives / migration |
|---|---|---|
| Primary source = NBS 国家数据 public JSON endpoints (`/dg/website/publicrelease/web/external/*`) | Structured, official, covers 31 provinces 2000–2025 in one place (source priority #1). Same anonymous calls the public page makes. Legacy `easyquery.htm` returns 403 → not used. | If endpoints change: `nbs_client.py` is the only adapter; yearbook transcription template exists as fallback. |
| `curl` subprocess for HTTP | Python urllib stalled ~25 s per call on the chunked `stream/esData` endpoint; curl returns in ~1–2 s. | requests/httpx would also work. |
| Config-driven indicators (`config/indicators.json`) | One page component for all indicators; adding an indicator = adding a config block (formula over named official ids, `cid:id` for cross-catalog). | — |
| Derived values only from official components | e.g. physicians/1000 = official physician count ÷ official resident population (the API's per-10k figure is integer-rounded). | Formula + original values are stored in every row. |
| Manual import only where no machine-readable source exists | Urbanization 2015–2024 (yearbook table is an image). Each transcribed value is bound-checked against u/t. | Automated updates never overwrite manual rows. |
| Static export (Next.js `output: "export"`) | No server, no runtime scraping, cheap/free hosting, fully indexable HTML, works if the user's computer is off. | Move to SSR/ISR + PostgreSQL (`observations` schema is table-ready; DuckDB file mirrors it). |
| No geographic map | Could not confirm a boundary dataset with valid 审图号 licensed for interactive choropleth. | Ranked bars + 7-region matrix (labelled “not a map”). |
| ECharts (core build, SVG renderer) | Required by spec; SVG keeps text crisp and accessible. | — |

## Data model (`observations.csv`)
Unique key `(indicator_id, geo_code, year)`; `value` empty for missing; `data_status` ∈ final/preliminary/revised/unknown;
`verification_status` ∈ verified/partially_verified/unverified; `original_value` + `transformation` allow exact re-derivation.
Revisions: the database always serves the latest vintage; when it differs from an earlier publication the row is marked
`revised` and the difference is recorded in `reports/data_validation_samples.csv` (no silent overwrite). Versioning:
`methodology_version` in config + `dataset_version` table in DuckDB + git history of the CSV.

## Front end
`app/src/lib/data.ts` (types, formatting, citation) · `components/` RankingSection (ranking table, bar chart, region matrix,
ties = competition ranking, missing excluded), TrendSection (multi-province, year range, gaps not interpolated, caliber-break
markers), RegionalSection (7-region aggregation with per-indicator rule: sum / population-weighted / none), DataTable
(multi-indicator explorer, CSV = filtered rows, per-row provenance dialog), Search (indicators + provinces, keyboard).
Pages: `/`, `/indicators/`, `/indicators/[id]/` (A–G sections), `/regions/`, `/regions/[code]/`, `/explorer/`, `/methodology/`, `/about/`, sitemap, robots.

## Dependencies (pinned in lockfiles)
Next 16.4.6 · React 19.3 · Tailwind 4.3.3 · ECharts 5.6 · @playwright/test 1.60.0 · Python 3.14 stdlib · duckdb 1.x (optional) · pytest 8.4.2.
