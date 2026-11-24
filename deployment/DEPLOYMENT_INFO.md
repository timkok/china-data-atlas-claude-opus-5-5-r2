# DEPLOYMENT_INFO (R2)

| Item | Value |
|---|---|
| Platform | Vercel, static files (Next.js 16 static export, 96 pages) |
| Project | `china-data-atlas-claude-opus-5-5-r2` — new, independent; R1 projects untouched |
| Public URL (tested) | https://china-data-atlas-claude-opus-5-5-r2.vercel.app |
| Preview deployment | https://china-data-atlas-claude-opus-5-5-r2-yzpzhyx3u-timkok621-1320.vercel.app (Vercel Authentication: anonymous → HTTP 302) |
| GitHub | https://github.com/timkok/china-data-atlas-claude-opus-5-5-r2 (private), branch `r2/dev` → PR to `main` |
| Status | First CLI deploy of the new project became its production alias (same behaviour as R1); this is a public site of an independent evaluation project, not an existing production |

## Verified after deploy (2026-11-24)
Playwright 56/56 passed against the public URL (home, indicator direct URLs + refresh, province pages, compare, explorer incl. CSV/share, stories, query engine, quality, map page, downloads, sitemap/robots, console errors = 0, 1440/768/390 layouts, no horizontal overflow, acceptance A–T). Lighthouse: reports/lighthouse/. `/.env.local` → 404 (CLI token file removed before each deploy, never committed).
Not verified: mainland-China access, WeChat in-app browser.
