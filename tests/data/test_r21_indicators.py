"""R2.1: tests for the 40 indicators added in methodology 2.1.0."""
import csv, json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CFG = json.load(open(os.path.join(ROOT, "config", "indicators.json"), encoding="utf-8"))
NEW = [i for i in CFG["indicators"] if i.get("added_in") == "2.1.0"]
ROWS = list(csv.DictReader(open(os.path.join(ROOT, "data", "normalized", "observations.csv"), encoding="utf-8")))
V = {(r["indicator_id"], r["geo_code"], int(r["year"])): r for r in ROWS}
SAMPLES = list(csv.DictReader(open(os.path.join(ROOT, "reports", "data_validation_samples.csv"), encoding="utf-8")))


def val(i, g, y):
    r = V.get((i, g, y))
    return float(r["value"]) if r and r["value"] != "" else None


def test_at_least_30_new_indicators_in_new_categories():
    assert len(NEW) >= 30
    assert {"labor", "tech", "society"} <= {i["category"] for i in NEW}
    assert CFG["methodology_version"] == "2.1.0"


def test_every_new_indicator_has_31_provinces():
    for ind in NEW:
        geos = {r["geo_code"] for r in ROWS if r["indicator_id"] == ind["id"] and r["value"] != "" and r["geo_code"] != "000000"}
        assert len(geos) == 31, ind["id"]


def test_national_pairing_or_documented():
    for ind in NEW:
        assert ind["national"], f"{ind['id']} has no national series"  # all 40 kept indicators are paired


def test_dropped_sparse_indicators_absent():
    ids = {i["id"] for i in CFG["indicators"]}
    assert not ({"urban_dibao_standard", "rural_dibao_standard"} & ids)


def test_index_to_growth_conversion():
    # national 2025: GDP index 105.0 -> 5.0 %, CPI 100.0 -> 0.0 %
    assert val("real_gdp_growth", "000000", 2025) == 5.0
    assert val("cpi_inflation", "000000", 2025) == 0.0
    assert V[("cpi_inflation", "000000", 2025)]["original_value"] == "v=100.0"
    assert val("cpi_inflation", "350000", 2024) == -0.1   # Fujian 99.9 (Yearbook 2025 table 5-4)


def test_usd_unit_conversion_matches_original():
    for (i, g, y), r in V.items():
        if i == "trade_total" and r["value"] != "":
            orig = float(r["original_value"].split("=")[1])
            div = 100000 if g != "000000" else 100     # 千美元 vs 百万美元 -> 亿美元
            assert abs(float(r["value"]) - round(orig / div, 2)) < 1e-9, (g, y)


def test_derived_per_capita_recomputes():
    for (i, g, y), r in V.items():
        if i == "private_cars_per_1000" and r["value"] != "":
            o = dict(kv.split("=") for kv in r["original_value"].split(";"))
            assert abs(float(r["value"]) - round(float(o["v"]) / float(o["t"]) * 1000, 1)) < 1e-9


def test_new_indicator_verification_coverage():
    new_ids = {i["id"] for i in NEW}
    s = [x for x in SAMPLES if x["indicator_id"] in new_ids]
    assert len(s) >= 40 and len({x["indicator_id"] for x in s}) >= 10
    assert all(x["match"] == "yes" for x in s), [x for x in s if x["match"] != "yes"]


def test_life_expectancy_only_census_years():
    years = {int(r["year"]) for r in ROWS if r["indicator_id"] == "life_expectancy" and r["value"] != "" and r["geo_code"] != "000000"}
    assert years <= {2000, 2010, 2020}
