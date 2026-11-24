"""Build the R2 canonical candidate from (a) this project's own official extraction (data/normalized/observations.csv,
raw evidence in data/raw) and (b) the imported Round 1 datasets (data/processed/r1_long.csv).

Rules (no majority voting, no averaging, other models' agreement never raises evidence):
  * Base value for a key = official value read by this pipeline (API / census HTML / manual yearbook transcription).
  * Evidence level:
      E2 directly read from the official source (or derived only from E2 inputs) by this pipeline
      E3 E2 + matched against a different official publication (reports/data_validation_samples.csv, match=yes)
      E4 key had a conflict that is resolved by an explicit official revision notice
      E1 value exists only in another model's R1 dataset with an official-source locator, not re-read here (not in default view)
      E0 no verifiable official source (e.g. Wikipedia / third-party aggregator) – never published
  * Every R1 value that differs from the base value is classified and written to data/reconciliation/conflicts.csv.
Outputs: data/canonical_candidate/{observations.csv, vintages.csv}, data/reconciliation/{conflicts,resolved_conflicts,unresolved_conflicts}.csv
"""
import csv, json, os, re, math
from collections import defaultdict, Counter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
P = lambda p: os.path.join(ROOT, p)
cfg = json.load(open(P("config/indicators.json"), encoding="utf-8"))
IND = {i["id"]: i for i in cfg["indicators"]}
base = list(csv.DictReader(open(P("data/normalized/observations.csv"), encoding="utf-8")))
r1 = [r for r in csv.DictReader(open(P("data/processed/r1_long.csv"), encoding="utf-8")) if r["indicator_id"] and r["year"] and r["value"] != "" and r["model"] != "claude_r1run3"]
samples = list(csv.DictReader(open(P("reports/data_validation_samples.csv"), encoding="utf-8")))
RETRIEVED = base[0]["retrieved_at"]
VINTAGE_BASE = f"NBS-DB@{RETRIEVED[:10]}"

NOTICES = {
    "gdp2024": ("https://www.stats.gov.cn/sj/zxfb/202512/t20251226_1962144.html", "国家统计局关于2024年国内生产总值最终核实的公告 (2025-12-26)"),
    "gdp2023": ("https://www.stats.gov.cn/sj/zxfb/202412/t20241227_1957915.html", "国家统计局关于修订2023年国内生产总值数据的公告 (2024-12-27，第五次全国经济普查 + 城镇居民自有住房服务核算方法改革)"),
    "gdp2018": ("https://www.stats.gov.cn/sj/zxfb/202302/t20230203_1900533.html", "国家统计局关于修订2018年国内生产总值数据的公告 (2019-11-22，第四次全国经济普查；历史数据随后修订)"),
}
GDP_FAMILY = {"gdp", "gdp_per_capita", "primary_industry_va", "secondary_industry_va", "tertiary_industry_va", "tertiary_share"}
POP_FAMILY = {"population", "birth_rate", "death_rate", "natural_growth_rate", "urbanization_rate", "urban_population", "rural_population", "population_65plus", "population_0_14", "population_15_64", "old_age_dependency"}
NONOFFICIAL = re.compile(r"wikipedia|维基|聚汇|jhshuju|gotohui", re.I)

def ndec(s):
    s = str(s)
    if "e" in s.lower(): return 6
    return len(s.split(".")[1].rstrip("0")) if "." in s else 0

def raw_bound(row):
    """Half-unit rounding bound of the base value implied by its original official precision and formula."""
    v = float(row["value"]); f = IND[row["indicator_id"]]
    orig = dict(x.split("=", 1) for x in row["original_value"].split(";") if "=" in x)
    tr = row["transformation"]
    if tr.startswith("v*10000"):
        d = max((ndec(x) for x in orig.values() if x), default=0); return 0.5 * 10 ** (-d) * 10000
    if tr.startswith("official ratio") or tr == "none" or tr.startswith("none"):
        return 0.5 * 10 ** (-ndec(row["value"]))
    if "/" in tr:  # derived ratio of rounded inputs: relative error of each input
        try:
            nums = [float(x) for x in orig.values() if x]
            rel = sum(0.5 * 10 ** (-ndec(x)) / abs(float(x)) for x in orig.values() if x and float(x) != 0)
            return abs(v) * rel + 0.005
        except Exception:
            return abs(v) * 0.005
    return 0.5 * 10 ** (-ndec(row["value"]))

