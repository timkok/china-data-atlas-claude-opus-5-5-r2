# PRODUCT_RESEARCH (Round 2)

Visited 2026-11-24 with the built-in browser (text + screenshots). Round 1 research: `PRODUCT_RESEARCH_R1.md`.

| URL | What was studied |
|---|---|
| https://themapsdaily.com/posts/in-birth-rate | full indicator page: Part 1–5 story structure, “Data Quality 9.2/10” checklist, “How we used it” processing notes, Data Explorer (730 rows), related datasets |
| https://themapsdaily.com/ | portal structure (search, topic chips with counts, featured chart, “recently added”) — from R1, re-checked |
| https://ourworldindata.org/grapher/population | “What you should know”, sources/processing, last/next update |
| https://china-data-atlas-gemini-4-neon-r1.vercel.app/ | homepage: hero stats, 7-region matrix with region totals & ranks, provenance card per province |
| https://china-data-atlas-codex-r1-1123.vercel.app/ | editorial homepage (“本期图表”), topic catalogue with year ranges |
| https://china-data-atlas-claude-opus-5-5-r1-run3.vercel.app/ | own R1 (baseline for R1-vs-R2 Lighthouse) |

## Lessons → R2 changes
| Observation | R2 implementation |
|---|---|
| TMD shows a per-dataset data-quality score with an explicit checklist | `QualityCard`: evidence-level bar (E2/E3/E4), coverage, independent checks, unresolved conflicts |
| TMD “How we used it” explains processing honestly | per-indicator “方法与来源” + versions/conflicts panel |
| TMD/OWID tell a question-led story | Data Stories (6), each with question, method, facts, limits; Research Query Engine for ad-hoc questions |
| OWID allows switching chart / table / map, linear / log | trend: value / change rate / index, linear / log; explorer: line / bar / scatter / bubble |
| Gemini 4 Neon homepage matrix is the most useful R1 homepage interaction | `/map/` matrix with quantile classes, legend, hover, click-through; region matrix on every indicator page |
| Codex homepage typography is the most editorial | larger headline, fewer KPI cards, portal sections (stories, questions, provinces, tools) |
| All R1 sites hide data revisions | provenance panel shows current vs superseded vintages with the official revision notice |
| No R1 site had province pages with national comparison and evidence levels | `/provinces/[code]/` with ranks, national value, relative difference (per-capita/ratio only), evidence |

## Not adopted
Large KPI-card grids; animated globe; uncited “insights”.
