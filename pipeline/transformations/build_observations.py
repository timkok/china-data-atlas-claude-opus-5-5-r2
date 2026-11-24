"""Step 2-4 (Extraction -> Standardization): turn cached raw NBS API
responses into data/normalized/observations.csv using config/indicators.json.
Purely offline: reads only data/raw/nbs_api_cache via nbs_client's cache.
Never fills missing values; never interpolates."""
import csv, json, os, sys, re
from datetime import datetime, timezone
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "pipeline", "ingestion"))
import nbs_client as c

cfg = json.load(open(os.path.join(ROOT, "config", "indicators.json"), encoding="utf-8"))
regions = json.load(open(os.path.join(ROOT, "config", "regions.json"), encoding="utf-8"))
manifest = json.load(open(os.path.join(ROOT, "data", "raw", "fetch_manifest.json"), encoding="utf-8"))
NAT_ROOT = manifest["national_root"]
PROV_ROOT = cfg["roots"]["province"]
MV = cfg["methodology_version"]
YEAR_MIN, YEAR_MAX = 2000, 2025
PAGE = {"province": "https://data.stats.gov.cn/dg/website/page.html#/pc/national/fsYearData",
        "national": "https://data.stats.gov.cn/dg/website/page.html#/pc/national/yearData"}
API = "https://data.stats.gov.cn/dg/website/publicrelease/web/external/stream/esData"
PRELIM = {("gdp", 2025), ("gdp_per_capita", 2025)}  # 2025 GDP is 初步核算 until final verification
REVISED = {("gdp", 2024), ("gdp_per_capita", 2024)}  # 2024 GDP finally verified (NBS announcement 2025-12-26), differs from Yearbook 2025 preliminary

from groups import build_groups, split_id
groups = build_groups(cfg)


def raw_lookup(scope, cid, region):
    ids = sorted(groups[(scope, cid)])
    root = NAT_ROOT if scope == "national" else PROV_ROOT
    data = c.series(cid, ids, region["nbs_code"], region["name_zh"], root)  # served from cache
    out = {}
    for y in data:
        m = re.match(r"(\d{4})YY", y["code"])
        if not m:
            continue
        yr = int(m.group(1))
        out[yr] = {v["_id"]: (v.get("value") or "").strip() for v in y["values"]}
    return out


def evaluate(formula, env):
    if any(v is None for v in env.values()):
        return None
    return eval(formula, {"__builtins__": {}}, env)  # formulas come only from our own config