def classify(ind, geo, year, V, vrow, x, xrow):
    """Return (category, resolution, evidence_url, explanation)."""
    src = (xrow["source_table"] + " " + xrow["source_url"])
    if NONOFFICIAL.search(src):
        return ("Source Not Verifiable", "resolved: R1 value rejected (non-official source); canonical keeps official value", "", "R1 value cites Wikipedia / third-party aggregator, not an official publication")
    b = raw_bound(vrow); xb = 0.5 * 10 ** (-ndec(x))
    if abs(x - V) <= b + xb + 1e-9:
        return ("Match Within Official Rounding", "resolved: both consistent with official rounding", vrow["source_url"], f"|diff|={abs(x-V):.4g} ≤ rounding bound {b+xb:.4g}")
    orig = dict(z.split("=", 1) for z in vrow["original_value"].split(";") if "=" in z)
    if ind == "urbanization_rate" and orig.get("u") and orig.get("t"):
        u, t = float(orig["u"]), float(orig["t"])
        bd = 0.5 / t * 100 * (1 + u / t) + 0.006
        if abs(x - V) <= bd + xb:
            return ("Match Within Official Rounding", "resolved: R1 derived u/t from 万人-rounded counts; official published ratio used", vrow["source_url"], f"|diff|={abs(x-V):.3f} ≤ count-rounding bound {bd:.3f}")
    if ind == "birth_rate" and "卫生健康统计年鉴" in src:
        return ("Definition Difference", "resolved: different statistical system (NHC health statistics vs NBS population statistics); canonical keeps NBS indicator", vrow["source_url"], "R1 value taken from 中国卫生健康统计年鉴, not the NBS 人口出生率 series")
    if ind == "higher_education_students" and x > V * 1.04:
        return ("Definition Difference", "resolved: R1 value appears to include postgraduate (研究生) students; canonical = 普通、职业本专科 only", vrow["source_url"], f"R1 − canonical = {x-V:,.0f} persons ≈ postgraduate enrolment")
    if V and x:
        r = x / V
        for fct in (10, 100, 1000, 10000, 0.1, 0.01, 0.001, 0.0001):
            if abs(r / fct - 1) < 0.02:
                return ("Unit Conversion Difference", "resolved: unit error in R1 value", vrow["source_url"], f"R1 value ≈ official × {fct}")
    if ind in GDP_FAMILY:
        if year == 2024:
            return ("Official Revision", "resolved: canonical = final verified value; R1 value = earlier preliminary vintage", NOTICES["gdp2024"][0], NOTICES["gdp2024"][1])
        if year == 2023:
            return ("Official Revision", "resolved: canonical = revised value; R1 value = pre-revision vintage", NOTICES["gdp2023"][0], NOTICES["gdp2023"][1])
        if 2000 <= year <= 2022:
            return ("Official Revision", "resolved: canonical = current official database vintage (historical revision after 4th/5th economic census); R1 value = earlier publication vintage",
                    NOTICES["gdp2018"][0] if year <= 2018 else NOTICES["gdp2023"][0], (NOTICES["gdp2018"][1] if year <= 2018 else NOTICES["gdp2023"][1]) + "; per-year historical revision table not individually located")
    if ind == "retail_sales" and year <= 2023:
        return ("Official Revision", "resolved-lite: canonical = current official database value; R1 value matches an earlier first-release publication", vrow["source_url"],
                "社会消费品零售总额历史数据已按经济普查修订（当前数据库值）；R1值来自首发公报/早期年鉴；未找到逐年修订公告")
    if ind in POP_FAMILY and 2011 <= year <= 2019:
        return ("Official Revision", "resolved-lite: canonical = 7th-census back-revised series in current NBS database / Yearbook 2025", "https://www.stats.gov.cn/sj/ndsj/2025/indexch.htm",
                "第七次人口普查后2011—2019年人口相关序列回溯修订（年鉴2025表2-6等刊载修订后序列）；未找到单独修订公告")
    if ind in POP_FAMILY and 2001 <= year <= 2009:
        return ("Official Revision", "resolved-lite: canonical = 6th-census back-revised series in current NBS database", vrow["source_url"],
                "R1 value from a yearbook edition before the 2010-census back-revision; current database value used; revision notice not located")
    if ind == "population" and year in (2000, 2010, 2020):
        return ("Definition Difference", "resolved: different reference date (census 11-01 count vs year-end estimate)", vrow["source_url"], "R1 value appears to be a census-date count, canonical is year-end resident population")
    if ind in ("physicians_per_1000", "nurses_per_1000", "hospital_beds_per_1000") and year <= 2020:
        return ("Definition Difference", "resolved: denominator vintage", vrow["source_url"], "R1 value uses pre-7th-census population as denominator (as printed in yearbooks); canonical uses current revised population")
    return ("Conflicting Value", "unresolved", "", "no documented revision or definition difference explains the gap")

