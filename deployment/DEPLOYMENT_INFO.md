# DEPLOYMENT_INFO (R2)

| Item | Value |
|---|---|
| Platform | Vercel, static files (Next.js 16 static export, 96 pages) |
| Project | `china-data-atlas-claude-opus-5-5-r2` — new, independent; R1 projects untouched |
| Public URL (tested) | https://china-data-atlas-claude-opus-5-5-r2.vercel.app |
| Preview deployment | https://china-data-atlas-claude-opus-5-5-r2-yzpzhyx3u-timkok621-1320.vercel.app (Vercel Authentication: anonymous → HTTP 302) |
| GitHub | https://github.com/timkok/china-data-atlas-claude-opus-5-5-r2 (public), branch `r2/dev` → PR to `main` |
| Status | First CLI deploy of the new project became its production alias (same behaviour as R1); this is a public site of an independent evaluation project, not an existing production |

## Verified after deploy (2026-11-24)
Playwright 56/56 passed against the public URL (home, indicator direct URLs + refresh, province pages, compare, explorer incl. CSV/share, stories, query engine, quality, map page, downloads, sitemap/robots, console errors = 0, 1440/768/390 layouts, no horizontal overflow, acceptance A–T). Lighthouse: reports/lighthouse/. `/.env.local` → 404 (CLI token file removed before each deploy, never committed).
Not verified: mainland-China access, WeChat in-app browser.

## R2.1 Preview (2026-11-26)
| Item | Value |
|---|---|
| Preview URL | https://china-data-atlas-claude-opus-5-5-r2-2p6sutjo9-timkok621-1320.vercel.app (Vercel login required; anonymous → 302) |
| Branch | `r2.1/data-expansion` |
| Production | unchanged — https://china-data-atlas-claude-opus-5-5-r2.vercel.app still serves R2 (42 indicators) |
| Verified | authenticated `vercel curl`: home, /indicators/fai_growth/, /stories/private-cars-per-1000/ → 200; `/.env.local` → 404. Full Playwright suite (62 passed, 1 intentional skip) on the identical local build. |

## R2.1 promoted to production (2026-11-26, at the user's request)
| Item | Value |
|---|---|
| Production URL | https://china-data-atlas-claude-opus-5-5-r2.vercel.app (now R2.1, 82 indicators) |
| Production deployment | https://china-data-atlas-claude-opus-5-5-r2-ow4adurwe-timkok621-1320.vercel.app (includes the empty-CSV button fix) |
| Previous R2 production (rollback) | https://china-data-atlas-claude-opus-5-5-r2-ea0xxv128-timkok621-1320.vercel.app — `vercel rollback` / `vercel promote` restores it |
| Verified live | Playwright 62 passed + 1 intentional skip (`reports/browser_test_report_live_r21.json`); `/.env.local` → 404. Lighthouse mobile live: home 96/100/100/100, /indicators/fai_growth/ 94/100/100/100, /stories/wage-vs-housing-price/ 98/100/100/100 (`reports/lighthouse/r21-live-*`). |
| Found by the live run | Explorer CSV button could be clicked before data loaded (empty CSV); button is now disabled until rows exist, and the test waits for the row count. |

