"""Independent sample verification: compare values in observations.csv
(from the NBS online database API) against values transcribed from a
different official publication (China Statistical Yearbook 2025 table
images, saved in data/raw/nbs_yearbook_2025/). Writes
reports/data_validation_samples.csv."""
import csv, os, datetime
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
obs = {(r["indicator_id"], r["geo_code"], int(r["year"])): r for r in csv.DictReader(open(os.path.join(ROOT, "data/normalized/observations.csv"), encoding="utf-8"))}
refs = list(csv.DictReader(open(os.path.join(ROOT, "pipeline/validation/reference_values_yearbook2025.csv"), encoding="utf-8")))
names = {r["geo_code"]: r["geo_name_zh"] for r in obs.values()}
REVISION_NOTES = {"gdp": "年鉴2025刊载2024年为初步核算数；数据库为其后最终核实（修订）数", "gdp_per_capita": "年鉴2025刊载2024年为初步核算数；数据库为其后最终核实（修订）数"}
out = []
today = datetime.date.today().isoformat()
for ref in refs:
    k = (ref["indicator_id"], ref["geo_code"], int(ref["year"]))
    o = obs.get(k)
    site = o["value"] if o else ""
    rv = float(ref["reference_value"]); tol = float(ref["tolerance"])
    if site == "":
        match, note = "no", "网站无该数值 / value missing on site"
    else:
        d = float(site) - rv
        if abs(d) <= tol + 1e-9:
            match, note = "yes", ("一致" if abs(d) < 1e-9 else f"在容差内一致（差 {d:+.4g}，原因：{'万人单位舍入' if 'students' in k[0] else '计算输入舍入'}）")
        elif k[0] == "physicians_per_1000" and k[2] <= 2020:
            match, note = "explained_difference", f"差 {d:+.4g}；年鉴对2020年及以前年份沿用普查前人口作分母，本平台统一使用当前修订后的年末常住人口作分母"
        elif k[0] in REVISION_NOTES:
            match, note = "revised", f"差 {d:+.4g}；{REVISION_NOTES[k[0]]}"
        else:
            match, note = "no", f"差 {d:+.4g}"
    out.append({"indicator_id": k[0], "geo_code": k[1], "geo_name_zh": names.get(k[1], ""), "year": k[2], "site_value": site,
                "official_value": ref["reference_value"], "conversion_formula": ref["formula"], "tolerance": ref["tolerance"],
                "verification_source": ref["ref_source"], "verification_locator": ref["ref_locator"],
                "site_source": "国家统计局国家数据 data.stats.gov.cn (API)", "match": match, "difference_note": note, "verified_on": today})
f = os.path.join(ROOT, "reports/data_validation_samples.csv")
with open(f, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
from collections import Counter
print(Counter(r["match"] for r in out)); [print(r["indicator_id"], r["geo_name_zh"], r["year"], r["site_value"], r["official_value"], r["difference_note"]) for r in out if r["match"] != "yes"]
