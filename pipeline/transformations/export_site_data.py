"""Step 5 (Versioned database -> static data for the website).
Builds:
  data/processed/atlas.duckdb            (queryable versioned DB, if duckdb is installed)
  data/processed/observations.parquet    (if pyarrow/duckdb available)
  app/src/data/site.json                 (metadata + summaries + findings, used at build time)
  app/public/data/<indicator>.json       (geo x year matrices for client charts)
  app/public/downloads/observations.csv  (exact copy of the normalized CSV)
All numbers shown on the site come from these files, which come only from
observations.csv. Findings are computed here, never written by hand."""
import csv, json, os, shutil, statistics
from collections import defaultdict
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
APP = os.path.join(ROOT, "app")
cfg = json.load(open(os.path.join(ROOT, "config/indicators.json"), encoding="utf-8"))
regions = json.load(open(os.path.join(ROOT, "config/regions.json"), encoding="utf-8"))
quality = json.load(open(os.path.join(ROOT, "reports/data_quality_report.json"), encoding="utf-8"))
rows = list(csv.DictReader(open(os.path.join(ROOT, "data/normalized/observations.csv"), encoding="utf-8")))
GEO = {r["geo_code"]: r for r in regions}
PROV = [r["geo_code"] for r in regions if r["level"] == "province"]

series = defaultdict(dict)   # (ind, geo) -> {year: value}
meta = {}                    # (ind, geo, year) -> row subset
for r in rows:
    if r["value"] != "":
        series[(r["indicator_id"], r["geo_code"])][int(r["year"])] = float(r["value"])
    meta[(r["indicator_id"], r["geo_code"], int(r["year"]))] = r

os.makedirs(os.path.join(APP, "public/data"), exist_ok=True)
os.makedirs(os.path.join(APP, "public/downloads"), exist_ok=True)
os.makedirs(os.path.join(APP, "src/data"), exist_ok=True)
shutil.copy(os.path.join(ROOT, "data/normalized/observations.csv"), os.path.join(APP, "public/downloads/observations.csv"))
shutil.copy(os.path.join(ROOT, "reports/coverage_matrix.csv"), os.path.join(APP, "public/downloads/coverage_matrix.csv"))
shutil.copy(os.path.join(ROOT, "reports/data_validation_samples.csv"), os.path.join(APP, "public/downloads/data_validation_samples.csv"))


def rank_desc(vals):
    """competition ranking (1,2,2,4) on descending values; missing excluded"""
    items = sorted([(g, v) for g, v in vals.items() if v is not None], key=lambda x: -x[1])
    out, prev, prev_rank = {}, None, 0
    for i, (g, v) in enumerate(items, 1):
        if v != prev:
            prev_rank = i
        out[g] = prev_rank
        prev = v
    return out

indicators_out = []
for ind in cfg["indicators"]:
    iid = ind["id"]
    years = sorted({int(r["year"]) for r in rows if r["indicator_id"] == iid})
    matrix = {g: {str(y): series[(iid, g)].get(y) for y in years} for g in ["000000"] + PROV}
    status = {g: {str(y): (meta[(iid, g, y)]["data_status"][0] + meta[(iid, g, y)]["verification_status"][0]) for y in years if (iid, g, y) in meta and meta[(iid, g, y)]["value"] != ""} for g in ["000000"] + PROV}
    s = quality["indicator_summary"][iid]
    lp, ln = s["latest_province_year"], s["latest_national_year"]
    latest = {g: series[(iid, g)].get(lp) for g in PROV}
    ranks = rank_desc(latest)
    nat_latest = series[(iid, "000000")].get(ln)
    nat_prev = series[(iid, "000000")].get(ln - 1) if ln else None
    vals = [v for v in latest.values() if v is not None]
    top = sorted([(g, v) for g, v in latest.items() if v is not None], key=lambda x: -x[1])
    findings = []
    if top:
        hi, lo = top[0], top[-1]
        findings.append({"zh": f"{lp}年{ind['name_zh'].replace('（扩展）','')}最高的是{GEO[hi[0]]['short_zh']}（{hi[1]:g} {ind['unit']}），最低的是{GEO[lo[0]]['short_zh']}（{lo[1]:g} {ind['unit']}）。", "type": "fact"})
        if lo[1] > 0 and ind["unit"] not in ("‰",):
            findings.append({"zh": f"最高省份是最低省份的 {hi[1]/lo[1]:.1f} 倍（{lp}年，计算值 = 最高值 ÷ 最低值）。", "type": "calculation"})
        if nat_latest is not None and ln == lp:
            above = sum(1 for v in vals if v > nat_latest)
            findings.append({"zh": f"{lp}年有 {above} 个省份高于全国水平（全国 {nat_latest:g} {ind['unit']}）。", "type": "calculation"})
    # change since 2015 (only if both years exist and same caliber)
    base = 2015
    ch = {g: (series[(iid, g)].get(lp), series[(iid, g)].get(base)) for g in PROV}
    ch = {g: (a - b) for g, (a, b) in ch.items() if a is not None and b is not None}
    if ch and ind["unit"] in ("%", "‰", "人/千人", "张/千人"):
        g_up = max(ch, key=ch.get); g_dn = min(ch, key=ch.get)
        findings.append({"zh": f"{base}—{lp}年变化最大：{GEO[g_up]['short_zh']} {ch[g_up]:+.2f}，{GEO[g_dn]['short_zh']} {ch[g_dn]:+.2f}（单位：{ind['unit']}，百分点/千分点差值）。", "type": "calculation"})
    elif ch:
        pct = {g: series[(iid, g)][lp] / series[(iid, g)][base] - 1 for g in ch if series[(iid, g)][base]}
        g_up = max(pct, key=pct.get); g_dn = min(pct, key=pct.get)
        findings.append({"zh": f"{base}—{lp}年增幅最大的是{GEO[g_up]['short_zh']}（{pct[g_up]*100:+.1f}%），最小的是{GEO[g_dn]['short_zh']}（{pct[g_dn]*100:+.1f}%）。", "type": "calculation"})
    sample_meta = next((meta[k] for k in meta if k[0] == iid and k[1] == "440000"), None)
    nat_meta = next((meta[k] for k in meta if k[0] == iid and k[1] == "000000"), None)
    indicators_out.append({
        **{k: ind[k] for k in ("id", "core", "category", "name_zh", "name_en", "unit", "unit_en", "agg", "definition_zh", "official_name_zh")},
        "years": years, "first_year": years[0] if years else None,
        "latest_province_year": lp, "latest_national_year": ln,
        "national_latest": nat_latest, "national_prev": nat_prev,
        "yoy_comparable": nat_prev is not None,
        "latest_province_coverage": s["latest_province_coverage"], "continuity_since_2015": s["continuity_since_2015"],
        "valid_observations": s["valid_observations"],
        "ranking": [{"geo": g, "rank": ranks.get(g), "value": latest[g]} for g in sorted(PROV, key=lambda g: (ranks.get(g, 99), g))],
        "findings": findings,
        "source": {"province_table": ind["province"]["table"], "national_table": ind["national"]["table"],
                    "province_url": sample_meta["source_url"] if sample_meta else None, "national_url": nat_meta["source_url"] if nat_meta else None,
                    "province_transformation": ind["province"]["formula"], "national_transformation": ind["national"]["formula"],
                    "province_orig_unit": ind["province"]["orig_unit"], "national_orig_unit": ind["national"]["orig_unit"],
                    "retrieved_at": sample_meta["retrieved_at"] if sample_meta else None,
                    "province_cid": ind["province"]["cid"], "national_cid": ind["national"]["cid"],
                    "province_ids": ind["province"]["ids"], "national_ids": ind["national"]["ids"]},
    })
    json.dump({"id": iid, "years": years, "matrix": matrix, "status": status}, open(os.path.join(APP, f"public/data/{iid}.json"), "w"), ensure_ascii=False, separators=(",", ":"))

