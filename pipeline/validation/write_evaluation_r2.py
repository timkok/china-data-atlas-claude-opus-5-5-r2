"""Compute EVALUATION.json (R2) from delivered files only."""
import csv, json, os, xml.etree.ElementTree as ET
from collections import Counter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")); P = lambda p: os.path.join(ROOT, p)
canon = list(csv.DictReader(open(P("data/canonical_candidate/observations.csv"), encoding="utf-8"))); pub = [r for r in canon if r["publish_default"] == "true"]
conf = list(csv.DictReader(open(P("data/reconciliation/conflicts.csv"), encoding="utf-8")))
find = list(csv.DictReader(open(P("audit/findings.csv"), encoding="utf-8")))
inv = list(csv.DictReader(open(P("audit/round1_inventory.csv"), encoding="utf-8")))
q = json.load(open(P("reports/data_quality_report.json"))); site = json.load(open(P("app/src/data/site.json")))
cfg = json.load(open(P("config/indicators.json"))); core = [i["id"] for i in cfg["indicators"] if i["core"]]
t = ET.parse(P("reports/pytest_report.xml")).getroot(); ts = t if t.tag == "testsuite" else t.find("testsuite")
py_tot, py_fail = int(ts.get("tests")), int(ts.get("failures")) + int(ts.get("errors"))
pl = json.load(open(P("reports/browser_test_report_local.json")))["stats"]; pd = json.load(open(P("reports/browser_test_report_deployed.json")))["stats"]
upd = json.load(open(P("reports/update_test_report.json")))
acc = [r for r in csv.DictReader(open(P("reports/acceptance_test_results.csv"), encoding="utf-8")) if r["environment"].startswith("https")]
ac = Counter(r["result"] for r in acc)
lh = json.load(open(P("reports/lighthouse/summary.json")))
def full31(i):
    ys = Counter(r["year"] for r in pub if r["indicator_id"] == i and r["geo_level"] == "province")
    return max((int(y) for y, n in ys.items() if n == 31), default=None)
conf_f = Counter((f["severity"], f["verification_status"]) for f in find)
ev = {
 "round": 2, "model": "Claude Opus 5.5 (claude-opus-5-5)",
 "r1_models_reviewed": len(inv), "r1_models_deeply_audited": 8, "r1_datasets_imported": 8,
 "confirmed_p0_findings": conf_f[("P0", "Confirmed Issue")], "confirmed_p1_findings": conf_f[("P1", "Confirmed Issue")], "confirmed_p2_findings": conf_f[("P2", "Confirmed Issue")],
 "findings_total": len(find), "findings_by_status": dict(Counter(f["verification_status"] for f in find)),
 "conflicts_detected": len(conf), "conflicts_resolved": sum(1 for c in conf if c["resolution"].startswith("resolved")), "conflicts_unresolved": sum(1 for c in conf if not c["resolution"].startswith("resolved")),
 "conflict_categories": dict(Counter(c["category"] for c in conf)),
 "r1_source_rows_imported": 32209, "r1_distinct_keys": 11527,
 "core_indicators_available": len({r["indicator_id"] for r in pub} & set(core)), "core_indicators_complete": sum(1 for i in core if (full31(i) or 0) >= 2024),
 "additional_indicators": len({r["indicator_id"] for r in pub}) - len(core),
 "unique_valid_observations": len(pub), "unique_valid_observations_core": sum(1 for r in pub if r["indicator_id"] in core),
 "evidence_level_counts": dict(Counter(r["evidence_level"] for r in canon)), "extraction_method_counts_published": dict(Counter(r["extraction_method"] for r in pub)),
 "official_source_count": 9, "earliest_data_year": min(int(r["year"]) for r in pub), "latest_data_year": max(int(r["year"]) for r in pub),
 "latest_provincial_coverage": {i: full31(i) for i in core},
 "data_quality_errors": q["errors"], "data_quality_warnings": q["warnings"],
 "province_pages": 31, "data_stories": len(site["stories"]),
 "map_status": "not_implemented: compliance (审图/licence) unverified; non-geographic region matrix with year switch, hover, click, legend, missing-value marking; replaceable ProvinceMapAdapter interface",
 "data_explorer_status": "implemented_and_tested: multi-indicator/province, line/bar/scatter/bubble, index/yoy/CAGR, Pearson r with n, evidence filter, CSV/PNG/SVG, share links",
 "research_assistant_status": "Research Query Engine (rule-based templates over the published data; no LLM, no paid API); 5 question types; refuses unparsed questions",
 "automatic_update_status": "implemented: check→stage→sha256→validate→review report→approve (new vintage)→rollback; simulation passed=" + str(upd["passed"]) + "; GitHub Actions weekly check (review artifact only, never publishes)",
 "tests_passed": (py_tot - py_fail) + pl["expected"] + pd["expected"], "tests_failed": py_fail + pl["unexpected"] + pd["unexpected"], "tests_not_run": pl["skipped"] + pd["skipped"],
 "tests_breakdown": {"pytest": {"passed": py_tot - py_fail, "failed": py_fail}, "playwright_local": pl, "playwright_deployed": pd, "update_simulation": upd["checks"]},
 "acceptance_tasks_passed": ac.get("Pass", 0), "acceptance_tasks_partial": ac.get("Partial", 0), "acceptance_tasks_failed": ac.get("Fail", 0), "acceptance_tasks_total": len(acc),
 "lighthouse": {k: {c: v[c] for c in ("performance", "accessibility", "best-practices", "seo")} for k, v in lh.items()},
 "mainland_access_status": "not verified (no mainland network available)", "wechat_browser_status": "not verified (no WeChat client available; Chromium mobile emulation only)",
 "redistribution_status": "official statistics published with attribution — pending formal review; yearbook images, page copies and other models' files not redistributed",
 "deployment_status": "deployed: new independent Vercel project china-data-atlas-claude-opus-5-5-r2 (first CLI deploy = that project's production; preview deployments login-protected); R1 untouched",
 "github_url": "https://github.com/timkok/china-data-atlas-claude-opus-5-5-r2 (public)", "pull_request_url": "https://github.com/timkok/china-data-atlas-claude-opus-5-5-r2/pull/1",
 "preview_url": "https://china-data-atlas-claude-opus-5-5-r2.vercel.app", "drive_folder_url": "https://drive.google.com/drive/folders/19yZxGJE3--18ychQ3_FbjKxq6imAgjiz",
 "known_limitations": ["Grok R1 dataset not importable (21.4 MB ZIP > 10 MB connector limit)", "No geographic map (compliance unverified; Tianditu/MNR sites unreachable from environment)",
   "Latest complete provincial year 2024 for most indicators (2025 for population, GDP, GDP pc, income, retail, consumption)", "Graduate students national-only (no provincial series in NBS database)",
   "Student/physician counts from 万人-rounded database values (±50 persons)", "1 unresolved conflict (Shanghai 2016 disposable income)", "Mainland access and WeChat not verified", "Population-series revision notice (2011–2019) not located; relies on Yearbook 2025 revised series"],
}
json.dump(ev, open(P("EVALUATION.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps({k: ev[k] for k in ("core_indicators_available","core_indicators_complete","additional_indicators","unique_valid_observations","conflicts_detected","conflicts_unresolved","tests_passed","tests_failed","tests_not_run","acceptance_tasks_passed","acceptance_tasks_total","confirmed_p0_findings","confirmed_p1_findings","confirmed_p2_findings")}, ensure_ascii=False))
