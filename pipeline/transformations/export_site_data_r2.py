"""R2 static data export. Reads ONLY data/canonical_candidate/* and data/reconciliation/* (the published layer).
Writes app/src/data/site.json and app/public/data/** shards (per indicator / per province), downloads, and data stories.
Default public view = publish_default == true (E2+). E0/E1 rows are exported only into the quality/conflict views."""
import csv, json, os, math, statistics, shutil
from collections import defaultdict, Counter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
P = lambda p: os.path.join(ROOT, p)
APP = P("app")
cfg = json.load(open(P("config/indicators.json"), encoding="utf-8"))
regions = json.load(open(P("config/regions.json"), encoding="utf-8"))
IND = {i["id"]: i for i in cfg["indicators"]}
GEO = {r["geo_code"]: r for r in regions}
PROV = [r["geo_code"] for r in regions if r["level"] == "province"]
canon = list(csv.DictReader(open(P("data/canonical_candidate/observations.csv"), encoding="utf-8")))
pub = [r for r in canon if r["publish_default"] == "true" and r["value"] != ""]
vint = list(csv.DictReader(open(P("data/canonical_candidate/vintages.csv"), encoding="utf-8")))
conf = list(csv.DictReader(open(P("data/reconciliation/conflicts.csv"), encoding="utf-8")))
quality = json.load(open(P("reports/data_quality_report.json"), encoding="utf-8"))

for d in ["public/data/ind", "public/data/prov", "public/data/conflicts", "public/downloads", "src/data"]:
    os.makedirs(os.path.join(APP, d), exist_ok=True)

S = defaultdict(dict); M = {}
for r in pub:
    k = (r["indicator_id"], r["geo_code"], int(r["year"]))
    S[(k[0], k[1])][k[2]] = float(r["value"]); M[k] = r
VINT = defaultdict(list)
for v in vint:
    VINT[(v["indicator_id"], v["geo_code"], int(v["year"]))].append(v)

def rank_desc(vals):
    items = sorted([(g, v) for g, v in vals.items() if v is not None], key=lambda x: -x[1]); out = {}; prev = None; pr = 0
    for i, (g, v) in enumerate(items, 1):
        if v != prev: pr = i
        out[g] = pr; prev = v
    return out

def fmtv(v, unit):
    d = {"万人": 0, "人": 0, "所": 0, "个": 0, "元": 0, "亿元": 1, "万张": 2, "亿人次": 2, "万公里": 2}.get(unit, 2)
    return f"{v:,.{d}f}"