# homepage findings: pick a few cross-indicator facts
def latest_val(iid, g):
    s = next(i for i in indicators_out if i["id"] == iid)
    return series[(iid, g)].get(s["latest_province_year"]), s["latest_province_year"]
home = []
for iid in ("population", "birth_rate", "gdp_per_capita", "population_65plus", "physicians_per_1000", "urbanization_rate"):
    i = next(x for x in indicators_out if x["id"] == iid)
    if i["findings"]:
        home.append({"indicator": iid, "name_zh": i["name_zh"], "text": i["findings"][0]["zh"]})
# national natural growth negative streak
ng = series[("natural_growth_rate", "000000")]
neg_years = sorted(y for y, v in ng.items() if v < 0)
if neg_years:
    home.append({"indicator": "natural_growth_rate", "name_zh": "人口自然增长率", "text": f"全国人口自然增长率自{neg_years[0]}年起为负值（{neg_years[0]}年 {ng[neg_years[0]]:g}‰，{neg_years[-1]}年 {ng[neg_years[-1]]:g}‰）。"})

site = {
    "generated_at": rows[0]["retrieved_at"],
    "methodology_version": cfg["methodology_version"],
    "regions": regions,
    "indicators": indicators_out,
    "home_findings": home,
    "stats": {"unique_valid_observations": quality["unique_valid_observations"], "verified_observations": quality["verified_observations"],
              "partially_verified_observations": quality["partially_verified_observations"], "core_indicators": sum(1 for i in indicators_out if i["core"]),
              "extension_indicators": sum(1 for i in indicators_out if not i["core"]), "regions": len(PROV),
              "earliest_year": min(i["first_year"] for i in indicators_out), "latest_year": max(i["latest_province_year"] for i in indicators_out),
              "official_sources": 2, "qa_errors": quality["errors"], "qa_warnings": quality["warnings"]},
}
json.dump(site, open(os.path.join(APP, "src/data/site.json"), "w"), ensure_ascii=False, indent=0)

# optional versioned DB / parquet
try:
    import duckdb
    db = os.path.join(ROOT, "data/processed/atlas.duckdb")
    if os.path.exists(db):
        os.remove(db)
    con = duckdb.connect(db)
    con.execute(f"CREATE TABLE observations AS SELECT * FROM read_csv_auto('{os.path.join(ROOT, 'data/normalized/observations.csv')}', all_varchar=true)")
    con.execute("ALTER TABLE observations ADD COLUMN value_num DOUBLE; UPDATE observations SET value_num = TRY_CAST(value AS DOUBLE)")
    con.execute(f"CREATE TABLE dataset_version AS SELECT '{cfg['methodology_version']}' AS methodology_version, '{rows[0]['retrieved_at']}' AS retrieved_at, now() AS built_at")
    con.execute(f"COPY observations TO '{os.path.join(ROOT, 'data/processed/observations.parquet')}' (FORMAT PARQUET)")
    con.close()
    print("duckdb + parquet written")
except Exception as e:
    print("duckdb step skipped:", e)
print("site.json indicators:", len(indicators_out), "home findings:", len(home))