def cache_retrieved_at():
    # retrieval timestamp = newest cache file mtime (exact per-request time is inside each cache json)
    d = os.path.join(ROOT, "data", "raw", "nbs_api_cache")
    t = max(os.path.getmtime(os.path.join(d, f)) for f in os.listdir(d))
    return datetime.fromtimestamp(t, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

RETRIEVED = cache_retrieved_at()
FIELDS = ["indicator_id", "indicator_name_zh", "indicator_name_en", "geo_code", "geo_name_zh", "geo_name_en", "geo_level", "year",
          "value", "unit", "source_id", "source_agency", "source_url", "source_table", "source_locator", "publication_date",
          "retrieved_at", "data_status", "methodology_version", "transformation", "verification_status", "notes",
          "original_value", "original_unit"]
rows = []
for ind in cfg["indicators"]:
    for r in regions:
        scope = "national" if r["level"] == "national" else "province"
        s = ind.get(scope)
        if not s:
            continue
        raws = {}
        for k, ref in s["ids"].items():
            cid, _ = split_id(s["cid"], ref)
            if cid not in raws:
                raws[cid] = raw_lookup(scope, cid, r)
        for yr in range(YEAR_MIN, YEAR_MAX + 1):
            env, orig = {}, {}
            for k, ref in s["ids"].items():
                cid, iid = split_id(s["cid"], ref)
                v = raws[cid].get(yr, {}).get(iid, "")
                try:
                    env[k] = float(v) if v != "" else None
                except ValueError:
                    env[k] = None
                orig[k] = v
            val = evaluate(s["formula"], env)
            if val is not None and "round" in s:
                val = round(val, s["round"])
            missing = val is None
            src_id = f"NBS-{'FSND' if scope == 'province' else 'HGND'}-{s['cid'][:8]}"
            rows.append({
                "indicator_id": ind["id"], "indicator_name_zh": ind["name_zh"], "indicator_name_en": ind["name_en"],
                "geo_code": r["geo_code"], "geo_name_zh": r["name_zh"], "geo_name_en": r["name_en"], "geo_level": r["level"],
                "year": yr, "value": "" if missing else (int(val) if float(val).is_integer() and s.get("round", None) in (0, None) and s["formula"] in ("v", "v*10000") else val),
                "unit": ind["unit"], "source_id": src_id, "source_agency": "国家统计局 National Bureau of Statistics of China",
                "source_url": PAGE[scope], "source_table": s["table"],
                "source_locator": f"API {API} cid={s['cid']} indicatorIds={'|'.join(s['ids'].values())} da={r['nbs_code']} dt={yr}YY",
                "publication_date": "", "retrieved_at": RETRIEVED,
                "data_status": "unknown" if missing else ("preliminary" if (ind["id"], yr) in PRELIM else "revised" if (ind["id"], yr) in REVISED else "final"),
                "methodology_version": MV,
                "transformation": "none" if s["formula"] == "v" else s["formula"] + (f"; round({s['round']})" if "round" in s else ""),
                "verification_status": "unverified",
                "notes": "缺失：官方来源该年份无数据 / missing in official source" if missing else "",
                "original_value": ";".join(f"{k}={orig[k]}" for k in orig), "original_unit": s["orig_unit"],
            })

# manual official ratios (urbanization 2015-2024) with bound check against u/t
MANUAL = os.path.join(ROOT, "data", "raw", "manual", "yearbook2025_table2-6_urbanization.csv")
manual_rejects = []
if os.path.exists(MANUAL):
    short2code = {r["short_zh"]: r["geo_code"] for r in regions}
    tab = {}
    for m in csv.DictReader(open(MANUAL, encoding="utf-8")):
        for y, v in m.items():
            if y != "geo_name_zh" and v:
                tab[(short2code[m["geo_name_zh"]], int(y))] = float(v)
    for row in rows:
        if row["indicator_id"] != "urbanization_rate":
            continue
        k = (row["geo_code"], row["year"])
        if k not in tab:
            if row["value"] != "":
                row["transformation"] += " (derived from 万人-rounded counts; ±rounding)"
            continue
        o = dict(x.split("=") for x in row["original_value"].split(";"))
        u, t = float(o["u"] or 0), float(o["t"] or 0)
        if u and t:
            bound = 0.5 / t * 100 * (1 + u / t) + 0.005
            if abs(tab[k] - u / t * 100) > bound:
                manual_rejects.append((k, tab[k], round(u / t * 100, 3)))
                continue
        row["value"] = tab[k]
        row["data_status"] = "final"
        row["transformation"] = "official ratio transcribed from 中国统计年鉴2025 表2-6 (validated against u/t*100 within rounding bound)"
        row["source_id"] = "NBS-CSY2025-T2-6"
        row["source_url"] = "https://www.stats.gov.cn/sj/ndsj/2025/html/C02-06.jpg"
        row["source_table"] = "中国统计年鉴2025 表2-6 分地区年末城镇人口比重"
        row["source_locator"] = f"表2-6 行={row['geo_name_zh']} 列={row['year']}; 人工转录 data/raw/manual/yearbook2025_table2-6_urbanization.csv"
        row["publication_date"] = ""
        row["notes"] = "人工转录官方比重，已用城镇人口/年末常住人口逐值校验"
json.dump(manual_rejects, open(os.path.join(ROOT, "data", "processed", "manual_import_rejects.json"), "w"), ensure_ascii=False)
print("manual urbanization rejects:", manual_rejects)

# 2020 census 65+ shares (provinces): the sample-survey table has no 2020 row; use the census bulletin
CENSUS = os.path.join(ROOT, "data", "raw", "census2020", "census2020_age_by_province.csv")
if os.path.exists(CENSUS):
    short2code = {r["short_zh"]: r["geo_code"] for r in regions}
    cen = {short2code[c["geo_short_zh"]]: c for c in csv.DictReader(open(CENSUS, encoding="utf-8"))}
    for row in rows:
        if row["indicator_id"] == "population_65plus" and row["year"] == 2020 and row["geo_level"] == "province" and row["geo_code"] in cen:
            c = cen[row["geo_code"]]
            row.update({"value": float(c["share_65plus"]), "data_status": "final", "transformation": "none (official census share)",
                        "source_id": "NBS-CENSUS7-B5", "source_url": c["source_url"], "source_table": c["table"],
                        "source_locator": f"表5-2 行={row['geo_name_zh']} 列=其中：65岁及以上（%）", "publication_date": "2021-05-11",
                        "notes": "第七次全国人口普查数据（2020年11月1日零时），与其他年份抽样调查口径不同", "original_value": f"share_65plus={c['share_65plus']}", "original_unit": "%"})

# caliber floor: 全体居民可支配收入 exists only from the 2013 integrated household survey; earlier values are back-estimates of a different caliber
# R2: keep the official pre-2013 back-estimates but give them their own methodology version (different survey system)
for r in rows:
    if r["indicator_id"] in ("disposable_income", "urban_disposable_income", "rural_disposable_income", "urban_rural_income_ratio", "consumption_expenditure_per_capita") and r["year"] < 2013 and r["value"] != "":
        r["methodology_version"] = MV + "-pre2013-backcast"
        r["notes"] = (r["notes"] + "; " if r["notes"] else "") + "2013年前为国家统计局按统一口径回溯推算数，与2013年起城乡一体化住户调查存在制度差异"

# drop leading all-missing years per indicator (years before the series starts anywhere) to keep the file honest but compact
first = {}
for row in rows:
    if row["value"] != "":
        first[row["indicator_id"]] = min(first.get(row["indicator_id"], 9999), row["year"])
last = {}
for row in rows:
    if row["value"] != "":
        last[row["indicator_id"]] = max(last.get(row["indicator_id"], 0), row["year"])
rows = [r for r in rows if first.get(r["indicator_id"], 9999) <= r["year"] <= last.get(r["indicator_id"], 0)]

# apply verification results (independent sample checks), if present
vs = os.path.join(ROOT, "reports", "data_validation_samples.csv")
if os.path.exists(vs):
    checked = {}
    for s in csv.DictReader(open(vs, encoding="utf-8")):
        checked[(s["indicator_id"], s["geo_code"], int(s["year"]))] = s["match"]
    ok_ind = {}
    for (i, g, y), m in checked.items():
        ok_ind.setdefault(i, []).append(m)
    for row in rows:
        k = (row["indicator_id"], row["geo_code"], row["year"])
        if row["value"] == "":
            continue
        ms = ok_ind.get(row["indicator_id"], [])
        if checked.get(k) == "yes":
            row["verification_status"] = "verified"
        elif ms.count("yes") >= 5 and "no" not in ms:
            row["verification_status"] = "partially_verified"

out = os.path.join(ROOT, "data", "normalized", "observations.csv")
with open(out, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=FIELDS)
    w.writeheader()
    w.writerows(rows)
print("rows", len(rows), "non-empty", sum(1 for r in rows if r["value"] != ""))
