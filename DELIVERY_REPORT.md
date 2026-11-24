# DELIVERY_REPORT — China Data Atlas Round 2 · Claude Opus 5.5 (claude-opus-5-5)

## A. Executive summary
**Completed**: cross-model audit of all accessible R1 deliveries (10 folders inventoried, 8 datasets imported, 32,209 source rows / 11,527 keys compared record-by-record); an independent canonical candidate (30,418 published official observations, 12 core + 30 extension indicators, 2000–2025, E0–E4 evidence, vintage table); a substantially upgraded site (detail engine, province pages & comparison, cross-indicator Explorer, 6 data stories, Research Query Engine, quality/conflict views); an update pipeline with a passing simulation; 146 automated tests passed (0 failed), acceptance A–T 20/20 on the live site; deployed to a new Vercel project.

**Five most important new findings**
1. Of 4,247 cross-model value differences, **only 12 were real conflicts**; 2,051 are official rounding, 1,780 official revisions (economic/population census back-revisions, GDP final verification), 254 non-official sources, 150 definition differences. 11 of the 12 are settled by an independent official publication; 1 is unresolved.
2. **Gemini (MVU) sources 541 values from Wikipedia** (GDP, GDP per capita, population) and its 2024 provincial retail values contradict Yearbook 2025 (Zhejiang 33,900 vs 37,707.7).
3. **Gemini 4 Neon labels all 9,110 rows “verified”** with 60 independent checks; its values match the NBS database (99.4% identical to this project's extraction), which is shared provenance, not independent verification.
4. **Codex GPT-6 mixes first-release and revised vintages** in GDP/retail series (2023 GDP 1,260,582 vs revised 1,294,272 per NBS notice 2024-12-27), distorting growth (7.0% vs 4.2%).
5. **Own R1** lost precision on 万人-based counts and deleted 288 official 2000–2012 income back-estimates; both corrected.

**Substantive improvements vs R1**: 3× published observations (10,416 → 30,418), 14 → 42 indicators, evidence levels that no longer inflate unsampled records, data vintages with official revision evidence, cross-model reconciliation, research tools (scatter/correlation/CAGR, comparison, stories, query engine), update pipeline.
**Open core issues**: no geographic map; latest complete provincial year mostly 2024; mainland/WeChat unverified; Grok dataset not importable.

## B. Round 1 model comparison
| Question | Answer (evidence) |
|---|---|
| Best data acquisition | NBS new-portal public endpoints — used by Grok (self-reported), Gemini 4 Neon and this project; reproducible, covers 31 provinces × 2000–2025 (research/DATA_SOURCE_RESEARCH.md). |
| Best data verification | Claude run 3 / Grok style: explicit independent samples against other official publications, labelled separately (Grok 122 samples, Claude run3 83+). Gemini 4 Neon's blanket "verified" is not acceptable. |
| Best raw-evidence preservation | Claude first run (cell locators, file hashes, double OCR) and GPT-6 Astra (evidence_file per row); Claude run3/R2 (1,003 hashed API responses). |
| Best software architecture | Static Next.js + config-driven indicator engine (Claude run3 → R2); Gemini 4 Neon comparable. |
| Best product experience | Gemini 4 Neon homepage matrix; Codex editorial typography; R2 detail engine + Explorer (this run). |
| Into the final version | NBS endpoint ingestion + raw hashing; E0–E4 + vintages + reconciliation rules; per-row evidence pointers; detail engine; region-matrix interaction; exact-count yearbook tables once vintage-normalised. |
Details: `audit/cross_model_audit.md`, `audit/model_comparison.csv`, `audit/findings.csv`.

## C. Data reconciliation report
| Item | Value |
|---|---|
| R1 datasets imported | 8 (Grok unavailable; Codex-MVU had no data) |
| Source rows / distinct keys | 32,209 / 11,527 |
| Key classes (raw, before rules) | exact 6,751 · within rounding 739 · single model 2,389 · conflicting 1,648 |
| Classified differences vs canonical | 4,247: rounding 2,051 · official revision 1,780 · source not verifiable 254 · definition 150 · conflicting 12 |
| Resolved / unresolved | 4,246 / 1 |
| Vintages | 32,198 rows: 30,418 current + 1,780 superseded earlier-publication values |
| Canonical candidate | 30,550 rows: E2 29,570 · E3 84 · E4 764 (published 30,418) · E1 101 · E0 31 (not published) |
| Rules | latest officially verified value; earlier vintages kept; no majority vote / averaging / splicing different calibers; unreliable data excluded from default view |

### Indicators
| id | 指标 | 类 | 单位 | 年份 | 完整省级最新 | 全国最新 | 观测 | E2/E3/E4 | 冲突(未决) |
|---|---|---|---|---|---|---|---|---|---|
| population | 年末常住人口 | 核心 | 万人 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 824/8/0 | 134 (0) |
| birth_rate | 人口出生率 | 核心 | ‰ | 2000—2024 | 2024 (31/31) | 2025 | 799 | 792/7/0 | 39 (0) |
| urbanization_rate | 常住人口城镇化率 | 核心 | % | 2000—2024 | 2024 (31/31) | 2025 | 646 | 639/7/0 | 362 (0) |
| population_65plus | 65岁及以上人口占比 | 核心 | % | 2000—2024 | 2024 (31/31) | 2025 | 708 | 699/9/0 | 80 (0) |
| gdp | 地区生产总值（现价） | 核心 | 亿元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 508/4/320 | 759 (0) |
| gdp_per_capita | 人均地区生产总值（现价） | 核心 | 元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 385/3/444 | 852 (0) |
| disposable_income | 居民人均可支配收入 | 核心 | 元 | 2000—2025 | 2025 (31/31) | 2025 | 708 | 700/8/0 | 291 (1) |
| retail_sales | 社会消费品零售总额 | 核心 | 亿元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 821/11/0 | 312 (0) |
| higher_education_students | 普通高等教育本专科在校生数 | 核心 | 人 | 2000—2024 | 2024 (31/31) | 2025 | 801 | 794/7/0 | 978 (0) |
| higher_education_institutions | 普通高等学校数量 | 核心 | 所 | 2000—2024 | 2024 (31/31) | 2024 | 800 | 794/6/0 | 1 (0) |
| physicians_per_1000 | 每千人口执业（助理）医师数 | 核心 | 人/千人 | 2000—2024 | 2024 (31/31) | 2025 | 801 | 794/7/0 | 122 (0) |
| hospital_beds_per_1000 | 每千人口医疗卫生机构床位数 | 核心 | 张/千人 | 2002—2024 | 2024 (31/31) | 2024 | 519 | 512/7/0 | 17 (0) |
| death_rate | 人口死亡率（扩展） | 扩展 | ‰ | 2000—2024 | 2024 (31/31) | 2025 | 799 | 799/0/0 | 0 (0) |
| natural_growth_rate | 人口自然增长率（扩展） | 扩展 | ‰ | 2000—2024 | 2024 (31/31) | 2025 | 799 | 799/0/0 | 5 (0) |
| urban_population | 城镇人口 | 扩展 | 万人 | 2000—2024 | 2024 (31/31) | 2025 | 646 | 646/0/0 | 0 (0) |
| rural_population | 乡村人口 | 扩展 | 万人 | 2000—2024 | 2024 (31/31) | 2025 | 646 | 646/0/0 | 0 (0) |
| population_0_14 | 0—14岁人口占比 | 扩展 | % | 2000—2024 | 2024 (31/31) | 2025 | 677 | 677/0/0 | 0 (0) |
| population_15_64 | 15—64岁人口占比 | 扩展 | % | 2000—2024 | 2024 (31/31) | 2025 | 677 | 677/0/0 | 0 (0) |
| old_age_dependency | 老年人口抚养比 | 扩展 | % | 2000—2024 | 2024 (31/31) | 2025 | 677 | 677/0/0 | 0 (0) |
| primary_industry_va | 第一产业增加值 | 扩展 | 亿元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 832/0/0 | 0 (0) |
| secondary_industry_va | 第二产业增加值 | 扩展 | 亿元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 832/0/0 | 0 (0) |
| tertiary_industry_va | 第三产业增加值 | 扩展 | 亿元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 832/0/0 | 0 (0) |
| tertiary_share | 第三产业占GDP比重 | 扩展 | % | 2000—2025 | 2025 (31/31) | 2025 | 832 | 832/0/0 | 0 (0) |
| consumption_expenditure_per_capita | 居民人均消费支出 | 扩展 | 元 | 2000—2025 | 2025 (31/31) | 2025 | 708 | 708/0/0 | 295 (0) |
| urban_disposable_income | 城镇居民人均可支配收入 | 扩展 | 元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 832/0/0 | 0 (0) |
| rural_disposable_income | 农村居民人均可支配收入 | 扩展 | 元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 832/0/0 | 0 (0) |
| urban_rural_income_ratio | 城乡居民收入比 | 扩展 | 倍 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 832/0/0 | 0 (0) |
| local_budget_revenue | 地方一般公共预算收入 | 扩展 | 亿元 | 2000—2025 | 2025 (31/31) | — | 806 | 806/0/0 | 0 (0) |
| local_budget_expenditure | 地方一般公共预算支出 | 扩展 | 亿元 | 2000—2025 | 2025 (31/31) | 2025 | 832 | 832/0/0 | 0 (0) |
| high_school_students | 普通高中在校生 | 扩展 | 人 | 2000—2024 | 2024 (31/31) | 2025 | 801 | 801/0/0 | 0 (0) |
| junior_secondary_students | 初中在校生 | 扩展 | 人 | 2000—2024 | 2024 (31/31) | 2025 | 460 | 460/0/0 | 0 (0) |
| primary_students | 小学在校生 | 扩展 | 人 | 2000—2024 | 2024 (31/31) | 2025 | 801 | 801/0/0 | 0 (0) |
| graduate_students | 在学研究生（全国） | 扩展 | 人 | 2000—2025 | — (0/31) | 2025 | 26 | 26/0/0 | 0 (0) |
| health_institutions | 医疗卫生机构数 | 扩展 | 个 | 2000—2024 | 2024 (31/31) | 2025 | 801 | 801/0/0 | 0 (0) |
| physicians_count | 执业（助理）医师数 | 扩展 | 人 | 2000—2024 | 2024 (31/31) | 2025 | 801 | 801/0/0 | 0 (0) |
| nurses_per_1000 | 每千人口注册护士数 | 扩展 | 人/千人 | 2000—2024 | 2024 (31/31) | 2025 | 801 | 801/0/0 | 0 (0) |
| hospital_beds_total | 医疗卫生机构床位数 | 扩展 | 万张 | 2000—2024 | 2024 (31/31) | 2025 | 770 | 770/0/0 | 0 (0) |
| hospital_bed_occupancy | 医院病床使用率 | 扩展 | % | 2000—2023 | 2023 (31/31) | 2024 | 458 | 458/0/0 | 0 (0) |
| outpatient_visits | 医疗卫生机构诊疗人次 | 扩展 | 亿人次 | 2008—2024 | 2024 (31/31) | 2024 | 482 | 482/0/0 | 0 (0) |
| water_use_per_capita | 人均用水量 | 扩展 | 立方米/人 | 2004—2024 | 2024 (31/31) | 2024 | 671 | 671/0/0 | 0 (0) |
| forest_coverage | 森林覆盖率 | 扩展 | % | 2004—2024 | 2024 (31/31) | 2024 | 544 | 544/0/0 | 0 (0) |
| highway_mileage | 公路里程 | 扩展 | 万公里 | 2000—2024 | 2024 (31/31) | 2025 | 801 | 801/0/0 | 0 (0) |

## D. R1 vs R2
See `R1_VS_R2.md` (table covering core indicators, observations, verification, latest data, history, features, map, Explorer, mobile, tests, performance, updates).

## Tests
pytest 34/34 · Playwright local 56/56 (+1 by-design skip) · Playwright live 56/56 (+1 skip) · update simulation 9/9 · acceptance A–T: 20 Pass on the live site (`reports/acceptance_test_results.csv`). Lighthouse (mobile, live, same conditions as R1): home 100/100/100/100 · indicator 94/100/96/100 · explorer 95/100/100/100 · province 100/100/100/100 · compare 96/98/100/100 (R1: 100/96/97 perf) — `reports/lighthouse/`.

## E. Links
1. Drive R2 folder: https://drive.google.com/drive/folders/19yZxGJE3--18ychQ3_FbjKxq6imAgjiz
2. GitHub (private): https://github.com/timkok/china-data-atlas-claude-opus-5-5-r2
3. Pull request: see EVALUATION.json `pull_request_url`
4. Site: https://china-data-atlas-claude-opus-5-5-r2.vercel.app (preview deployments login-protected)
5. ZIP: `China-Data-Atlas-Claude-Opus-5.5-R2*.zip` in the Drive folder (split to respect the 10 MB upload limit)
6. Audit: `audit/` · 7. Candidate DB: `data/canonical_candidate/` · 8. Data dictionary: `data/metadata/data_dictionary.csv` · 9. Tests: `reports/` · 10. Screenshots: `screenshots/` (homepage/indicator/data-explorer at desktop/tablet/mobile; province-comparison, data-story, map-or-alternative, acceptance-*)

## Status classification
| Status | Items |
|---|---|
| Implemented & Verified | audit, reconciliation, canonical candidate, 42 indicators, detail engine, province pages, comparison, Explorer, stories, query engine, quality page, update pipeline (simulated), deployment |
| Implemented but Not Verified | mainland access, WeChat, real devices |
| Partially Implemented | exact-count ingestion (counts still from 万人 values); Data export of “current chart config” (share link carries the config) |
| Not Implemented | geographic map; English UI; city-level data |
| Blocked by Environment | Grok dataset (ZIP > 10 MB); Tianditu/MNR sites unreachable; Henan bureau 403 |
| Out of scope | LLM assistant (no paid API) |

## F. Round 3 recommendations (keep five)
1. **Data acquisition**: NBS public-endpoint client with raw-response hashing (shared approach; keep one implementation).
2. **Versioning & verification**: observation/source/vintage layers + E0–E4 + the conflict taxonomy and rules in `build_canonical.py` (no voting/averaging).
3. **Product architecture**: config-driven static detail engine with per-indicator data shards.
4. **User experience**: indicator page (quality card + versions/conflicts + distribution) with Gemini 4 Neon's region-matrix interaction and Codex's editorial typography.
5. **Update mechanism**: `update_pipeline.py` check → review → approve-as-new-vintage → rollback, scheduled check that never publishes.
Integrate by taking the union of *officially re-read* values only; import other models' exact-count yearbook tables as E2 after re-reading the source, not by copying their numbers.
