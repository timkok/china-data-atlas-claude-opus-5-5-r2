# DEPLOYMENT_INFO

| Item | Value |
|---|---|
| Platform | Vercel (account scope `timkok621-1320`), static files (Next.js static export) |
| Project | `china-data-atlas-claude-opus-5-5-r1-run3` — **new project created for this run**; no existing project or production touched |
| Public URL (tested) | https://china-data-atlas-claude-opus-5-5-r1-run3.vercel.app |
| Other auto alias | https://china-data-atlas-claude-opus-5-5-r1.vercel.app (assigned by Vercel to this project) |
| Current deployment | https://china-data-atlas-claude-opus-5-5-r1-run3-cb0n81c24.vercel.app (target: production of the new project) |
| Preview deployment | https://china-data-atlas-claude-opus-5-5-r1-run3-2uz6shdnv.vercel.app — protected by Vercel Authentication (anonymous → HTTP 302 to login). Not usable by reviewers without a Vercel login. |
| GitHub | https://github.com/timkok/china-data-atlas-claude-opus-5-5-r1-run3 (public) · PR https://github.com/timkok/china-data-atlas-claude-opus-5-5-r1-run3/pull/1 (branch `r1/dev` → `main`) |

## How it was deployed
```bash
cd app && NEXT_PUBLIC_SITE_URL=https://china-data-atlas-claude-opus-5-5-r1-run3.vercel.app npm run build
cp -R out/. <dir outside the git repo>/ && cd <that dir>
vercel link --project china-data-atlas-claude-opus-5-5-r1-run3 --yes
vercel deploy --prod --yes
vercel alias set <deployment-url> china-data-atlas-claude-opus-5-5-r1-run3.vercel.app
```

## Issues met
1. **First `vercel deploy` went to Production**: the CLI promotes the first deployment of a brand-new project. Because the project is new and dedicated to this run, no existing Production was affected. Preview deployments are behind Vercel Authentication, so the public, tested URL is the project's production domain.
2. **Deployment "Blocked"** when deploying from `app/out` inside the git repo ("couldn't find a Git account for the commit author"). Fixed by deploying a copy outside the repo.
3. **Pinned alias**: a manual `alias set` keeps pointing to the old deployment after new deploys; each release re-runs `alias set`.
4. `vercel link` writes `.env.local` (short-lived OIDC token) into the deploy folder; it was deleted after each deploy and verified not to be served (`/.env.local` → 404). Never committed.

## Post-deploy verification (2026-11-24)
- Playwright full suite against the public URL: 36 passed, 0 failed, 1 skipped by design (`reports/browser_test_report_deployed.json`, `reports/browser_test_log_deployed.txt`), including direct-URL loads, refresh, static assets, CSV download, console errors = 0, 1440/768/390 layouts, acceptance tasks A–J.
- Lighthouse 12 (mobile emulation) against the public URL: see `reports/lighthouse-*.report.html`.
- Not verified: access from mainland China networks; WeChat in-app browser.