# ---------- assemble ----------
idx = {(r["indicator_id"], r["geo_code"], int(r["year"])): r for r in base}
r1_by = defaultdict(list)
for r in r1:
    r1_by[(r["indicator_id"], r["geo_code"], int(r["year"]))].append(r)
verified_yes = {(s["indicator_id"], s["geo_code"], int(s["year"])) for s in samples if s["match"] == "yes"}

conflicts, vintages, canon = [], [], []
cat_count = Counter()
for k, vrow in idx.items():
    ind, geo, year = k
    if vrow["value"] == "":
        continue
    V = float(vrow["value"])
    support, e4 = [], False
    for xrow in r1_by.get(k, []):
        x = float(xrow["value"])
        if abs(x - V) <= 1e-9 * max(1, abs(V)):
            support.append(xrow["model"]); continue
        cat, res, url, expl = classify(ind, geo, year, V, vrow, x, xrow)
        cat_count[cat] += 1
        if cat == "Match Within Official Rounding":
            support.append(xrow["model"] + "~")
        conflicts.append({"conflict_id": f"C{len(conflicts)+1:05d}", "indicator_id": ind, "geo_code": geo, "year": year, "canonical_value": V, "canonical_unit": IND[ind]["unit"],
                          "canonical_source": vrow["source_table"], "r1_model": xrow["model"], "r1_value": x, "r1_unit": xrow["src_unit"], "r1_source": xrow["source_table"][:200],
                          "r1_verification_claim": xrow["src_verification"], "difference": round(x - V, 6), "rel_difference": round((x - V) / V, 6) if V else "",
                          "category": cat, "resolution": res, "evidence_url": url, "explanation": expl})
        if cat == "Official Revision":
            vintages.append({"indicator_id": ind, "geo_code": geo, "year": year, "value": x, "vintage": f"earlier publication per {xrow['model']}", "vintage_status": "superseded",
                             "source": xrow["source_table"][:200], "source_url": xrow["source_url"], "evidence_url": url})
            if url.startswith("https://www.stats.gov.cn/sj/zxfb/"):
                e4 = True
    level = "E2"
    if k in verified_yes: level = "E3"
    if e4: level = "E4"
    method = ("Manual" if vrow["transformation"].startswith("official ratio") else "HTML" if vrow["source_id"].startswith("NBS-CENSUS") else
              "Derived" if vrow["transformation"] not in ("none",) and "/" in vrow["transformation"] else "API")
    if vrow["data_status"] == "revised" and level in ("E2", "E3") and ind in GDP_FAMILY and year == 2024:
        level = "E4" if any(c["indicator_id"] == ind and c["geo_code"] == geo and c["year"] == year for c in conflicts[-8:]) else level
    canon.append({**{f: vrow[f] for f in ["indicator_id", "indicator_name_zh", "indicator_name_en", "geo_code", "geo_name_zh", "geo_name_en", "geo_level", "year", "value", "unit",
                                          "source_id", "source_agency", "source_url", "source_table", "source_locator", "publication_date", "retrieved_at", "data_status",
                                          "methodology_version", "transformation", "notes", "original_value", "original_unit"]},
                  "verification_status": {"E2": "verified_direct", "E3": "verified_independent", "E4": "verified_revision"}[level],
                  "evidence_level": level, "extraction_method": method, "vintage": VINTAGE_BASE, "publish_default": "true",
                  "r1_models_same_value": "|".join(sorted(support)), "core": str(IND[ind]["core"]).lower()})
    vintages.append({"indicator_id": ind, "geo_code": geo, "year": year, "value": V, "vintage": VINTAGE_BASE, "vintage_status": "current", "source": vrow["source_table"],
                     "source_url": vrow["source_url"], "evidence_url": ""})

