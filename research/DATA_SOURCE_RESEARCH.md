# DATA_SOURCE_RESEARCH

| Source | Endpoint / URL | Method | Status | Used for |
|---|---|---|---|---|
| NBS 国家数据 (new portal) public JSON endpoints | `https://data.stats.gov.cn/dg/website/publicrelease/web/external/{new/queryIndexTreeAsync, new/queryIndicatorsByCid, stream/esData}` | anonymous GET/POST, same calls the public page makes; ≥1.2 s between requests; raw responses cached with URL/body/time (1,003 files) | **works, reproducible** (re-tested 2026-11-24, 704 series requests); no login, cookies or captcha; Python urllib stalls on the chunked stream endpoint → curl used | 42 indicators, 31 provinces + national, 2000–2025 |
| NBS legacy easyquery | `https://data.stats.gov.cn/easyquery.htm` | — | HTTP 403 (WAF) — **not used, not bypassed** | — |
| 中国统计年鉴2025 | `https://www.stats.gov.cn/sj/ndsj/2025/html/C??-??.jpg` | table images read visually; one manual transcription (table 2-6) with automated bound check | images only (no XLS) | independent verification (E3), urbanization 2015–2024 |
| 2025年统计公报 | https://www.stats.gov.cn/sj/zxfb/202602/t20260228_1962662.html | HTML | ok | E3 for national 2025 |
| GDP revision notices | 2025-12-26 (2024 final), 2024-12-27 (2023 revision), 2019-11-22 (2018 revision) | HTML | ok | E4 rulings |
| 第七次全国人口普查公报（第五号） | https://www.stats.gov.cn/sj/zxfb/202302/t20230203_1901085.html | HTML table parsed by script | ok | 65+ shares 2020 |
| Provincial 2025 communiqués | Beijing, Zhejiang, Shandong bureau sites | HTML | ok; **Henan bureau HTTP 403 → not used** | E3 for 2025 provincial GDP / income |
| Tianditu / MNR standard map | see MAP_COMPLIANCE_RESEARCH.md | — | unreachable from environment | — |

## Stability / maintenance risks
- The new portal is an SPA whose internal API may change without notice; catalogue IDs (cid) are opaque. Mitigation: `nbs_client.py` is the only adapter; discovery script lists the tree; update pipeline fails loudly (blocked rows) and never publishes automatically.
- Changing the set of IDs per catalogue changes the cache key (all affected series are re-fetched) — observed in R2 (≈20 min).
- Some series are already rounded in the database (per-10k physicians as integers; students in 万人, 2 decimals) → derive from counts or prefer exact-count tables.
- Incremental updates: `pipeline/update/update_pipeline.py check` re-queries the last 3 years of every series.

## Extending to other indicators
Any leaf in the 分省年度数据 (code 6) / 年度数据 (code 3) trees can be added by a config block (`config/indicators.json`) with `cid`, indicator `ids` (or `cid:id` for cross-catalogue formulas) and a formula. 30 extension indicators were added this way in R2.
