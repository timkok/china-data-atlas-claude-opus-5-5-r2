"""Data tests on the delivered normalized dataset (run: python3 -m pytest tests/data -q)."""
import csv, json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ROWS = list(csv.DictReader(open(os.path.join(ROOT, "data/normalized/observations.csv"), encoding="utf-8")))
CFG = json.load(open(os.path.join(ROOT, "config/indicators.json"), encoding="utf-8"))
CORE = [i["id"] for i in CFG["indicators"] if i["core"]]
def val(i, g, y):
    r = [x for x in ROWS if x["indicator_id"] == i and x["geo_code"] == g and x["year"] == str(y)]
    return float(r[0]["value"]) if r and r[0]["value"] != "" else None

def test_all_12_core_indicators_present():
    assert len(CORE) == 12 and {r["indicator_id"] for r in ROWS} >= set(CORE)

def test_unique_key():
    keys = [(r["indicator_id"], r["geo_code"], r["year"]) for r in ROWS]
    assert len(keys) == len(set(keys))

def test_31_provinces_plus_national():
    assert len({r["geo_code"] for r in ROWS if r["geo_level"] == "province"}) == 31
    assert {r["geo_code"] for r in ROWS if r["geo_level"] == "national"} == {"000000"}

def test_missing_values_are_empty_never_zero():
    for r in ROWS:
        if r["value"] == "":
            assert r["data_status"] == "unknown" and r["verification_status"] == "unverified"

def test_numeric_and_iso():
    for r in ROWS:
        assert r["value"] == "" or re.fullmatch(r"-?\d+(\.\d+)?", r["value"])
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", r["retrieved_at"])

def test_every_value_has_source():
    for r in ROWS:
        if r["value"] != "":
            assert r["source_url"].startswith("https://") and r["source_table"] and r["source_locator"]

def test_latest_province_year_full_coverage():
    for i in CORE:
        years = [int(r["year"]) for r in ROWS if r["indicator_id"] == i and r["geo_level"] == "province" and r["value"] != ""]
        y = max(years)
        n = sum(1 for r in ROWS if r["indicator_id"] == i and r["geo_level"] == "province" and r["year"] == str(y) and r["value"] != "")
        assert n == 31, (i, y, n)

def test_known_official_values():
    # spot values from 中国统计年鉴2025 / 2025 statistical communiqué (independent of the API)
    assert val("population", "440000", 2024) == 12780
    assert val("population", "000000", 2025) == 140489
    assert val("birth_rate", "000000", 2025) == 5.63
    assert val("disposable_income", "000000", 2025) == 43377
    assert val("urbanization_rate", "540000", 2020) == 35.73
    assert val("population_65plus", "440000", 2020) == 8.58

def test_negative_only_where_possible():
    for r in ROWS:
        if r["value"] != "" and float(r["value"]) < 0:
            assert r["indicator_id"] == "natural_growth_rate"

def test_units_converted_correctly():
    r = [x for x in ROWS if x["indicator_id"] == "higher_education_students" and x["geo_code"] == "440000" and x["year"] == "2024"][0]
    assert r["original_value"] == "v=268.76" and float(r["value"]) == 2687600
    r = [x for x in ROWS if x["indicator_id"] == "hospital_beds_per_1000" and x["geo_code"] == "440000" and x["year"] == "2024"][0]
    assert abs(float(r["value"]) - 5.04) < 1e-9

def test_disposable_income_pre2013_kept_with_separate_methodology():
    pre = [r for r in ROWS if r["indicator_id"] == "disposable_income" and int(r["year"]) < 2013 and r["value"] != ""]
    assert pre and all("pre2013" in r["methodology_version"] for r in pre)

def test_validation_samples_cover_all_core_and_no_unexplained_mismatch():
    s = list(csv.DictReader(open(os.path.join(ROOT, "reports/data_validation_samples.csv"), encoding="utf-8")))
    for i in CORE:
        assert sum(1 for x in s if x["indicator_id"] == i) >= 5, i
    assert not [x for x in s if x["match"] == "no"]

def test_quality_report_zero_errors():
    q = json.load(open(os.path.join(ROOT, "reports/data_quality_report.json"), encoding="utf-8"))
    assert q["errors"] == 0
