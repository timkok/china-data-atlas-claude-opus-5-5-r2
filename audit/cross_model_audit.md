# Cross-Model Audit — Round 1 → Round 2

Auditor: Claude Opus 5.5 (claude-opus-5-5), R2 run, 2026-11-24. All Round 1 material was treated as read-only input.
Machine-readable: `round1_inventory.csv`, `model_comparison.csv`, `findings.csv` (19 findings), `data_overlap_matrix.csv`,
`../data/reconciliation/conflicts.csv` (4,247 classified differences).

## 1. What was inventoried
10 Round 1 folders were found in the Drive folder (2 "Round 2" folders also exist; they were **not opened**).

| Model | Data imported? | Self-reported obs. | Recomputed valid keys | Note |
|---|---|---|---|---|
| Grok Bot | **No** — observations only inside a 21.4 MB ZIP (connector limit 10 MB) | 11,229 | — | reports + validation samples read |
| Gemini 4 Neon | yes | 9,110 | 9,110 | public site inspected |
| Claude Opus 5.5 (first run) | yes | (4,616 rows) | 4,616 | quality_report read |
| Claude Opus 5.5 run 3 (own R1) | yes | 10,416 | 10,416 | |
| GPT-6 Astra Pro | yes | 1,416 | 1,416 | |
| Gemini (MVU) | yes (Sheet export) | 1,526 | 1,526 | |
| Muse Spark 1.3 | yes | 428 | 428 | |
| Codex GPT-6 | yes (2 differing copies; 3,825-row copy used) | 3,825 | 3,825 | public site inspected |
| GPT-6.2 | yes (from ZIP) | 184 | 184 | |
| Codex (MVU) R1-20261124-1250 | no deliverables | — | — | checkpoint doc only |

Deeply audited (record-level reconciliation + report reading): Gemini 4 Neon (data-volume leader with importable data), Codex GPT-6 (multi-source, largest disagreement), Claude first run (raw-evidence / OCR), GPT-6 Astra Pro (evidence ledger), Gemini MVU, Muse, GPT-6.2, own R1. Grok: report-level only (dataset unavailable).

## 2. Headline findings (evidence in findings.csv)
1. **P0 — Gemini (MVU) uses Wikipedia as source** for 541 of 1,526 rows (GDP, GDP per capita, population) and third-party aggregators for others. All rejected as E0/“Source Not Verifiable”.
2. **P1 — Gemini 4 Neon “9,110 verified”** while only 60 independent checks were delivered. Its values are correct (99.4% identical to another model that read the same NBS database) — but agreement between two extractions of the *same* database is not independent verification.
3. **P1 — Codex GPT-6 mixes statistical vintages**: GDP series built from first-release figures in successive Jiangsu yearbook appendices (2023: 1,260,582 vs revised 1,294,272; 2024: preliminary 1,349,084 vs final 1,348,066). Growth computed across the mix is wrong (7.0% vs 4.2% nominal 2023→24).
4. **P1 — Gemini (MVU) 2024 provincial retail sales contradict Yearbook 2025 table 15-12** (Zhejiang 33,900 vs 37,707.7; Guangdong 47,872.8 vs 45,029.2; 7 provinces).
5. **Most “conflicts” are not errors**: of 4,247 differing values, 2,051 are within official rounding and 1,780 are official revisions (economic-census / population-census back-revisions, final GDP verification). Only 12 were genuine value conflicts; 11 were resolved by an independent official publication and **1 remains unresolved** (Codex, Shanghai 2016 disposable income 54,032 vs NBS 54,305).
6. **Claude first run’s 5,488 `single_reading_ocr` warnings** concern raw cells; its published values reconcile to official data except 4 national 65+ shares, which are a basis difference (sample-survey share vs year-end structure).
7. **Own R1 problems fixed**: precision loss in 万人-based counts; over-exclusion of official pre-2013 income back-estimates (now kept with a separate methodology_version).
8. The prompt’s **125-record physician difference (Grok vs Gemini 4 Neon) could not be reproduced** — Grok’s observations were not accessible. Gemini 4 Neon’s physician values are identical to this project’s (computed from official counts ÷ population).

## 3. Overlap and agreement (shared keys, agreement within rounding)
| Pair | Shared | Agree |
|---|---|---|
| Claude run3 – Gemini 4 Neon | 8,818 | 99.4% (same NBS database) |
| Claude first run – GPT-6 Astra | 1,086 | 99.5% (both yearbook-based) |
| Claude first run – Codex | 2,715 | 94.7% |
| Claude run3 – Codex | 3,786 | 64.5% (vintage differences) |
| Gemini MVU – Gemini 4 Neon | 1,490 | 72.9% |
Full matrix: `data_overlap_matrix.csv`.

## 4. Per-model assessment
**Grok** — strengths (self-reported): largest database extraction, 15 indicators, clear verified/partially-verified split, 122 validation samples (107 yes, 12 revision, 3 not comparable). Issues: data not importable here; no public deployment. Reuse: its verification labelling discipline. Risk: unknown (not independently checked).

**Gemini 4 Neon** — strengths: complete 12/12 from the NBS database (values agree with official data), public site with 7-region matrix and provenance, documented pre-2013 income back-estimates. Issues: blanket “verified” label; 9,110 = same count as another model because both read the same database (so it is not extra evidence). Reuse: homepage region-matrix interaction, pre-2013 handling. Risk: low for values, high for verification claims.

**Claude Opus 5.5 (first run)** — strengths: yearbook OCR with source_cell locators, cross-edition checks, file hashing. Issues: edition vintages (e.g. GDP per capita 2011–12, Tianjin −27% after revision) not reconciled to the current series. Reuse: cell-level locators. Risk: low–medium.

**Claude Opus 5.5 run 3 (own)** — strengths: NBS API with raw responses, independent yearbook/communiqué checks, tested live deployment. Issues: precision loss, over-exclusion (both fixed in R2). Reuse: validation-sample design, provenance dialog.

**GPT-6 Astra Pro** — strengths: evidence_file per observation, 99.5% agreement with yearbook transcriptions. Issues: small coverage. Reuse: per-row evidence file pointer.

**Codex GPT-6** — strengths: 90 sources, exact person counts, editorial design. Issues: vintage mixing; NHC birth rates spliced into the NBS series; two differing observation files; stale homepage headline. Reuse: exact-count tables (once vintage-normalised). Risk: medium–high for time series.

**Muse Spark 1.3** — strengths: carefully annotated small dataset, fix log. Issues: superseded vintages; broader HE-student scope under shared ID (documented by Muse). Risk: medium.

**Gemini (MVU)** — Wikipedia/aggregator sourcing; contradicted 2024 retail values. Risk: high.

**GPT-6.2** — 184 transcribed facts with locators; too small to judge further.

## 5. What should enter a final unified version
Data acquisition: NBS public-endpoint extraction (shared by Grok / Gemini 4 Neon / this project) + raw-response hashing. Evidence: E0–E4 levels with independent-publication sampling (this project) + per-row evidence pointers (Astra) + cell locators (Claude first run). Product: indicator detail engine + provenance/vintage panels (this project), region-matrix homepage interaction (Gemini 4 Neon), editorial typography ideas (Codex).