ind_out = []
for iid, ind in IND.items():
    years = sorted({y for (i, g), s in S.items() if i == iid for y in s})
    if not years:
        continue
    pyears = sorted({y for g in PROV for y in S.get((iid, g), {})})
    nyears = sorted(S.get((iid, "000000"), {}))
    lp = max([y for y in pyears if all(y in S.get((iid, g), {}) for g in PROV)], default=(max(pyears) if pyears else None))
    lp_any = max(pyears) if pyears else None
    ln = max(nyears) if nyears else None
    matrix = {g: {str(y): S.get((iid, g), {}).get(y) for y in years} for g in ["000000"] + PROV}
    status = {}
    for g in ["000000"] + PROV:
        for y in years:
            r = M.get((iid, g, y))
            if r:
                status.setdefault(g, {})[str(y)] = r["data_status"][0] + r["evidence_level"][1]
    vin = {}
    for g in ["000000"] + PROV:
        for y in years:
            vs = VINT.get((iid, g, y), [])
            if len(vs) > 1:
                vin.setdefault(g, {})[str(y)] = [{"v": float(x["value"]), "vintage": x["vintage"], "status": x["vintage_status"], "source": x["source"][:120], "evidence": x["evidence_url"]} for x in vs]
    lvl = Counter(M[k]["evidence_level"] for k in M if k[0] == iid)
    nconf = Counter(c["category"] for c in conf if c["indicator_id"] == iid)
    unresolved = sum(1 for c in conf if c["indicator_id"] == iid and not c["resolution"].startswith("resolved"))
    latest = {g: S.get((iid, g), {}).get(lp) for g in PROV} if lp else {}
    ranks = rank_desc(latest)
    vals = [v for v in latest.values() if v is not None]
    nat_latest = S.get((iid, "000000"), {}).get(ln) if ln else None
    nat_prev = S.get((iid, "000000"), {}).get(ln - 1) if ln else None
    findings = []
    if vals:
        top = sorted([(g, v) for g, v in latest.items() if v is not None], key=lambda x: -x[1])
        hi, lo = top[0], top[-1]
        findings.append({"zh": f"{lp}年{ind['name_zh']}最高的是{GEO[hi[0]]['short_zh']}（{fmtv(hi[1], ind['unit'])} {ind['unit']}），最低的是{GEO[lo[0]]['short_zh']}（{fmtv(lo[1], ind['unit'])} {ind['unit']}）。", "type": "fact"})
        if lo[1] > 0 and ind["unit"] not in ("‰", "%", "倍"):
            findings.append({"zh": f"最高省份是最低省份的 {hi[1]/lo[1]:.1f} 倍（{lp}年；衍生计算 = 最高值 ÷ 最低值）。", "type": "calculation"})
        if nat_latest is not None and ln == lp:
            findings.append({"zh": f"{lp}年有 {sum(1 for v in vals if v > nat_latest)} 个省份高于全国值（{fmtv(nat_latest, ind['unit'])} {ind['unit']}）。", "type": "calculation"})
        med = statistics.median(vals); q1, q3 = statistics.quantiles(vals, n=4)[0], statistics.quantiles(vals, n=4)[2]
        iqr = q3 - q1; outl = [GEO[g]["short_zh"] for g, v in latest.items() if v is not None and (v > q3 + 1.5 * iqr or v < q1 - 1.5 * iqr)]
        dist = {"median": med, "q1": q1, "q3": q3, "min": min(vals), "max": max(vals), "outliers": outl}
    else:
        dist = None
    # biggest moves since 2015 (comparable only if no caliber break in between, flagged on page)
    moves = []
    if lp and 2015 in pyears:
        for g in PROV:
            a, b = S.get((iid, g), {}).get(2015), S.get((iid, g), {}).get(lp)
            if a is not None and b is not None:
                moves.append({"geo": g, "from": a, "to": b, "abs": b - a, "pct": (b / a - 1) * 100 if a else None})
    moves.sort(key=lambda m: -(m["pct"] if m["pct"] is not None and ind["unit"] not in ("%", "‰", "倍") else m["abs"]))
    src_p, src_n = ind.get("province") or {}, ind.get("national") or {}
    anyrow = next((M[k] for k in M if k[0] == iid), None)
    ind_out.append({
        **{k: ind[k] for k in ("id", "core", "category", "name_zh", "name_en", "unit", "agg", "definition_zh", "official_name_zh")},
        "years": years, "first_year": years[0], "province_years": [pyears[0], pyears[-1]] if pyears else None,
        "latest_province_year": lp, "latest_province_year_any": lp_any, "latest_national_year": ln,
        "national_latest": nat_latest, "national_prev": nat_prev,
        "latest_province_coverage": (len(vals) / 31) if vals else 0, "valid_observations": sum(1 for k in M if k[0] == iid),
        "evidence": dict(lvl), "conflicts": dict(nconf), "unresolved_conflicts": unresolved,
        "ranking": [{"geo": g, "rank": ranks.get(g), "value": latest.get(g)} for g in sorted(PROV, key=lambda g: (ranks.get(g, 99), g))] if lp else [],
        "findings": findings, "distribution": dist, "moves": moves[:5] + moves[-5:] if len(moves) > 10 else moves,
        "has_province": bool(src_p), "has_national": bool(src_n),
        "source": {"province_table": src_p.get("table"), "national_table": src_n.get("table"), "province_transformation": src_p.get("formula"), "national_transformation": src_n.get("formula"),
                    "province_orig_unit": src_p.get("orig_unit"), "national_orig_unit": src_n.get("orig_unit"), "province_cid": src_p.get("cid"), "national_cid": src_n.get("cid"),
                    "province_ids": src_p.get("ids"), "national_ids": src_n.get("ids"),
                    "province_url": "https://data.stats.gov.cn/dg/website/page.html#/pc/national/fsYearData", "national_url": "https://data.stats.gov.cn/dg/website/page.html#/pc/national/yearData",
                    "retrieved_at": anyrow["retrieved_at"] if anyrow else None},
    })
    json.dump({"id": iid, "years": years, "matrix": matrix, "status": status, "vintages": vin}, open(os.path.join(APP, f"public/data/ind/{iid}.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    cs = [{k: c[k] for k in ("conflict_id", "geo_code", "year", "canonical_value", "r1_model", "r1_value", "r1_source", "r1_verification_claim", "category", "resolution", "evidence_url", "explanation")} for c in conf if c["indicator_id"] == iid]
    json.dump(cs, open(os.path.join(APP, f"public/data/conflicts/{iid}.json"), "w"), ensure_ascii=False, separators=(",", ":"))

IDS = [i["id"] for i in ind_out]
# province shards: latest value + rank + national for each indicator, plus short series for key indicators
for g in PROV:
    rows = []
    for i in ind_out:
        iid = i["id"]; y = i["latest_province_year"]
        if not y: continue
        v = S.get((iid, g), {}).get(y); nat = S.get((iid, "000000"), {}).get(y)
        rk = next((r["rank"] for r in i["ranking"] if r["geo"] == g), None)
        r = M.get((iid, g, y))
        rows.append({"id": iid, "year": y, "value": v, "national": nat, "rank": rk, "evidence": r["evidence_level"] if r else None,
                     "series": {str(yy): S.get((iid, g), {}).get(yy) for yy in range(2005, 2026) if S.get((iid, g), {}).get(yy) is not None}})
    json.dump({"geo": g, "rows": rows}, open(os.path.join(APP, f"public/data/prov/{g}.json"), "w"), ensure_ascii=False, separators=(",", ":"))

# ---------- data stories (all numbers computed here; text templates only) ----------
def s(i, g): return S.get((i, g), {})
stories = []
# 1 population growth 2005->latest
pp = [(g, s("population", g).get(2005), s("population", g).get(2025)) for g in PROV]
pp = [(g, a, b, (b / a - 1) * 100) for g, a, b in pp if a and b]
pp.sort(key=lambda x: -x[3])
stories.append({"slug": "population-growth-20-years", "title": "过去20年哪些省份常住人口增长最快？",
  "question": "2005—2025年，各省年末常住人口变化了多少？", "indicators": ["population"], "years": [2005, 2025],
  "method": "增幅 = 2025年值 ÷ 2005年值 − 1。两端均为年末常住人口（国家数据分省年度数据当前版本）。注意：2001—2009年分省人口已按第六次人口普查回溯修订，本平台使用修订后数据。",
  "facts": [f"增长最快：{', '.join(f'{GEO[g]['short_zh']}（{p:+.1f}%）' for g, a, b, p in pp[:5])}。", f"人口减少：{', '.join(f'{GEO[g]['short_zh']}（{p:+.1f}%）' for g, a, b, p in pp if p < 0)}。",
            f"31省中 {sum(1 for x in pp if x[3] > 0)} 个省份增长、{sum(1 for x in pp if x[3] < 0)} 个省份减少。"],
  "chart": {"type": "bar", "data": [{"geo": g, "value": round(p, 2)} for g, a, b, p in pp], "unit": "%（2005→2025变化）"},
  "limits": ["常住人口受人口流动影响，不代表户籍人口变化。", "增幅为两点比较，不反映中间年份波动。"]})
# 2 northeast
ne = ["210000", "220000", "230000"]
stories.append({"slug": "northeast-population", "title": "东北三省人口变化", "question": "辽宁、吉林、黑龙江的常住人口与自然增长率如何变化？", "indicators": ["population", "natural_growth_rate"], "years": [2010, 2025],
  "method": "比较2010年与最新年份年末常住人口；自然增长率取官方发布值。",
  "facts": [f"{GEO[g]['short_zh']}：2010年 {s('population', g).get(2010):,.0f} 万人 → 2025年 {s('population', g).get(2025):,.0f} 万人（{(s('population', g)[2025]/s('population', g)[2010]-1)*100:+.1f}%）；2024年自然增长率 {s('natural_growth_rate', g).get(2024)}‰。" for g in ne if s('population', g).get(2010) and s('population', g).get(2025)],
  "chart": {"type": "line", "geos": ne, "indicator": "population", "from": 2005, "to": 2025},
  "limits": ["人口减少同时受迁出与自然变动影响；本数据无法区分两者的精确贡献。"]})
# 3 zhejiang vs jiangsu
zj, js = "330000", "320000"
yrs = [y for y in range(2013, 2026) if s("gdp_per_capita", zj).get(y) and s("gdp_per_capita", js).get(y)]
gap = {y: s("gdp_per_capita", js)[y] - s("gdp_per_capita", zj)[y] for y in yrs}
inc = {y: s("disposable_income", zj).get(y, 0) - s("disposable_income", js).get(y, 0) for y in yrs if s("disposable_income", zj).get(y) and s("disposable_income", js).get(y)}
stories.append({"slug": "zhejiang-vs-jiangsu", "title": "浙江与江苏：人均GDP与居民收入的“错位”", "question": "江苏人均GDP更高，为什么浙江居民收入更高？差距在扩大吗？", "indicators": ["gdp_per_capita", "disposable_income"], "years": [yrs[0], yrs[-1]],
  "method": "差值 = 江苏 − 浙江（人均GDP）；浙江 − 江苏（居民人均可支配收入）。现价，未扣除价格因素。",
  "facts": [f"人均GDP差（江苏−浙江）：{yrs[0]}年 {gap[yrs[0]]:,.0f} 元 → {yrs[-1]}年 {gap[yrs[-1]]:,.0f} 元。", f"居民人均可支配收入差（浙江−江苏）：{min(inc)}年 {inc[min(inc)]:,.0f} 元 → {max(inc)}年 {inc[max(inc)]:,.0f} 元。",
            "两者口径不同：人均GDP衡量产出（核算），可支配收入来自住户调查，二者之差不能直接解释为“分配不公”。"],
  "chart": {"type": "line", "geos": [js, zj], "indicator": "gdp_per_capita", "from": yrs[0], "to": yrs[-1], "second": "disposable_income"},
  "limits": ["现价比较；人均GDP以年平均人口计算，收入以住户调查计算。", "差距变化原因（产业结构、劳动报酬份额等）超出本数据可证实范围。"]})
# 4 aging vs physicians (correlation)
y = 2024
pairs = [(g, s("population_65plus", g).get(y), s("physicians_per_1000", g).get(y)) for g in PROV]
pairs = [p for p in pairs if p[1] is not None and p[2] is not None]
def pearson(xs, ys):
    mx, my = statistics.mean(xs), statistics.mean(ys)
    num = sum((a - mx) * (b - my) for a, b in zip(xs, ys)); den = math.sqrt(sum((a - mx) ** 2 for a in xs) * sum((b - my) ** 2 for b in ys))
    return num / den if den else float("nan")
r_age = pearson([p[1] for p in pairs], [p[2] for p in pairs])
stories.append({"slug": "aging-and-doctors", "title": "老龄化程度与医生供给：相关吗？", "question": f"{y}年各省65岁及以上人口占比与每千人口执业（助理）医师数之间是否存在相关？", "indicators": ["population_65plus", "physicians_per_1000"], "years": [y, y],
  "method": f"Pearson 相关系数，n = {len(pairs)} 个省份，{y}年横截面；65+占比为抽样调查样本推算；无缺失值处理（{31-len(pairs)} 个省份缺失被排除）。",
  "facts": [f"相关系数 r = {r_age:.2f}（n = {len(pairs)}）。", "相关不代表因果：医生配置受财政能力、城市化、医学院分布等多种因素影响。"],
  "chart": {"type": "scatter", "x": "population_65plus", "y": "physicians_per_1000", "year": y, "points": [{"geo": g, "x": a, "y": b} for g, a, b in pairs]},
  "limits": ["横截面相关，n=31，统计功效有限。", "65+占比为样本推算，小省份误差大。"]})
# 5 urbanization and GDP per capita
pairs2 = [(g, s("urbanization_rate", g).get(y), s("gdp_per_capita", g).get(y)) for g in PROV]
pairs2 = [p for p in pairs2 if p[1] and p[2]]
r_urb = pearson([p[1] for p in pairs2], [math.log(p[2]) for p in pairs2])
stories.append({"slug": "urbanization-and-income", "title": "城镇化与经济发展水平", "question": f"{y}年城镇化率与人均GDP（对数）的统计关系如何？", "indicators": ["urbanization_rate", "gdp_per_capita"], "years": [y, y],
  "method": f"Pearson 相关，x = 城镇化率，y = ln(人均GDP)，n = {len(pairs2)}。",
  "facts": [f"r = {r_urb:.2f}（n = {len(pairs2)}）：城镇化率越高的省份，人均GDP通常越高。", "这是相关关系，不说明城镇化“导致”经济增长，二者可能共同由产业结构驱动。"],
  "chart": {"type": "scatter", "x": "urbanization_rate", "y": "gdp_per_capita", "year": y, "logy": True, "points": [{"geo": g, "x": a, "y": b} for g, a, b in pairs2]},
  "limits": ["横截面；未控制其他变量。"]})
# 6 urban-rural income ratio
nr = s("urban_rural_income_ratio", "000000")
if nr:
    ys = sorted(nr)
    stories.append({"slug": "urban-rural-income-gap", "title": "城乡居民收入差距的变化", "question": "全国城乡居民人均可支配收入比如何变化？哪些省份差距最大？", "indicators": ["urban_rural_income_ratio"], "years": [ys[0], ys[-1]],
      "method": "城乡收入比 = 城镇居民人均可支配收入 ÷ 农村居民人均可支配收入（同一官方表，衍生计算）。",
      "facts": [f"全国：{ys[0]}年 {nr[ys[0]]:.2f} 倍 → {ys[-1]}年 {nr[ys[-1]]:.2f} 倍。"] + ([f"{ys[-1] if ys[-1] in [yy for yy in s('urban_rural_income_ratio','110000')] else ''}年差距最大省份：" + "、".join(f"{GEO[g]['short_zh']} {s('urban_rural_income_ratio', g).get(max(s('urban_rural_income_ratio', g)) ):.2f}" for g in sorted(PROV, key=lambda g: -(s('urban_rural_income_ratio', g).get(max(s('urban_rural_income_ratio', g) or {0:0}), 0) or 0))[:3])] if s('urban_rural_income_ratio','110000') else []),
      "chart": {"type": "line", "geos": ["000000"], "indicator": "urban_rural_income_ratio", "from": ys[0], "to": ys[-1]},
      "limits": ["2013年前后住户调查制度变化，长期比较需谨慎。"]})

# ---------- R2.1 stories (new indicators) ----------
def common_latest(ids, geos):
    ys = [yy for yy in range(2025, 1999, -1) if all(s(i, g).get(yy) is not None for i in ids for g in geos)]
    return ys[0] if ys else None
# 7 housing affordability: square metres of new housing one year's average wage buys
yA = common_latest(["average_wage", "housing_price"], PROV)
if yA:
    aff = sorted([(g, s("average_wage", g)[yA] / s("housing_price", g)[yA]) for g in PROV], key=lambda x: x[1])
    nat_aff = (s("average_wage", "000000").get(yA) or 0) / (s("housing_price", "000000").get(yA) or 1) if s("housing_price", "000000").get(yA) else None
    stories.append({"slug": "wage-vs-housing-price", "title": "一年工资能买几平方米新房？", "question": f"{yA}年各省城镇非私营单位平均工资与新建商品房平均销售价格之比",
      "indicators": ["average_wage", "housing_price"], "years": [yA, yA],
      "method": "可购面积 = 城镇非私营单位就业人员年平均工资 ÷ 新建商品房平均销售价格（元/平方米）。两项均为国家统计局官方发布值；比值为本平台衍生计算。",
      "facts": [f"最少：{'、'.join(f'{GEO[g]['short_zh']} {v:.1f} 平方米' for g, v in aff[:3])}。", f"最多：{'、'.join(f'{GEO[g]['short_zh']} {v:.1f} 平方米' for g, v in aff[::-1][:3])}。"]
               + ([f"全国：{nat_aff:.1f} 平方米。"] if nat_aff else []),
      "chart": {"type": "bar", "data": [{"geo": g, "value": round(v, 2)} for g, v in aff[::-1]], "unit": "平方米/年工资"},
      "limits": ["平均工资不含私营单位，偏高于全体就业人员；房价为全部新建商品房（含办公、商业）均价，且受当年销售结构影响。", "不含税费、贷款利息与二手房市场，不等于真实购房负担。"]})
# 8 where invention patents are concentrated
yP = common_latest(["invention_patents_granted"], PROV)
if yP and s("invention_patents_granted", "000000").get(yP):
    tot = sum(s("invention_patents_granted", g)[yP] for g in PROV)
    top = sorted(PROV, key=lambda g: -s("invention_patents_granted", g)[yP])
    share5 = sum(s("invention_patents_granted", g)[yP] for g in top[:5]) / tot * 100
    per = sorted([(g, s("invention_patents_per_10k", g).get(yP)) for g in PROV if s("invention_patents_per_10k", g).get(yP) is not None], key=lambda x: -x[1])
    stories.append({"slug": "invention-patents-geography", "title": "发明专利集中在哪里？", "question": f"{yP}年国内发明专利授权量的地区分布有多集中？",
      "indicators": ["invention_patents_granted", "invention_patents_per_10k"], "years": [yP, yP],
      "method": "前五省份占比 = 前五省份授权量之和 ÷ 31省合计；每万人授权量 = 授权量 ÷ 年末常住人口（万人），本平台衍生计算。",
      "facts": [f"前五省份（{'、'.join(GEO[g]['short_zh'] for g in top[:5])}）占31省合计的 {share5:.1f}%。", f"按人口计最高：{'、'.join(f'{GEO[g]['short_zh']} {v:.1f} 件/万人' for g, v in per[:3])}；最低：{'、'.join(f'{GEO[g]['short_zh']} {v:.2f}' for g, v in per[-3:])}。"],
      "chart": {"type": "bar", "data": [{"geo": g, "value": round(v, 2)} for g, v in per], "unit": "件/万人"},
      "limits": ["授权量按申请人所在地统计，跨省企业的研发地与申请地可能不同。", "专利数量不等于专利质量或经济价值。"]})
# 9 private cars per 1,000 residents: growth since 2010
yC = common_latest(["private_cars_per_1000"], PROV)
if yC and all(s("private_cars_per_1000", g).get(2010) for g in PROV):
    cg = sorted([(g, s("private_cars_per_1000", g)[2010], s("private_cars_per_1000", g)[yC]) for g in PROV], key=lambda x: -x[2])
    nat = s("private_cars_per_1000", "000000")
    stories.append({"slug": "private-cars-per-1000", "title": "私人汽车普及：从2010年到现在", "question": f"2010—{yC}年每千人私人汽车拥有量如何变化？",
      "indicators": ["private_cars_per_1000", "private_cars"], "years": [2010, yC],
      "method": "每千人私人汽车 = 私人汽车拥有量（万辆）÷ 年末常住人口（万人）× 1000，本平台衍生计算；车辆按登记地统计。",
      "facts": ([f"全国：2010年 {nat[2010]:.0f} 辆 → {yC}年 {nat[yC]:.0f} 辆（每千人）。"] if nat.get(2010) and nat.get(yC) else []) +
               [f"{yC}年最高：{'、'.join(f'{GEO[g]['short_zh']} {b:.0f}' for g, a, b in cg[:3])}；最低：{'、'.join(f'{GEO[g]['short_zh']} {b:.0f}' for g, a, b in cg[-3:])}。"],
      "chart": {"type": "bar", "data": [{"geo": g, "value": round(b, 1)} for g, a, b in cg], "unit": f"辆/千人（{yC}年）"},
      "limits": ["车辆按登记地统计；限牌城市（如北京、上海）存在外地登记车辆。", "人口分母为年末常住人口。"]})

# ---------- site.json ----------
latest_updates = sorted([{"id": i["id"], "name_zh": i["name_zh"], "national": i["latest_national_year"], "province": i["latest_province_year"]} for i in ind_out], key=lambda x: (-(x["province"] or 0), -(x["national"] or 0)))
ev_counts = Counter(r["evidence_level"] for r in canon)
site = {
    "generated_at": canon[0]["retrieved_at"], "methodology_version": cfg["methodology_version"], "regions": regions, "indicators": ind_out,
    "stories": stories, "latest_updates": latest_updates[:12],
    "stats": {"published_observations": len(pub), "candidate_rows": len(canon), "evidence": dict(ev_counts), "core_indicators": sum(1 for i in ind_out if i["core"]),
              "extension_indicators": sum(1 for i in ind_out if not i["core"]), "regions": 31, "earliest_year": min(i["first_year"] for i in ind_out),
              "latest_year": max(i["latest_province_year_any"] or 0 for i in ind_out), "conflicts": len(conf),
              "conflicts_unresolved": sum(1 for c in conf if not c["resolution"].startswith("resolved")), "r1_datasets": 8, "qa_errors": quality["errors"], "qa_warnings": quality["warnings"]},
    "conflict_categories": dict(Counter(c["category"] for c in conf)),
}
# R2.1: keep the client bundle small. Per-indicator detail (ranking, moves, findings, distribution) is only
# needed by build-time pages, so it goes to site-detail.json (read server-side) instead of site.json (bundled).
DETAIL = ("ranking", "moves", "findings", "distribution")
detail = {i["id"]: {k: i[k] for k in DETAIL} for i in site["indicators"]}
site["indicators"] = [{k: v for k, v in i.items() if k not in DETAIL} for i in site["indicators"]]
json.dump(site, open(os.path.join(APP, "src/data/site.json"), "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(detail, open(os.path.join(APP, "src/data/site-detail.json"), "w"), ensure_ascii=False, separators=(",", ":"))
# downloads
with open(os.path.join(APP, "public/downloads/observations.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(canon[0].keys())); w.writeheader(); w.writerows(pub)
for src, dst in [("data/canonical_candidate/vintages.csv", "vintages.csv"), ("data/reconciliation/conflicts.csv", "conflicts.csv"), ("reports/coverage_matrix.csv", "coverage_matrix.csv"), ("reports/data_validation_samples.csv", "data_validation_samples.csv"), ("data/metadata/data_dictionary.csv", "data_dictionary.csv")]:
    if os.path.exists(P(src)): shutil.copy(P(src), os.path.join(APP, "public/downloads", dst))
print("indicators", len(ind_out), "published", len(pub), "stories", len(stories), "evidence", dict(ev_counts))
