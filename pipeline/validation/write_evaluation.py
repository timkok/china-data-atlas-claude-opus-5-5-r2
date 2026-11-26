"""Compute EVALUATION.json from delivered data + reports (all numbers recomputable)."""
import csv, json, os, xml.etree.ElementTree as ET
from collections import Counter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
P = lambda p: os.path.join(ROOT, p)
cfg = json.load(open(P("config/indicators.json"), encoding="utf-8"))
core = [i["id"] for i in cfg["indicators"] if i["core"]]
rows = [r for r in csv.DictReader(open(P("data/normalized/observations.csv"), encoding="utf-8")) if r["value"] != ""]
q = json.load(open(P("reports/data_quality_report.json"), encoding="utf-8"))
samples = list(csv.DictReader(open(P("reports/data_validation_samples.csv"), encoding="utf-8")))
yes = Counter(s["indicator_id"] for s in samples if s["match"] == "yes")
bad = {s["indicator_id"] for s in samples if s["match"] == "no"}
t = ET.parse(P("reports/pytest_report.xml")).getroot(); ts = t if t.tag == "testsuite" else t.find("testsuite")
py_total, py_fail = int(ts.get("tests")), int(ts.get("failures")) + int(ts.get("errors"))
pl = json.load(open(P("reports/browser_test_report_local.json")))["stats"]
pd = json.load(open(P("reports/browser_test_report_deployed.json")))["stats"]
acc = [r for r in csv.DictReader(open(P("reports/acceptance_test_results.csv"), encoding="utf-8")) if r["environment"].startswith("https")]
ac = Counter(r["result"] for r in acc)
lh = {n: {k: round(v["score"] * 100) for k, v in json.load(open(P(f"reports/lighthouse-{n}.report.json")))["categories"].items()} for n in ("home", "indicator", "explorer")}
ev = {
 "project_version": "R1", "model": "Claude Opus 5.5 (claude-opus-5-5)",
 "core_indicators_target": 12, "core_indicators_available": sum(1 for i in core if any(r["indicator_id"] == i for r in rows)),
 "core_indicators_verified": sum(1 for i in core if yes[i] >= 5 and i not in bad),
 "core_indicators_verified_definition": ">=5 data points individually matched against an independent official publication, no unexplained mismatch",
 "additional_indicators": len(cfg["indicators"]) - len(core),
 "unique_valid_observations": len(rows),
 "unique_valid_observations_core": sum(1 for r in rows if r["indicator_id"] in core),
 "verified_observations": sum(1 for r in rows if r["verification_status"] == "verified"),
 "partially_verified_observations": sum(1 for r in rows if r["verification_status"] == "partially_verified"),
 "official_sources": 7, "regions_covered": len({r["geo_code"] for r in rows if r["geo_level"] == "province"}),
 "earliest_data_year": min(int(r["year"]) for r in rows), "latest_data_year": max(int(r["year"]) for r in rows),
 "data_quality_errors": q["errors"], "data_quality_warnings": q["warnings"],
 "tests_passed": (py_total - py_fail) + pl["expected"] + pd["expected"], "tests_failed": py_fail + pl["unexpected"] + pd["unexpected"],
 "tests_not_run": pl["skipped"] + pd["skipped"],
 "tests_breakdown": {"pytest_data_unit": {"passed": py_total - py_fail, "failed": py_fail}, "playwright_local": pl, "playwright_deployed": pd,
                     "not_run_note": "Task H (mobile-only) is skipped by design in the desktop project of each run"},
 "acceptance_tasks_passed": ac.get("Pass", 0), "acceptance_tasks_partial": ac.get("Partial", 0), "acceptance_tasks_failed": ac.get("Fail", 0),
 "acceptance_environment": "deployed site (also passed on local build)",
 "lighthouse_mobile": lh,
 "map_status": "not_implemented_by_design: no boundary data with confirmed 审图号/licence for interactive choropleth; replaced by ranked bars, ranking tables and a labelled non-geographic 7-region matrix",
 "redistribution_status": "pending_review: official NBS statistics shown with attribution; no explicit open-data licence found; yearbook images and page copies not redistributed publicly",
 "deployment_status": "deployed: new independent Vercel project china-data-atlas-claude-opus-5-5-r1-run3 (first CLI deploy became the new project's production; preview deployments exist but are behind Vercel Authentication)",
 "github_url": "https://github.com/timkok/china-data-atlas-claude-opus-5-5-r1-run3 (public)",
 "pull_request_url": "https://github.com/timkok/china-data-atlas-claude-opus-5-5-r1-run3/pull/1",
 "preview_url": "https://china-data-atlas-claude-opus-5-5-r1-run3.vercel.app",
 "drive_folder_url": "https://drive.google.com/drive/folders/1vGwrABTN7SaRX31Fet0A8ekE6MmTPUfd",
 "known_limitations": [
   "Latest provincial year is 2024 for 7 of 12 core indicators (2025 for population, GDP, GDP per capita, income, retail)",
   "65+ provincial shares are sample-survey based except 2020 (census); 2025 provincial not available",
   "Urbanization 2015-2024 hand-transcribed from Yearbook 2025 table image (bound-checked); other years derived from rounded counts",
   "GDP 2024 values are final-verified and differ from Yearbook 2025 preliminary figures; provincial revisions not confirmed by a second source",
   "Physicians per 1000 uses current revised population; Yearbook values for <=2020 differ by 0.01-0.03",
   "No geographic map; no English UI; no PNG/SVG export or scatter plot yet",
   "Mainland China network access and WeChat browser not verified",
   "Redistribution licence not confirmed (pending review); GitHub repo is public (made public at the user's request) while redistribution status remains pending review"]}
json.dump(ev, open(P("EVALUATION.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps({k: ev[k] for k in ("core_indicators_available","core_indicators_verified","unique_valid_observations","verified_observations","tests_passed","tests_failed","tests_not_run","acceptance_tasks_passed")}, ensure_ascii=False))
print(dict(yes))
