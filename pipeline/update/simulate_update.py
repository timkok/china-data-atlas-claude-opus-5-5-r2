"""Simulated update test (Task S). Runs the real update pipeline on an ISOLATED COPY of the data layer with a synthetic
fixture (clearly marked SIMULATED) and checks: new data detected, revision kept as a new vintage without overwriting the
old one, rows with missing fields blocked, approve + rollback work, and the real canonical file is untouched.
Writes reports/update_test_report.json."""
import csv, hashlib, json, os, shutil, subprocess, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REAL = os.path.join(ROOT, "data/canonical_candidate/observations.csv")
sha = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()
real_before = sha(REAL)
tmp = tempfile.mkdtemp(prefix="cda-update-sim-")
for d in ["data/canonical_candidate", "config"]:
    shutil.copytree(os.path.join(ROOT, d), os.path.join(tmp, d))
canon = {(r["indicator_id"], r["geo_code"], r["year"]): r for r in csv.DictReader(open(REAL, encoding="utf-8")) if r["publish_default"] == "true"}
old = canon[("gdp", "110000", "2025")]
fx = os.path.join(tmp, "fixture"); os.makedirs(fx)
rows = [
    {"indicator_id": "population", "geo_code": g, "year": "2026", "value": v, "unit": "万人", "source_url": "SIMULATED://fixture", "source_table": "SIMULATED new year", "retrieved_at": "2027-03-01T00:00:00Z"}
    for g, v in [("110000", "2179"), ("440000", "12900"), ("320000", "8510")]] + [
    {"indicator_id": "gdp", "geo_code": "110000", "year": "2025", "value": str(round(float(old["value"]) + 100, 1)), "unit": "亿元", "source_url": "SIMULATED://fixture", "source_table": "SIMULATED revision", "retrieved_at": "2027-03-01T00:00:00Z"},
    {"indicator_id": "retail_sales", "geo_code": "440000", "year": "2026", "value": "47000", "unit": "", "source_url": "SIMULATED://fixture", "source_table": "SIMULATED missing unit", "retrieved_at": "2027-03-01T00:00:00Z"},
    {"indicator_id": "population", "geo_code": "330000", "year": "2025", "value": canon[("population", "330000", "2025")]["value"], "unit": "万人", "source_url": "SIMULATED://fixture", "source_table": "SIMULATED unchanged", "retrieved_at": "2027-03-01T00:00:00Z"},
]
with open(os.path.join(fx, "candidates.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
PY = [sys.executable, os.path.join(ROOT, "pipeline/update/update_pipeline.py")]
out = subprocess.run(PY + ["check", "--root", tmp, "--source", f"fixture:{fx}"], capture_output=True, text=True, check=True).stdout
check = json.loads(out.strip().splitlines()[-1]); run = check["run_id"]
rep = json.load(open(os.path.join(tmp, "data/staging", run, "review_report.json"), encoding="utf-8"))
sim_before = sha(os.path.join(tmp, "data/canonical_candidate/observations.csv"))
subprocess.run(PY + ["approve", run, "--root", tmp], capture_output=True, text=True, check=True)
vint = [v for v in csv.DictReader(open(os.path.join(tmp, "data/canonical_candidate/vintages.csv"), encoding="utf-8")) if (v["indicator_id"], v["geo_code"], v["year"]) == ("gdp", "110000", "2025")]
canon_after = {(r["indicator_id"], r["geo_code"], r["year"]): r for r in csv.DictReader(open(os.path.join(tmp, "data/canonical_candidate/observations.csv"), encoding="utf-8"))}
subprocess.run(PY + ["rollback", run, "--root", tmp], capture_output=True, text=True, check=True)
sim_after_rb = sha(os.path.join(tmp, "data/canonical_candidate/observations.csv"))
checks = {
    "new_year_detected": check["new_observations"] == 3 and ["population", "2026"] in rep["new_years_detected"],
    "revision_detected": check["revisions"] == 1,
    "missing_field_blocked": check["blocked"] == 1 and "unit" in rep["blocked_rows"][0]["reason"],
    "unchanged_ignored": check["unchanged"] == 1,
    "nothing_published_before_approval": rep["status"] == "pending_review" and sim_before == sha(os.path.join(tmp, "data/versions", run, "observations.before.csv")),
    "revision_kept_old_vintage": any(v["vintage_status"] == "superseded" and abs(float(v["value"]) - float(old["value"])) < 1e-6 for v in vint) and any(v["vintage_status"] == "current" and abs(float(v["value"]) - float(old["value"]) - 100) < 1e-6 for v in vint),
    "approved_value_current": abs(float(canon_after[("gdp", "110000", "2025")]["value"]) - float(old["value"]) - 100) < 1e-6,
    "rollback_restores_snapshot": sim_after_rb == sim_before,
    "real_data_untouched": sha(REAL) == real_before,
}
report = {"run_id": run, "isolated_root": tmp, "fixture_rows": len(rows), "fixture_marked": "SIMULATED", "check_summary": check, "checks": checks, "passed": all(checks.values()),
          "note": "Simulation ran on a temporary copy; SIMULATED rows never touched data/canonical_candidate in the repository."}
json.dump(report, open(os.path.join(ROOT, "reports/update_test_report.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps({"passed": report["passed"], **checks}, ensure_ascii=False))
shutil.rmtree(tmp, ignore_errors=True)
sys.exit(0 if report["passed"] else 1)