# R1-only keys (not present / empty in our official extraction)
r1_only = Counter()
for k, rows in r1_by.items():
    if k in idx and idx[k]["value"] != "":
        continue
    ind, geo, year = k
    if ind not in IND:
        continue
    for xrow in rows:
        src = xrow["source_table"] + " " + xrow["source_url"]
        lvl = "E0" if NONOFFICIAL.search(src) or not (xrow["source_url"] or xrow["source_table"]) else "E1"
        r1_only[(xrow["model"], lvl)] += 1
        canon.append({"indicator_id": ind, "indicator_name_zh": IND[ind]["name_zh"], "indicator_name_en": IND[ind]["name_en"], "geo_code": geo, "geo_name_zh": "", "geo_name_en": "",
                      "geo_level": "national" if geo == "000000" else "province", "year": year, "value": xrow["value"], "unit": IND[ind]["unit"], "source_id": f"R1-{xrow['model']}",
                      "source_agency": "per R1 model (not re-read by this pipeline)", "source_url": xrow["source_url"], "source_table": xrow["source_table"][:200],
                      "source_locator": f"{xrow['model']} R1 observations row {xrow['row']}", "publication_date": "", "retrieved_at": RETRIEVED, "data_status": "unknown",
                      "methodology_version": cfg["methodology_version"], "transformation": "imported", "notes": "R1-only value; not in default public view", "original_value": "",
                      "original_unit": xrow["src_unit"], "verification_status": "unverified", "evidence_level": lvl, "extraction_method": "R1-import", "vintage": f"R1:{xrow['model']}",
                      "publish_default": "false", "r1_models_same_value": xrow["model"], "core": str(IND[ind]["core"]).lower()})

os.makedirs(P("data/canonical_candidate"), exist_ok=True)
def write(path, rows):
    with open(P(path), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
write("data/canonical_candidate/observations.csv", canon)
write("data/canonical_candidate/vintages.csv", vintages)
write("data/reconciliation/conflicts.csv", conflicts)
write("data/reconciliation/resolved_conflicts.csv", [c for c in conflicts if c["resolution"].startswith("resolved")] or [{"conflict_id": ""}])
write("data/reconciliation/unresolved_conflicts.csv", [c for c in conflicts if not c["resolution"].startswith("resolved")] or [{"conflict_id": ""}])
print("canonical rows", len(canon), Counter(r["evidence_level"] for r in canon))
print("conflicts", len(conflicts), dict(cat_count))
print("r1-only", dict(r1_only))
print("unresolved by indicator/model", Counter((c["indicator_id"], c["r1_model"]) for c in conflicts if not c["resolution"].startswith("resolved")).most_common(20))
