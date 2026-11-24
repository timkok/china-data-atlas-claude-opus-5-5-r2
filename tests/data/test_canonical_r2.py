"""R2 data tests on the canonical candidate and reconciliation outputs."""
import csv, json, os
from collections import Counter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
C = list(csv.DictReader(open(os.path.join(ROOT, "data/canonical_candidate/observations.csv"), encoding="utf-8")))
PUB = [r for r in C if r["publish_default"] == "true"]
CONF = list(csv.DictReader(open(os.path.join(ROOT, "data/reconciliation/conflicts.csv"), encoding="utf-8")))
VINT = list(csv.DictReader(open(os.path.join(ROOT, "data/canonical_candidate/vintages.csv"), encoding="utf-8")))
CORE = ["population", "birth_rate", "urbanization_rate", "population_65plus", "gdp", "gdp_per_capita", "disposable_income", "retail_sales", "higher_education_students", "higher_education_institutions", "physicians_per_1000", "hospital_beds_per_1000"]
def v(i, g, y): return next((float(r["value"]) for r in PUB if r["indicator_id"] == i and r["geo_code"] == g and r["year"] == str(y)), None)

def test_unique_published_key():
    k = Counter((r["indicator_id"], r["geo_code"], r["year"], r["methodology_version"]) for r in PUB)
    assert max(k.values()) == 1

def test_only_e2_plus_published():
    assert {r["evidence_level"] for r in PUB} <= {"E2", "E3", "E4"}
    assert all(r["publish_default"] == "false" for r in C if r["evidence_level"] in ("E0", "E1"))

def test_evidence_and_extraction_are_separate_fields():
    assert {r["extraction_method"] for r in PUB} <= {"API", "HTML", "Manual", "Derived"}

def test_core_12_latest_full_31():
    for i in CORE:
        ys = Counter(r["year"] for r in PUB if r["indicator_id"] == i and r["geo_level"] == "province")
        assert max(int(y) for y, n in ys.items() if n == 31) >= 2024, i

def test_at_least_30_indicators_published():
    assert len({r["indicator_id"] for r in PUB}) >= 30

def test_no_majority_vote_values():
    # canonical value must be the official-extraction value, never a value only another model had
    assert all(r["extraction_method"] != "R1-import" for r in PUB)

def test_known_revisions():
    assert v("gdp", "000000", 2023) == 1294271.7          # revised (NBS 2024-12-27), not 1,260,582
    assert v("gdp", "000000", 2024) == 1348066.2          # final verification (NBS 2025-12-26)
    assert any(x["indicator_id"] == "gdp" and x["geo_code"] == "000000" and x["year"] == "2023" and x["vintage_status"] == "superseded" for x in VINT)

def test_conflict_categories_valid_and_resolution_present():
    cats = {"Exact Match", "Match Within Official Rounding", "Unit Conversion Difference", "Definition Difference", "Official Revision", "Conflicting Value", "Source Not Verifiable"}
    assert {c["category"] for c in CONF} <= cats
    assert all(c["resolution"] for c in CONF)

def test_wikipedia_never_published():
    assert not any("wikipedia" in r["source_url"].lower() for r in PUB)

def test_pre2013_income_flagged():
    rows = [r for r in PUB if r["indicator_id"] == "disposable_income" and int(r["year"]) < 2013]
    assert rows and all(r["methodology_version"].endswith("pre2013-backcast") for r in rows)

def test_graduate_students_not_added_to_undergrad():
    assert not any(r["indicator_id"] == "higher_education_students" and r["geo_level"] == "national" and float(r["value"]) > 45_000_000 for r in PUB)

def test_update_simulation_passed():
    r = json.load(open(os.path.join(ROOT, "reports/update_test_report.json")))
    assert r["passed"] and r["checks"]["real_data_untouched"]
