"""Data Quality Gate. Reads observations.csv + config, writes
reports/data_quality_report.json and reports/coverage_matrix.csv.
Exit code 1 if any ERROR-level check fails."""
import csv, json, os, sys, re, statistics
from collections import defaultdict, Counter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
cfg = json.load(open(os.path.join(ROOT, "config/indicators.json"), encoding="utf-8"))
regions = json.load(open(os.path.join(ROOT, "config/regions.json"), encoding="utf-8"))
IND = {i["id"]: i for i in cfg["indicators"]}
GEO = {r["geo_code"]: r for r in regions}
rows = list(csv.DictReader(open(os.path.join(ROOT, "data/normalized/observations.csv"), encoding="utf-8")))
checks, errors, warnings = [], 0, 0

def check(name, level, ok, detail, n=None):
    global errors, warnings
    checks.append({"check": name, "level": level, "passed": bool(ok), "detail": detail, "count": n})
    if not ok:
        if level == "ERROR": errors += 1
        else: warnings += 1

REQUIRED = ["indicator_id","indicator_name_zh","indicator_name_en","geo_code","geo_name_zh","geo_name_en","geo_level","year","value","unit","source_id","source_agency","source_url","source_table","source_locator","publication_date","retrieved_at","data_status","methodology_version","transformation","verification_status","notes"]
check("schema_required_columns", "ERROR", all(c in rows[0] for c in REQUIRED), "all required columns present")
bad_type = [r for r in rows if r["value"] != "" and not re.fullmatch(r"-?\d+(\.\d+)?", r["value"])]
check("value_numeric", "ERROR", not bad_type, "non-empty values parse as numbers", len(bad_type))
bad_geo = [r for r in rows if r["geo_code"] not in GEO or GEO[r["geo_code"]]["level"] != r["geo_level"]]
check("geo_code_valid", "ERROR", not bad_geo, "geo_code in regions.json and level consistent", len(bad_geo))
bad_year = [r for r in rows if not (2000 <= int(r["year"]) <= 2025)]
check("year_range", "ERROR", not bad_year, "2000<=year<=2025", len(bad_year))
bad_unit = [r for r in rows if r["unit"] != IND[r["indicator_id"]]["unit"]]
check("unit_consistency", "ERROR", not bad_unit, "unit equals configured unit for indicator", len(bad_unit))
keys = Counter((r["indicator_id"], r["geo_code"], r["year"]) for r in rows)
dups = [k for k, v in keys.items() if v > 1]
check("unique_key", "ERROR", not dups, "(indicator_id, geo_code, year) unique", len(dups))
nosrc = [r for r in rows if r["value"] != "" and not (r["source_url"] and r["source_table"] and r["source_locator"] and r["source_agency"])]
check("source_completeness", "ERROR", not nosrc, "every value has agency/url/table/locator", len(nosrc))
zero_missing = [r for r in rows if r["value"] == "" and r["data_status"] != "unknown"]
check("missing_not_zero", "ERROR", not zero_missing, "missing values are empty with status unknown (never 0)", len(zero_missing))
bad_status = [r for r in rows if r["data_status"] not in ("final","preliminary","revised","unknown") or r["verification_status"] not in ("verified","partially_verified","unverified")]
check("status_enums", "ERROR", not bad_status, "data_status / verification_status enums", len(bad_status))
iso = [r for r in rows if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", r["retrieved_at"])]
check("iso_dates", "ERROR", not iso, "retrieved_at ISO 8601", len(iso))
# plausibility
SIGNED = {"natural_growth_rate", "real_gdp_growth", "cpi_inflation", "real_wage_growth", "fai_growth"}  # growth rates may be negative
NONNEG = [i for i in IND if i not in SIGNED]
neg = [r for r in rows if r["value"] != "" and r["indicator_id"] in NONNEG and float(r["value"]) < 0]
check("no_negative_where_impossible", "ERROR", not neg, "only natural growth and growth-rate indicators may be negative", len(neg))
pct = [r for r in rows if r["value"] != "" and r["unit"] == "%" and r["indicator_id"] not in SIGNED and not (0 <= float(r["value"]) <= 100)]
check("percent_range", "ERROR", not pct, "percent values within 0-100", len(pct))
# year-on-year jumps
series = defaultdict(dict)
for r in rows:
    if r["value"] != "":
        series[(r["indicator_id"], r["geo_code"])][int(r["year"])] = float(r["value"])
jumps = []
for (i, g), s in series.items():
    for y in sorted(s):
        if y - 1 in s and s[y - 1] != 0:
            if IND[i]["unit"] in ("‰", "%"):
                ch = abs(s[y] - s[y - 1]); thr = 3.0   # absolute points for rates
            else:
                ch = abs(s[y] / s[y - 1] - 1); thr = 0.30
            if ch > thr:
                jumps.append({"indicator": i, "geo": g, "year": y, "prev": s[y - 1], "value": s[y], "change": round(ch, 3)})
check("yoy_outliers", "WARNING", not jumps, "year-on-year change >30% (levels) or >3 points (%/‰ rates) flagged for review (not an error)", len(jumps))
# national vs provincial consistency (only additive, consistent-scope indicators)
cons = []
for i in ("higher_education_institutions", "higher_education_students"):
    for y in range(2000, 2026):
        prov = [series[(i, g)].get(y) for g in GEO if GEO[g]["level"] == "province"]
        nat = series[(i, "000000")].get(y)
        if nat and all(v is not None for v in prov):
            d = sum(prov) / nat - 1
            if abs(d) > 0.005:
                cons.append({"indicator": i, "year": y, "sum_prov": sum(prov), "national": nat, "diff": round(d, 4)})
check("national_vs_province_sum", "WARNING", not cons, "sum of 31 provinces vs national for additive indicators (|diff|<=0.5%); population excluded because national includes active military", len(cons))
pop_gap = []
for y in range(2000, 2026):
    prov = [series[("population", g)].get(y) for g in GEO if GEO[g]["level"] == "province"]
    nat = series[("population", "000000")].get(y)
    if nat and all(v is not None for v in prov):
        pop_gap.append({"year": y, "national_minus_sum": round(nat - sum(prov), 1)})
check("population_military_gap_plausible", "WARNING", all(0 <= p["national_minus_sum"] <= 500 for p in pop_gap), "national population minus sum of provinces should be small and positive (active military + rounding)", len(pop_gap))
# urbanization recomputation consistency is implicit (derived); check derived ratio in (0,100)
# coverage matrix
cov = []
prov_codes = [g for g in GEO if GEO[g]["level"] == "province"]
for i, ind in IND.items():
    years = sorted({int(r["year"]) for r in rows if r["indicator_id"] == i})
    for y in years:
        vals = {g: series[(i, g)].get(y) for g in prov_codes}
        present = [g for g, v in vals.items() if v is not None]
        miss = [GEO[g]["short_zh"] for g, v in vals.items() if v is None]
        ver = sum(1 for r in rows if r["indicator_id"] == i and int(r["year"]) == y and r["geo_level"] == "province" and r["value"] != "" and r["verification_status"] in ("verified", "partially_verified"))
        statuses = sorted({r["data_status"] for r in rows if r["indicator_id"] == i and int(r["year"]) == y and r["value"] != ""})
        reason = ""
        if miss:
            reason = "官方数据库该年份未发布省级数据" if len(miss) == 31 else "官方数据库部分省份该年份无数据"
        cov.append({"indicator_id": i, "core": ind["core"], "year": y, "expected_provinces": 31, "nonnull_provinces": len(present),
                    "verified_or_partially_verified": ver, "missing_provinces": "|".join(miss), "province_coverage_rate": round(len(present) / 31, 4),
                    "national_value_present": (y in series[(i, "000000")]), "data_status": "|".join(statuses) or "unknown", "missing_reason": reason})
with open(os.path.join(ROOT, "reports/coverage_matrix.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(cov[0].keys())); w.writeheader(); w.writerows(cov)
summary = {}
for i, ind in IND.items():
    c = [x for x in cov if x["indicator_id"] == i]
    full = [x["year"] for x in c if x["nonnull_provinces"] == 31]
    latest_prov = max([x["year"] for x in c if x["nonnull_provinces"] > 0], default=None)
    latest_nat = max([x["year"] for x in c if x["national_value_present"]], default=None)
    lp = next((x for x in c if x["year"] == latest_prov), None)
    since2015 = [y for y in range(2015, (latest_prov or 2015) + 1)]
    summary[i] = {"core": ind["core"], "first_year": c[0]["year"] if c else None, "latest_province_year": latest_prov, "latest_national_year": latest_nat,
                  "latest_province_coverage": lp["province_coverage_rate"] if lp else 0, "years_with_full_31": len(full),
                  "continuity_since_2015": round(sum(1 for y in since2015 if y in full) / len(since2015), 3) if since2015 else 0,
                  "valid_observations": sum(1 for r in rows if r["indicator_id"] == i and r["value"] != "")}
core = [i for i in IND if IND[i]["core"]]
report = {"generated_from": "data/normalized/observations.csv", "rows": len(rows), "unique_valid_observations": sum(1 for r in rows if r["value"] != ""),
          "missing_rows": sum(1 for r in rows if r["value"] == ""),
          "verified_observations": sum(1 for r in rows if r["verification_status"] == "verified"),
          "partially_verified_observations": sum(1 for r in rows if r["verification_status"] == "partially_verified"),
          "errors": errors, "warnings": warnings, "checks": checks, "yoy_outliers": jumps, "national_vs_province": cons, "population_military_gap": pop_gap,
          "indicator_summary": summary,
          "core_completion": {"core_target": 12, "core_with_latest_full_province_data": sum(1 for i in core if summary[i]["latest_province_coverage"] == 1.0),
                              "mean_latest_province_coverage": round(statistics.mean(summary[i]["latest_province_coverage"] for i in core), 4),
                              "mean_continuity_since_2015": round(statistics.mean(summary[i]["continuity_since_2015"] for i in core), 4)}}
json.dump(report, open(os.path.join(ROOT, "reports/data_quality_report.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps({k: report[k] for k in ("rows","unique_valid_observations","verified_observations","partially_verified_observations","errors","warnings","core_completion")}, ensure_ascii=False))
for c in checks:
    print(("OK  " if c["passed"] else "FAIL"), c["level"], c["check"], c["count"])
sys.exit(1 if errors else 0)
