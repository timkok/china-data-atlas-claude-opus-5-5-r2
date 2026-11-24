# Reuse & attribution

**No code was copied from other models.** Their scripts were not executed (only their CSV/JSON/Markdown outputs were read as data).

| What | From | How it was used |
|---|---|---|
| Round 1 observations (8 datasets) | Gemini 4 Neon, Codex GPT-6, Claude first run, GPT-6 Astra Pro, Gemini MVU, Muse Spark 1.3, GPT-6.2, own R1 | Read-only inputs for record-level comparison; values never copied into the published layer (published values are re-read from official sources). R1-only values enter the candidate DB as E1/E0 with `publish_default=false` and `source_id=R1-<model>`. Inputs are listed with Drive IDs and SHA-256 in `data/input_manifest/manifest.csv` and are not redistributed. |
| Idea: keep official pre-2013 income back-estimates with a note | Gemini 4 Neon (its observation notes) | Re-implemented independently with a separate `methodology_version`. |
| Idea: home-page region matrix with click-through | Gemini 4 Neon site | Own implementation already existed in R1; R2 adds hover/legend/quantile classes in `/map/`. |
| Idea: per-dataset “data quality” checklist | The Maps Daily (reference site, studied 2026-11-24) | `QualityCard` derives its checklist from evidence levels; no code/text copied. |
| Revision-notice evidence | NBS (official) | Linked in conflicts/vintages. |

Licences: other models' repositories carry no stated licence; therefore nothing beyond facts (statistical values) and ideas was reused.
